from app import db
from app.models import Appointment, User, UserBookingStats
from app.models import GenderEnum, RoleEnum, StatusEnum
from sqlalchemy import and_
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from . import dao_user_booking_stats

def create_appointment(patient_id, dentist_id, appointment_date, start_time, end_time, note=None):

    # Kiểm tra dentist và patient có tồn tại không
    dentist = User.query.get(dentist_id)
    patient = User.query.get(patient_id)

    if not dentist or not patient:
        raise ValueError("Bác sĩ hoặc bệnh nhân không tồn tại!")

    patient_apt=Appointment.query.filter_by(patient_id=patient_id,appointment_date=appointment_date).first();

    # Giới hạn mỗi bệnh nhân chỉ được đặt một lệnh mỗi này 
    if patient_apt:
        raise ValueError("Lỗi đặt trên 1 lịch mỗi ngày!")

    today=datetime.utcnow().date();
    start_of_week=today-timedelta(days=today.weekday())
    end_of_week=start_of_week+timedelta(days=6)

    # Convert appointment_date nếu là string
    if isinstance(appointment_date, str):
        try:
            appointment_date = datetime.strptime(appointment_date, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Sai định dạng ngày! Đúng format: YYYY-MM-DD")


    #Giới hạn việc không cho đặt lịch thêm cho tuần đó nếu đã có một lịch chưa được hoàn thành
    if start_of_week <= appointment_date <= end_of_week:
        lastest_apt=Appointment.query.filter(
            Appointment.patient_id==patient_id,
            Appointment.appointment_date>=start_of_week,
            Appointment.appointment_date<=end_of_week
        ).order_by(Appointment.appointment_date.desc()).first()

        if lastest_apt and lastest_apt.status!="COMPLETED":
            raise ValueError("Bạn đã có lịch hẹn trong tuần này chưa hoàn thành, không thể đặt thêm!")
        

    # Giới hạn tối đa 5 lịch 1 ngày
    if db.session.query(Appointment).filter_by(
        dentist_id=dentist_id,
        appointment_date=appointment_date
    ).count() >= 5:
        raise ValueError("Bác sĩ đã tối đa lịch hẹn vào ngày hôm nay!")

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
        raise ValueError("Khung giờ này đã bị trùng với lịch hẹn khác của bác sĩ!")

    stats = UserBookingStats.query.filter_by(user_id=patient_id).first()

    # Nếu bị chặn đặt lịch vì spam thì không cho đặt nữa
    if stats.blocked_until and datetime.utcnow() < stats.blocked_until:
        raise ValueError("Bạn bị hạn chế đặt lịch đến " + stats.blocked_until.strftime("%H:%M %d/%m/%Y"))

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
    appointments = (
        Appointment.query
        .options(joinedload(Appointment.patient))
        .filter_by(dentist_id=dentist_id)
        .all()
    )
    return appointments

def get_appointments_by_id(appointment_id):
    appointment=Appointment.query.filter_by(id=appointment_id).first();
    return appointment

def update_appointment(appointment_id, **kwargs):
    appointment = Appointment.query.filter_by(id=appointment_id).first()
    
    if not appointment:
        raise ValueError("Cuộc hẹn không tồn tại!")

    allowed_fields = ["appointment_date", "start_time", "end_time", "note", "status"]

    for field, value in kwargs.items():
        if field in allowed_fields and value is not None:
            setattr(appointment, field, value)

    if "start_time" in kwargs or "end_time" in kwargs or "appointment_date" in kwargs:

        # Nếu cập nhật thời gian thì check trùng lịch
        overlapping = Appointment.query.filter(
            Appointment.dentist_id == appointment.dentist_id,
            Appointment.id != appointment.id,  # bỏ chính nó
            Appointment.appointment_date == appointment.appointment_date,
            Appointment.start_time < appointment.end_time,
            Appointment.end_time > appointment.start_time
        ).first()

        if overlapping:
            raise ValueError("Khung giờ cập nhật bị trùng với lịch khác của bác sĩ!")

            

    if "status" in kwargs and kwargs["status"] == "CANCELLED":
        # Ghép date + time thành datetime
        appointment_time = datetime.combine(
            appointment.appointment_date,
            appointment.start_time
        )

        now=datetime.now()

        if appointment_time-now<timedelta(hours=12):
            raise ValueError("Không thể hủy lịch khi còn dưới 12 giờ trước giờ khám!")

        dao_user_booking_stats.update_user_booking_stats(appointment.patient_id)


#huy-dev
def get_all_appointments():
    return Appointment.query.options(
        joinedload(Appointment.patient),
        joinedload(Appointment.dentist)
    ).all()

def delete_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return False
    db.session.delete(appointment)
    db.session.commit()
    return True


    db.session.commit()

    return appointment


