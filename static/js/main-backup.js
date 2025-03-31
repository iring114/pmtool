// 全局變量
let trafficChart = null;

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
    
    // 上傳文件
    uploadFile(file);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 上傳文件
async function uploadFile(file) {
    showLoading();
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '上傳文件時發生錯誤');
        }
        
        // 填充日期選擇下拉菜單
        populateDateSelect(data.dates);
        
        // 顯示日期選擇區域
        dateSection.style.display = 'block';
        
        // 隱藏結果區域（如果之前顯示過）
        resultsSection.style.display = 'none';
        
    } catch (error) {
        showMessage(error.message);
    } finally {
        hideLoading();
    }
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
async function analyzeData() {
    const selectedDate = dateSelect.value;
    
    if (!selectedDate) {
        showMessage('請選擇日期');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: selectedDate })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '分析數據時發生錯誤');
        }
        
        // 顯示統計數據
        displayStats(data.stats);
        
        // 顯示圖表
        displayChart(data.chart_data);
        
        // 顯示結果區域
        resultsSection.style.display = 'block';
        
    } catch (error) {
        showMessage(error.message);
    } finally {
        hideLoading();
    }
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
async function exportReport() {
    const selectedDate = dateSelect.value;
    
    if (!selectedDate) {
        showMessage('請選擇日期');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: selectedDate })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '導出報告時發生錯誤');
        }
        
        // 創建下載鏈接
        window.location.href = data.download_url;
        
        showMessage('報告已成功生成，正在下載...');
        
    } catch (error) {
        showMessage(error.message);
    } finally {
        hideLoading();
    }
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