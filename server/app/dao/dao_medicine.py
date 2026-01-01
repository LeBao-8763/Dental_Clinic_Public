from datetime import datetime
from sqlalchemy import func
from app import db
from app.models import Medicine, MedicineImport

def get_medicine_list():
    
    today = datetime.utcnow()

    query = (
        db.session.query(
            Medicine,
            func.coalesce(func.sum(MedicineImport.stock_quantity), 0).label('total_stock')
        )
        .outerjoin(MedicineImport, Medicine.id == MedicineImport.medicine_id)
        .filter(MedicineImport.expiration_date > today)
        .group_by(Medicine.id)
        .having(func.coalesce(func.sum(MedicineImport.stock_quantity), 0) > 0)
        .order_by(Medicine.name.asc())
    )

    return query.all()
