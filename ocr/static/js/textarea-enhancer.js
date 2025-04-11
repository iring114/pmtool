/**
 * Textarea增強器 - 為OCR工具中的textarea元素添加增強功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 獲取所有textarea元素
    const textareas = document.querySelectorAll('textarea');
    
    // 為每個textarea添加自動調整高度功能
    textareas.forEach(textarea => {
        // 添加auto-resize類
        textarea.classList.add('auto-resize');
        
        // 初始調整高度
        autoResizeTextarea(textarea);
        
        // 監聽輸入事件以調整高度
        textarea.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
        
        // 監聽focus事件
        textarea.addEventListener('focus', function() {
            this.style.height = 'auto';
            autoResizeTextarea(this);
        });
        
        // 添加tab鍵支持
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                
                // 在光標位置插入tab
                this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
                
                // 將光標移到tab後
                this.selectionStart = this.selectionEnd = start + 1;
                
                // 調整高度
                autoResizeTextarea(this);
            }
        });
    });
    
    // 自動調整textarea高度的函數
    function autoResizeTextarea(element) {
        // 保存原始高度
        const originalHeight = element.style.height;
        
        // 重置高度以獲取正確的scrollHeight
        element.style.height = 'auto';
        
        // 設置新高度
        const newHeight = Math.max(element.scrollHeight, 100) + 'px';
        element.style.height = newHeight;
        
        // 如果內容減少，也要相應減少高度
        if (originalHeight && parseInt(originalHeight) > parseInt(newHeight)) {
            setTimeout(() => {
                element.style.height = 'auto';
                element.style.height = Math.max(element.scrollHeight, 100) + 'px';
            }, 0);
        }
    }
    
    // 為特定textarea添加特殊功能
    const resultText = document.getElementById('result-text');
    const aiPromptInput = document.getElementById('ai-prompt-input');
    const aiResultText = document.getElementById('ai-result-text');
    
    if (resultText) {
        // 添加字數統計功能
        resultText.addEventListener('input', function() {
            updateWordCount(this, 'result-word-count');
        });
        
        // 創建字數統計元素
        createWordCountElement(resultText, 'result-word-count');
    }
    
    if (aiPromptInput) {
        // 添加提示文字計數
        aiPromptInput.addEventListener('input', function() {
            updateWordCount(this, 'prompt-word-count');
        });
        
        // 創建字數統計元素
        createWordCountElement(aiPromptInput, 'prompt-word-count');
    }
    
    if (aiResultText) {
        // 添加字數統計功能
        aiResultText.addEventListener('input', function() {
            updateWordCount(this, 'ai-result-word-count');
        });
        
        // 創建字數統計元素
        createWordCountElement(aiResultText, 'ai-result-word-count');
    }
    
    // 創建字數統計元素
    function createWordCountElement(textarea, id) {
        const container = document.createElement('div');
        container.className = 'word-count-container';
        container.id = id;
        container.innerHTML = '0 個字';
        
        // 插入到textarea後面
        textarea.parentNode.insertBefore(container, textarea.nextSibling);
        
        // 初始更新字數
        updateWordCount(textarea, id);
    }
    
    // 更新字數統計
    function updateWordCount(textarea, counterId) {
        const counter = document.getElementById(counterId);
        if (counter) {
            const text = textarea.value.trim();
            const wordCount = text ? text.length : 0;
            counter.innerHTML = `${wordCount} 個字`;
        }
    }
});