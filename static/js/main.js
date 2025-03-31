// 全局變量
let trafficChart = null;
let excelData = null;

// DOM元素
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const dateSection = document.getElementById('dateSection');
const dateSelect = document.getElementById('dateSelect');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const maxValue = document.getElementById('maxValue');
const minValue = document.getElementById('minValue');
const avgValue = document.getElementById('avgValue');
const maxTime = document.getElementById('maxTime');
const exportBtn = document.getElementById('exportBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const messageOverlay = document.getElementById('messageOverlay');
const messageText = document.getElementById('messageText');
const messageCloseBtn = document.getElementById('messageCloseBtn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 文件上傳相關事件監聽
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖放功能
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });
    
    // 分析按鈕事件
    analyzeBtn.addEventListener('click', analyzeData);
    
    // 導出按鈕事件
    exportBtn.addEventListener('click', exportReport);
    
    // 訊息關閉按鈕
    messageCloseBtn.addEventListener('click', () => {
        messageOverlay.style.display = 'none';
    });
});

// 處理文件選擇
function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;
    
    // 檢查文件類型
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
        showMessage('請上傳有效的Excel檔案 (.xlsx 或 .xls)');
        return;
    }
    
    // 顯示文件信息
    fileInfo.textContent = `已選擇: ${file.name} (${formatFileSize(file.size)})`;
    
    // 處理Excel文件
    processExcelFile(file);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 處理Excel文件
async function processExcelFile(file) {
    showLoading();
    
    try {
        // 使用FileReader讀取文件
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                // 解析Excel數據
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                // 獲取第一個工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 將工作表轉換為JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                // 檢查必要的列是否存在
                if (!jsonData.length || !jsonData[0].hasOwnProperty('time') || !jsonData[0].hasOwnProperty('out')) {
                    throw new Error('文件格式不正確，缺少必要的列(time或out)');
                }
                
                // 處理數據
                excelData = jsonData.map(row => ({
                    time: new Date(row.time),
                    out: parseFloat(row.out)
                }));
                
                // 獲取唯一日期列表
                const dates = getUniqueDates(excelData);
                
                // 填充日期選擇下拉菜單
                populateDateSelect(dates);
                
                // 顯示日期選擇區域
                dateSection.style.display = 'block';
                
                // 隱藏結果區域（如果之前顯示過）
                resultsSection.style.display = 'none';
                
            } catch (error) {
                showMessage(error.message);
            } finally {
                hideLoading();
            }
        };
        
        reader.onerror = function() {
            hideLoading();
            showMessage('讀取文件時發生錯誤');
        };
        
        // 讀取文件為ArrayBuffer
        reader.readAsArrayBuffer(file);
        
    } catch (error) {
        hideLoading();
        showMessage(error.message);
    }
}

// 獲取唯一日期列表
function getUniqueDates(data) {
    const uniqueDates = [];
    const dateSet = new Set();
    
    data.forEach(item => {
        // 使用本地日期格式而非ISO格式，避免時區問題
        const year = item.time.getFullYear();
        const month = String(item.time.getMonth() + 1).padStart(2, '0');
        const day = String(item.time.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        if (!dateSet.has(dateStr)) {
            dateSet.add(dateStr);
            uniqueDates.push(dateStr);
        }
    });
    
    return uniqueDates.sort();
}

// 填充日期選擇下拉菜單
function populateDateSelect(dates) {
    // 清空現有選項（保留第一個默認選項）
    dateSelect.innerHTML = '<option value="" disabled selected>-- 請選擇日期 --</option>';
    
    // 添加日期選項
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dateSelect.appendChild(option);
    });
}

