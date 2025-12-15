from app import db
from datetime import datetime, time, date
import enum

# ------------------------------
# 🔹 Enum Python
# ------------------------------
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
    OTHER = "OTHER"

class AppointmentStatusEnum(enum.Enum):
    PENDING = "PENDING"
    CONSULTING = "CONSULTING"
    PRESCRIPTION="PRESCRIPTION"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

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

# ------------------------------
# 🔹 Bảng chuyên ngành
# ------------------------------
class Specialization(db.Model):
    __tablename__ = 'specialization'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))

    users = db.relationship('User', back_populates='specialization', lazy=True)


# ------------------------------
# 🔹 Bảng người dùng
# ------------------------------
class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    specialization_id = db.Column(db.BigInteger, db.ForeignKey('specialization.id'))
    firstname = db.Column(db.String(100))
    lastname = db.Column(db.String(100))
    gender = db.Column(db.Enum(GenderEnum))
    phone_number = db.Column(db.String(20), unique=True)
    username = db.Column(db.String(100), unique=True)
    avatar = db.Column(db.String(255))
    password = db.Column(db.String(255))
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    role = db.Column(db.Enum(RoleEnum), default=RoleEnum.ROLE_PATIENT)
    status = db.Column(db.Enum(StatusEnum), default=StatusEnum.ACTIVE)

    specialization = db.relationship('Specialization', back_populates='users')
    dentist_appointments = db.relationship('Appointment', foreign_keys='Appointment.dentist_id', back_populates='dentist')
    patient_appointments = db.relationship('Appointment', foreign_keys='Appointment.patient_id', back_populates='patient')
    medicine_imports = db.relationship('MedicineImport', back_populates='user', lazy=True)

    dentist_schedules = db.relationship('DentistSchedule', back_populates='dentist', lazy=True)
    dentist_custom_schedules = db.relationship('DentistCustomSchedule', back_populates='dentist', lazy=True)
    dentist_profile = db.relationship('DentistProfile', back_populates='dentist', uselist=False)
    booking_stats = db.relationship('UserBookingStats', back_populates='user', uselist=False)


# ------------------------------
# 🔹 Bảng hồ sơ bác sĩ
# ------------------------------
class DentistProfile(db.Model):
    __tablename__ = 'dentist_profile'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dentist_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)

    introduction = db.Column(db.Text)
    education = db.Column(db.Text)
    experience = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    dentist = db.relationship('User', back_populates='dentist_profile')


# ------------------------------
# 🔹 Bảng thuốc
# ------------------------------
class Medicine(db.Model):
    __tablename__ = 'medicine'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255))
    reserved_quantity = db.Column(db.Integer)
    type = db.Column(db.Enum(MedicineTypeEnum))
    amount_per_unit = db.Column(db.Integer)
    retail_unit = db.Column(db.String(50))
    selling_price = db.Column(db.Numeric(10, 2))

    imports = db.relationship('MedicineImport', back_populates='medicine', lazy=True)
    details = db.relationship('PrescriptionDetail', back_populates='medicine', lazy=True)


# ------------------------------
# 🔹 Bảng nhập thuốc
# ------------------------------
class MedicineImport(db.Model):
    __tablename__ = 'medicine_import'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('user.id'))
    medicine_id = db.Column(db.BigInteger, db.ForeignKey('medicine.id'))
    import_date = db.Column(db.DateTime, default=datetime.utcnow)
    production_date = db.Column(db.DateTime)
    expiration_date = db.Column(db.DateTime)
    quantity_imported = db.Column(db.Integer)
    price = db.Column(db.Numeric(10, 2))
    stock_quantity = db.Column(db.Integer)

    user = db.relationship('User', back_populates='medicine_imports')
    medicine = db.relationship('Medicine', back_populates='imports')


# ------------------------------
# 🔹 Bảng lịch hoạt động chung của phòng khám
# ------------------------------
class ClinicHours(db.Model):
    __tablename__ = 'clinic_hours'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    day_of_week = db.Column(db.Enum(DayOfWeekEnum), nullable=False)
    open_time = db.Column(db.Time, nullable=False)
    close_time = db.Column(db.Time, nullable=False)
    slot_duration_minutes = db.Column(db.Integer, default=30)


# ------------------------------
# 🔹 Bảng lịch làm việc của bác sĩ
# ------------------------------
class DentistSchedule(db.Model):
    __tablename__ = 'dentist_schedule'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dentist_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)
    day_of_week = db.Column(db.Enum(DayOfWeekEnum), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

    effective_from = db.Column(db.Date,nullable=True)

    dentist = db.relationship('User', back_populates='dentist_schedules')


# ------------------------------
# 🔹 Bảng ngoại lệ — lịch cá nhân bác sĩ
# ------------------------------
class DentistCustomSchedule(db.Model):
    __tablename__ = 'dentist_custom_schedule'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dentist_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)
    custom_date = db.Column(db.Date, nullable=False)

    # TRUE → nghỉ nguyên ngày
    is_day_off = db.Column(db.Boolean, default=False)

    # Nếu không nghỉ nguyên ngày → có giờ bắt đầu/kết thúc
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)

    note = db.Column(db.String(255))

    dentist = db.relationship('User', back_populates='dentist_custom_schedules')



