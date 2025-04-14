# 專案工具網站

這是一個靜態網頁工具集合，提供GSN數據分析和OCR文字辨識功能，可直接在瀏覽器中運行，無需後端服務器。

## 可用工具

### GSN 數據分析工具

- 上傳Excel檔案（支持.xlsx和.xls格式）
- 從檔案中提取可用日期供用戶選擇
- 顯示所選日期的數據分析（最大值、最小值、平均值、最大值發生時間）
- 使用Chart.js顯示數據的視覺化圖表（每日流量變化）
- 導出分析報告（Excel格式）

### OCR 文字辨識工具

- 上傳圖片並顯示預覽
- 使用Gemini API進行OCR辨識
- 顯示辨識結果並允許編輯
- 提供複製文字功能
- 錯誤處理和用戶提示

## 技術架構

- **前端**：HTML, CSS, JavaScript
- **數據處理**：SheetJS (xlsx)
- **圖表繪製**：Chart.js
- **OCR服務**：Gemini API

## 目錄結構

```
gsn_convert_tool/
├── index.html            # 主頁面
├── static/               # 共用靜態資源
│   ├── css/              # CSS樣式
│   │   └── style.css     # 主要樣式表
│   ├── js/               # JavaScript
│   │   └── main.js       # 主要JS邏輯
│   └── img/              # 圖片資源
│       └── upload.svg    # 上傳圖標
├── tools/                # 工具目錄
│   ├── gsn/              # GSN數據分析工具
│   │   ├── index.html    # GSN工具頁面
│   │   ├── css/          # GSN工具樣式
│   │   ├── js/           # GSN工具腳本
│   │   └── img/          # GSN工具圖片
│   └── ocr/              # OCR文字辨識工具
│       ├── index.html    # OCR工具頁面
│       ├── css/          # OCR工具樣式
│       └── js/           # OCR工具腳本
├── reports/              # 生成的報告存放目錄（自動創建）
└── uploads/              # 上傳的檔案暫存目錄（自動創建）
```

## 使用方法

1. 直接在瀏覽器中打開 `index.html` 文件，或部署到網站後訪問

2. 從主頁選擇需要使用的工具：
   - GSN數據分析工具
   - OCR文字辨識工具

3. 按照各工具的界面指引操作

## GSN數據分析工具使用方法

1. 點擊「選擇檔案」按鈕或拖放Excel檔案到上傳區域
2. 從下拉菜單中選擇日期
3. 點擊「分析數據」按鈕查看結果
4. 點擊「導出報告」按鈕下載Excel格式的分析報告

## OCR文字辨識工具使用方法

1. 點擊「選擇圖片」按鈕上傳圖片
2. 圖片將顯示在預覽區域
3. 輸入您的Gemini API密鑰
4. 點擊「開始辨識」按鈕進行OCR處理
5. 辨識結果將顯示在文字區域，可以直接編輯
6. 點擊「複製文字」按鈕將結果複製到剪貼板

## 部署到GitHub Pages

1. 在GitHub上創建一個新的儲存庫

2. 將所有文件上傳到儲存庫

3. 在儲存庫設置中啟用GitHub Pages：
   - 進入儲存庫的「Settings」
   - 找到「Pages」選項
   - 在「Source」下選擇「main」分支
   - 點擊「Save」

4. 等待幾分鐘後，您的網站將在以下地址可用：
   `https://<您的用戶名>.github.io/<儲存庫名稱>/`

## 本地開發

由於瀏覽器的安全限制，如果您直接在本地打開HTML文件，可能會遇到CORS問題。建議使用簡單的HTTP服務器來測試：

```bash
# 使用Python啟動簡單的HTTP服務器
python -m http.server

# 然後在瀏覽器中訪問：http://localhost:8000
```

## 注意事項

- 所有數據處理都在瀏覽器中進行，不會上傳到任何服務器
- GSN Excel文件必須包含 `time` 和 `out` 列
- OCR功能需要有效的Gemini API密鑰
- 為獲得最佳體驗，建議使用現代瀏覽器（Chrome、Firefox、Edge等）