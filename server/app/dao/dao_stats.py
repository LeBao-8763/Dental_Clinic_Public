from app import db
from app.models import Appointment, Invoice, User, RoleEnum, AppointmentStatusEnum, Service, TreatmentRecord, Medicine, \
    PrescriptionDetail, Prescription
from sqlalchemy import extract, func

def overall_stats(month=None, year=None):
    query = db.session.query(func.sum(Invoice.total).label("total_revenue"))
    if month:
        query = query.filter(extract("month", Invoice.created_at) == month)
    if year:
        query = query.filter(extract("year", Invoice.created_at) == year)

    total_revenue = query.scalar() or 0

    total_appointments = (
        db.session.query(func.count(Appointment.id))
        .join(Invoice, Invoice.appointment_id == Appointment.id)
    )
    if month:
        total_appointments = total_appointments.filter(extract("month", Invoice.created_at) == month)
    if year:
        total_appointments = total_appointments.filter(extract("year", Invoice.created_at) == year)

    total_appointments = total_appointments.scalar() or 0

    total_dentists = (
        db.session.query(func.count(User.id))
        .filter(User.role == RoleEnum.ROLE_DENTIST)
        .scalar() or 1
    )
    avg_per_dentist = total_revenue / total_dentists if total_dentists > 0 else 0

    return {
        "total_revenue": total_revenue,
        "total_appointments": total_appointments,
        "avg_per_dentist": avg_per_dentist
    }

def revenue_by_dentist(month=None):
    query = (
        db.session.query(
            User.id.label("dentist_id"),
            func.concat(User.name).label("dentist_name"),
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

def revenue_by_day(month=None, year=None, dentist_id=None):
    query = (
        db.session.query(
            func.date(Invoice.created_at).label("date"),
            func.sum(Invoice.total).label("total_revenue")
        )
        .join(Appointment, Appointment.id == Invoice.appointment_id)
    )

    if month:
        query = query.filter(extract("month", Invoice.created_at) == month)

    if year:
        query = query.filter(extract("year", Invoice.created_at) == year)

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

    completion_rate = 0
    if total > 0:
        completion_rate = round(total_completed_appointments * 100 / total, 2)


    return {
        "total_patients": total_patients + total_guests,
        "total_dentists": total_dentists,
        "total_completed_appointments": total_completed_appointments,
        "completion_rate": completion_rate
    }

def top_services(month=None, year=None, limit=5):
    query = (
        db.session.query(
            Service.name.label("service_name"),
            func.sum(TreatmentRecord.price).label("revenue")
        )
        .join(Appointment, TreatmentRecord.appointment_id == Appointment.id)
        .join(Service, TreatmentRecord.service_id == Service.id)
        .join(Invoice, Invoice.appointment_id == Appointment.id)
        .filter(Appointment.status == AppointmentStatusEnum.PAID)
    )

    if month:
        query = query.filter(extract("month", Invoice.created_at) == month)
    if year:
        query = query.filter(extract("year", Invoice.created_at) == year)

    query = query.group_by(Service.id).order_by(func.sum(TreatmentRecord.price).desc())

    return query.limit(limit).all()

def top_medicines(month=None, year=None, limit=5):
    query = (
        db.session.query(
            Medicine.name.label("medicine_name"),
            func.sum(PrescriptionDetail.price).label("revenue")
        )
        .join(Medicine, PrescriptionDetail.medicine_id == Medicine.id)
        .join(Prescription, Prescription.id == PrescriptionDetail.prescription_id)
        .join(Appointment, Appointment.id == Prescription.appointment_id)
        .join(Invoice, Invoice.appointment_id == Appointment.id)
        .filter(Appointment.status == AppointmentStatusEnum.PAID)
    )

    if month:
        query = query.filter(extract("month", Invoice.created_at) == month)
    if year:
        query = query.filter(extract("year", Invoice.created_at) == year)

    query = query.group_by(Medicine.id).order_by(func.sum(PrescriptionDetail.price).desc())

    return query.limit(limit).all()
