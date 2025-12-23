from app import db
from app.models import Appointment, Invoice, User, RoleEnum, AppointmentStatusEnum, Service, TreatmentRecord, Medicine, \
    PrescriptionDetail, Prescription
from sqlalchemy import extract, func, desc, case


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

def revenue_by_dentist(month=None, year=None):
    query = (
        db.session.query(
            User.id.label("dentist_id"),
            User.name.label("dentist_name"),
            func.coalesce(func.sum(Invoice.total), 0).label("total_revenue")
        )
        .filter(User.role == RoleEnum.ROLE_DENTIST)
        .outerjoin(Appointment, Appointment.dentist_id == User.id)
        .outerjoin(Invoice, Invoice.appointment_id == Appointment.id)
    )

    if month:
        query = query.filter(extract("month", Invoice.created_at) == month)

    if year:
        query = query.filter(extract("year", Invoice.created_at) == year)

    query = (
        query.group_by(User.id)
        .order_by(desc("total_revenue"))
    )
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

def top_services(month=None, year=None):
    query = (
        db.session.query(
            Service.id.label("service_id"),
            Service.name.label("service_name"),
            func.coalesce(func.sum(TreatmentRecord.price), 0).label("revenue")
        )
        .outerjoin(TreatmentRecord, TreatmentRecord.service_id == Service.id)
        .outerjoin(Appointment, Appointment.id == TreatmentRecord.appointment_id)
        .outerjoin(Invoice, Invoice.appointment_id == Appointment.id)
    )

    if month:
        query = query.filter(extract("month", Invoice.created_at) == month)
    if year:
        query = query.filter(extract("year", Invoice.created_at) == year)

    query = (
        query.group_by(Service.id)
        .order_by(desc("revenue"))
    )

    return query.all()

def top_medicines(month=None, year=None):
    qty_used_expr = case(
        (Medicine.type == "PILL", PrescriptionDetail.dosage * PrescriptionDetail.duration_days),
        (Medicine.type.in_(["CREAM", "LIQUID"]),
         func.ceil((PrescriptionDetail.dosage * PrescriptionDetail.duration_days) /
                   func.nullif(Medicine.capacity_per_unit, 0))),
        else_=PrescriptionDetail.dosage * PrescriptionDetail.duration_days
    )

    revenue_expr = func.coalesce(func.sum(qty_used_expr * PrescriptionDetail.price), 0)

    query = (
        db.session.query(
            Medicine.id.label("medicine_id"),
            Medicine.name.label("medicine_name"),
            revenue_expr.label("revenue")
        )
        .outerjoin(PrescriptionDetail, PrescriptionDetail.medicine_id == Medicine.id)
        .outerjoin(Prescription, Prescription.id == PrescriptionDetail.prescription_id)
        .outerjoin(Appointment, Appointment.id == Prescription.appointment_id)
        .outerjoin(Invoice, Invoice.appointment_id == Appointment.id)
    )

    if month:
        query = query.filter(extract("month", Invoice.created_at) == month)
    if year:
        query = query.filter(extract("year", Invoice.created_at) == year)

    query = (
        query.group_by(Medicine.id)
        .order_by(desc("revenue"))
    )

    return query.all()

