// OCR工具的主要JavaScript功能

document.addEventListener('DOMContentLoaded', function() {
    // 獲取DOM元素
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');
    const changeImageBtn = document.getElementById('change-image-btn');
    const ocrBtn = document.getElementById('ocr-btn');
    const browseBtn = document.getElementById('browseBtn');
    const resultSection = document.getElementById('result-section');
    const resultText = document.getElementById('result-text');
    const copyBtn = document.getElementById('copy-btn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const toast = document.getElementById('toast');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeySection = document.getElementById('api-key-section');
    const aiInteractionSection = document.getElementById('ai-interaction-section');
    const aiPromptInput = document.getElementById('ai-prompt-input');
    const aiProcessBtn = document.getElementById('ai-process-btn');
    const aiResultContainer = document.querySelector('.ai-result-container');
    const aiResultText = document.getElementById('ai-result-text');
    const aiCopyBtn = document.getElementById('ai-copy-btn');
    
    // 設置textarea自動調整高度
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.classList.add('auto-resize');
        textarea.addEventListener('input', autoResizeTextarea);
        // 初始化高度
        setTimeout(() => autoResizeTextarea.call(textarea), 0);
    });
    
    // 當前上傳的文件和API密鑰
    let currentFile = null;
    const API_KEY_STORAGE_KEY = 'gemini_api_key';
    let apiKey = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    
    // 如果已有API密鑰，則填入輸入框
    if (apiKey) {
        apiKeyInput.value = apiKey;
        // 顯示已保存的提示
        showToast('已載入保存的API密鑰');
    }
    
    // 保存API密鑰
    saveApiKeyBtn.addEventListener('click', function() {
        const newApiKey = apiKeyInput.value.trim();
        if (newApiKey) {
            localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
            apiKey = newApiKey;
            showToast('API密鑰已保存');
        } else {
            showToast('請輸入有效的API密鑰', true);
        }
    });
    
    // 拖放功能
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('active');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('active');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // 點擊上傳區域觸發文件選擇
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 點擊瀏覽按鈕觸發文件選擇
    if (browseBtn) {
        browseBtn.addEventListener('click', function() {
            fileInput.click();
        });
    }
    
    // 文件選擇事件
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        }
    });
    
    // 更換圖片按鈕
    changeImageBtn.addEventListener('click', function() {
        resetUI();
    });
    
    // OCR按鈕
    ocrBtn.addEventListener('click', function() {
        if (currentFile) {
            // 檢查API密鑰
            if (!apiKey) {
                showToast('請先設置Gemini API密鑰', true);
                apiKeySection.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            processOCR(currentFile);
        } else {
            showToast('請先上傳圖片', true);
        }
    });
    
    // 複製按鈕
    copyBtn.addEventListener('click', function() {
        copyToClipboard(resultText);
    });
    
    // AI處理按鈕
    aiProcessBtn.addEventListener('click', function() {
        if (!resultText.value.trim()) {
            showToast('請先進行OCR辨識獲取文字', true);
            return;
        }
        
        if (!aiPromptInput.value.trim()) {
            showToast('請輸入處理指令', true);
            return;
        }
        
        // 檢查API密鑰
        if (!apiKey) {
            showToast('請先設置Gemini API密鑰', true);
            apiKeySection.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        
        processAIInteraction(resultText.value, aiPromptInput.value);
    });
    
    // AI結果複製按鈕
    aiCopyBtn.addEventListener('click', function() {
        copyToClipboard(aiResultText);
    });
    
    // 處理文件上傳
    function handleFileUpload(file) {
        // 檢查文件類型
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('不支持的文件類型，請上傳圖片文件', true);
            return;
        }
        
        // 檢查文件大小 (限制為10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast('文件太大，請上傳小於10MB的圖片', true);
            return;
        }
        
        // 顯示預覽
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            uploadArea.style.display = 'none';
            previewContainer.style.display = 'block';
            currentFile = file;
            
            // 隱藏結果區域（如果之前顯示過）
            resultSection.style.display = 'none';
            resultText.value = '';
            
            showToast('圖片已準備就緒');
        };
        reader.readAsDataURL(file);
    }
    
    // 處理OCR
    async function processOCR(file) {
        // 檢查API密鑰
        if (!apiKey) {
            showToast('請先設置Gemini API密鑰', true);
            return;
        }
        
        // 顯示載入動畫
        loadingOverlay.style.display = 'flex';
        
        try {
            // 將文件轉換為base64
            const base64Image = await fileToBase64(file);
            const base64Data = base64Image.split(',')[1]; // 移除data URL前綴
            
            // 準備Gemini API請求
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            const requestData = {
                contents: [{
                    parts: [
                        {text: "請從這張圖片中提取所有可見的文字。只返回提取的文字內容，不要添加任何解釋或額外信息。"}, 
                        {
                            inline_data: {
                                mime_type: file.type,
                                data: base64Data
                            }
                        }
                    ]
                }]
            };
            
            // 發送請求到Gemini API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            // 隱藏載入動畫
            loadingOverlay.style.display = 'none';
            
            // 解析API響應
            if (response.ok && result.candidates && result.candidates.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                
                // 顯示結果
                resultText.value = text;
                resultSection.style.display = 'block';
                
                // 顯示AI互動區域
                aiInteractionSection.style.display = 'block';
                aiPromptInput.value = '';
                aiResultContainer.style.display = 'none';
                
                // 滾動到結果區域
                resultSection.scrollIntoView({ behavior: 'smooth' });
                
                showToast('OCR處理完成');
            } else {
                const errorMessage = result.error ? result.error.message : '無法從API響應中提取文字';
                showToast(`OCR處理失敗: ${errorMessage}`, true);
                console.error('API錯誤:', result);
            }
        } catch (error) {
            // 隱藏載入動畫
            loadingOverlay.style.display = 'none';
            showToast('OCR處理過程中發生錯誤，請重試', true);
            console.error('OCR錯誤:', error);
        }
    }
    
    // 將文件轉換為base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // 複製文字到剪貼板
    function copyToClipboard(textElement) {
        textElement.select();
        textElement.setSelectionRange(0, 99999); // 對於移動設備
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showToast('文字已複製到剪貼板');
            } else {
                showToast('複製失敗，請手動複製', true);
            }
        } catch (err) {
            // 嘗試使用現代API
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textElement.value)
                    .then(() => showToast('文字已複製到剪貼板'))
                    .catch(() => showToast('複製失敗，請手動複製', true));
            } else {
                showToast('您的瀏覽器不支持自動複製，請手動複製', true);
            }
        }
    }
    
    // 顯示提示訊息
    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.className = isError ? 'toast error' : 'toast';
        toast.style.display = 'block';
        toast.style.opacity = '1';
        toast.style.visibility = 'visible';
        
        // 3秒後隱藏
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
    
    // 自動調整textarea高度的函數
    function autoResizeTextarea() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    }
    
    // 處理AI互動
    async function processAIInteraction(text, prompt) {
        // 顯示載入動畫
        loadingOverlay.style.display = 'flex';
        
        try {
            // 準備Gemini API請求
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            const requestData = {
                contents: [{
                    parts: [
                        {text: `以下是OCR辨識出的文字內容：\n\n${text}\n\n用戶指令：${prompt}\n\n請根據用戶指令處理上述文字，只返回處理後的結果，不要添加任何解釋或額外信息。如果結果是表格數據，請使用清晰的表格格式（使用 | 作為列分隔符），確保表格格式整齊，每列對齊，並包含表頭行。如果識別到表格但格式不清晰，請嘗試重新整理成標準表格格式。`}
                    ]
                }]
            };
            
            // 發送請求到Gemini API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            // 隱藏載入動畫
            loadingOverlay.style.display = 'none';
            
            // 解析API響應
            if (response.ok && result.candidates && result.candidates.length > 0) {
                const processedText = result.candidates[0].content.parts[0].text;
                
                // 移除之前可能存在的表格容器
                const existingTableContainer = document.querySelector('.table-container');
                if (existingTableContainer) {
                    existingTableContainer.remove();
                }
                
                // 移除之前可能存在的隱藏textarea
                const existingHiddenTextarea = document.querySelector('.hidden-original-text');
                if (existingHiddenTextarea) {
                    existingHiddenTextarea.remove();
                }
                
                // 檢查是否為表格格式的文本
                if (isTableFormat(processedText)) {
                    // 將文本轉換為HTML表格
                    const tableHtml = convertToHtmlTable(processedText);
                    
                    // 創建一個隱藏的textarea用於複製原始文本
                    const originalTextArea = document.createElement('textarea');
                    originalTextArea.value = processedText;
                    originalTextArea.style.display = 'none';
                    originalTextArea.className = 'hidden-original-text';
                    document.body.appendChild(originalTextArea);
                    
                    // 顯示HTML表格
                    aiResultText.value = processedText; // 保持原始文本在textarea中用於複製
                    aiResultContainer.style.display = 'block';
                    
                    // 創建表格容器
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'table-container';
                    
                    // 添加搜索框
                    const searchContainer = document.createElement('div');
                    searchContainer.className = 'table-search-container';
                    searchContainer.innerHTML = `
                        <input type="text" id="table-search" placeholder="搜尋表格內容..." />
                        <button id="search-btn"><i class="fas fa-search"></i></button>
                    `;
                    
                    // 將搜索框和表格添加到容器
                    tableContainer.appendChild(searchContainer);
                    tableContainer.insertAdjacentHTML('beforeend', tableHtml);
                    
                    // 在textarea後面插入表格
                    aiResultText.parentNode.insertBefore(tableContainer, aiResultText.nextSibling);
                    
                    // 添加搜索功能
                    setTimeout(() => {
                        const searchInput = document.getElementById('table-search');
                        const searchBtn = document.getElementById('search-btn');
                        const table = document.getElementById('sortable-table');
                        
                        if (searchInput && searchBtn && table) {
                            const performSearch = () => {
                                const searchTerm = searchInput.value.toLowerCase();
                                const rows = table.querySelectorAll('tbody tr');
                                
                                rows.forEach(row => {
                                    const text = row.textContent.toLowerCase();
                                    if (text.includes(searchTerm)) {
                                        row.style.display = '';
                                    } else {
                                        row.style.display = 'none';
                                    }
                                });
                            };
                            
                            searchBtn.addEventListener('click', performSearch);
                            searchInput.addEventListener('keyup', (e) => {
                                if (e.key === 'Enter') {
                                    performSearch();
                                }
                            });
                        }
                    }, 100);
                    
                    // 隱藏原始textarea
                    aiResultText.style.display = 'none';
                    
                    // 添加表格說明
                    const tableInfo = document.createElement('div');
                    tableInfo.className = 'table-info';
                    tableInfo.innerHTML = '<p><i class="fas fa-info-circle"></i> 表格已格式化顯示，點擊「複製文字」按鈕可複製原始文本。支持表格排序和搜索功能。</p>';
                    tableContainer.parentNode.insertBefore(tableInfo, tableContainer);
                    
                    // 添加表格標題（如果能從處理指令中推斷）
                    let tableTitle = '';
                    if (prompt.toLowerCase().includes('表格') || prompt.toLowerCase().includes('table')) {
                        const promptWords = prompt.split(/\s+/);
                        // 嘗試從提示中提取可能的表格標題
                        for (let i = 0; i < promptWords.length; i++) {
                            if (promptWords[i].includes('表格') || promptWords[i].includes('table')) {
                                // 獲取後面的詞作為可能的標題
                                if (i + 1 < promptWords.length && promptWords[i+1].length > 1) {
                                    tableTitle = promptWords[i+1];
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 如果找到標題，添加到表格上方
                    if (tableTitle) {
                        const titleElement = document.createElement('div');
                        titleElement.className = 'table-title';
                        titleElement.textContent = tableTitle;
                        tableContainer.parentNode.insertBefore(titleElement, tableContainer);
                    }
                    
                    // 修改複製按鈕的行為，使其複製原始文本
                    aiCopyBtn.onclick = function() {
                        copyToClipboard(originalTextArea);
                    };
                } else {
                    // 非表格格式，正常顯示文本
                    aiResultText.value = processedText;
                    aiResultText.style.display = 'block';
                    aiResultContainer.style.display = 'block';
                    
                    // 恢復複製按鈕的原始行為
                    aiCopyBtn.onclick = function() {
                        copyToClipboard(aiResultText);
                    };
                }
                
                // 滾動到結果區域
                aiResultContainer.scrollIntoView({ behavior: 'smooth' });
                
                showToast('處理完成');
            } else {
                // 提供更詳細的錯誤信息
                let errorMessage = '無法從API響應中提取處理結果';
                let errorDetails = '';
                let errorSolution = '';
                
                if (result.error) {
                    errorMessage = result.error.message;
                    // 檢查是否為API密鑰錯誤
                    if (errorMessage.includes('API key')) {
                        errorDetails = '您提供的API密鑰無效或已過期。';
                        errorSolution = '請檢查您的API密鑰是否正確，或者嘗試重新生成一個新的API密鑰。您可以在Google AI Studio網站上獲取新的API密鑰。';
                    } 
                    // 檢查是否為配額或限制錯誤
                    else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
                        errorDetails = '您已達到API使用限制或配額。';
                        errorSolution = '請稍後再試或檢查您的API配額。如果您經常遇到此問題，可能需要升級您的API使用計劃。';
                    }
                    // 檢查是否為模型不可用
                    else if (errorMessage.includes('model') && errorMessage.includes('available')) {
                        errorDetails = '所請求的AI模型目前不可用。';
                        errorSolution = '請稍後再試。這通常是暫時性問題，Google可能正在更新或維護其AI模型。';
                    }
                    // 檢查是否為內容政策違規
                    else if (errorMessage.includes('content') && (errorMessage.includes('policy') || errorMessage.includes('safety'))) {
                        errorDetails = '您的請求可能違反了Google的內容政策。';
                        errorSolution = '請檢查您的文本內容和處理指令，確保它們不包含敏感或違規內容。';
                    }
                } else if (!response.ok) {
                    // 處理HTTP錯誤
                    errorMessage = `HTTP錯誤: ${response.status} ${response.statusText}`;
                    if (response.status === 429) {
                        errorDetails = '請求過多，API服務器拒絕了您的請求。';
                        errorSolution = '請稍後再試。如果您在短時間內發送了多個請求，請嘗試減少請求頻率。';
                    } else if (response.status >= 500) {
                        errorDetails = 'API服務器暫時不可用或發生內部錯誤。';
                        errorSolution = '這是服務器端的問題，請稍後再試。如果問題持續存在，可能需要聯繫Google API支持。';
                    } else if (response.status === 400) {
                        errorDetails = '請求格式不正確或包含無效參數。';
                        errorSolution = '請檢查您的請求格式和參數。如果問題持續存在，可能需要更新應用程序。';
                    } else if (response.status === 401 || response.status === 403) {
                        errorDetails = '未授權訪問API或權限不足。';
                        errorSolution = '請檢查您的API密鑰權限，或嘗試重新生成一個新的API密鑰。';
                    }
                }
                
                // 顯示錯誤信息
                let fullErrorMessage = errorDetails ? `處理失敗: ${errorMessage}\n${errorDetails}` : `處理失敗: ${errorMessage}`;
                showToast(fullErrorMessage, true);
                console.error('API錯誤:', result);
                
                // 在結果區域顯示更詳細的錯誤信息和建議
                let errorSolutionText = errorSolution || '請檢查您的網絡連接和API密鑰，然後重試。如果問題持續存在，請嘗試使用較短的文本或不同的處理指令。';
                
                // 格式化錯誤信息，使其更易於閱讀
                aiResultText.value = `處理文字時發生錯誤:\n\n錯誤類型: ${errorMessage}\n\n可能的原因:\n${errorDetails || '未知錯誤，可能是API服務暫時不可用或請求格式不正確。'}\n\n解決方案:\n${errorSolutionText}\n\n如果問題持續存在，請嘗試:\n1. 重新整理頁面後再試\n2. 檢查API密鑰是否有效\n3. 減少文本長度或分段處理\n4. 使用不同的處理指令`;
                
                // 顯示結果區域並滾動到可見位置
                aiResultContainer.style.display = 'block';
                aiResultContainer.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            // 隱藏載入動畫
            loadingOverlay.style.display = 'none';
            
            // 提供更詳細的錯誤信息
            let errorMessage = '處理過程中發生錯誤';
            let errorDetails = '';
            let errorSolution = '';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = '網絡請求失敗';
                errorDetails = '請檢查您的網絡連接是否正常。';
                errorSolution = '確保您已連接到互聯網，並且可以訪問Google的API服務。';
            } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
                errorMessage = 'API響應格式錯誤';
                errorDetails = 'API返回的數據格式不正確，請稍後再試。';
                errorSolution = '這通常是暫時性問題，請稍後重試。';
            } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
                errorMessage = '請求超時';
                errorDetails = '與API服務器的連接超時。';
                errorSolution = '請檢查您的網絡連接速度，或稍後再試。';
            } else if (error.message.includes('abort') || error.message.includes('aborted')) {
                errorMessage = '請求被中斷';
                errorDetails = '處理過程被意外中斷。';
                errorSolution = '請重新嘗試處理操作。';
            }
            
            // 顯示錯誤信息
            let fullErrorMessage = errorDetails ? `${errorMessage}：${errorDetails}` : `${errorMessage}，請重試`;
            showToast(fullErrorMessage, true);
            console.error('AI處理錯誤:', error);
            
            // 在結果區域顯示更詳細的錯誤信息和建議
            let errorSolutionText = errorSolution || '請檢查您的網絡連接和API密鑰，然後重試。如果問題持續存在，請嘗試使用較短的文本或不同的處理指令。';
            
            // 格式化錯誤信息，使其更易於閱讀
            aiResultText.value = `處理文字時發生錯誤:\n\n錯誤類型: ${errorMessage}\n錯誤詳情: ${error.message}\n\n可能的原因:\n${errorDetails || '未知錯誤，可能是網絡問題或API服務暫時不可用。'}\n\n解決方案:\n${errorSolutionText}\n\n如果問題持續存在，請嘗試:\n1. 重新整理頁面後再試\n2. 檢查API密鑰是否有效\n3. 減少文本長度或分段處理\n4. 使用不同的瀏覽器`;
            
            // 顯示結果區域並滾動到可見位置
            aiResultContainer.style.display = 'block';
            aiResultContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // 判斷文本是否為表格格式
    function isTableFormat(text) {
        // 檢查是否包含多行且每行都有分隔符（如|、tab或多個空格）
        const lines = text.trim().split('\n');
        if (lines.length < 2) return false;
        
        // 檢查是否有表格分隔符
        let delimiterCount = 0;
        let delimiterType = null;
        
        // 檢查第一行的分隔符類型和數量
        if (lines[0].includes('|')) {
            delimiterType = '|';
            delimiterCount = (lines[0].match(/\|/g) || []).length;
        } else if (lines[0].includes('\t')) {
            delimiterType = '\t';
            delimiterCount = (lines[0].split('\t').length - 1);
        } else if (/\s{2,}/.test(lines[0])) {
            delimiterType = 'space';
            delimiterCount = (lines[0].match(/\s{2,}/g) || []).length;
        }
        
        // 檢查是否有CSV格式（逗號分隔）
        if (!delimiterType && lines[0].includes(',')) {
            // 確認是否真的是CSV格式（至少有2個逗號且每行都有相似數量的逗號）
            const firstLineCommas = (lines[0].match(/,/g) || []).length;
            if (firstLineCommas >= 2) {
                let csvConsistentLines = 0;
                for (let i = 0; i < Math.min(lines.length, 10); i++) {
                    const commaCount = (lines[i].match(/,/g) || []).length;
                    if (Math.abs(commaCount - firstLineCommas) <= 1) {
                        csvConsistentLines++;
                    }
                }
                
                if (csvConsistentLines >= Math.min(lines.length, 10) * 0.7) {
                    delimiterType = ',';
                    delimiterCount = firstLineCommas;
                }
            }
        }
        
        // 如果沒有找到分隔符，則嘗試檢測其他表格特徵
        if (!delimiterType || delimiterCount === 0) {
            // 檢查是否有數字列表格式（如1. 項目1  2. 項目2）
            // 擴展模式以支持中文數字標記（如：1。 項目1  2、項目2）
            const numberListPattern = /^\s*\d+[\.):。、]\s+.+$/;
            let numberListLines = 0;
            for (let i = 0; i < Math.min(lines.length, 5); i++) {
                if (numberListPattern.test(lines[i])) {
                    numberListLines++;
                }
            }
            if (numberListLines >= 3) return true; // 如果前5行中有3行以上符合數字列表格式，認為是表格
            
            // 檢查是否有固定寬度的列（每行在相同位置有空格分隔）
            const columnPositions = detectFixedWidthColumns(lines);
            if (columnPositions.length >= 2) return true;
            
            // 檢查是否有類似表格的結構（如每行都有相似的模式）
            const patterns = [];
            for (let i = 0; i < Math.min(lines.length, 10); i++) {
                // 將每行轉換為模式：字母=A，數字=N，空格=S，標點=P
                let pattern = '';
                for (let j = 0; j < lines[i].length; j++) {
                    const char = lines[i][j];
                    if (/[a-zA-Z\u4e00-\u9fa5]/.test(char)) pattern += 'A';
                    else if (/\d/.test(char)) pattern += 'N';
                    else if (/\s/.test(char)) pattern += 'S';
                    else pattern += 'P';
                }
                patterns.push(pattern);
            }
            
            // 檢查模式的相似度
            let similarPatterns = 0;
            const firstPattern = patterns[0];
            for (let i = 1; i < patterns.length; i++) {
                // 計算模式相似度
                const similarity = calculatePatternSimilarity(firstPattern, patterns[i]);
                if (similarity > 0.7) { // 如果相似度大於70%
                    similarPatterns++;
                }
            }
            
            if (similarPatterns >= patterns.length * 0.6) return true;
            
            // 檢查是否有表格關鍵詞
            const tableKeywords = ['表格', '表', 'table', '列表', 'list', '清單', '數據', 'data'];
            for (let i = 0; i < Math.min(5, lines.length); i++) {
                const line = lines[i].toLowerCase();
                if (tableKeywords.some(keyword => line.includes(keyword))) {
                    // 如果前5行中包含表格關鍵詞，增加表格判斷的可能性
                    return true;
                }
            }
            
            return false;
        }
        
        // 檢查每行的分隔符數量是否一致（表格通常每行有相同數量的列）
        // 允許有一些行不一致（例如分隔線行）
        let consistentLines = 0;
        const totalLines = lines.length;
        
        // 檢查是否有明顯的表格特徵（如標題行、分隔線等）
        let hasTableFeatures = false;
        
        // 檢查是否有標題分隔行（通常是第二行，由 ----- 組成）
        if (lines.length > 1 && lines[1].replace(/[\-|+:\s]/g, '') === '') {
            hasTableFeatures = true;
        }
        
        // 檢查是否有明顯的表頭（第一行與其他行格式不同）
        const firstLineWords = lines[0].split(/\s+/).filter(word => word.trim() !== '');
        if (firstLineWords.length >= 2 && firstLineWords.every(word => word.length > 0)) {
            // 檢查第一行是否都是短詞（可能是表頭）
            if (firstLineWords.every(word => word.length < 20)) {
                hasTableFeatures = true;
            }
        }
        
        // 檢查是否有行首數字序號（如1、2、3或①②③）
        const hasNumberPrefix = lines.slice(1, Math.min(6, lines.length)).every(line => {
            return /^\s*([0-9０-９①-⑳⑴-⑽一二三四五六七八九十]+)[、.．:：)）]/.test(line.trim());
        });
        if (hasNumberPrefix && lines.length >= 3) {
            hasTableFeatures = true;
        }
        
        for (let i = 0; i < totalLines; i++) {
            const line = lines[i].trim();
            // 跳過空行或分隔線行
            if (line === '' || line.replace(/[\-|+:\s]/g, '') === '') continue;
            
            let currentCount = 0;
            if (delimiterType === '|') {
                currentCount = (line.match(/\|/g) || []).length;
            } else if (delimiterType === '\t') {
                currentCount = (line.split('\t').length - 1);
            } else if (delimiterType === 'space') {
                currentCount = (line.match(/\s{2,}/g) || []).length;
            } else if (delimiterType === ',') {
                currentCount = (line.match(/,/g) || []).length;
            }
            
            if (Math.abs(currentCount - delimiterCount) <= 1) { // 允許有1個分隔符的差異
                consistentLines++;
            }
        }
        
        // 如果至少60%的行符合表格格式，則認為是表格
        // 或者如果有明顯的表格特徵且至少50%的行符合表格格式
        return (consistentLines / totalLines) >= 0.6 || 
               (hasTableFeatures && (consistentLines / totalLines) >= 0.5);
    }
    
    // 計算兩個模式字符串的相似度
    function calculatePatternSimilarity(pattern1, pattern2) {
        const len1 = pattern1.length;
        const len2 = pattern2.length;
        
        // 如果長度差異太大，直接返回低相似度
        if (Math.abs(len1 - len2) > Math.min(len1, len2) * 0.3) {
            return 0.5;
        }
        
        // 計算共同字符的數量
        const minLen = Math.min(len1, len2);
        let commonChars = 0;
        
        for (let i = 0; i < minLen; i++) {
            if (pattern1[i] === pattern2[i]) {
                commonChars++;
            }
        }
        
        return commonChars / minLen;
    }
    
    // 檢測固定寬度列的函數
    function detectFixedWidthColumns(lines) {
        // 只分析前10行（或更少）
        const sampleLines = lines.slice(0, Math.min(10, lines.length));
        
        // 找出每行中可能的列分隔位置（連續2個或更多空格的位置）
        const potentialPositions = [];
        
        sampleLines.forEach(line => {
            let inSpace = false;
            let spaceStart = -1;
            
            for (let i = 0; i < line.length; i++) {
                if (line[i] === ' ') {
                    if (!inSpace) {
                        inSpace = true;
                        spaceStart = i;
                    }
                } else {
                    if (inSpace) {
                        inSpace = false;
                        const spaceLength = i - spaceStart;
                        if (spaceLength >= 2) {
                            // 記錄空格的中間位置
                            potentialPositions.push(Math.floor((spaceStart + i) / 2));
                        }
                    }
                }
            }
        });
        
        // 計算每個位置出現的頻率
        const positionCounts = {};
        potentialPositions.forEach(pos => {
            // 允許1-2個字符的誤差
            const rangeStart = pos - 1;
            const rangeEnd = pos + 1;
            
            for (let i = rangeStart; i <= rangeEnd; i++) {
                positionCounts[i] = (positionCounts[i] || 0) + 1;
            }
        });
        
        // 找出頻繁出現的位置（至少在30%的樣本行中出現）
        const threshold = sampleLines.length * 0.3;
        const columnPositions = [];
        
        for (const pos in positionCounts) {
            if (positionCounts[pos] >= threshold) {
                columnPositions.push(parseInt(pos));
            }
        }
        
        // 排序位置
        columnPositions.sort((a, b) => a - b);
        
        // 合併太接近的位置
        const mergedPositions = [];
        let lastPos = -999;
        
        for (const pos of columnPositions) {
            if (pos - lastPos > 3) { // 如果與上一個位置相差超過3個字符
                mergedPositions.push(pos);
                lastPos = pos;
            }
        }
        
        return mergedPositions;
    }
    
    // 將文本轉換為HTML表格
    function convertToHtmlTable(text) {
        const lines = text.trim().split('\n');
        let delimiter = '|';
        let delimiterType = 'pipe';
        
        // 確定分隔符類型
        if (!lines[0].includes('|')) {
            if (lines[0].includes('\t')) {
                delimiter = '\t';
                delimiterType = 'tab';
            } else if (lines[0].includes(',')) {
                // 檢查是否為CSV格式
                const commaCount = (lines[0].match(/,/g) || []).length;
                if (commaCount >= 2) {
                    delimiter = ',';
                    delimiterType = 'csv';
                }
            } else if (lines[0].match(/\s{2,}/)) {
                delimiter = /\s{2,}/; // 兩個或更多空格
                delimiterType = 'space';
            } else {
                // 嘗試檢測固定寬度列
                const columnPositions = detectFixedWidthColumns(lines);
                if (columnPositions.length > 0) {
                    delimiterType = 'fixed-width';
                } else {
                    delimiterType = 'space'; // 默認使用空格
                }
            }
        }
        
        // 處理表格數據
        const tableData = [];
        let hasHeaderSeparator = false;
        
        // 檢查是否有標題分隔行（通常是第二行，由 ----- 組成）
        if (lines.length > 1 && lines[1].replace(/[\-|+:\s]/g, '') === '') {
            hasHeaderSeparator = true;
        }
        
        // 檢查是否為數字列表格式（如1. 項目1  2. 項目2）
        const isNumberedList = lines.length > 2 && lines.slice(0, Math.min(5, lines.length)).every(line => /^\s*\d+[\.):]\s+.+$/.test(line));
        
        // 解析每一行
        for (let i = 0; i < lines.length; i++) {
            // 跳過分隔行
            if (lines[i].replace(/[\-|+:\s]/g, '') === '') continue;
            
            let cells;
            if (isNumberedList) {
                // 處理數字列表格式
                const match = lines[i].match(/^\s*(\d+[\.):])\s+(.+)$/);
                if (match) {
                    cells = [match[1], match[2]];
                } else {
                    cells = [""]; // 如果不匹配，添加一個空單元格
                }
            } else if (delimiterType === 'pipe') {
                // 處理 | 分隔的表格，需要過濾空單元格
                cells = lines[i].split('|').map(cell => cell.trim());
                // 如果首尾是空字符串（由於分隔符在行首尾），則移除
                if (cells[0] === '') cells.shift();
                if (cells[cells.length - 1] === '') cells.pop();
            } else if (delimiterType === 'tab') {
                cells = lines[i].split('\t').map(cell => cell.trim());
            } else if (delimiterType === 'csv') {
                // 處理CSV格式，需要考慮引號內的逗號
                cells = [];
                let inQuotes = false;
                let currentCell = '';
                
                for (let j = 0; j < lines[i].length; j++) {
                    const char = lines[i][j];
                    
                    if (char === '"') {
                        // 切換引號狀態
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        // 如果不在引號內遇到逗號，則結束當前單元格
                        cells.push(currentCell.trim());
                        currentCell = '';
                    } else {
                        // 添加字符到當前單元格
                        currentCell += char;
                    }
                }
                
                // 添加最後一個單元格
                cells.push(currentCell.trim());
            } else if (delimiterType === 'fixed-width') {
                // 處理固定寬度的表格
                const columnPositions = detectFixedWidthColumns(lines);
                cells = [];
                let lastPos = 0;
                
                // 根據列位置分割行
                for (let j = 0; j < columnPositions.length; j++) {
                    const pos = columnPositions[j];
                    const cellContent = lines[i].substring(lastPos, pos).trim();
                    cells.push(cellContent);
                    lastPos = pos;
                }
                
                // 添加最後一列
                const lastCellContent = lines[i].substring(lastPos).trim();
                if (lastCellContent) cells.push(lastCellContent);
                
                // 過濾空單元格
                cells = cells.filter(cell => cell !== '');
            } else {
                // 處理空格分隔的表格
                cells = lines[i].split(/\s{2,}/).map(cell => cell.trim()).filter(cell => cell !== '');
            }
            
            tableData.push(cells);
        }
        
        // 確保所有行有相同數量的列
        const maxColumns = Math.max(...tableData.map(row => row.length));
        tableData.forEach(row => {
            while (row.length < maxColumns) {
                row.push('');
            }
        });
        
        // 構建HTML表格
        let tableHtml = '<table class="styled-table" id="sortable-table">';
        
        // 添加表頭
        tableHtml += '<thead><tr>';
        const headerRow = tableData[0];
        headerRow.forEach((cell, index) => {
            // 檢查是否為數字列，設置對應的對齊方式
            const isNumericColumn = isColumnNumeric(tableData, index);
            const alignment = isNumericColumn ? 'right' : 'left';
            tableHtml += `<th style="text-align: ${alignment};">${cell}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        // 添加表格內容
        tableHtml += '<tbody>';
        // 表格內容從 tableData 的索引 1 開始 (索引 0 是表頭)
        for (let i = 1; i < tableData.length; i++) {
            // 根據數據行的實際索引 (i-1) 來決定奇偶行樣式
            tableHtml += `<tr class="${(i - 1) % 2 === 0 ? 'odd-row' : 'even-row'}">`;
            tableData[i].forEach((cell, cellIndex) => {
                // 檢查單元格是否包含數字，如果是則右對齊
                const isNumeric = /^[\-+]?\d*\.?\d+$/.test(cell.trim());
                const alignment = isNumeric ? 'right' : 'left';
                // 處理空單元格，添加一個空格確保單元格有高度
                const cellContent = cell.trim() === '' ? '&nbsp;' : cell;
                // 為第一列添加特殊樣式（通常是標識符或序號）
                const isFirstColumn = cellIndex === 0;
                const cellClass = isFirstColumn ? 'first-column' : '';
                tableHtml += `<td class="${cellClass}" style="text-align: ${alignment};">${cellContent}</td>`;
            });
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        
        // 添加表格樣式
        let tableStyle = `
        <style>
            .table-container {
                overflow-x: auto;
                margin: 20px 0;
                border-radius: 12px;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
                background-color: white;
                padding: 16px;
                position: relative;
                transition: all 0.3s ease;
                max-height: 80vh; /* 限制最大高度，避免表格過長 */
                scrollbar-width: thin; /* Firefox */
                scrollbar-color: #4285f4 #f1f1f1; /* Firefox */
            }
            
            /* 自定義滾動條樣式 */
            .table-container::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            .table-container::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
            }
            .table-container::-webkit-scrollbar-thumb {
                background: #4285f4;
                border-radius: 10px;
            }
            .table-container::-webkit-scrollbar-thumb:hover {
                background: #3367d6;
            }
            .table-search-container {
                display: flex;
                margin-bottom: 15px;
                position: relative;
            }
            #table-search {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
                transition: all 0.3s;
            }
            #table-search:focus {
                outline: none;
                border-color: #4285f4;
                box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
            }
            #search-btn {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #4285f4;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s;
            }
            #search-btn:hover {
                color: #3367d6;
            }
            .styled-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                font-size: 15px;
                font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif;
                background-color: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            }
            .styled-table thead tr {
                background: linear-gradient(135deg, #4285f4, #3367d6);
                color: white;
                font-weight: bold;
                letter-spacing: 0.6px;
                text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
                height: 60px;
                position: sticky;
                top: 0;
                z-index: 10;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            .styled-table th {
                position: sticky;
                top: 0;
                padding: 16px 18px;
                border: 1px solid rgba(224, 224, 224, 0.5);
                border-bottom: 3px solid #3367d6;
                text-align: left;
                transition: background-color 0.2s;
                font-size: 16px;
                vertical-align: middle;
            }
            .styled-table td {
                padding: 14px 18px;
                border: 1px solid #e0e0e0;
                transition: all 0.2s;
                word-break: break-word;
                vertical-align: middle;
                line-height: 1.5;
                position: relative;
                overflow: hidden;
            }
            
            /* 添加單元格懸停效果 */
            .styled-table td:hover::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(66, 133, 244, 0.05);
                pointer-events: none;
            }
            .styled-table tbody tr {
                transition: all 0.3s;
            }
            .styled-table tbody tr:last-of-type td {
                border-bottom: 1px solid #e0e0e0;
            }
            .styled-table tbody tr.odd-row {
                background-color: #f8f9fa;
            }
            .styled-table tbody tr.even-row {
                background-color: #ffffff;
            }
            .styled-table tbody tr:nth-child(odd) {
                background-color: rgba(242, 245, 250, 0.8);
            }
            .styled-table tbody tr:nth-child(even) {
                background-color: #ffffff;
            }
            .styled-table tbody tr:hover {
                background-color: #e8f0fe;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
                z-index: 5;
                position: relative;
            }
            
            /* 改進數字單元格樣式 */
            .styled-table td[style*="text-align: right"] {
                font-family: 'Consolas', monospace;
                font-variant-numeric: tabular-nums;
                letter-spacing: 0.5px;
                background-color: rgba(242, 245, 250, 0.5);
            }
            
            /* 改進表格在移動設備上的顯示 */
            @media (max-width: 576px) {
                .styled-table {
                    font-size: 13px;
                }
                .styled-table th {
                    padding: 12px 10px;
                    font-size: 14px;
                }
                .styled-table td {
                    padding: 10px 8px;
                }
                .table-container {
                    padding: 10px;
                    border-radius: 8px;
                }
            }
            
            /* 添加行選中效果 */
            .styled-table tbody tr.selected {
                background-color: #e8f0fe;
                box-shadow: 0 0 0 2px #4285f4 inset;
            }
            .styled-table td.first-column {
                font-weight: 500;
                color: #333;
                background-color: rgba(66, 133, 244, 0.05);
                border-right: 2px solid rgba(66, 133, 244, 0.2);
            }
            .table-info {
                margin: 10px 0 15px 0;
                padding: 12px 18px;
                background-color: #f1f8ff;
                border-left: 4px solid #4285f4;
                border-radius: 8px;
                font-size: 14px;
                color: #333;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            }
            .table-info p {
                margin: 0;
                display: flex;
                align-items: center;
            }
            .table-info i {
                margin-right: 10px;
                color: #4285f4;
                font-size: 16px;
            }
            .table-title {
                margin: 10px 0 15px 0;
                padding: 12px 18px;
                background-color: #e8f0fe;
                border-left: 4px solid #4285f4;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                color: #333;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                text-align: center;
            }
            /* 表格容器的漸變邊框效果 */
            .table-container::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, #4285f4, #34a853, #fbbc05, #ea4335);
                z-index: -1;
                border-radius: 14px;
                opacity: 0.6;
                animation: borderGlow 8s infinite alternate;
            }
            @keyframes borderGlow {
                0% { opacity: 0.4; }
                100% { opacity: 0.7; }
            }
            /* 響應式設計優化 */
            @media screen and (max-width: 768px) {
                .styled-table {
                    font-size: 14px;
                }
                .styled-table th {
                    padding: 14px 16px;
                    font-size: 15px;
                }
                .styled-table td {
                    padding: 12px 14px;
                }
                .table-info {
                    padding: 10px 14px;
                    font-size: 13px;
                }
                .styled-table thead tr {
                    height: 50px;
                }
            }
            @media screen and (max-width: 480px) {
                .styled-table {
                    font-size: 13px;
                }
                .styled-table th {
                    padding: 12px 14px;
                    font-size: 14px;
                }
                .styled-table td {
                    padding: 10px 12px;
                }
                .table-container {
                    margin: 15px 0;
                    padding: 8px;
                    border-radius: 10px;
                }
                .styled-table thead tr {
                    height: 45px;
                }
            }
            /* 打印樣式優化 */
            @media print {
                .table-container {
                    box-shadow: none;
                    margin: 0;
                }
                .styled-table thead tr {
                    background-color: #f1f1f1 !important;
                    color: #333 !important;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    height: auto;
                }
                .styled-table tbody tr:hover {
                    background-color: inherit;
                    transform: none;
                    box-shadow: none;
                }
                .table-container::before {
                    display: none;
                }
            }
        </style>
        `;
        
        // 添加表格排序功能的JavaScript代碼
        const sortScript = `
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const table = document.getElementById('sortable-table');
            if (!table) return;
            
            const headers = table.querySelectorAll('th');
            const tableBody = table.querySelector('tbody');
            const rows = Array.from(tableBody.querySelectorAll('tr'));
            
            // 添加排序指示器和點擊事件
            headers.forEach((header, index) => {
                // 添加排序指示器
                header.innerHTML += '<span class="sort-icon"> ↕️</span>';
                
                // 添加點擊事件
                header.addEventListener('click', () => {
                    // 獲取當前排序方向
                    const currentDirection = header.getAttribute('data-sort-direction') || 'none';
                    let newDirection = 'asc';
                    
                    // 切換排序方向
                    if (currentDirection === 'asc') {
                        newDirection = 'desc';
                    } else if (currentDirection === 'desc') {
                        newDirection = 'none';
                    }
                    
                    // 重置所有表頭的排序方向
                    headers.forEach(h => {
                        h.setAttribute('data-sort-direction', 'none');
                        h.querySelector('.sort-icon').textContent = ' ↕️';
                    });
                    
                    // 設置當前表頭的排序方向
                    header.setAttribute('data-sort-direction', newDirection);
                    
                    // 更新排序指示器
                    if (newDirection === 'asc') {
                        header.querySelector('.sort-icon').textContent = ' ↑';
                    } else if (newDirection === 'desc') {
                        header.querySelector('.sort-icon').textContent = ' ↓';
                    }
                    
                    // 如果是「無排序」狀態，恢復原始順序
                    if (newDirection === 'none') {
                        // 恢復原始順序
                        rows.sort((a, b) => {
                            return parseInt(a.getAttribute('data-original-index')) - 
                                   parseInt(b.getAttribute('data-original-index'));
                        });
                    } else {
                        // 排序行
                        rows.sort((a, b) => {
                            const aValue = a.querySelectorAll('td')[index].textContent.trim();
                            const bValue = b.querySelectorAll('td')[index].textContent.trim();
                            
                            // 檢查是否為數字
                            const aNum = parseFloat(aValue.replace(/[^\d.-]/g, ''));
                            const bNum = parseFloat(bValue.replace(/[^\d.-]/g, ''));
                            
                            if (!isNaN(aNum) && !isNaN(bNum)) {
                                // 數字比較
                                return newDirection === 'asc' ? aNum - bNum : bNum - aNum;
                            } else {
                                // 字符串比較
                                return newDirection === 'asc' ? 
                                    aValue.localeCompare(bValue, 'zh-TW') : 
                                    bValue.localeCompare(aValue, 'zh-TW');
                            }
                        });
                    }
                    
                    // 重新排列表格行
                    rows.forEach(row => tableBody.appendChild(row));
                });
            });
            
            // 為每行添加原始索引屬性
            rows.forEach((row, index) => {
                row.setAttribute('data-original-index', index);
            });
        });
        </script>
        `;
        
        // 添加排序圖標樣式
        tableStyle += `
        <style>
        .sort-icon {
            display: inline-block;
            margin-left: 5px;
            font-size: 12px;
            opacity: 0.7;
            transition: all 0.2s;
        }
        th:hover .sort-icon {
            opacity: 1;
        }
        th {
            cursor: pointer;
            user-select: none;
        }
        </style>
        `;
        
        return tableStyle + tableHtml + sortScript;
    }
    
    // 檢查整列是否為數字類型（用於設置列的對齊方式）
    function isColumnNumeric(tableData, columnIndex) {
        // 跳過表頭行
        let numericCount = 0;
        let totalValidCells = 0;
        
        // 從第二行開始檢查
        for (let i = 1; i < tableData.length; i++) {
            if (tableData[i].length > columnIndex) {
                const cell = tableData[i][columnIndex].trim();
                if (cell !== '') {
                    totalValidCells++;
                    // 擴展數字識別模式，支持千分位逗號、百分比和科學計數法
                    if (/^[\-+]?[\d,]+(\.\d+)?%?([eE][\-+]?\d+)?$/.test(cell)) {
                        numericCount++;
                    }
                }
            }
        }
        
        // 如果沒有有效單元格，返回false
        if (totalValidCells === 0) return false;
        
        // 如果超過65%的有效單元格是數字，則認為整列是數字類型
        return numericCount >= totalValidCells * 0.65;
    }
    
    // 重置UI
    function resetUI() {
        uploadArea.style.display = 'block';
        previewContainer.style.display = 'none';
        previewImage.src = '';
        fileInput.value = '';
        currentFile = null;
        resultSection.style.display = 'none';
        aiInteractionSection.style.display = 'none';
        aiResultContainer.style.display = 'none';
    }
});