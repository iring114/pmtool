# GSN 數據分析工具

這是一個網頁版的GSN數據分析工具，允許用戶上傳Excel檔案，選擇日期，查看分析結果和視覺化圖表，並導出分析報告。

## 功能特點

- 上傳Excel檔案（支持.xlsx和.xls格式）
- 從檔案中提取可用日期供用戶選擇
- 顯示所選日期的數據分析（最大值、最小值、平均值、最大值發生時間）
- 使用Chart.js顯示數據的視覺化圖表（每日流量變化）
- 導出分析報告（Excel格式）

## 安裝步驟

### 前提條件

- Python 3.7或更高版本
- pip（Python包管理器）

### 安裝

1. 克隆或下載此專案到本地

2. 安裝所需的Python套件：

```bash
pip install -r requirements.txt
```

## 使用方法

1. 啟動應用程式：

```bash
python app.py
```

2. 在瀏覽器中訪問：`http://localhost:5000`

3. 使用界面：
   - 點擊「選擇檔案」按鈕或拖放Excel檔案到上傳區域
   - 從下拉菜單中選擇日期
   - 點擊「分析數據」按鈕查看結果
   - 點擊「導出報告」按鈕下載Excel格式的分析報告

## 檔案格式要求

上傳的Excel檔案必須包含以下列：
- `time`：日期時間列，用於識別數據的時間點
- `out`：流量數據列，單位為原始值（程式會自動除以1,000,000轉換為百萬單位）

## 技術架構

- **前端**：HTML, CSS, JavaScript, Chart.js
- **後端**：Python, Flask
- **數據處理**：Pandas

## 目錄結構

```
gsn_convert_tool/
├── app.py                # Flask應用主程式
├── requirements.txt      # Python依賴包列表
├── static/              # 靜態資源
│   ├── css/             # CSS樣式
│   │   └── style.css    # 主要樣式表
│   ├── js/              # JavaScript
│   │   └── main.js      # 主要JS邏輯
│   └── img/             # 圖片資源
│       └── upload.svg   # 上傳圖標
├── templates/           # HTML模板
│   └── index.html       # 主頁面
├── uploads/             # 上傳的檔案存放目錄（自動創建）
└── reports/             # 生成的報告存放目錄（自動創建）
```