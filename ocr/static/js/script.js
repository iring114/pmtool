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
    
    // 當前上傳的文件名
    let currentFileName = '';
    
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
        if (currentFileName) {
            processOCR(currentFileName);
        } else {
            showToast('請先上傳圖片', true);
        }
    });
    
    // 複製按鈕
    copyBtn.addEventListener('click', function() {
        copyToClipboard();
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
        
        // 顯示載入動畫
        loadingOverlay.style.display = 'flex';
        
        // 創建FormData對象
        const formData = new FormData();
        formData.append('file', file);
        
        // 發送上傳請求
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loadingOverlay.style.display = 'none';
            
            if (data.success) {
                // 顯示預覽
                previewImage.src = data.file_url;
                uploadArea.style.display = 'none';
                previewContainer.style.display = 'block';
                currentFileName = data.filename;
                
                // 隱藏結果區域（如果之前顯示過）
                resultSection.style.display = 'none';
                resultText.value = '';
                
                showToast('圖片上傳成功');
            } else {
                showToast(data.error || '上傳失敗，請重試', true);
            }
        })
        .catch(error => {
            loadingOverlay.style.display = 'none';
            showToast('上傳過程中發生錯誤，請重試', true);
            console.error('上傳錯誤:', error);
        });
    }
    
    // 處理OCR
    function processOCR(filename) {
        // 顯示載入動畫
        loadingOverlay.style.display = 'flex';
        
        // 發送OCR請求
        fetch('/ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename: filename })
        })
        .then(response => response.json())
        .then(data => {
            loadingOverlay.style.display = 'none';
            
            if (data.success) {
                // 顯示結果
                resultText.value = data.text;
                resultSection.style.display = 'block';
                
                // 滾動到結果區域
                resultSection.scrollIntoView({ behavior: 'smooth' });
                
                showToast('OCR處理完成');
            } else {
                showToast(data.error || 'OCR處理失敗，請重試', true);
            }
        })
        .catch(error => {
            loadingOverlay.style.display = 'none';
            showToast('OCR處理過程中發生錯誤，請重試', true);
            console.error('OCR錯誤:', error);
        });
    }
    
    // 複製文字到剪貼板
    function copyToClipboard() {
        resultText.select();
        resultText.setSelectionRange(0, 99999); // 對於移動設備
        
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
                navigator.clipboard.writeText(resultText.value)
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
    
    // 重置UI
    function resetUI() {
        uploadArea.style.display = 'block';
        previewContainer.style.display = 'none';
        previewImage.src = '';
        fileInput.value = '';
        currentFileName = '';
    }
});