"""
مجوهرات الحمروني - Backend API
نظام إدارة المبيعات والمخزون
"""

from flask import Flask, render_template_string, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import qrcode
from io import BytesIO
import base64

app = Flask(__name__)

# إعدادات CORS للسماح بالتواصل مع React
CORS(app, resources={r"/api/*": {"origins": "*"}})

# إعداد قاعدة البيانات
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'alhumroni.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# ==========================================
# نماذج قاعدة البيانات
# ==========================================

class JewelryItem(db.Model):
    """نموذج القطعة"""
    __tablename__ = 'jewelry_items'

    id = db.Column(db.Integer, primary_key=True)
    item_code = db.Column(db.String(100), unique=True, nullable=False)
    item_type = db.Column(db.String(10))  # G:ذهب, S:فضة
    karat = db.Column(db.String(20))  # 18, 21, 24
    origin = db.Column(db.String(50))  # L:ليبي, T:تركي, I:إيطالي
    category = db.Column(db.String(50))  # R:خاتم, BR:سوار, NL:قلادة, ER:حلق
    status = db.Column(db.String(50))  # جديد, تكسير, مستعمل
    model_name = db.Column(db.String(100), nullable=False)
    weight = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)
    stock_qty = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'item_code': self.item_code,
            'item_type': self.item_type,
            'karat': self.karat,
            'origin': self.origin,
            'category': self.category,
            'status': self.status,
            'model_name': self.model_name,
            'weight': self.weight,
            'price': self.price,
            'stock_qty': self.stock_qty,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class SaleInvoice(db.Model):
    """نموذج الفاتورة"""
    __tablename__ = 'sale_invoices'

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_name = db.Column(db.String(100))
    total_amount = db.Column(db.Float, nullable=False)
    seller_name = db.Column(db.String(100))
    seller_code = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.now)
    items = db.relationship('InvoiceItem', backref='invoice', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'customer_name': self.customer_name,
            'total_amount': self.total_amount,
            'seller_name': self.seller_name,
            'seller_code': self.seller_code,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'items': [item.to_dict() for item in self.items],
        }


class InvoiceItem(db.Model):
    """عناصر الفاتورة"""
    __tablename__ = 'invoice_items'

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('sale_invoices.id'), nullable=False)
    item_code = db.Column(db.String(100))
    model_name = db.Column(db.String(100))
    weight = db.Column(db.Float)
    price = db.Column(db.Float)
    quantity = db.Column(db.Integer)
    total = db.Column(db.Float)

    def to_dict(self):
        return {
            'item_code': self.item_code,
            'model_name': self.model_name,
            'weight': self.weight,
            'price': self.price,
            'quantity': self.quantity,
            'total': self.total,
        }


# إنشاء الجداول
with app.app_context():
    db.create_all()


# ==========================================
# API Routes - Items
# ==========================================

@app.route('/api/items', methods=['GET'])
def api_get_all_items():
    """جلب كل القطع"""
    items = JewelryItem.query.order_by(JewelryItem.created_at.desc()).all()
    return jsonify([item.to_dict() for item in items])


