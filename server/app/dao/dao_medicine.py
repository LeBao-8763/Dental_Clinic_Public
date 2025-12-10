from app import db
from app.models import Medicine

# Thêm loại thuốc mới vào danh mục
def create_medicine(name, type, amount_per_unit, retail_unit, selling_price):
    med = Medicine.query.filter_by(name=name).first()
    if med:
        return med  # thuốc đã tồn tại
    med = Medicine(
        name=name,
        reserved_quantity=0,
        type=type,
        amount_per_unit=amount_per_unit,
        retail_unit=retail_unit,
        selling_price=selling_price
    )
    db.session.add(med)
    db.session.commit()
    return med


# Lấy danh sách thuốc
def get_medicine_list():
    return Medicine.query.all()
