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

    // 添加頁面載入動畫
    animateElementsOnLoad();
});

// 頁面載入動畫
function animateElementsOnLoad() {
    const header = document.querySelector('header');
    const sections = document.querySelectorAll('section');
    
    // 淡入效果
    header.style.opacity = '0';
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
    });
    
    // 設置延遲顯示
    setTimeout(() => {
        header.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        header.style.opacity = '1';
        
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 200 * (index + 1));
        });
    }, 300);
}

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
    fileInfo.style.display = 'inline-block';
    fileInfo.classList.add('file-info-appear');
    
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
                
                // 假設第一個工作表是 "日流量"，第二個是 "周流量"
                const dailySheetName = workbook.SheetNames[0]; // 或者根據實際名稱調整
                const weeklySheetName = workbook.SheetNames[1]; // 或者根據實際名稱調整

                if (!workbook.Sheets[dailySheetName]) {
                    throw new Error('找不到 "日流量" 工作表 (預期在第一個)');
                }
                // 允許周流量工作表不存在
                const weeklyWorksheet = workbook.Sheets[weeklySheetName]; 

                const dailyWorksheet = workbook.Sheets[dailySheetName];
                
                // 將工作表轉換為JSON
                const dailyJsonData = XLSX.utils.sheet_to_json(dailyWorksheet);
                const weeklyJsonData = weeklyWorksheet ? XLSX.utils.sheet_to_json(weeklyWorksheet) : [];

                // 檢查日流量工作表必要的列是否存在
                if (!dailyJsonData.length || !dailyJsonData[0].hasOwnProperty('time') || !dailyJsonData[0].hasOwnProperty('out')) {
                     // 如果周流量工作表也不存在或格式不對，則報錯
                    if (!weeklyJsonData.length || !weeklyJsonData[0].hasOwnProperty('time') || !weeklyJsonData[0].hasOwnProperty('out')) {
                        throw new Error('文件格式不正確，日流量和周流量工作表都缺少必要的列(time或out)或不存在');
                    } 
                    // 如果只有日流量格式不對，可以繼續處理周流量
                    console.warn('日流量工作表格式不正確或為空，將僅使用周流量數據');
                }

                // 處理並合併數據，優先使用日流量數據
                const combinedDataMap = new Map();

                // 處理周流量數據 (如果存在且格式正確)
                if (weeklyJsonData.length > 0 && weeklyJsonData[0].hasOwnProperty('time') && weeklyJsonData[0].hasOwnProperty('out')) {
                    weeklyJsonData.forEach(row => {
                        // 檢查 time 和 out 是否有效
                        if (row.time && row.out !== undefined && row.out !== null) {
                            try {
                                const time = new Date(row.time);
                                // 檢查轉換後的日期是否有效
                                if (time instanceof Date && !isNaN(time)) {
                                    const dateStr = time.toISOString().split('T')[0]; // 使用 ISO 日期字符串作為 key
                                    const dataPoint = { time: time, out: parseFloat(row.out) };
                                    if (!combinedDataMap.has(dateStr)) {
                                        combinedDataMap.set(dateStr, []);
                                    }
                                    combinedDataMap.get(dateStr).push(dataPoint);
                                } else {
                                    console.warn('周流量數據中發現無效時間格式:', row.time);
                                }
                            } catch (e) {
                                console.error('處理周流量時間時出錯:', e, '行數據:', row);
                            }
                        }
                    });
                }

                // 處理日流量數據 (如果存在且格式正確)
                const dailyDates = new Set();
                if (dailyJsonData.length > 0 && dailyJsonData[0].hasOwnProperty('time') && dailyJsonData[0].hasOwnProperty('out')) {
                    dailyJsonData.forEach(row => {
                         // 檢查 time 和 out 是否有效
                        if (row.time && row.out !== undefined && row.out !== null) {
                            try {
                                const time = new Date(row.time);
                                // 檢查轉換後的日期是否有效
                                if (time instanceof Date && !isNaN(time)) {
                                    

                                    const dateStr = time.toISOString().split('T')[0];
                                    const dataPoint = { time: time, out: parseFloat(row.out) };

                                    // 如果 Map 中還沒有這一天的數據，則初始化一個空數組
                                    if (!combinedDataMap.has(dateStr)) {
                                        combinedDataMap.set(dateStr, []);
                                    }

                                    // 如果這是第一次遇到這個日期的日流量數據，標記一下
                                    if (!dailyDates.has(dateStr)) {
                                        // 不再清空，而是準備合併。可以考慮在這裡移除與日流量時間點衝突的周流量數據
                                        // 但更簡單的方式是，在排序後處理，或者讓用戶知曉可能存在混合數據
                                        dailyDates.add(dateStr);
                                        // 可選：如果需要嚴格按日流量覆蓋，可以在此處過濾掉當天所有周流量數據
                                        // combinedDataMap.set(dateStr, []); // 如果決定完全覆蓋，則取消註釋此行
                                    }

                                    // 添加日流量數據點
                                    combinedDataMap.get(dateStr).push(dataPoint);
                                } else {
                                     console.warn('日流量數據中發現無效時間格式:', row.time);
                                }
                            } catch (e) {
                                console.error('處理日流量時間時出錯:', e, '行數據:', row);
                            }
                        }
                    });
                }

                // 將 Map 轉換回數組
                excelData = [];
                combinedDataMap.forEach(dataPoints => {
                    excelData.push(...dataPoints);
                });

                // 按時間排序
                excelData.sort((a, b) => a.time - b.time);

                // 可選：排序後再次處理，確保同一時間點只有一個數據（日優先）
                // 這一步比較複雜，暫時省略，目前的邏輯是日數據和周數據可能在同一天共存
                // 如果需要嚴格去重，可以在這裡實現

                // 如果排序後 excelData 為空，則表示沒有有效數據
                if (excelData.length === 0) {
                    throw new Error('未能從文件中讀取到有效的時間和流量數據');
                }
                
                // 獲取唯一日期列表
                const dates = getUniqueDates(excelData);
                
                // 填充日期選擇下拉菜單
                populateDateSelect(dates);
                
                // 顯示日期選擇區域，帶動畫效果
                dateSection.style.display = 'block';
                dateSection.style.opacity = '0';
                dateSection.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    dateSection.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    dateSection.style.opacity = '1';
                    dateSection.style.transform = 'translateY(0)';
                }, 100);
                
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
        // 確保 item.time 是有效的 Date 對象
        if (item && item.time instanceof Date && !isNaN(item.time)) {
            // 使用本地日期格式而非ISO格式，避免時區問題
            const year = item.time.getFullYear();
            const month = String(item.time.getMonth() + 1).padStart(2, '0');
            const day = String(item.time.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            if (!dateSet.has(dateStr)) {
                dateSet.add(dateStr);
                uniqueDates.push(dateStr);
            }
        } else {
            console.warn('在 getUniqueDates 中發現無效的時間數據:', item);
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
            // 確保 item.time 是有效的 Date 對象
            if (item && item.time instanceof Date && !isNaN(item.time)) {
                // 使用本地日期格式而非ISO格式，與getUniqueDates函數保持一致
                const year = item.time.getFullYear();
                const month = String(item.time.getMonth() + 1).padStart(2, '0');
                const day = String(item.time.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                return dateStr === selectedDate;
            } else {
                // 在 analyzeData 和 exportReport 中都會用到此過濾邏輯
                // 使用 console.trace() 可以幫助確定調用來源，但會增加控制台輸出
                // console.trace('過濾掉無效數據:', item); 
                console.warn('過濾掉無效或格式不正確的時間數據:', item);
                return false; // 過濾掉無效數據
            }
        });
        
        // 檢查是否有數據
        if (filteredData.length === 0) {
            throw new Error('所選日期沒有數據');
        }
        
        // 計算統計數據
        const stats = calculateStats(filteredData);
        
        // 準備圖表數據
        const chartData = prepareChartData(filteredData);
        
        // 顯示結果區域，帶動畫效果
        resultsSection.style.display = 'block';
        resultsSection.style.opacity = '0';
        resultsSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            resultsSection.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            resultsSection.style.opacity = '1';
            resultsSection.style.transform = 'translateY(0)';
            
            // 顯示統計數據，帶動畫效果
            displayStats(stats);
            
            // 顯示圖表，帶動畫效果
            setTimeout(() => {
                displayChart(chartData);
            }, 300);
        }, 100);
        
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
    // 獲取所有統計卡片
    const statCards = document.querySelectorAll('.stat-card');
    
    // 設置數據
    maxValue.textContent = `${stats.max} Mbps`;
    minValue.textContent = `${stats.min} Mbps`;
    avgValue.textContent = `${stats.avg} Mbps`;
    maxTime.textContent = stats.max_time;
    
    // 添加動畫效果
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
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
                label: '流量 (Mbps)',
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
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            plugins: {
                title: {
                    display: true,
                    text: '每日流量變化',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 14
                    },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `流量: ${context.parsed.y} Mbps`;
                        }
                    }
                },
                legend: {
                    labels: {
                        font: {
                            size: 14
                        },
                        padding: 20
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '時間',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10
                        }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '流量 (Mbps)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 10
                        }
                    },
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
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
            // 確保 item.time 是有效的 Date 對象
            if (item && item.time instanceof Date && !isNaN(item.time)) {
                // 使用本地日期格式而非ISO格式，與getUniqueDates函數保持一致
                const year = item.time.getFullYear();
                const month = String(item.time.getMonth() + 1).padStart(2, '0');
                const day = String(item.time.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                return dateStr === selectedDate;
            } else {
                // 在 analyzeData 和 exportReport 中都會用到此過濾邏輯
                // 使用 console.trace() 可以幫助確定調用來源，但會增加控制台輸出
                // console.trace('過濾掉無效數據:', item); 
                console.warn('過濾掉無效或格式不正確的時間數據:', item);
                return false; // 過濾掉無效數據
            }
        });
        
        // 檢查是否有數據
        if (filteredData.length === 0) {
            throw new Error('所選日期沒有數據');
        }
        
        // 計算統計數據
        const stats = calculateStats(filteredData);
        
        // 創建工作簿
        const wb = XLSX.utils.book_new();
        
        // 創建統計數據工作表
        const statsData = [
            ['GSN 流量分析報告'],
            ['日期', selectedDate],
            [''],
            ['統計數據'],
            ['最大值', `${stats.max} Mbps`],
            ['最小值', `${stats.min} Mbps`],
            ['平均值', `${stats.avg} Mbps`],
            ['最大值時間', stats.max_time],
            [''],
            ['詳細數據']
        ];
        
        // 添加詳細數據
        statsData.push(['時間', '流量 (Mbps)']);
        filteredData.forEach(item => {
            statsData.push([formatDateTime(item.time), round(item.out / 1000000, 2)]);
        });
        
        // 將數據轉換為工作表
        const ws = XLSX.utils.aoa_to_sheet(statsData);
        
        // 設置單元格合併
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
            { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } }
        ];
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, 'GSN流量分析');
        
        // 生成文件名
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const fileName = `GSN_Report_${selectedDate}_${timestamp}.xlsx`;
        
        // 導出Excel文件
        XLSX.writeFile(wb, fileName);
        
        // 顯示成功消息
        showMessage(`報告已成功導出為 ${fileName}`);
        
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