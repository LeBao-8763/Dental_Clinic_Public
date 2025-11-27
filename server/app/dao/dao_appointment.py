from app import db
from app.models import Appointment, User
from app.models import GenderEnum, RoleEnum, StatusEnum
from sqlalchemy import and_


def create_appointment(patient_id, dentist_id, appointment_date, start_time, end_time, note=None):

    # Kiểm tra dentist và patient có tồn tại không
    dentist = User.query.get(dentist_id)
    patient = User.query.get(patient_id)

    if not dentist or not patient:
        raise ValueError("Dentist hoặc Patient không tồn tại")

    # Giới hạn tối đa 5 lịch 1 ngày
    if db.session.query(Appointment).filter_by(
        dentist_id=dentist_id,
        appointment_date=appointment_date
    ).count() >= 5:
        raise ValueError("Bác sĩ đã tối đa lịch hẹn vào ngày hôm nay")

    # Kiểm tra trùng lịch
    overlapping_appointment = Appointment.query.filter(
        Appointment.dentist_id == dentist_id,
        Appointment.appointment_date == appointment_date,
        and_(
            Appointment.start_time < end_time,
            Appointment.end_time > start_time
        )
    ).first()

    if overlapping_appointment:
        raise ValueError("Khung giờ này đã bị trùng với lịch hẹn khác của bác sĩ")

    # Tạo mới lịch hẹn
    appointment = Appointment(
        patient_id=patient_id,
        dentist_id=dentist_id,
        appointment_date=appointment_date,
        start_time=start_time,
        end_time=end_time,
        note=note
    )

    db.session.add(appointment)
    db.session.commit()

    return appointment

def get_appointments_by_dentist(dentist_id):
    appointments = Appointment.query.filter_by(dentist_id=dentist_id).all()
    return appointments
