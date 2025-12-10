from app import db
from app.models import Medicine, MedicineImport
from datetime import datetime

# Nhập thuốc vào kho
def import_medicine(user_id, medicine_id, production_date, expiration_date, quantity, price):
    med = Medicine.query.get(medicine_id)
    if not med:
        return None

    # Tạo bản ghi nhập thuốc
    import_record = MedicineImport(
        user_id=user_id,
        medicine_id=medicine_id,
        import_date=datetime.utcnow(),
        quantity_imported=quantity,
        production_date=production_date,
        expiration_date=expiration_date,
        price=price,
        stock_quantity=quantity
    )
    db.session.add(import_record)
    db.session.commit()
    return import_record

# Lấy danh sách nhập thuốc
def get_medicine_import_list():
    return MedicineImport.query.all()
