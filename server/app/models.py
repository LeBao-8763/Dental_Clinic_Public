from app.extensions import db
from datetime import datetime
import enum
from flask_login import UserMixin

class GenderEnum(enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class RoleEnum(enum.Enum):
    ROLE_ADMIN = "ROLE_ADMIN"
    ROLE_DENTIST = "ROLE_DENTIST"
    ROLE_STAFF = "ROLE_STAFF"
    ROLE_PATIENT = "ROLE_PATIENT"

class StatusEnum(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class MedicineTypeEnum(enum.Enum):
    PILL = "PILL"
    CREAM = "CREAM"
    LIQUID = "LIQUID"

class AppointmentStatusEnum(enum.Enum):
    PENDING = "PENDING"
    CONSULTING = "CONSULTING"
    PRESCRIPTION="PRESCRIPTION"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    PAID = "PAID"

class DayOfWeekEnum(enum.Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"

class PrescriptionStatusEnum(enum.Enum):
    DRAFT = 'DRAFT'
    CONFIRMED = 'CONFIRMED'
    CANCELLED = 'CANCELLED'

class User(db.Model, UserMixin):
    __tablename__ = 'user'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100))
    gender = db.Column(db.Enum(GenderEnum), nullable=False)
    phone_number = db.Column(db.String(20), unique=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    avatar = db.Column(db.String(255))
    password = db.Column(db.String(255), nullable=False)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    role = db.Column(db.Enum(RoleEnum), nullable=False, default=RoleEnum.ROLE_PATIENT)
    status = db.Column(db.Enum(StatusEnum), nullable=False, default=StatusEnum.ACTIVE)

    dentist_appointments = db.relationship('Appointment', foreign_keys='Appointment.dentist_id', back_populates='dentist')
    patient_appointments = db.relationship('Appointment', foreign_keys='Appointment.patient_id', back_populates='patient')

    dentist_schedules = db.relationship('DentistSchedule', back_populates='dentist', lazy=True)
    dentist_custom_schedules = db.relationship('DentistCustomSchedule', back_populates='dentist', lazy=True)
    booking_stats = db.relationship('UserBookingStats', back_populates='user', uselist=False)

    def __str__(self):
        return self.name

class DentistProfile(db.Model):
    __tablename__ = 'dentist_profile'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dentist_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)

    introduction = db.Column(db.Text)
    education = db.Column(db.Text, nullable=False)
    experience = db.Column(db.Text, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    dentist = db.relationship('User', backref=db.backref('dentist_profile', uselist=False), lazy=True)

class Medicine(db.Model):
    __tablename__ = 'medicine'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    reserved_quantity = db.Column(db.Integer, default=0)
    type = db.Column(db.Enum(MedicineTypeEnum), nullable=False)
    amount_per_unit = db.Column(db.Integer, nullable=False)
    retail_unit = db.Column(db.String(50), nullable=False)
    capacity_per_unit = db.Column(db.Integer, default=1)
    selling_price = db.Column(db.Numeric(10, 2), nullable=False)


    imports = db.relationship('MedicineImport', backref='medicine', lazy=True)
    details = db.relationship('PrescriptionDetail', back_populates='medicine', lazy=True)
    def __str__(self):
        return self.name or f"Thuốc {self.id}"

class MedicineImport(db.Model):
    __tablename__ = 'medicine_import'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    medicine_id = db.Column(db.BigInteger, db.ForeignKey('medicine.id'), nullable=False)
    import_date = db.Column(db.DateTime, default=datetime.utcnow)
    production_date = db.Column(db.DateTime, nullable=False)
    expiration_date = db.Column(db.DateTime, nullable=False)
    quantity_imported = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    stock_quantity = db.Column(db.Integer, nullable=False)

class ClinicHours(db.Model):
    __tablename__ = 'clinic_hours'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    day_of_week = db.Column(db.Enum(DayOfWeekEnum), nullable=False)
    open_time = db.Column(db.Time, nullable=False)
    close_time = db.Column(db.Time, nullable=False)
    slot_duration_minutes = db.Column(db.Integer, nullable=False, default=30)

class DentistSchedule(db.Model):
    __tablename__ = 'dentist_schedule'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dentist_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)
    day_of_week = db.Column(db.Enum(DayOfWeekEnum), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    effective_from = db.Column(db.Date,nullable=True)

    dentist = db.relationship('User', back_populates='dentist_schedules')

class DentistCustomSchedule(db.Model):
    __tablename__ = 'dentist_custom_schedule'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dentist_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)
    custom_date = db.Column(db.Date, nullable=False)
    is_day_off = db.Column(db.Boolean, default=False)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    note = db.Column(db.String(255))

    dentist = db.relationship('User', back_populates='dentist_custom_schedules')

class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dentist_id = db.Column(db.BigInteger, db.ForeignKey('user.id'))
    patient_id = db.Column(db.BigInteger, db.ForeignKey('user.id'))

    patient_name = db.Column(db.String(255), nullable=True)
    patient_phone = db.Column(db.String(20), nullable=True)
    is_guest = db.Column(db.Boolean, default=False)

    date_of_birth = db.Column(db.Date, nullable=True)
    gender = db.Column(db.Enum(GenderEnum), nullable=True)

    appointment_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    note = db.Column(db.String(255))
    diagnosis = db.Column(db.Text)

    status = db.Column(
        db.Enum(AppointmentStatusEnum),
        default=AppointmentStatusEnum.PENDING
    )

    dentist = db.relationship('User', foreign_keys=[dentist_id], back_populates='dentist_appointments')
    patient = db.relationship('User', foreign_keys=[patient_id], back_populates='patient_appointments')
    treatments = db.relationship('TreatmentRecord', back_populates='appointment', lazy=True)
    prescriptions = db.relationship('Prescription', back_populates='appointment', lazy=True)
    invoice = db.relationship('Invoice', back_populates='appointment', uselist=False)

class UserBookingStats(db.Model):
    __tablename__ = 'user_booking_stats'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)
    cancel_count_day = db.Column(db.Integer, default=0)
    last_cancel_at = db.Column(db.DateTime,nullable=True)
    blocked_until = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', back_populates='booking_stats')

