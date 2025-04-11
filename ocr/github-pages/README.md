# 網頁版OCR工具 - GitHub Pages版本

這是一個簡單直觀的網頁版OCR工具，使用Gemini API進行文字辨識。此版本專為GitHub Pages部署設計，完全在前端運行，無需後端伺服器。

## 技術棧

- **前端**：HTML, CSS, JavaScript
- **OCR服務**：Gemini API (直接從前端調用)

## 部署到GitHub Pages

1. 創建一個新的GitHub倉庫

2. 將`github-pages`目錄中的所有文件上傳到倉庫的根目錄

3. 在倉庫設置中啟用GitHub Pages：
   - 進入倉庫的「Settings」
   - 滾動到「GitHub Pages」部分
   - 在「Source」下選擇「main branch」
   - 點擊「Save」

4. 等待幾分鐘後，您的OCR工具將在以下URL可用：
   `https://[您的用戶名].github.io/[倉庫名稱]/`

## 使用說明

1. 首次使用時，您需要設置Gemini API密鑰：
   - 在[Google AI Studio](https://makersuite.google.com/app/apikey)獲取API密鑰
   - 將密鑰輸入網頁上的「Gemini API設置」區域並保存
   - API密鑰將保存在您的瀏覽器本地存儲中，不會上傳到任何伺服器

2. 上傳圖片：
   - 點擊上傳區域或拖放圖片到指定區域
   - 支持的格式：JPEG, PNG, GIF, BMP, WEBP
   - 文件大小限制：10MB

3. 開始辨識：
   - 上傳圖片後，點擊「開始辨識」按鈕
   - 系統將使用Gemini API進行文字辨識
   - 辨識結果將顯示在下方文本區域

4. 複製結果：
   - 點擊「複製文字」按鈕將辨識結果複製到剪貼板

## 注意事項

- 此版本直接從前端調用Gemini API，您需要自己的API密鑰
- API密鑰僅保存在本地瀏覽器中，刷新頁面或清除瀏覽器數據不會影響已保存的密鑰
- 圖片處理完全在本地進行，不會上傳到任何伺服器（除了發送到Gemini API進行辨識）

## 隱私聲明

- 您上傳的圖片僅發送到Google的Gemini API進行文字辨識
- 您的API密鑰僅保存在本地瀏覽器中，不會上傳到任何伺服器
- 此應用不收集任何個人信息或使用數據