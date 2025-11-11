from flask import Blueprint
from flask_restx import Api, fields, reqparse
from flask_jwt_extended.exceptions import NoAuthorizationError
from werkzeug.datastructures import FileStorage
from app.models import GenderEnum, RoleEnum, StatusEnum, MedicineTypeEnum, AppointmentStatusEnum

# Tạo một Blueprint cho API. Blueprint này sẽ được đăng ký với ứng dụng Flask chính.
# url_prefix='/api' có nghĩa là tất cả các endpoint trong Blueprint này sẽ có tiền tố /api.
api_bp = Blueprint('api', __name__, url_prefix='/api')

api = Api(
    api_bp,
    version='1.0',
    title='API Phòng khám nha khoa',
    description='Quản lý API với tài liệu Swagger UI.',
    doc='/swagger-ui/' # Đường dẫn để truy cập Swagger UI (ví dụ: /api/swagger-ui/)
)

user_ns = api.namespace('users', description='Các thao tác liên quan đến người dùng')
auth_ns = api.namespace('auth', description='Các thao tác liên quan đến chứng thực người dùng')

# ------------------------------
# --- Định nghĩa Models cho Swagger UI ---
# Các model này mô tả cấu trúc dữ liệu cho response.
# Chúng giúp Swagger UI hiển thị ví dụ dữ liệu và validate input.
# ------------------------------

specialization_ref = api.model('SpecializationRef', {
    'id': fields.Integer(readOnly=True, description='Specialization id'),
    'name': fields.String(required=True, description='Specialization name'),
})

user_ref = api.model('UserRef', {
    'id': fields.Integer(readOnly=True, description='User id'),
    'firstname': fields.String(description='First name'),
    'lastname': fields.String(description='Last name'),
    'username': fields.String(description='Username'),
    'role': fields.String(description='Role', enum=[r.value for r in RoleEnum]),
})

medicine_ref = api.model('MedicineRef', {
    'id': fields.Integer(readOnly=True, description='Medicine id'),
    'name': fields.String(required=True, description='Medicine name'),
})

appointment_ref = api.model('AppointmentRef', {
    'id': fields.Integer(readOnly=True, description='Appointment id'),
    'appointment_date': fields.DateTime(description='Appointment date'),
    'appointment_time': fields.String(description='Appointment time'),
    'status': fields.String(description='Status', enum=[s.value for s in AppointmentStatusEnum])
})

# -- Full models --
SpecializationModel = api.model('Specialization', {
    'id': fields.Integer(readOnly=True, description='ID của chuyên ngành'),
    'name': fields.String(required=True, description='Tên chuyên ngành'),
    'description': fields.String(description='Mô tả'),
    # optionally show small list of users (refs)
    'users': fields.List(fields.Nested(user_ref), description='Danh sách người dùng (refs)'),
})

UserModel = api.model('User', {
    'id': fields.Integer(readOnly=True, description='ID người dùng'),
    'specialization': fields.Nested(specialization_ref, description='Chuyên ngành (nếu có)'),
    'firstname': fields.String(description='Tên'),
    'lastname': fields.String(description='Họ'),
    'gender': fields.String(description='Giới tính', enum=[g.value for g in GenderEnum]),
    'phone_number': fields.String(description='Số điện thoại'),
    'address': fields.String(description='Địa chỉ'),
    'username': fields.String(description='Tên đăng nhập'),
    'created_date': fields.DateTime(description='Ngày tạo'),
    'role': fields.String(description='Vai trò', enum=[r.value for r in RoleEnum]),
    'status': fields.String(description='Trạng thái', enum=[s.value for s in StatusEnum]),
})

MedicineModel = api.model('Medicine', {
    'id': fields.Integer(readOnly=True, description='ID thuốc'),
    'name': fields.String(required=True),
    'production_date': fields.DateTime(),
    'expiration_date': fields.DateTime(),
    'stock_quantity': fields.Integer(),
    'type': fields.String(description='Kiểu thuốc', enum=[t.value for t in MedicineTypeEnum]),
    'amount_per_unit': fields.Integer(),
    'retail_unit': fields.String(),
})

