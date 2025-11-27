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

auth_ns = api.namespace('auth', description='Các thao tác liên quan đến chứng thực người dùng')
user_ns = api.namespace('users', description='Các thao tác liên quan đến người dùng')
dentist_ns=api.namespace('dentists', description='Các thao tác liên quan đến bác sĩ')
appointment_ns=api.namespace('appointments', description='Các thao tác liên quan đến lịch hẹn')
clinic_hours_ns=api.namespace('clinic_hours', description='Các thao tác liên quan đến khung giờ phòng khám')
dentist_shedule_ns=api.namespace('dentist_schedules', description='Các thao tác liên quan đến lịch làm việc của bác sĩ')
service_ns=api.namespace('services', description='Các thao tác liên quan đến dịch vụ')
treatment_record_ns=api.namespace('treatment_records', description='Các thao tác liên quan đến hồ sơ điều trị')
dentist_profile_ns=api.namespace('dentist_profiles', description='Các thao tác liên quan đến hồ sơ bác sĩ')
dentist_custom_shedule_ns=api.namespace('dentist_custom_schedules', description='Các thao tác liên quan đến lịch làm việc tùy chỉnh của bác sĩ')

# ------------------------------
# --- Định nghĩa Models cho Swagger UI ---
# Các model này mô tả cấu trúc dữ liệu cho response.
# Chúng giúp Swagger UI hiển thị ví dụ dữ liệu và validate input.
# ------------------------------


specialization_model = api.model('Specialization', {
    'id': fields.Integer(readOnly=True, description='ID chuyên ngành'),
    'name': fields.String(required=True, description='Tên chuyên ngành'),
    'description': fields.String(description='Mô tả chuyên ngành')
})

user_model = api.model('User', {
    'id': fields.Integer(readOnly=True, description='ID người dùng'),
    'specialization_id': fields.Integer(description='ID chuyên ngành nếu là bác sĩ'),
    'firstname': fields.String(required=True, description='Tên'),
    'lastname': fields.String(required=True, description='Họ'),
    'gender': fields.String(enum=[e.value for e in GenderEnum], description='Giới tính'),
    'phone_number': fields.String(description='Số điện thoại'),
    'address': fields.String(description='Địa chỉ'),
    'username': fields.String(description='Tên đăng nhập'),
    'avatar': fields.String(description='URL avatar'),
    'role': fields.String(enum=[e.value for e in RoleEnum], description='Quyền người dùng'),
    'status': fields.String(enum=[e.value for e in StatusEnum], description='Trạng thái'),
    'created_date': fields.DateTime(description='Ngày tạo')
})

dentist_model = api.model('Dentist', {
    'id': fields.Integer(readOnly=True, description='ID người dùng'),
    'firstname': fields.String(required=True, description='Tên'),
    'lastname': fields.String(required=True, description='Họ'),
    'gender': fields.String(enum=[e.value for e in GenderEnum], description='Giới tính'),
    'avatar': fields.String(description='URL avatar')
})

medicine_model = api.model('Medicine', {
    'id': fields.Integer(readOnly=True, description='ID thuốc'),
    'name': fields.String(required=True, description='Tên thuốc'),
    'production_date': fields.DateTime(description='Ngày sản xuất'),
    'expiration_date': fields.DateTime(description='Hạn sử dụng'),
    'stock_quantity': fields.Integer(description='Số lượng tồn kho'),
    'type': fields.String(enum=[e.value for e in MedicineTypeEnum], description='Loại thuốc'),
    'amount_per_unit': fields.Integer(description='Số lượng trên 1 đơn vị'),
    'retail_unit': fields.String(description='Đơn vị bán lẻ')
})

clinic_hours_model = api.model('ClinicHours', {
    'id': fields.Integer(readOnly=True, description='ID khung giờ phòng khám'),
    'day_of_week': fields.String(required=True,description='Ngày trong tuần'
    ),
    'open_time': fields.String(required=True, description='Giờ mở cửa (HH:MM:SS)'),
    'close_time': fields.String(required=True, description='Giờ đóng cửa (HH:MM:SS)'),
    'slot_duration_minutes': fields.Integer(description='Thời lượng mỗi slot (phút)')
})

dentist_schedule_input = api.model('DentistScheduleInput', {
    'start_time': fields.String(required=True, description='Giờ bắt đầu HH:MM:SS'),
    'end_time': fields.String(required=True, description='Giờ kết thúc HH:MM:SS')
})

multiple_schedule_model = api.model('MultipleDentistSchedules', {
    'dentist_id': fields.Integer(required=True, description='ID bác sĩ'),
    'day_of_week': fields.String(required=True, description='Ngày trong tuần'),
    'schedules': fields.List(
        fields.Nested(dentist_schedule_input),
        required=True,
        description='Danh sách lịch làm việc'
    )
})

