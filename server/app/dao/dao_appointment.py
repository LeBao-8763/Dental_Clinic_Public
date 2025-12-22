from app import db
from app.models import Appointment, User, UserBookingStats, AppointmentStatusEnum
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from . import dao_user_booking_stats

def create_appointment(
    dentist_id,
    appointment_date,
    start_time,
    end_time,

    patient_id=None,

    patient_name=None,
    patient_phone=None,
    date_of_birth=None,
    gender=None,

    note=None
):
    dentist = User.query.get(dentist_id)
    if not dentist:
        raise ValueError("Bác sĩ không tồn tại!")

    if isinstance(appointment_date, str):
        try:
            appointment_date = datetime.strptime(
                appointment_date, "%Y-%m-%d"
            ).date()
        except ValueError:
            raise ValueError("Sai định dạng ngày! (YYYY-MM-DD)")

    is_guest = patient_id is None

    if is_guest:
        if not patient_name or not patient_phone:
            raise ValueError("Khách chưa có tài khoản phải nhập tên và số điện thoại!")

        existing_user = User.query.filter_by(
            phone_number=patient_phone
        ).first()

        if existing_user:
            raise ValueError(
                "Số điện thoại đã có tài khoản. Vui lòng đăng nhập để đặt lịch."
        )
    else:
        patient = User.query.get(patient_id)
        if not patient:
            raise ValueError("Bệnh nhân không tồn tại!")

        if Appointment.query.filter(
            Appointment.patient_id == patient_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status != AppointmentStatusEnum.CANCELLED
        ).first():
            raise ValueError("Bạn chỉ được đặt 1 lịch hẹn mỗi ngày!")

        today = datetime.utcnow().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        if start_of_week <= appointment_date <= end_of_week:
            last_apt = Appointment.query.filter(
                Appointment.patient_id == patient_id,
                Appointment.appointment_date.between(start_of_week, end_of_week),
                Appointment.status != AppointmentStatusEnum.CANCELLED
            ).order_by(Appointment.appointment_date.desc()).first()


            if last_apt and last_apt.status != AppointmentStatusEnum.COMPLETED:
                raise ValueError(
                    "Bạn đã có lịch trong tuần này chưa hoàn thành!"
                )

        stats = UserBookingStats.query.filter_by(user_id=patient_id).first()
        if stats and stats.blocked_until and datetime.utcnow() < stats.blocked_until:
            raise ValueError(
                f"Bạn bị hạn chế đặt lịch đến {stats.blocked_until.strftime('%H:%M %d/%m/%Y')}"
            )

    if Appointment.query.filter(
        Appointment.dentist_id == dentist_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status != AppointmentStatusEnum.CANCELLED
    ).count() >= 5:
        raise ValueError("Bác sĩ đã đủ số lịch trong ngày!")

    overlap = Appointment.query.filter(
        Appointment.dentist_id == dentist_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status != AppointmentStatusEnum.CANCELLED,
        Appointment.start_time < end_time,
        Appointment.end_time > start_time
    ).first()


    if overlap:
        raise ValueError("Khung giờ đã có lịch hẹn!")

    appointment = Appointment(
        dentist_id=dentist_id,
        patient_id=None if is_guest else patient_id,

        patient_name=patient_name if is_guest else None,
        patient_phone=patient_phone if is_guest else None,
        date_of_birth=date_of_birth if is_guest else None,
        gender=gender if is_guest else None,

        is_guest=is_guest,

        appointment_date=appointment_date,
        start_time=start_time,
        end_time=end_time,
        note=note
    )

    db.session.add(appointment)
    db.session.commit()

    return appointment


def get_appointments_by_dentist(dentist_id, status=None, appointment_date=None, keyword=None):
    query = (
        Appointment.query
        .options(joinedload(Appointment.patient))
        .filter(Appointment.dentist_id == dentist_id)
    )

    if status:
        statuses = status.split(",")
        query = query.filter(Appointment.status.in_(statuses))

    if appointment_date:
        query = query.filter(Appointment.appointment_date == appointment_date)

    if keyword:
        keyword = keyword.strip()
        query = (
            query
            .outerjoin(Appointment.patient)
            .filter(
                db.or_(
                    User.name.ilike(f"%{keyword}%"),
                    Appointment.patient_name.ilike(f"%{keyword}%")
                )
            )
        )

    return query.all()