// 分析數據
function analyzeData() {
    const selectedDate = dateSelect.value;
    
    if (!selectedDate) {
        showMessage('請選擇日期');
        return;
    }
    
    showLoading();
    
    try {
        // 根據選擇的日期過濾數據
        const filteredData = excelData.filter(item => {
            // 使用本地日期格式而非ISO格式，與getUniqueDates函數保持一致
            const year = item.time.getFullYear();
            const month = String(item.time.getMonth() + 1).padStart(2, '0');
            const day = String(item.time.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            return dateStr === selectedDate;
        });
        
        // 檢查是否有數據
        if (filteredData.length === 0) {
            throw new Error('所選日期沒有數據');
        }
        
        // 計算統計數據
        const stats = calculateStats(filteredData);
        
        // 準備圖表數據
        const chartData = prepareChartData(filteredData);
        
        // 顯示統計數據
        displayStats(stats);
        
        // 顯示圖表
        displayChart(chartData);
        
        // 顯示結果區域
        resultsSection.style.display = 'block';
        
    } catch (error) {
        showMessage(error.message);
    } finally {
        hideLoading();
    }
}

// 計算統計數據
function calculateStats(data) {
    // 找出最大值和對應的時間
    let maxOutValue = -Infinity;
    let maxOutTime = null;
    
    data.forEach(item => {
        if (item.out > maxOutValue) {
            maxOutValue = item.out;
            maxOutTime = item.time;
        }
    });
    
    // 計算最小值和平均值
    const minOutValue = Math.min(...data.map(item => item.out));
    const avgOutValue = data.reduce((sum, item) => sum + item.out, 0) / data.length;
    
    return {
        max: round(maxOutValue / 1000000, 2),
        min: round(minOutValue / 1000000, 2),
        avg: round(avgOutValue / 1000000, 2),
        max_time: formatDateTime(maxOutTime)
    };
}

// 準備圖表數據
function prepareChartData(data) {
    return {
        time: data.map(item => formatTime(item.time)),
        out: data.map(item => round(item.out / 1000000, 2))
    };
}

// 四捨五入到指定小數位
function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

// 格式化日期時間
function formatDateTime(date) {
    // 使用本地時間格式而非UTC時間
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 格式化時間（只顯示時:分:秒）
function formatTime(date) {
    return date.toTimeString().substring(0, 8);
}

// 顯示統計數據
function displayStats(stats) {
    maxValue.textContent = `${stats.max} Mbps`;
    minValue.textContent = `${stats.min} Mbps`;
    avgValue.textContent = `${stats.avg} Mbps`;
    maxTime.textContent = stats.max_time;
}

// 顯示圖表
function displayChart(chartData) {
    const ctx = document.getElementById('trafficChart').getContext('2d');
    
    // 如果已經有圖表，先銷毀它
    if (trafficChart) {
        trafficChart.destroy();
    }
    
    // 創建新圖表
    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.time,
            datasets: [{
                label: '流量 (百萬)',
                data: chartData.out,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#3498db',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '每日流量變化',
                    font: {
                        size: 18
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `流量: ${context.parsed.y} Mbps`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '時間'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '流量 (百萬)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// 導出報告
function exportReport() {
    const selectedDate = dateSelect.value;
    
    if (!selectedDate) {
        showMessage('請選擇日期');
        return;
    }
    
    showLoading();
    
    try {
        // 根據選擇的日期過濾數據
        const filteredData = excelData.filter(item => {
            // 使用本地日期格式而非ISO格式，與getUniqueDates函數保持一致
            const year = item.time.getFullYear();
            const month = String(item.time.getMonth() + 1).padStart(2, '0');
            const day = String(item.time.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            return dateStr === selectedDate;
        });
        
        // 檢查是否有數據
        if (filteredData.length === 0) {
            throw new Error('所選日期沒有數據');
        }
        
        // 計算統計數據
        const stats = calculateStats(filteredData);
        
        // 創建工作簿
        const wb = XLSX.utils.book_new();
        
        // 創建統計摘要工作表
        const statsData = [
            ['統計項目', '數值'],
            ['最大值 (百萬)', stats.max],
            ['最小值 (百萬)', stats.min],
            ['平均值 (百萬)', stats.avg],
            ['最大值時間', stats.max_time]
        ];
        
        const statsWs = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, statsWs, '統計摘要');
        
        // 創建原始數據工作表
        const rawData = filteredData.map(item => ({
            'time': formatDateTime(item.time),
            'out': item.out
        }));
        
        const rawWs = XLSX.utils.json_to_sheet(rawData);
        XLSX.utils.book_append_sheet(wb, rawWs, '原始數據');
        
        // 生成報告文件名
        const reportFilename = `GSN_Report_${selectedDate}_${generateRandomId()}.xlsx`;
        
        // 導出Excel文件
        XLSX.writeFile(wb, reportFilename);
        
        showMessage('報告已成功生成，正在下載...');
        
    } catch (error) {
        showMessage(error.message);
    } finally {
        hideLoading();
    }
}

// 生成隨機ID
function generateRandomId() {
    return Math.random().toString(36).substring(2, 10);
}

// 顯示載入中覆蓋層
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// 隱藏載入中覆蓋層
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// 顯示訊息
function showMessage(message) {
    messageText.textContent = message;
    messageOverlay.style.display = 'flex';
}