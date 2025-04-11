# 網頁版OCR工具

這是一個簡單直觀的網頁版OCR工具，使用Gemini API進行文字辨識。

## 功能

- 上傳圖片並顯示預覽
- 點擊按鈕進行OCR辨識
- 顯示辨識結果並允許編輯
- 提供複製文字功能
- 錯誤處理和用戶提示

## 技術棧

- **前端**：HTML, CSS, JavaScript
- **後端**：Python Flask
- **OCR服務**：Gemini API

## 安裝與運行

1. 安裝所需依賴：

```bash
pip install -r requirements.txt
```

2. 設置Gemini API密鑰：

在`.env`文件中添加您的Gemini API密鑰：

```
GEMINI_API_KEY=your_api_key_here
```

3. 運行應用：

```bash
python app.py
```

4. 在瀏覽器中訪問：http://localhost:5000

## 使用方法

1. 點擊「選擇圖片」按鈕上傳圖片
2. 圖片將顯示在預覽區域
3. 點擊「開始辨識」按鈕進行OCR處理
4. 辨識結果將顯示在文字區域，可以直接編輯
5. 點擊「複製文字」按鈕將結果複製到剪貼板