class Service(db.Model):
    __tablename__ = 'service'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.String(255))

    treatments = db.relationship('TreatmentRecord', back_populates='service', lazy=True)

class TreatmentRecord(db.Model):
    __tablename__ = 'treatment_record'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    appointment_id = db.Column(db.BigInteger, db.ForeignKey('appointments.id'))
    service_id = db.Column(db.BigInteger, db.ForeignKey('service.id'))
    price = db.Column(db.Numeric(10, 2))
    note = db.Column(db.String(255))

    appointment = db.relationship('Appointment', back_populates='treatments')
    service = db.relationship('Service', back_populates='treatments')

class Prescription(db.Model):
    __tablename__ = 'prescriptions'
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    appointment_id = db.Column(db.BigInteger, db.ForeignKey('appointments.id'))
    note = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Enum(PrescriptionStatusEnum), default=PrescriptionStatusEnum.DRAFT)

    details = db.relationship('PrescriptionDetail', back_populates='prescription')
    appointment = db.relationship('Appointment', back_populates='prescriptions')

class PrescriptionDetail(db.Model):
    __tablename__ = 'prescription_details'
    prescription_id = db.Column(db.BigInteger, db.ForeignKey('prescriptions.id'), primary_key=True)
    medicine_id = db.Column(db.BigInteger, db.ForeignKey('medicine.id'), primary_key=True)
    dosage = db.Column(db.Integer, nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    note = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2), nullable=False)

    prescription = db.relationship('Prescription', back_populates='details')
    medicine = db.relationship('Medicine', back_populates='details')

class Invoice(db.Model):
    __tablename__ = 'invoice'

    appointment_id = db.Column(db.BigInteger, db.ForeignKey('appointments.id'), primary_key=True)
    total_service_fee = db.Column(db.Numeric(10, 2), default=0)
    total_medicine_fee = db.Column(db.Numeric(10, 2), default=0)
    vat = db.Column(db.Numeric(10, 2), default=0)
    total = db.Column(db.Numeric(10, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    appointment = db.relationship('Appointment', back_populates='invoice', uselist=False)

class Post(db.Model):
    __tablename__ = 'post'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    img = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
