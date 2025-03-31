# GSN 數據分析工具 (靜態版本)

這是GSN數據分析工具的靜態網頁版本，可以直接部署到GitHub Pages或其他靜態網站託管服務。

## 功能特點

- 完全在瀏覽器端運行，無需後端服務器
- 支援Excel檔案上傳和解析
- 自動分析GSN流量數據
- 生成視覺化圖表
- 導出Excel格式的分析報告

## 技術架構

- **前端**：HTML, CSS, JavaScript
- **數據處理**：SheetJS (xlsx)
- **圖表繪製**：Chart.js

## 目錄結構

```
gsn_convert_tool/
├── index.html            # 主頁面
├── static/              # 靜態資源
│   ├── css/             # CSS樣式
│   │   └── style.css    # 主要樣式表
│   ├── js/              # JavaScript
│   │   └── main.js      # 主要JS邏輯
│   └── img/             # 圖片資源
│       └── upload.svg   # 上傳圖標
└── README.md            # 說明文件
```

## 使用方法

1. 直接在瀏覽器中打開 `index.html` 文件，或部署到網站後訪問

2. 使用界面：
   - 點擊「選擇檔案」按鈕或拖放Excel檔案到上傳區域
   - 從下拉菜單中選擇日期
   - 點擊「分析數據」按鈕查看結果
   - 點擊「導出報告」按鈕下載Excel格式的分析報告

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
- Excel文件必須包含 `time` 和 `out` 列
- 為獲得最佳體驗，建議使用現代瀏覽器（Chrome、Firefox、Edge等）