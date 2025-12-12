from alembic.util import status

from app import db
from app.models import Prescription, PrescriptionDetail, Medicine

# ------------------------------
# 🔹 Toa thuốc
# ------------------------------
def get_all_prescriptions():
    return Prescription.query.all()

def get_prescription_by_id(prescription_id):
    return Prescription.query.get(prescription_id)

def create_prescription(data):
    prescription = Prescription(
        appointment_id=data['appointment_id'],
        note=data.get('note')
    )
    db.session.add(prescription)
    db.session.commit()
    return prescription

def delete_prescription(prescription_id):
    prescription = Prescription.query.get(prescription_id)
    if not prescription:
        return False
    db.session.delete(prescription)
    db.session.commit()
    return True

# ------------------------------
# 🔹 Chi tiết toa thuốc
# ------------------------------
def get_details_by_prescription(prescription_id):
    details = PrescriptionDetail.query.filter_by(prescription_id=prescription_id).all()
    result = []
    for d in details:
        result.append({
            'prescription_id': d.prescription_id,
            'medicine_id': d.medicine_id,
            'medicine_name': d.medicine.name if d.medicine else None,
            'dosage': d.dosage,
            'unit': d.unit,
            'duration_days': d.duration_days,
            'note': d.note,
            'price': float(d.price) if d.price else None
        })
    return result

def get_prescription_by_appointment(appointment_id):
    """Lấy toa thuốc và chi tiết thuốc theo appointment_id"""
    prescription = (
        db.session.query(Prescription)
        .filter(Prescription.appointment_id == appointment_id)
        .first()
    )

    if not prescription:
        return None

    # Lấy chi tiết thuốc + thông tin thuốc
    details = (
        db.session.query(PrescriptionDetail, Medicine)
        .join(Medicine, PrescriptionDetail.medicine_id == Medicine.id)
        .filter(PrescriptionDetail.prescription_id == prescription.id)
        .all()
    )

    # Đóng gói dữ liệu trả về
    result = {
        "id": prescription.id,
        "appointment_id": prescription.appointment_id,
        "note": prescription.note,
        "created_at": prescription.created_at.strftime("%Y-%m-%d %H:%M:%S") if prescription.created_at else None,
        "status": prescription.status.name if prescription.status else None,
        "details": [
            {
                "medicine_id": med.id,
                "medicine_name": med.name,
                "dosage": detail.dosage,
                "unit": detail.unit,
                "duration_days": detail.duration_days,
                "note": detail.note,
                "price": float(detail.price),
            }
            for detail, med in details
        ],
    }

    return result

def add_details(data):
    prescription_id = data['prescription_id']
    new_details = data['details']

    # 1️⃣ Lấy tất cả chi tiết hiện có trong DB
    existing_details = PrescriptionDetail.query.filter_by(prescription_id=prescription_id).all()
    existing_map = {d.medicine_id: d for d in existing_details}

    # 2️⃣ Tạo danh sách ID thuốc mới
    new_ids = [item['medicine_id'] for item in new_details]

    # 3️⃣ Xử lý thêm hoặc cập nhật
    for item in new_details:
        medicine_id = int(item['medicine_id'])
        dosage = int(item['dosage'])
        duration_days = int(item['duration_days'])
        total_quantity = dosage * duration_days

        unit = item.get('unit')
        price = float(item.get('price', 0))
        note = item.get('note')

        medicine = Medicine.query.get(medicine_id)

        if medicine_id in existing_map:
            # Đã tồn tại → kiểm tra thay đổi
            old_detail = existing_map[medicine_id]
            old_total = old_detail.dosage * old_detail.duration_days
            diff = total_quantity - old_total  # dương: tăng, âm: giảm

            # Cập nhật toa
            old_detail.dosage = dosage
            old_detail.unit = item['unit']
            old_detail.duration_days = duration_days
            old_detail.note = item.get('note')
            old_detail.price = item['price']

            # Cập nhật kho tạm
            if medicine:
                medicine.reserved_quantity += diff

        else:
            # Thuốc mới → thêm mới
            new_detail = PrescriptionDetail(
                prescription_id=prescription_id,
                medicine_id=medicine_id,
                dosage=dosage,
                unit=item['unit'],
                duration_days=duration_days,
                note=item.get('note'),
                price=item['price']
            )
            db.session.add(new_detail)
            if medicine:
                medicine.reserved_quantity += total_quantity

    # 4️⃣ Xóa thuốc bị gỡ khỏi toa
    for old_medicine_id, old_detail in existing_map.items():
        if old_medicine_id not in new_ids:
            # Thuốc bị xóa khỏi toa
            old_total = old_detail.dosage * old_detail.duration_days
            medicine = Medicine.query.get(old_medicine_id)
            if medicine:
                medicine.reserved_quantity -= old_total
            db.session.delete(old_detail)

    db.session.commit()
    return True


#huy-dev
def update_prescription(prescription_id, args):
    prescription = Prescription.query.get(prescription_id)
    if not prescription:
        return None
    if 'patient_id' in args: prescription.patient_id = args['patient_id']
    if 'dentist_id' in args: prescription.dentist_id = args['dentist_id']
    if 'note' in args: prescription.note = args['note']
    db.session.commit()
    return prescription

def update_detail(prescription_id, medicine_id, args):
    detail = PrescriptionDetail.query.filter_by(
        prescription_id=prescription_id,
        medicine_id=medicine_id
    ).first()
    if not detail:
        return False
    if 'quantity' in args: detail.quantity = args['quantity']
    if 'note' in args: detail.note = args['note']
    db.session.commit()
    return True