@app.route('/api/items', methods=['POST'])
def api_add_item():
    """إضافة قطعة جديدة مع توليد QR"""
    try:
        data = request.get_json()

        # توليد الكود
        prefix = f"{data.get('karat', '21')}{data.get('item_type', 'G')}{data.get('origin', 'L')}{data.get('category', 'R')}"
        last = JewelryItem.query.filter(JewelryItem.item_code.like(f"{prefix}-%")).order_by(JewelryItem.id.desc()).first()
        num = (int(last.item_code.split('-')[-1]) + 1) if last else 1001
        item_code = f"{prefix}-{num}"

        # إنشاء القطعة
        item = JewelryItem(
            item_code=item_code,
            item_type=data.get('item_type', 'G'),
            karat=data.get('karat', '21'),
            origin=data.get('origin', 'L'),
            category=data.get('category', 'R'),
            status=data.get('status', 'جديد'),
            model_name=data.get('model_name'),
            weight=float(data.get('weight', 0)),
            price=float(data.get('price', 0)),
            stock_qty=int(data.get('stock_qty', 1)),
        )

        db.session.add(item)
        db.session.commit()

        return jsonify({
            'success': True,
            'item': item.to_dict(),
            'qr_data_url': generate_qr_data_url(item_code)
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/items/<code>', methods=['GET'])
def api_get_item(code):
    """جلب قطعة بالكود"""
    item = JewelryItem.query.filter_by(item_code=code).first()
    if not item:
        return jsonify({'success': False, 'error': 'القطعة غير موجودة'}), 404

    return jsonify({
        'success': True,
        'item': item.to_dict(),
        'qr_data_url': generate_qr_data_url(code)
    })


@app.route('/api/items/<code>/sale', methods=['POST'])
def api_sell_item(code):
    """تحديث المخزون عند البيع"""
    try:
        data = request.get_json()
        quantity = data.get('quantity', 1)

        item = JewelryItem.query.filter_by(item_code=code).first()
        if not item:
            return jsonify({'success': False, 'error': 'القطعة غير موجودة'}), 404

        if item.stock_qty < quantity:
            return jsonify({'success': False, 'error': 'الكمية غير كافية'}), 400

        item.stock_qty -= quantity
        db.session.commit()

        return jsonify({
            'success': True,
            'remaining_qty': item.stock_qty
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/items/<code>', methods=['PUT'])
def api_update_item(code):
    """تحديث بيانات قطعة"""
    try:
        data = request.get_json()
        item = JewelryItem.query.filter_by(item_code=code).first()

        if not item:
            return jsonify({'success': False, 'error': 'القطعة غير موجودة'}), 404

        # تحديث الحقول
        for key in ['model_name', 'price', 'weight', 'status', 'stock_qty']:
            if key in data:
                setattr(item, key, data[key])

        db.session.commit()

        return jsonify({
            'success': True,
            'item': item.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/items/<code>', methods=['DELETE'])
def api_delete_item(code):
    """حذف قطعة"""
    try:
        item = JewelryItem.query.filter_by(item_code=code).first()
        if not item:
            return jsonify({'success': False, 'error': 'القطعة غير موجودة'}), 404

        db.session.delete(item)
        db.session.commit()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/items/search', methods=['GET'])
def api_search_items():
    """البحث في القطع"""
    query = request.args.get('q', '')
    items = JewelryItem.query.filter(
        (JewelryItem.item_code.contains(query)) |
        (JewelryItem.model_name.contains(query)) |
        (JewelryItem.category.contains(query))
    ).all()

    return jsonify([item.to_dict() for item in items])


# ==========================================
# API Routes - Sales
# ==========================================

@app.route('/api/sales', methods=['GET'])
def api_get_sales():
    """جلب كل الفواتير"""
    invoices = SaleInvoice.query.order_by(SaleInvoice.created_at.desc()).all()
    return jsonify([inv.to_dict() for inv in invoices])


@app.route('/api/sales', methods=['POST'])
def api_create_sale():
    """إنشاء فاتورة جديدة"""
    try:
        data = request.get_json()

        # إنشاء الفاتورة
        invoice = SaleInvoice(
            invoice_number=data.get('invoice_number', generate_invoice_number()),
            customer_name=data.get('customer_name', ''),
            total_amount=data.get('total_amount', 0),
            seller_name=data.get('seller_name', 'خالد تركي'),
            seller_code=data.get('seller_code', '001'),
        )
        db.session.add(invoice)
        db.session.flush()  # للحصول على الـ id

        # إضافة العناصر
        for item_data in data.get('items', []):
            invoice_item = InvoiceItem(
                invoice_id=invoice.id,
                item_code=item_data.get('item_code'),
                model_name=item_data.get('model_name'),
                weight=item_data.get('weight'),
                price=item_data.get('price'),
                quantity=item_data.get('quantity'),
                total=item_data.get('total'),
            )
            db.session.add(invoice_item)

            # تحديث المخزون
            jewelry_item = JewelryItem.query.filter_by(item_code=item_data.get('item_code')).first()
            if jewelry_item:
                jewelry_item.stock_qty -= item_data.get('quantity', 1)

        db.session.commit()

        return jsonify({
            'success': True,
            'invoice': invoice.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/sales/<invoice_number>', methods=['GET'])
def api_get_sale(invoice_number):
    """جلب فاتورة برقمها"""
    invoice = SaleInvoice.query.filter_by(invoice_number=invoice_number).first()
    if not invoice:
        return jsonify({'success': False, 'error': 'الفاتورة غير موجودة'}), 404

    return jsonify({
        'success': True,
        'invoice': invoice.to_dict()
    })


# ==========================================
# API Routes - QR Code
# ==========================================

@app.route('/api/qr/<code>', methods=['GET'])
def api_get_qr(code):
    """جلب QR code كصورة"""
    qr_data_url = generate_qr_data_url(code)
    return jsonify({
        'success': True,
        'qr_data_url': qr_data_url,
        'item_code': code
    })


# ==========================================
# Helper Functions
# ==========================================

def generate_qr_data_url(data: str, size: int = 200) -> str:
    """توليد QR code كـ data URL"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # تحويل لإنهائي
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    img_bytes = buffer.getvalue()
    base64_str = base64.b64encode(img_bytes).decode()

    return f"data:image/png;base64,{base64_str}"


def generate_invoice_number() -> str:
    """توليد رقم فاتورة فريد"""
    now = datetime.now()
    prefix = f"INV-{now.year}{now.month:02d}"
    last = SaleInvoice.query.filter(
        SaleInvoice.invoice_number.like(f"{prefix}%")
    ).order_by(SaleInvoice.id.desc()).first()

    if last:
        num = int(last.invoice_number.split('-')[-1]) + 1
    else:
        num = 1

    return f"{prefix}-{num:04d}"


# ==========================================
# Frontend Routes (للمعاينة بدون React)
# ==========================================

@app.route('/')
def index():
    """الصفحة الرئيسية"""
    return '''
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مجوهرات الحمروني - API</title>
        <style>
            body { font-family: Arial, sans-serif; background: #121212; color: #e0e0e0; padding: 40px; }
            h1 { color: #d4af37; }
            .info { background: #1e1e1e; padding: 20px; border-radius: 10px; margin: 20px 0; }
            a { color: #d4af37; }
            code { background: #333; padding: 2px 8px; border-radius: 4px; }
        </style>
    </head>
    <body>
        <h1>🏆 نظام مجوهرات الحمروني - API Server</h1>
        <div class="info">
            <h2>API Endpoints:</h2>
            <ul>
                <li><code>GET /api/items</code> - جلب كل القطع</li>
                <li><code>POST /api/items</code> - إضافة قطعة جديدة</li>
                <li><code>GET /api/items/{code}</code> - جلب قطعة بالكود</li>
                <li><code>POST /api/items/{code}/sale</code> - بيع قطعة</li>
                <li><code>GET /api/sales</code> - جلب الفواتير</li>
                <li><code>POST /api/sales</code> - إنشاء فاتورة</li>
                <li><code>GET /api/qr/{code}</code> - جلب QR code</li>
            </ul>
        </div>
        <div class="info">
            <h2>للتشغيل مع React:</h2>
            <p>الـ Backend يعمل على: <code>http://localhost:5000</code></p>
            <p>الـ Frontend (React) يعمل على: <code>http://localhost:5173</code></p>
        </div>
    </body>
    </html>
    '''


# ==========================================
# تشغيل السيرفر
# ==========================================

if __name__ == '__main__':
    print("=" * 50)
    print("🏆 نظام مجوهرات الحمروني - Backend API")
    print("=" * 50)
    print("السيرفر يعمل على: http://localhost:5000")
    print("API Documentation: http://localhost:5000/")
    print("=" * 50)

    app.run(debug=True, host='0.0.0.0', port=5000)