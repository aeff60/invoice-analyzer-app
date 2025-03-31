import os
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from config import AZURE_FORM_RECOGNIZER_ENDPOINT, AZURE_FORM_RECOGNIZER_KEY
import sqlite3
import pandas as pd

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

def init_db():
    with sqlite3.connect('db.sqlite3') as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vendor_name TEXT,
                customer_name TEXT,
                invoice_total TEXT
            )
        ''')
        conn.commit()

init_db()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

document_analysis_client = DocumentAnalysisClient(
    endpoint=AZURE_FORM_RECOGNIZER_ENDPOINT,
    credential=AzureKeyCredential(AZURE_FORM_RECOGNIZER_KEY)
)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze-upload', methods=['POST'])
def analyze_uploaded_invoice():
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        with open(file_path, "rb") as f:
            poller = document_analysis_client.begin_analyze_document(
                model_id="prebuilt-invoice",
                document=f,
                locale="en-US"
            )
            result = poller.result()

        os.remove(file_path)  # ลบไฟล์หลังประมวลผล

        response_data = []
        for doc in result.documents:
            fields = doc.fields
            data = {
                'vendor_name': fields.get("VendorName").value if fields.get("VendorName") else None,
                'customer_name': fields.get("CustomerName").value if fields.get("CustomerName") else None,
            }
            invoice_total = fields.get("InvoiceTotal")
            if invoice_total and invoice_total.value:
                data['invoice_total'] = f"{invoice_total.value.symbol}{invoice_total.value.amount}"
            else:
                data['invoice_total'] = None

            response_data.append(data)

        return jsonify({'status': 'success', 'data': response_data})

    return jsonify({'status': 'error', 'message': 'Invalid file format'}), 400
@app.route('/save', methods=['POST'])
def save_invoice():
    data = request.get_json()
    vendor_name = data.get('vendor_name')
    customer_name = data.get('customer_name')
    invoice_total = data.get('invoice_total')

    with sqlite3.connect('db.sqlite3') as conn:
        c = conn.cursor()
        c.execute("INSERT INTO invoices (vendor_name, customer_name, invoice_total) VALUES (?, ?, ?)",
                  (vendor_name, customer_name, invoice_total))
        conn.commit()

    return jsonify({'status': 'success', 'message': 'Saved successfully!'})

@app.route('/records')
def records():
    with sqlite3.connect('db.sqlite3') as conn:
        c = conn.cursor()
        c.execute("SELECT id, vendor_name, customer_name, invoice_total FROM invoices")
        records = c.fetchall()
    return render_template('records.html', records=records)

# ลบข้อมูล
@app.route('/delete/<int:invoice_id>', methods=['POST'])
def delete_invoice(invoice_id):
    with sqlite3.connect('db.sqlite3') as conn:
        c = conn.cursor()
        c.execute("DELETE FROM invoices WHERE id = ?", (invoice_id,))
        conn.commit()
    return jsonify({'status': 'success'})

# แก้ไขข้อมูล
@app.route('/update/<int:invoice_id>', methods=['POST'])
def update_invoice(invoice_id):
    data = request.get_json()
    with sqlite3.connect('db.sqlite3') as conn:
        c = conn.cursor()
        c.execute("UPDATE invoices SET vendor_name=?, customer_name=?, invoice_total=? WHERE id=?",
                  (data['vendor_name'], data['customer_name'], data['invoice_total'], invoice_id))
        conn.commit()
    return jsonify({'status': 'success'})

# Export ข้อมูลเป็น Excel
@app.route('/export')
def export_excel():
    with sqlite3.connect('db.sqlite3') as conn:
        df = pd.read_sql_query("SELECT * FROM invoices", conn)
    filepath = 'exports/invoices_export.xlsx'
    os.makedirs('exports', exist_ok=True)
    df.to_excel(filepath, index=False)
    return send_file(filepath, as_attachment=True)

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)
