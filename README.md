# PM Tools | 專案工具網站

**English** | [繁體中文](./README.zh-TW.md)

A creative, artistic web-based toolkit featuring a **Liquid Abstract** design theme with real-time GLSL fluid shaders and brutalist editorial typography.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎨 Design Philosophy

This project breaks away from traditional UI frameworks to deliver a unique, immersive experience:

- **Liquid Abstract Background**: Real-time GLSL shader creating morphing fluid colors
- **Editorial Typography**: Using Syne (bold artistic headers) and Space Grotesk (modern body)
- **Brutalist Layout**: Asymmetrical, staggered card design with bold borders
- **Minimalist Interactions**: Clean, underlined buttons and borderless inputs

## ✨ Features

### 🏠 Home Page
- Full-viewport liquid fluid shader background (Three.js)
- Giant outline typography with hover effects
- Staggered tool cards with 3D transform effects

### 📊 GSN Data Analysis Tool
Analyze GSN network data from Excel files with interactive charts.

**Features:**
- Excel file upload (.xlsx, .xls)
- Date-based data filtering
- Statistical analysis (max, min, average)
- Interactive Chart.js visualizations
- Export analysis reports

### 🔍 OCR Text Recognition Tool
Extract and process text from images using Google's Gemini AI.

**Features:**
- Image upload with drag-and-drop
- Gemini 2.5 Flash API integration
- AI-powered text extraction
- Interactive text processing (formatting, translation, error correction)
- Copy-to-clipboard functionality

## 📁 Project Structure

```
Pmtool/
├── index.html                    # Home page
├── README.md                     # This file
├── requirements.txt              # Python dependencies (if applicable)
│
├── static/                       # Global assets
│   ├── css/
│   │   └── style.css            # Main stylesheet (Liquid Abstract theme)
│   ├── img/
│   │   └── upload.svg           # Upload icon
│   └── js/
│       ├── bg-3d.js             # Three.js GLSL fluid shader
│       └── main.js              # Shared utilities
│
└── tools/                        # Tool modules
    ├── gsn/                      # GSN Analysis Tool
    │   ├── index.html
    │   ├── img/
    │   │   └── upload.svg
    │   └── js/
    │       └── main.js          # GSN-specific logic
    │
    └── ocr/                      # OCR Tool
        ├── index.html
        ├── css/
        │   └── textarea-styles.css  # Minimalist textarea styles
        └── js/
            └── script.js        # OCR & Gemini API logic
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- For OCR Tool: Google Gemini API Key ([Get here](https://ai.google.dev/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pmtool.git
   cd pmtool
   ```

2. **Serve locally:**
   
   **Option 1: Python HTTP Server**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **Option 2: Node.js HTTP Server**
   ```bash
   npx http-server
   ```
   
   **Option 3: VS Code Live Server**
   - Install the "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### OCR Tool Setup

1. Navigate to the OCR tool
2. Click "Gemini API設置"
3. Enter your Gemini API key
4. The key is saved in browser localStorage (not sent to any server)

## 🎯 Usage

### GSN Analysis Tool
1. Click "使用工具" on the GSN card
2. Upload an Excel file containing GSN data
3. Select a date from the dropdown
4. Click "分析數據" to view statistics and charts
5. Optionally export the report

### OCR Tool
1. Click "使用工具" on the OCR card
2. Upload an image or drag-and-drop
3. Click "開始辨識" to extract text
4. Use "AI互動處理" to format, translate, or correct the text
5. Copy results to clipboard

## 🛠 Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Liquid Abstract theme, Brutalist design
- **Vanilla JavaScript** - No framework dependencies
- **Three.js** - WebGL/GLSL shader rendering

### Libraries
- [Three.js](https://threejs.org/) - 3D graphics and shaders
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [SheetJS](https://sheetjs.com/) - Excel file parsing
- [Font Awesome](https://fontawesome.com/) - Icons
- [Google Fonts](https://fonts.google.com/) - Syne & Space Grotesk typography

### APIs
- [Google Gemini AI](https://ai.google.dev/) - OCR and text processing

## 🎨 Design Tokens

```css
:root {
    --text-primary: #ffffff;
    --text-accent: #00ffcc;        /* Neon Cyan */
    --font-heading: 'Syne', sans-serif;
    --font-body: 'Space Grotesk', sans-serif;
}
```

## 🐛 Known Issues & Fixes

- ✅ **Fixed**: Cursor changed to crosshair → Reset to default
- ✅ **Fixed**: Loading screen stuck on GSN page → Hidden by default

## 📝 Development

### Adding a New Tool

1. Create a new directory in `tools/`
2. Add `index.html` with the tool UI
3. Create tool-specific JS/CSS as needed
4. Update home page (`index.html`) with a new tool card
5. Ensure the tool uses the global `static/css/style.css`

### Customizing the Shader

Edit `static/js/bg-3d.js` to modify:
- Color palette (lines with `vec3` color definitions)
- Animation speed (`u_time` multipliers)
- Noise patterns (adjust `snoise` parameters)

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

- Three.js community for shader examples
- Google AI for Gemini API
- Design inspiration from creative coding communities

---

**Made with ❤️ and GLSL shaders**