MedicineImportModel = api.model('MedicineImport', {
    'id': fields.Integer(readOnly=True),
    'user': fields.Nested(user_ref, description='Người nhập (ref)'),
    'medicine': fields.Nested(medicine_ref, description='Thuốc (ref)'),
    'import_date': fields.DateTime(),
    'quantity_imported': fields.Integer(),
    'price': fields.Float(),
    'stock_quantity': fields.Integer(),
})

AppointmentModel = api.model('Appointment', {
    'id': fields.Integer(readOnly=True),
    'dentist': fields.Nested(user_ref, description='Dentist (ref)'),
    'patient': fields.Nested(user_ref, description='Patient (ref)'),
    'appointment_date': fields.DateTime(),
    'appointment_time': fields.String(),
    'note': fields.String(),
    'status': fields.String(enum=[s.value for s in AppointmentStatusEnum]),
    'specialization': fields.Nested(specialization_ref),
})

ServiceModel = api.model('Service', {
    'id': fields.Integer(readOnly=True),
    'name': fields.String(required=True),
    'price': fields.Float(),
    'description': fields.String(),
})

TreatmentRecordModel = api.model('TreatmentRecord', {
    'id': fields.Integer(readOnly=True),
    'appointment': fields.Nested(appointment_ref),
    'service': fields.Nested(ServiceModel),
    'price': fields.Float(),
    'note': fields.String(),
})

PrescriptionModel = api.model('Prescription', {
    'id': fields.Integer(readOnly=True),
    'appointment': fields.Nested(appointment_ref),
    'medicine': fields.Nested(medicine_ref),
    'dosage': fields.Integer(),
    'unit': fields.String(),
    'duration_days': fields.Integer(),
    'note': fields.String(),
    'price': fields.Float(),
})

InvoiceModel = api.model('Invoice', {
    'id': fields.Integer(readOnly=True),
    'appointment': fields.Nested(appointment_ref),
    'total_service_fee': fields.Float(),
    'total_medicine_fee': fields.Float(),
    'vat': fields.Float(),
    'total': fields.Float(),
})


# ------------------------------
# --- Định nghĩa Parsers cho Swagger UI ---
# Parsers được sử dụng để định nghĩa các tham số đầu vào (query params, form data)
# và giúp Swagger UI hiển thị các trường nhập liệu tương ứng.
# ------------------------------

''' USER '''
user_creation_parser = reqparse.RequestParser()
user_creation_parser.add_argument('username', type=str, required=True, help='Tên người dùng là bắt buộc', location='form')
user_creation_parser.add_argument('phonenumber', type=str, required=True, help='Số điện thoại là bắt buộc', location='form')
user_creation_parser.add_argument('password', type=str, required=True, help='Password người dùng là bắt buộc', location='form')
user_creation_parser.add_argument('firstname', type=str, required=True, help='Tên người dùng là bắt buộc', location='form')
user_creation_parser.add_argument('lastname', type=str, required=True, help='Họ người dùng là bắt buộc', location='form')
user_creation_parser.add_argument('role', type=str, required=False, help='Quyền (không bắt buộc)', location='form')
user_creation_parser.add_argument('gender',type=str, required=True, help='Giới tính là bắt buộc', location='form')
user_creation_parser.add_argument('avatar', type=FileStorage, required=False, help='Ảnh (không bắt buộc)', location='files')

''' AUTH '''
auth_parser = reqparse.RequestParser()
auth_parser.add_argument('username', type=str, required=False, help='Tên người dùng')
auth_parser.add_argument('phonenumber', type=str, required=False, help='Tên người dùng')
auth_parser.add_argument('password', type=str, required=True, help='Mật khẩu')