dentist_shedule_model = api.model('DentistSchedule', {
    'id': fields.Integer(readOnly=True, description='ID lịch làm việc của bác sĩ'),
    'dentist_id': fields.Integer(description='ID bác sĩ'),
    'day_of_week': fields.String(description='Ngày trong tuần'),
    'start_time': fields.String(description='Giờ bắt đầu (HH:MM:SS)'),
    'end_time': fields.String(description='Giờ kết thúc (HH:MM:SS)')
})


appointment_model = api.model('Appointment', {
    'id': fields.Integer(readOnly=True, description='ID lịch hẹn'),
    'dentist_id': fields.Integer(description='ID bác sĩ'),
    'patient_id': fields.Integer(description='ID bệnh nhân'),
    'appointment_date': fields.Date(description='Ngày hẹn'),
    'start_time': fields.String(description='Thời gian bắt đầu HH:MM:SS'),
    'end_time': fields.String(description='Thời gian kết thúc HH:MM:SS'),
    'note': fields.String(description='Ghi chú'),
    'status': fields.String(enum=[e.value for e in AppointmentStatusEnum], description='Trạng thái')
})

prescription_model = api.model('Prescription', {
    'id': fields.Integer(readOnly=True, description='ID toa thuốc'),
    'appointment_id': fields.Integer(description='ID lịch hẹn'),
    'medicine_id': fields.Integer(description='ID thuốc'),
    'dosage': fields.Integer(description='Liều lượng'),
    'unit': fields.String(description='Đơn vị'),
    'duration_days': fields.Integer(description='Số ngày dùng'),
    'note': fields.String(description='Ghi chú'),
    'price': fields.Float(description='Giá')
})

invoice_model = api.model('Invoice', {
    'id': fields.Integer(readOnly=True, description='ID hóa đơn'),
    'appointment_id': fields.Integer(description='ID lịch hẹn'),
    'total_service_fee': fields.Float(description='Tổng phí dịch vụ'),
    'total_medicine_fee': fields.Float(description='Tổng phí thuốc'),
    'vat': fields.Float(description='VAT'),
    'total': fields.Float(description='Tổng cộng')
})

service_model = api.model('Service', {
    'id': fields.Integer(readOnly=True, description='ID dịch vụ'),
    'name': fields.String(required=True, description='Tên dịch vụ'),
    'price': fields.Float(description='Giá dịch vụ'),
    'description': fields.String(description='Mô tả dịch vụ')
})

treatment_record_model = api.model('TreatmentRecord', {
    'id': fields.Integer(readOnly=True, description='ID hồ sơ điều trị'),
    'appointment_id': fields.Integer(required=True, description='ID lịch hẹn'),
    'service_id': fields.Integer(required=True, description='ID dịch vụ'),
    'price': fields.Float(description='Giá dịch vụ'),
    'note': fields.String(description='Ghi chú')
})

# Model cho input (tạo treatment record)
treatment_record_input_model = api.model('TreatmentRecordInput', {
    'service_id': fields.Integer(required=True, description='ID dịch vụ'),
    'price': fields.Float(required=False, description='Giá dịch vụ (để trống sẽ lấy từ Service)'),
    'note': fields.String(required=False, description='Ghi chú')
})

# Model cho request tạo nhiều treatment records
treatment_records_create_model = api.model('TreatmentRecordsCreate', {
    'appointment_id': fields.Integer(required=True, description='ID lịch hẹn'),
    'services': fields.List(
        fields.Nested(treatment_record_input_model), 
        required=True, 
        description='Danh sách dịch vụ'
    )
})

#Model cho hồ sơ bác sĩ
dentist_profile_model = api.model('DentistProfile', {
    'id': fields.Integer(readOnly=True, description='ID hồ sơ bác sĩ'),
    'dentist_id': fields.Integer(description='ID người dùng (bác sĩ)'),
    'introduction': fields.String(description='Tiểu sử'),
    'education': fields.String(description='Giáo dục'),
    'experience': fields.String(description='Số năm kinh nghiệm')
})

#Model cho lịch làm việc đột xuất/nghỉ
dentist_custom_schedule_input_model=api.model('DentistCustomSchedule',{
    'start_time': fields.String(required=True, description='Giờ bắt đầu HH:MM:SS'),
    'end_time': fields.String(required=True, description='Giờ kết thúc HH:MM:SS')
})