# ------------------------------
# 🔹 Bảng lịch hẹn
# ------------------------------
class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dentist_id = db.Column(db.BigInteger, db.ForeignKey('user.id'))
    patient_id = db.Column(db.BigInteger, db.ForeignKey('user.id'))
    appointment_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    note = db.Column(db.String(255))
    # diagnosis = db.Column(db.Text)
    status = db.Column(
        db.Enum(AppointmentStatusEnum),
        default=AppointmentStatusEnum.PENDING
    )

    dentist = db.relationship('User', foreign_keys=[dentist_id], back_populates='dentist_appointments')
    patient = db.relationship('User', foreign_keys=[patient_id], back_populates='patient_appointments')
    treatments = db.relationship('TreatmentRecord', back_populates='appointment', lazy=True)
    prescriptions = db.relationship('Prescription', back_populates='appointment', lazy=True)
    invoice = db.relationship('Invoice', back_populates='appointment', uselist=False)



# ------------------------------
# 🔹 Bảng tracking việc hủy đơn của khách hàng
# ------------------------------
class UserBookingStats(db.Model):
    __tablename__ = 'user_booking_stats'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)

    # số lần hủy trong ngày
    cancel_count_day = db.Column(db.Integer, default=0)

    # thời điểm hủy cuối cùng
    last_cancel_at = db.Column(db.DateTime,nullable=True)

    # nếu bị block → thời gian block theo giờ
    blocked_until = db.Column(db.DateTime, nullable=True)

    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', back_populates='booking_stats')



# ------------------------------
# 🔹 Bảng dịch vụ
# ------------------------------
class Service(db.Model):
    __tablename__ = 'service'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2))
    description = db.Column(db.String(255))

    treatments = db.relationship('TreatmentRecord', back_populates='service', lazy=True)


# ------------------------------
# 🔹 Bảng hồ sơ điều trị
# ------------------------------
class TreatmentRecord(db.Model):
    __tablename__ = 'treatment_record'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    appointment_id = db.Column(db.BigInteger, db.ForeignKey('appointments.id'))
    service_id = db.Column(db.BigInteger, db.ForeignKey('service.id'))
    price = db.Column(db.Numeric(10, 2))
    note = db.Column(db.String(255))

    appointment = db.relationship('Appointment', back_populates='treatments')
    service = db.relationship('Service', back_populates='treatments')


# ------------------------------
# 🔹 Bảng toa thuốc
# ------------------------------
class Prescription(db.Model):
    __tablename__ = 'prescriptions'
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    appointment_id = db.Column(db.BigInteger, db.ForeignKey('appointments.id'))
    note = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Enum(PrescriptionStatusEnum), default=PrescriptionStatusEnum.DRAFT)

    details = db.relationship('PrescriptionDetail', back_populates='prescription')
    appointment = db.relationship('Appointment', back_populates='prescriptions')


# ------------------------------
# 🔹 Bảng chi tiết toa thuốc
# ------------------------------
class PrescriptionDetail(db.Model):
    __tablename__ = 'prescription_details'
    prescription_id = db.Column(db.BigInteger, db.ForeignKey('prescriptions.id'), primary_key=True)
    medicine_id = db.Column(db.BigInteger, db.ForeignKey('medicine.id'), primary_key=True)
    dosage = db.Column(db.Integer)
    unit = db.Column(db.String(50))
    duration_days = db.Column(db.Integer)
    note = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2))

    prescription = db.relationship('Prescription', back_populates='details')
    medicine = db.relationship('Medicine', back_populates='details')

# ------------------------------
# 🔹 Bảng hóa đơn
# ------------------------------
class Invoice(db.Model):
    __tablename__ = 'invoice'

    appointment_id = db.Column(db.BigInteger, db.ForeignKey('appointments.id'), primary_key=True)
    total_service_fee = db.Column(db.Numeric(10, 2), default=0)
    total_medicine_fee = db.Column(db.Numeric(10, 2), default=0)
    vat = db.Column(db.Numeric(10, 2), default=0)
    total = db.Column(db.Numeric(10, 2), default=0)

    # Quan hệ 1-1 với Appointment
    appointment = db.relationship('Appointment', back_populates='invoice', uselist=False)


# ------------------------------
# 🔹 Bảng bài viết / blog nha khoa
# ------------------------------
class Post(db.Model):
    __tablename__ = 'post'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text)
    img = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
