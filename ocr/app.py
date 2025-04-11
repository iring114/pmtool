import os
import base64
import json
import requests
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from PIL import Image
import io

# 載入環境變量（保留以支持向後兼容）
load_dotenv()

# 創建Flask應用
app = Flask(__name__)
CORS(app)  # 啟用CORS

# 配置上傳文件夾
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 允許的文件擴展名
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# Gemini API端點
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?k"

# 檢查文件擴展名是否允許
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 將圖片轉換為base64編碼
def image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# 主頁路由
@app.route('/')
def index():
    return render_template('index.html')

# 上傳圖片路由
@app.route('/upload', methods=['POST'])
def upload_file():
    # 檢查是否有文件部分
    if 'file' not in request.files:
        return jsonify({'error': '沒有文件部分'}), 400
    
    file = request.files['file']
    
    # 如果用戶未選擇文件
    if file.filename == '':
        return jsonify({'error': '未選擇文件'}), 400
    
    # 如果文件類型允許
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # 返回文件路徑供前端使用
        return jsonify({
            'success': True,
            'filename': filename,
            'file_url': f'/uploads/{filename}'
        })
    
    return jsonify({'error': '不支持的文件類型'}), 400

# 獲取上傳的圖片
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# OCR處理路由
@app.route('/ocr', methods=['POST'])
def process_ocr():
    data = request.json
    
    # 檢查API密鑰
    api_key = data.get('api_key')
    if not api_key:
        return jsonify({'error': '未提供API密鑰'}), 400
    
    # 處理直接提供的base64圖片數據
    if data and 'image_data' in data:
        image_base64 = data['image_data']
        # 如果提供了文件名，保存圖片到服務器
        if 'filename' in data:
            filename = data['filename']
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            try:
                # 將base64數據保存為圖片文件
                image_data = base64.b64decode(image_base64)
                with open(file_path, 'wb') as f:
                    f.write(image_data)
            except Exception as e:
                print(f"保存圖片時出錯: {str(e)}")
                # 繼續處理，即使保存失敗
    # 處理從文件讀取的情況
    elif data and 'filename' in data:
        filename = data['filename']
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': '文件不存在'}), 404
        
        # 將圖片轉換為base64
        image_base64 = image_to_base64(file_path)
    else:
        return jsonify({'error': '未提供圖片數據或文件名'}), 400
    
    try:
        
        # 準備Gemini API請求
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key  # 使用前端傳來的API密鑰
        }
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": "請從這張圖片中提取所有可見的文字。只返回提取的文字內容，不要添加任何解釋或額外信息。"}, 
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": image_base64
                        }
                    }
                ]
            }]
        }
        
        # 發送請求到Gemini API
        response = requests.post(
            f"{GEMINI_API_URL}?key={api_key}",  # 使用前端傳來的API密鑰
            headers=headers,
            json=payload
        )
        
        # 解析API響應
        if response.status_code == 200:
            result = response.json()
            # 從響應中提取文字
            if 'candidates' in result and len(result['candidates']) > 0:
                text = result['candidates'][0]['content']['parts'][0]['text']
                return jsonify({'success': True, 'text': text})
            else:
                return jsonify({'error': '無法從API響應中提取文字'}), 500
        else:
            return jsonify({'error': f'API請求失敗: {response.status_code}', 'details': response.text}), 500
    
    except Exception as e:
        return jsonify({'error': f'處理OCR時出錯: {str(e)}'}), 500

# AI文字處理路由
@app.route('/process-text', methods=['POST'])
def process_text():
    data = request.json
    
    if not data or 'text' not in data or 'prompt' not in data:
        return jsonify({'error': '未提供文字或處理指令'}), 400
    
    # 檢查API密鑰
    api_key = data.get('api_key')
    if not api_key:
        return jsonify({'error': '未提供API密鑰'}), 400
    
    text = data['text']
    prompt = data['prompt']
    
    try:
        # 準備Gemini API請求
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key  # 使用前端傳來的API密鑰
        }
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": f"以下是一段文字：\n\n{text}\n\n請根據以下指令處理這段文字：{prompt}"}
                ]
            }]
        }
        
        # 發送請求到Gemini API
        response = requests.post(
            f"{GEMINI_API_URL}?key={api_key}",  # 使用前端傳來的API密鑰
            headers=headers,
            json=payload
        )
        
        # 解析API響應
        if response.status_code == 200:
            result = response.json()
            # 從響應中提取文字
            if 'candidates' in result and len(result['candidates']) > 0:
                processed_text = result['candidates'][0]['content']['parts'][0]['text']
                return jsonify({'success': True, 'text': processed_text})
            else:
                return jsonify({'error': '無法從API響應中提取文字'}), 500
        else:
            return jsonify({'error': f'API請求失敗: {response.status_code}', 'details': response.text}), 500
    
    except Exception as e:
        return jsonify({'error': f'處理文字時出錯: {str(e)}'}), 500

# 啟動應用
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)