def get_appointments_by_patient(patient_id, status=None, start_date=None, end_date=None, keyword=None, page=None, per_page=None):
    query = (
        Appointment.query
        .options(joinedload(Appointment.dentist))
        .filter(Appointment.patient_id == patient_id)
    )

    if status:
        statuses = status.split(",")
        query = query.filter(Appointment.status.in_(statuses))

    if start_date and end_date:
        query = query.filter(Appointment.appointment_date.between(start_date, end_date))

    if keyword:
        keyword = keyword.strip()
        query = query.join(Appointment.patient).filter(
            User.name.ilike(f'%{keyword}%')
        )

    if page and per_page:
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_pages": pagination.pages
        }
    else:
        return {
            "items": query.all(),
            "total": len(query.all()),
            "page": 1,
            "per_page": len(query.all()),
            "total_pages": 1
        }



def get_all_appointment_with_filter(status=None, appointment_date=None, start_date=None, end_date=None,keyword=None):
    query = (
        Appointment.query
        .options(joinedload(Appointment.patient))
    )

    if status:
        query = query.filter(Appointment.status == status)

    if appointment_date:
        query = query.filter(Appointment.appointment_date == appointment_date)
    
    if start_date and end_date:
        query = query.filter(Appointment.appointment_date.between(start_date, end_date))

    if keyword:
        keyword = keyword.strip()
        query = (
            query
            .outerjoin(Appointment.patient)
            .filter(
                db.or_(
                    # Tìm trong tên của User (patient đã đăng ký)
                    User.name.ilike(f"%{keyword}%"),
                    # Tìm trong patient_name (guest)
                    Appointment.patient_name.ilike(f"%{keyword}%")
                )
            )
        )

    return query.all()

def get_appointments_by_id(appointment_id):
    appointment=Appointment.query.filter_by(id=appointment_id).first();
    return appointment

def update_appointment(appointment_id, **kwargs):
    appointment = Appointment.query.filter_by(id=appointment_id).first()
    
    if not appointment:
        raise ValueError("Cuộc hẹn không tồn tại!")

    allowed_fields = ["appointment_date", "start_time", "end_time", "note", "status","diagnosis"]

    for field, value in kwargs.items():
        if field in allowed_fields and value is not None:
            setattr(appointment, field, value)

    if "start_time" in kwargs or "end_time" in kwargs or "appointment_date" in kwargs:

        overlapping = Appointment.query.filter(
            Appointment.dentist_id == appointment.dentist_id,
            Appointment.id != appointment.id,
            Appointment.appointment_date == appointment.appointment_date,
            Appointment.status != AppointmentStatusEnum.CANCELLED,
            Appointment.start_time < appointment.end_time,
            Appointment.end_time > appointment.start_time
        ).first()

        if overlapping:
            raise ValueError("Khung giờ cập nhật bị trùng với lịch khác của bác sĩ!")

            

    if "status" in kwargs and kwargs["status"] == "CANCELLED":
        appointment_time = datetime.combine(
            appointment.appointment_date,
            appointment.start_time
        )

        now=datetime.now()

        if appointment_time-now<timedelta(hours=12):
            raise ValueError("Không thể hủy lịch khi còn dưới 12 giờ trước giờ khám!")

        dao_user_booking_stats.update_user_booking_stats(appointment.patient_id)

    db.session.commit()
    return appointment

def get_booked_slots(dentist_id, appointment_date):
    return Appointment.query.filter(
        Appointment.dentist_id == dentist_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status != AppointmentStatusEnum.CANCELLED
    ).all()

def check_max_dentist_schedule(dentist_id, date):
    count = Appointment.query.filter(
        Appointment.dentist_id == dentist_id,
        Appointment.appointment_date == date
    ).count()

    return count >= 5

def has_unfinished_appointment_in_current_week(patient_id=None,  target_date=None):
    if not target_date:
        target_date = datetime.utcnow().date()

    start_of_week = target_date - timedelta(days=target_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    query = Appointment.query.filter(
        Appointment.patient_id == patient_id,
        Appointment.appointment_date.between(start_of_week, end_of_week),
        Appointment.status.in_([
            AppointmentStatusEnum.PENDING,
            AppointmentStatusEnum.CONSULTING,
            AppointmentStatusEnum.PRESCRIPTION,
            AppointmentStatusEnum.COMPLETED,
        ])
    ).first()

    return bool(query)


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



