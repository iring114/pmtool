# PM Tools | 專案工具網站

[English](./README.md) | **繁體中文**

一個具有創意和藝術感的網頁工具套件，採用 **液態抽象 (Liquid Abstract)** 設計主題，配備即時 GLSL 流體著色器和粗獷主義編輯排版。

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎨 設計理念

本專案突破傳統 UI 框架，提供獨特且沉浸式的體驗：

- **液態抽象背景**：即時 GLSL 著色器創造變形流體色彩
- **編輯排版**：使用 Syne（粗體藝術標題）和 Space Grotesk（現代內文）
- **粗獷主義佈局**：不對稱、錯落的卡片設計搭配粗邊框
- **極簡互動**：清爽的底線按鈕和無邊框輸入

## ✨ 功能特色

### 🏠 首頁
- 全視窗液態流體著色器背景（Three.js）
- 巨大輪廓文字搭配懸停效果
- 錯落排列的工具卡片，具有 3D 變換效果

### 📊 GSN 數據分析工具
從 Excel 檔案分析 GSN 網路數據，並顯示互動式圖表。

**功能：**
- 上傳 Excel 檔案（.xlsx, .xls）
- 基於日期的數據篩選
- 統計分析（最大值、最小值、平均值）
- Chart.js 互動式視覺化
- 匯出分析報告

### 🔍 OCR 文字辨識工具
使用 Google 的 Gemini AI 從圖片中提取和處理文字。

**功能：**
- 圖片上傳，支援拖放
- Gemini 2.5 Flash API 整合
- AI 驅動的文字提取
- 互動式文字處理（格式化、翻譯、錯誤修正）
- 複製到剪貼簿

## 📁 專案結構

```
Pmtool/
├── index.html                    # 首頁
├── README.md                     # 英文文檔
├── README.zh-TW.md              # 繁體中文文檔（本檔案）
├── requirements.txt              # Python 依賴項（如適用）
│
├── static/                       # 全域資源
│   ├── css/
│   │   └── style.css            # 主樣式表（液態抽象主題）
│   ├── img/
│   │   └── upload.svg           # 上傳圖示
│   └── js/
│       ├── bg-3d.js             # Three.js GLSL 流體著色器
│       └── main.js              # 共用工具
│
└── tools/                        # 工具模組
    ├── gsn/                      # GSN 分析工具
    │   ├── index.html
    │   ├── img/
    │   │   └── upload.svg
    │   └── js/
    │       └── main.js          # GSN 專用邏輯
    │
    └── ocr/                      # OCR 工具
        ├── index.html
        ├── css/
        │   └── textarea-styles.css  # 極簡文字區域樣式
        └── js/
            └── script.js        # OCR 與 Gemini API 邏輯
```

## 🚀 開始使用

### 前置需求
- 現代網頁瀏覽器（Chrome、Firefox、Edge、Safari）
- OCR 工具需要：Google Gemini API 金鑰 ([在此取得](https://ai.google.dev/))

### 安裝

1. **複製儲存庫：**
   ```bash
   git clone https://github.com/yourusername/pmtool.git
   cd pmtool
   ```

2. **本地服務：**
   
   **選項 1：Python HTTP 伺服器**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **選項 2：Node.js HTTP 伺服器**
   ```bash
   npx http-server
   ```
   
   **選項 3：VS Code Live Server**
   - 安裝「Live Server」擴充功能
   - 右鍵點擊 `index.html` → 「使用 Live Server 開啟」

3. **在瀏覽器中開啟：**
   ```
   http://localhost:8000
   ```

### OCR 工具設定

1. 導覽至 OCR 工具
2. 點擊「Gemini API 設置」
3. 輸入您的 Gemini API 金鑰
4. 金鑰保存在瀏覽器 localStorage（不會傳送至任何伺服器）

## 🎯 使用方法

### GSN 分析工具
1. 點擊 GSN 卡片上的「使用工具」
2. 上傳包含 GSN 數據的 Excel 檔案
3. 從下拉選單選擇日期
4. 點擊「分析數據」查看統計和圖表
5. 可選擇匯出報告

### OCR 工具
1. 點擊 OCR 卡片上的「使用工具」
2. 上傳圖片或拖放
3. 點擊「開始辨識」提取文字
4. 使用「AI互動處理」格式化、翻譯或修正文字
5. 複製結果到剪貼簿

## 🛠 技術堆疊

### 前端
- **HTML5** - 語義化標記
- **CSS3** - 液態抽象主題、粗獷主義設計
- **原生 JavaScript** - 無框架依賴
- **Three.js** - WebGL/GLSL 著色器渲染

### 函式庫
- [Three.js](https://threejs.org/) - 3D 圖形和著色器
- [Chart.js](https://www.chartjs.org/) - 數據視覺化
- [SheetJS](https://sheetjs.com/) - Excel 檔案解析
- [Font Awesome](https://fontawesome.com/) - 圖示
- [Google Fonts](https://fonts.google.com/) - Syne 和 Space Grotesk 字體

### API
- [Google Gemini AI](https://ai.google.dev/) - OCR 和文字處理

## 🎨 設計標記

```css
:root {
    --text-primary: #ffffff;
    --text-accent: #00ffcc;        /* 霓虹青色 */
    --font-heading: 'Syne', sans-serif;
    --font-body: 'Space Grotesk', sans-serif;
}
```

## 🐛 已知問題與修復

- ✅ **已修復**：游標變成十字形 → 重置為預設
- ✅ **已修復**：GSN 頁面載入畫面卡住 → 預設隱藏

## 📝 開發

### 新增工具

1. 在 `tools/` 中建立新目錄
2. 新增 `index.html` 包含工具 UI
3. 根據需要建立工具專用的 JS/CSS
4. 更新首頁（`index.html`）新增工具卡片
5. 確保工具使用全域 `static/css/style.css`

### 自訂著色器

編輯 `static/js/bg-3d.js` 以修改：
- 色彩調板（包含 `vec3` 顏色定義的行）
- 動畫速度（`u_time` 乘數）
- 噪聲圖案（調整 `snoise` 參數）

## 📄 授權

MIT License - 歡迎將此專案用於您自己的目的。

## 🙏 致謝

- Three.js 社群的著色器範例
- Google AI 提供 Gemini API
- 來自創意編程社群的設計靈感

---

**用 ❤️ 和 GLSL 著色器製作**
