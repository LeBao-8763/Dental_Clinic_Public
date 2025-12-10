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

def add_detail(data):
    detail = PrescriptionDetail(
        prescription_id=data['prescription_id'],
        medicine_id=data['medicine_id'],
        dosage=data['dosage'],
        unit=data['unit'],
        duration_days=data['duration_days'],
        note=data.get('note'),
        price=data['price']
    )
    db.session.add(detail)
    db.session.commit()
    return True  # chỉ trả về True khi thêm thành công


def delete_detail(prescription_id, medicine_id):
    detail = PrescriptionDetail.query.filter_by(
        prescription_id=prescription_id,
        medicine_id=medicine_id
    ).first()
    if not detail:
        return False
    db.session.delete(detail)
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

