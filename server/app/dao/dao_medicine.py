from sqlalchemy import func
from app import db
from app.models import Medicine, MedicineImport

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

def get_medicine_list():
    query = (
        db.session.query(
            Medicine,
            func.coalesce(func.sum(MedicineImport.stock_quantity), 0).label('total_stock')
        )
        .outerjoin(MedicineImport, Medicine.id == MedicineImport.medicine_id)
        .group_by(Medicine.id)
    )

    return query.all()

def update_medicine(medicine_id, name=None, production_date=None, expiration_date=None,
                    type=None, amount_per_unit=None, retail_unit=None):
    medicine = Medicine.query.get(medicine_id)
    if not medicine:
        return None
    if name: medicine.name = name
    if production_date: medicine.production_date = production_date
    if expiration_date: medicine.expiration_date = expiration_date
    if type: medicine.type = type
    if amount_per_unit: medicine.amount_per_unit = amount_per_unit
    if retail_unit: medicine.retail_unit = retail_unit
    db.session.commit()
    return medicine

def delete_medicine(medicine_id):
    medicine = Medicine.query.get(medicine_id)
    if not medicine:
        return False
    db.session.delete(medicine)
    db.session.commit()
    return True