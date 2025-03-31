from flask import Flask, request, jsonify, send_file, render_template, session
import pandas as pd
import os
import uuid
import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.urandom(24)

# 配置上傳文件夾
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
REPORT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reports')
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

# 確保上傳和報告文件夾存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)

# 檢查文件擴展名是否允許
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/gsn-analysis.html')
def gsn_analysis():
    return send_file('gsn-analysis.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_file(os.path.join('static', filename))

@app.route('/upload', methods=['POST'])
def upload_file():
    # 檢查是否有文件
    if 'file' not in request.files:
        return jsonify({'error': '沒有選擇文件'}), 400
    
    file = request.files['file']
    
    # 檢查文件名
    if file.filename == '':
        return jsonify({'error': '沒有選擇文件'}), 400
    
    # 檢查文件類型
    if not allowed_file(file.filename):
        return jsonify({'error': '不支持的文件格式，請上傳Excel文件(.xlsx或.xls)'}), 400
    
    # 生成唯一文件名並保存
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(file_path)
    
    # 讀取Excel文件
    try:
        df = pd.read_excel(file_path)
        
        # 檢查必要的列是否存在
        if 'time' not in df.columns or 'out' not in df.columns:
            os.remove(file_path)  # 刪除無效文件
            return jsonify({'error': '文件格式不正確，缺少必要的列(time或out)'}), 400
        
        # 確保time列是日期時間格式
        df['time'] = pd.to_datetime(df['time'])
        
        # 獲取唯一日期列表
        dates = sorted(df['time'].dt.date.unique())
        dates_str = [date.strftime('%Y-%m-%d') for date in dates]
        
        # 保存文件路徑到會話
        session['file_path'] = file_path
        
        return jsonify({
            'success': True,
            'message': '文件上傳成功',
            'dates': dates_str
        })
    
    except Exception as e:
        # 發生錯誤時刪除文件
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({'error': f'處理文件時出錯: {str(e)}'}), 500

@app.route('/analyze', methods=['POST'])
def analyze_data():
    # 檢查是否有文件路徑
    if 'file_path' not in session:
        return jsonify({'error': '請先上傳文件'}), 400
    
    # 獲取選擇的日期
    data = request.get_json()
    if 'date' not in data:
        return jsonify({'error': '請選擇日期'}), 400
    
    date_str = data['date']
    
    try:
        # 讀取文件
        file_path = session['file_path']
        df = pd.read_excel(file_path)
        
        # 確保time列是日期時間格式
        df['time'] = pd.to_datetime(df['time'])
        
        # 根據選擇的日期過濾數據
        selected_date = pd.to_datetime(date_str).date()
        filtered_df = df[df['time'].dt.date == selected_date]
        
        # 檢查是否有數據
        if filtered_df.empty:
            return jsonify({'error': '所選日期沒有數據'}), 404
        
        # 計算統計數據
        stats = {
            'max': round(filtered_df['out'].max() / 1000000, 2),
            'min': round(filtered_df['out'].min() / 1000000, 2),
            'avg': round(filtered_df['out'].mean() / 1000000, 2),
            'max_time': filtered_df.loc[filtered_df['out'].idxmax(), 'time'].strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # 準備圖表數據
        chart_data = {
            'time': [t.strftime('%H:%M:%S') for t in filtered_df['time']],
            'out': [round(val / 1000000, 2) for val in filtered_df['out']]
        }
        
        return jsonify({
            'success': True,
            'stats': stats,
            'chart_data': chart_data
        })
    
    except Exception as e:
        return jsonify({'error': f'分析數據時出錯: {str(e)}'}), 500

@app.route('/export', methods=['POST'])
def export_report():
    # 檢查是否有文件路徑
    if 'file_path' not in session:
        return jsonify({'error': '請先上傳文件'}), 400
    
    # 獲取選擇的日期
    data = request.get_json()
    if 'date' not in data:
        return jsonify({'error': '請選擇日期'}), 400
    
    date_str = data['date']
    
    try:
        # 讀取文件
        file_path = session['file_path']
        df = pd.read_excel(file_path)
        
        # 確保time列是日期時間格式
        df['time'] = pd.to_datetime(df['time'])
        
        # 根據選擇的日期過濾數據
        selected_date = pd.to_datetime(date_str).date()
        filtered_df = df[df['time'].dt.date == selected_date]
        
        # 檢查是否有數據
        if filtered_df.empty:
            return jsonify({'error': '所選日期沒有數據'}), 404
        
        # 添加統計信息
        stats_df = pd.DataFrame({
            '統計項目': ['最大值 (百萬)', '最小值 (百萬)', '平均值 (百萬)', '最大值時間'],
            '數值': [
                round(filtered_df['out'].max() / 1000000, 2),
                round(filtered_df['out'].min() / 1000000, 2),
                round(filtered_df['out'].mean() / 1000000, 2),
                filtered_df.loc[filtered_df['out'].idxmax(), 'time'].strftime('%Y-%m-%d %H:%M:%S')
            ]
        })
        
        # 創建報告文件名
        report_filename = f"GSN_Report_{date_str}_{uuid.uuid4().hex[:8]}.xlsx"
        report_path = os.path.join(REPORT_FOLDER, report_filename)
        
        # 創建Excel寫入器
        with pd.ExcelWriter(report_path, engine='openpyxl') as writer:
            # 寫入統計數據
            stats_df.to_excel(writer, sheet_name='統計摘要', index=False)
            
            # 寫入原始數據
            filtered_df.to_excel(writer, sheet_name='原始數據', index=False)
        
        return jsonify({
            'success': True,
            'filename': report_filename,
            'download_url': f'/download/{report_filename}'
        })
    
    except Exception as e:
        return jsonify({'error': f'生成報告時出錯: {str(e)}'}), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(REPORT_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)