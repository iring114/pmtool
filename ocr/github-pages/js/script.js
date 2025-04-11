document.addEventListener('DOMContentLoaded', function() {
    // 獲取DOM元素
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');
    const changeImageBtn = document.getElementById('change-image-btn');
    const ocrBtn = document.getElementById('ocr-btn');
    const resultSection = document.getElementById('result-section');
    const resultText = document.getElementById('result-text');
    const copyBtn = document.getElementById('copy-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const toast = document.getElementById('toast');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const apiKeySection = document.getElementById('api-key-section');
    const aiInteractionSection = document.getElementById('ai-interaction-section');
    const aiPromptInput = document.getElementById('ai-prompt-input');
    const aiProcessBtn = document.getElementById('ai-process-btn');
    const aiResultContainer = document.querySelector('.ai-result-container');
    const aiResultText = document.getElementById('ai-result-text');
    const aiCopyBtn = document.getElementById('ai-copy-btn')
    
    // 當前上傳的文件和API密鑰
    let currentFile = null;
    let apiKey = localStorage.getItem('gemini_api_key') || '';
    
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
            localStorage.setItem('gemini_api_key', newApiKey);
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
        
        // 3秒後隱藏
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
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
                        {text: `以下是OCR辨識出的文字內容：\n\n${text}\n\n用戶指令：${prompt}\n\n請根據用戶指令處理上述文字，只返回處理後的結果，不要添加任何解釋或額外信息。`}
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
                
                // 顯示結果
                aiResultText.value = processedText;
                aiResultContainer.style.display = 'block';
                
                showToast('處理完成');
            } else {
                const errorMessage = result.error ? result.error.message : '無法從API響應中提取處理結果';
                showToast(`處理失敗: ${errorMessage}`, true);
                console.error('API錯誤:', result);
            }
        } catch (error) {
            // 隱藏載入動畫
            loadingOverlay.style.display = 'none';
            showToast('處理過程中發生錯誤，請重試', true);
            console.error('AI處理錯誤:', error);
        }
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