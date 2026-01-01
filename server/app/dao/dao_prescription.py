import math
from app import db
from app.models import Prescription, PrescriptionDetail, Medicine, PrescriptionStatusEnum, MedicineTypeEnum

def create_prescription(data):
    prescription = Prescription(
        appointment_id=data['appointment_id'],
        note=data.get('note')
    )
    db.session.add(prescription)
    db.session.commit()
    return prescription

def get_prescription_by_appointment(appointment_id):
    prescription = (
        db.session.query(Prescription)
        .filter(Prescription.appointment_id == appointment_id)
        .first()
    )

    if not prescription:
        return None

    details = (
        db.session.query(PrescriptionDetail, Medicine)
        .join(Medicine, PrescriptionDetail.medicine_id == Medicine.id)
        .filter(PrescriptionDetail.prescription_id == prescription.id)
        .all()
    )

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
                "medicine_capacity_per_unit": med.capacity_per_unit,
                "medicine_type": med.type.name if med.type else None,
                "dosage": detail.dosage,
                "unit": detail.unit,
                "duration_days": detail.duration_days,
                "note": detail.note,
                "price": detail.price,
            }
            for detail, med in details
        ],
    }

    return result

def calculate_total_dose(dosage, duration_days, type, capacity_per_unit):
    total_dose = dosage * duration_days

    if type in [MedicineTypeEnum.CREAM, MedicineTypeEnum.LIQUID]:
        capacity = capacity_per_unit or 1
        total_dose = math.ceil(total_dose / capacity)

    return total_dose

def add_details(prescription_id, data):
    details = data['details']

    prescription = Prescription.query.get(prescription_id)
    if not prescription:
        return {"error": "Không tìm thấy toa thuốc."}, False

    if prescription.status == PrescriptionStatusEnum.CONFIRMED:
        return {"error": "Toa thuốc đã được xác nhận, không thể chỉnh sửa."}, False

    for item in details:
        medicine_id = item.get('medicine_id')
        medicine = Medicine.query.get(medicine_id)
        if not medicine:
            return {"error": f"Không tìm thấy thuốc với ID {medicine_id}."}, False
        total = calculate_total_dose(
            dosage=item['dosage'],
            duration_days=item['duration_days'],
            type=medicine.type,
            capacity_per_unit=medicine.capacity_per_unit
        )
        medicine.reserved_quantity += total
        db.session.add(medicine)

        detail = PrescriptionDetail(
            prescription_id=prescription_id,
            medicine_id=medicine_id,
            dosage=item['dosage'],
            unit=item['unit'],
            duration_days=item['duration_days'],
            note=item.get('note'),
            price=medicine.price
        )
        db.session.add(detail)

    db.session.commit()
    return True

def delete_details(prescription_id, data):
    prescription = PrescriptionDetail.query.get(prescription_id)
    if not prescription:
        return {"error": "Không tìm thấy toa thuốc."}, False
    
    for item in data['details']:
        detail = PrescriptionDetail.query.get(item['id'])
        medicine = Medicine.query.get(detail.medicine_id)
        if not medicine:
            return {"error": f"Không tìm thấy thuốc với ID {medicine.id}."}, False
        total = calculate_total_dose(
            dosage=detail.dosage,
            duration_days=detail.duration_days,
            type=medicine.type,
            capacity_per_unit=medicine.capacity_per_unit
        )
        medicine.reserved_quantity -= total
        db.session.add(medicine)
        if detail:
            db.session.delete(detail)

    db.session.commit()
    return True