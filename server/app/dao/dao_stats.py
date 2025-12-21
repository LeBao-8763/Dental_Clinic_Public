from app import db
from app.models import Appointment, Invoice, User, RoleEnum, AppointmentStatusEnum
from sqlalchemy import extract, func

# --------------------------------------------------
# 🔹 1. Doanh thu theo bác sĩ
# --------------------------------------------------
def revenue_by_dentist(month=None):
    query = (
        db.session.query(
            User.id.label("dentist_id"),
            func.concat(User.firstname, " ", User.lastname).label("dentist_name"),
            func.sum(Invoice.total).label("total_revenue")
        )
        .join(Appointment, Appointment.id == Invoice.appointment_id)
        .join(User, Appointment.dentist_id == User.id)
        .filter(User.role == RoleEnum.ROLE_DENTIST)
    )

    if month:
        query = query.filter(extract("month", Invoice.created_at) == month)

    query = query.group_by(User.id)
    return query.all()


# --------------------------------------------------
# 🔹 2. Doanh thu theo ngày (trong tháng)
# --------------------------------------------------
def revenue_by_day(month=None, dentist_id=None):
    query = (
        db.session.query(
            func.date(Invoice.created_at).label("date"),
            func.sum(Invoice.total).label("total_revenue")
        )
        .join(Appointment, Appointment.id == Invoice.appointment_id)
    )

    if month:
        query = query.filter(extract("month", Invoice.created_at) == month)

    if dentist_id:
        query = query.filter(Appointment.dentist_id == dentist_id)

    query = query.group_by(func.date(Invoice.created_at))
    return query.order_by(func.date(Invoice.created_at)).all()


def general_revenue():
    total_patients = db.session.query(
        func.coalesce(func.count(User.id), 0)
    ).filter(User.role == RoleEnum.ROLE_PATIENT).scalar()

    total_guests = db.session.query(
        func.count(func.distinct(Appointment.patient_phone))
    ).filter(
        Appointment.is_guest == True,
        Appointment.patient_phone.isnot(None)
    ).scalar()

    total_dentists = db.session.query(
        func.coalesce(func.count(User.id), 0)
    ).filter(User.role == RoleEnum.ROLE_DENTIST).scalar()

    total_completed_appointments = db.session.query(
        func.coalesce(func.count(Appointment.id), 0)
    ).filter(Appointment.status == AppointmentStatusEnum.PAID).scalar()

    total = db.session.query(func.count(Appointment.id)).scalar()


    return {
        "total_patients": total_patients + total_guests,
        "total_dentists": total_dentists,
        "total_completed_appointments": total_completed_appointments,
        "completion_rate": (total_completed_appointments*100/total)
    }
