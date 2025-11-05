from app import db
from datetime import datetime


# ------------------------------
# 🔹 Bảng chuyên ngành (Specialization)
# ------------------------------
class Specialization(db.Model):
    __tablename__ = 'specialization'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))

    # Quan hệ 1-n với User và Appointment
    users = db.relationship('User', back_populates='specialization', lazy=True)
    appointments = db.relationship('Appointment', back_populates='specialization', lazy=True)


# ------------------------------
# 🔹 Bảng người dùng (User)
# ------------------------------
class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    specialization_id = db.Column(db.BigInteger, db.ForeignKey('specialization.id'))
    firstname = db.Column(db.String(100))
    lastname = db.Column(db.String(100))
    gender = db.Column(db.Enum('MALE', 'FEMALE', 'OTHER'))
    phone_number = db.Column(db.String(20))
    address = db.Column(db.String(255))
    username = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(255))
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    role = db.Column(db.Enum('ROLE_ADMIN', 'ROLE_DENTIST', 'ROLE_STAFF', 'ROLE_PATIENT'))
    status = db.Column(db.Enum('ACTIVE', 'INACTIVE'))

    # Quan hệ ngược lại
    specialization = db.relationship('Specialization', back_populates='users')
    dentist_appointments = db.relationship('Appointment', foreign_keys='Appointment.dentist_id', back_populates='dentist')
    patient_appointments = db.relationship('Appointment', foreign_keys='Appointment.patient_id', back_populates='patient')
    medicine_imports = db.relationship('MedicineImport', back_populates='user', lazy=True)


# ------------------------------
# 🔹 Bảng thuốc (Medicine)
# ------------------------------
class Medicine(db.Model):
    __tablename__ = 'medicine'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255))
    production_date = db.Column(db.DateTime)
    expiration_date = db.Column(db.DateTime)
    stock_quantity = db.Column(db.Integer)
    type = db.Column(db.Enum('PILL', 'CREAM', 'LIQUID', 'OTHER'))
    amount_per_unit = db.Column(db.Integer)
    retail_unit = db.Column(db.String(50))

    imports = db.relationship('MedicineImport', back_populates='medicine', lazy=True)
    prescriptions = db.relationship('Prescription', back_populates='medicine', lazy=True)


# ------------------------------
# 🔹 Bảng nhập thuốc (Medicine Import)
# ------------------------------
class MedicineImport(db.Model):
    __tablename__ = 'medicine_import'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('user.id'))
    medicine_id = db.Column(db.BigInteger, db.ForeignKey('medicine.id'))
    import_date = db.Column(db.DateTime, default=datetime.utcnow)
    quantity_imported = db.Column(db.Integer)
    price = db.Column(db.Numeric(10, 2))
    stock_quantity = db.Column(db.Integer)

    user = db.relationship('User', back_populates='medicine_imports')
    medicine = db.relationship('Medicine', back_populates='imports')


# ------------------------------
# 🔹 Bảng lịch hẹn (Appointments)
# ------------------------------
class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dentist_id = db.Column(db.BigInteger, db.ForeignKey('user.id'))
    patient_id = db.Column(db.BigInteger, db.ForeignKey('user.id'))
    appointment_date = db.Column(db.DateTime)
    appointment_time = db.Column(db.Time)
    note = db.Column(db.String(255))
    status = db.Column(db.Enum('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'))
    specialization_id = db.Column(db.BigInteger, db.ForeignKey('specialization.id'))

    dentist = db.relationship('User', foreign_keys=[dentist_id], back_populates='dentist_appointments')
    patient = db.relationship('User', foreign_keys=[patient_id], back_populates='patient_appointments')
    specialization = db.relationship('Specialization', back_populates='appointments')
    treatments = db.relationship('TreatmentRecord', back_populates='appointment', lazy=True)
    prescriptions = db.relationship('Prescription', back_populates='appointment', lazy=True)
    invoice = db.relationship('Invoice', back_populates='appointment', uselist=False)


# ------------------------------
# 🔹 Bảng dịch vụ (Service)
# ------------------------------
class Service(db.Model):
    __tablename__ = 'service'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2))
    description = db.Column(db.String(255))

    treatments = db.relationship('TreatmentRecord', back_populates='service', lazy=True)


# ------------------------------
# 🔹 Bảng hồ sơ điều trị (Treatment Record)
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
# 🔹 Bảng toa thuốc (Prescriptions)
# ------------------------------
class Prescription(db.Model):
    __tablename__ = 'prescriptions'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    appointment_id = db.Column(db.BigInteger, db.ForeignKey('appointments.id'))
    medicine_id = db.Column(db.BigInteger, db.ForeignKey('medicine.id'))
    dosage = db.Column(db.Integer)
    unit = db.Column(db.String(50))
    duration_days = db.Column(db.Integer)
    note = db.Column(db.String(255))
    price = db.Column(db.Numeric(10, 2))

    appointment = db.relationship('Appointment', back_populates='prescriptions')
    medicine = db.relationship('Medicine', back_populates='prescriptions')


# ------------------------------
# 🔹 Bảng hóa đơn (Invoice)
# ------------------------------
class Invoice(db.Model):
    __tablename__ = 'invoice'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    appointment_id = db.Column(db.BigInteger, db.ForeignKey('appointments.id'))
    total_service_fee = db.Column(db.Numeric(10, 2))
    total_medicine_fee = db.Column(db.Numeric(10, 2))
    vat = db.Column(db.Numeric(10, 2))
    total = db.Column(db.Numeric(10, 2))

    appointment = db.relationship('Appointment', back_populates='invoice')
