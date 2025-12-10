from app import db
from app.models import TreatmentRecord, Appointment, Service

def create_treatment_record(appointment_id, service_id, price, note):
    """Tạo một treatment record"""

    if not Appointment.query.get(appointment_id):
        raise ValueError(f"Appointment with id {appointment_id} does not exist.")

    if not Service.query.get(service_id):
        raise ValueError(f"Service with id {service_id} does not exist.")
    
    try:
        treatment = TreatmentRecord(
            appointment_id=appointment_id,
            service_id=service_id,
            price=price,
            note=note
        )
        db.session.add(treatment)
        db.session.commit()
        return treatment
    except Exception as e:
        db.session.rollback() # Hoàn tác nếu có lỗi xảy ra trong quá trình thêm
        raise e


def create_multiple_treatment_records(appointment_id, services_data):
    """
    Tạo nhiều treatment records cho một appointment
    services_data: list of dict [{'service_id': 1, 'price': 100000, 'note': 'abc'}, ...]
    """

    if not Appointment.query.get(appointment_id):
        raise ValueError(f"Appointment with id {appointment_id} does not exist.")


    try:
        treatment_records = []
        for service_data in services_data:

            #Check xem service có tồn tại không
            service = Service.query.get(service_data['service_id'])
            if not service:
                raise ValueError(f"Service with id {service_data['service_id']} does not exist.")

            treatment = TreatmentRecord(
                appointment_id=appointment_id,
                service_id=service_data['service_id'],
                price=service_data.get('price'),  # Có thể null nếu lấy từ Service
                note=service_data.get('note', '')
            )
            db.session.add(treatment)
            treatment_records.append(treatment)
        
        db.session.commit()
        return treatment_records
    except Exception as e:
        db.session.rollback()
        raise e

def get_treatment_record_by_aptId(appointment_id):

    appointment = Appointment.query.filter_by(id=appointment_id).first()
    
    if not appointment:
        raise ValueError("Cuộc hẹn không tồn tại!")

    treatment_records=TreatmentRecord.query.filter_by(appointment_id=appointment_id).all()
    return treatment_records

def delete_treatment_records_by_aptId(appointment_id):
    appointment = Appointment.query.filter_by(id=appointment_id).first()
    
    if not appointment:
        raise ValueError("Cuộc hẹn không tồn tại!")

    deleted_count=TreatmentRecord.query.filter_by(appointment_id=appointment_id).delete()

    db.session.commit()
    return deleted_count

#huy-dev
def get_all_treatment_records():
    return TreatmentRecord.query.all()

def update_treatment_record(record_id, service_id=None, note=None):
    record = TreatmentRecord.query.get(record_id)
    if not record:
        return None
    if service_id: record.service_id = service_id
    if note: record.note = note
    db.session.commit()
    return record