multiple_dentist_custom_schedule_model = api.model('MultipleDentistCustomSchedule', {
    'dentist_id': fields.Integer(description='ID bác sĩ'),
    'custom_date': fields.Date(description='Ngày tùy chỉnh'),
    'is_day_off': fields.Boolean(description='Có phải ngày nghỉ không'),
    'note': fields.String(description='Ghi chú'),
    'schedules':fields.List(
        fields.Nested(dentist_custom_schedule_input_model),
        required=False,
        description='Danh sách thời gian'
    )
})

dentist_custom_schedule_model=api.model('DentistCustomSchedule',{
    'dentist_id': fields.Integer(description='ID bác sĩ'),
    'custom_date': fields.Date(description='Ngày tùy chỉnh'),
    'is_day_off': fields.Boolean(description='Có phải ngày nghỉ không'),
    'start_time': fields.String(description='Giờ bắt đầu (HH:MM:SS)'),
    'end_time': fields.String(description='Giờ kết thúc (HH:MM:SS)'),
    'note': fields.String(description='Ghi chú'),
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
auth_parser.add_argument('account_identifier', type=str, required=True, help='Tên người dùng hoặc số điện thoại')
auth_parser.add_argument('password', type=str, required=True, help='Mật khẩu')

''' APPOINMENT '''
appointment_creation_parser = reqparse.RequestParser()
appointment_creation_parser.add_argument('dentist_id', type=int, required=True, help='Id bác sĩ')
appointment_creation_parser.add_argument('patient_id', type=int, required=True, help='Id bệnh nhân')
appointment_creation_parser.add_argument('appointment_date', type=str, required=True, help='Ngày khám (YYYY-MM-DD)')
appointment_creation_parser.add_argument('start_time', type=str, required=True, help='Giờ bắt đầu (HH:MM:SS)')
appointment_creation_parser.add_argument('end_time', type=str, required=True, help='Giờ kết thúc (HH:MM:SS)')
appointment_creation_parser.add_argument('note', type=str, required=False, help='Ghi chú')


''' CLINIC HOURS '''
clinic_hours_parser = reqparse.RequestParser()
clinic_hours_parser.add_argument('day_of_week', type=str, required=True, help='Ngày trong tuần')
clinic_hours_parser.add_argument('open_time', type=str, required=True, help='Giờ mở cửa (HH:MM:SS)')
clinic_hours_parser.add_argument('close_time', type=str, required=True, help='Giờ đóng cửa (HH:MM:SS)')
clinic_hours_parser.add_argument('slot_duration_minutes', type=str, required=True, help='Thời lượng mỗi slot (phút)')

''' DENTIST SCHEDULE '''
dentist_shedule_parser = reqparse.RequestParser()
dentist_shedule_parser.add_argument('dentist_id', type=int, required=True, help='Id bác sĩ')
dentist_shedule_parser.add_argument('day_of_week', type=str, required=True, help='Ngày trong tuần')
dentist_shedule_parser.add_argument('start_time', type=str, required=True, help='Giờ bắt đầu (HH:MM:SS)')
dentist_shedule_parser.add_argument('end_time', type=str, required=True, help='Giờ kết thúc (HH:MM:SS)')

''' SERVICE '''
service_parser = reqparse.RequestParser()
service_parser.add_argument('name', type=str, required=True, help='Tên dịch vụ')
service_parser.add_argument('price', type=float, required=True, help='Giá dịch vụ')
service_parser.add_argument('description', type=str, required=True, help='Mô tả dịch vụ')

''' DENTIST PROFILE '''
dentist_profile_parser = reqparse.RequestParser()
dentist_profile_parser.add_argument('user_id', type=int, required=True, help='ID người dùng (bác sĩ)')
dentist_profile_parser.add_argument('introduction', type=str, required=False, help='Tiểu sử')
dentist_profile_parser.add_argument('education', type=str, required=False, help='Bằng cấp')
dentist_profile_parser.add_argument('experience', type=str, required=False, help='Kinh nghiệm làm việc')

''' DENTIST CUSTOM SCHEDULE '''
dentist_custom_schedule_parser = reqparse.RequestParser()
dentist_custom_schedule_parser.add_argument('dentist_id', type=int, required=True, help='ID bác sĩ')
dentist_custom_schedule_parser.add_argument('custom_date', type=str, required=True, help='Ngày tùy chỉnh (YYYY-MM-DD)')
dentist_custom_schedule_parser.add_argument('start_time', type=str, required=False, help='Giờ bắt đầu (HH:MM:SS)')
dentist_custom_schedule_parser.add_argument('end_time', type=str, required=False, help='Giờ kết thúc (HH:MM:SS)')
dentist_custom_schedule_parser.add_argument('note', type=str, required=False, help='Ghi chú')
