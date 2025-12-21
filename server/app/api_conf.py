from flask import Blueprint
from flask_restx import Api, fields, reqparse
from flask_jwt_extended.exceptions import NoAuthorizationError
from werkzeug.datastructures import FileStorage
from app.models import GenderEnum, RoleEnum, StatusEnum, MedicineTypeEnum, AppointmentStatusEnum, PrescriptionStatusEnum

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
medicine_ns=api.namespace('medicines', description='Các thao tác liên quan đến thuốc')
medicine_import_ns=api.namespace('medicines_import', description='Các thao tác liên quan đến nhập thuốc')
prescription_ns=api.namespace('prescription', description='Các thao tác liên quan đến kê toa thuốc')
post_ns=api.namespace('post',description='Các thao tác liên quan đến bài viết/blog của nha khoa')
invoice_ns=api.namespace('invoice', description='Các thao tác liên quan đến hóa đơn')
user_booking_stat_ns=api.namespace('user_booking_stat', description='Các thao tác liên quan đến thông số đặt lịch')
stats_ns = api.namespace('stats', description='Statistics APIs')

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
    'reserved_quantity': fields.Integer(description='Số lượng trừ tạm'),
    'type': fields.String(enum=[e.value for e in MedicineTypeEnum], description='Loại thuốc'),
    'amount_per_unit': fields.Integer(description='Số lượng trên 1 đơn vị'),
    'retail_unit': fields.String(description='Đơn vị bán lẻ'),
    'selling_price': fields.Float(required=True, description='Giá bán'),
    'total_stock': fields.Integer,
})

medicine_import_model = api.model('MedicineImport', {
    'id': fields.Integer(readOnly=True, description='ID bản ghi nhập thuốc'),
    'user_id': fields.Integer(required=True, description='ID nhân viên nhập thuốc'),
    'medicine_id': fields.Integer(required=True, description='ID thuốc được nhập'),
    'import_date': fields.DateTime(description='Ngày nhập thuốc'),
    'production_date': fields.DateTime(description='Ngày sản xuất'),
    'expiration_date': fields.DateTime(description='Hạn sử dụng'),
    'quantity_imported': fields.Integer(required=True, description='Số lượng nhập'),
    'price': fields.Float(required=True, description='Giá nhập lô thuốc'),
    'stock_quantity': fields.Integer(description='Tồn kho sau khi nhập')
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
    'end_time': fields.String(description='Giờ kết thúc (HH:MM:SS)'),
    'effective_from':fields.String(description='Ngày hiệu lực')
})

appointment_model = api.model('Appointment', {
    'id': fields.Integer(readOnly=True, description='ID lịch hẹn'),
    'dentist_id': fields.Integer(description='ID bác sĩ'),
    'patient_id': fields.Integer(description='ID bệnh nhân'),
    'appointment_date': fields.Date(description='Ngày hẹn'),
    'start_time': fields.String(description='Thời gian bắt đầu HH:MM:SS'),
    'end_time': fields.String(description='Thời gian kết thúc HH:MM:SS'),
    'note': fields.String(description='Ghi chú'),
    'diagnosis':fields.String(description='Chuẩn đoán'),
    'status': fields.String(enum=[e.value for e in AppointmentStatusEnum], description='Trạng thái'),
})

# Thêm model cho patient info trong appointment
appointment_with_user_model = api.model('AppointmentWithPatient', {
    'id': fields.Integer(readOnly=True, description='ID lịch hẹn'),
    'dentist_id': fields.Integer(description='ID bác sĩ'),
    'patient_id': fields.Integer(description='ID bệnh nhân'),
    'patient_name' : fields.String(description='Tên bênh nhân mới'),
    'patient_phone': fields.String(description='Số điện thoại bệnh nhân mới'),
    'is_guest': fields.Boolean(description='Biến check xem có phải bệnh nhân mới'),
    'gender': fields.String(description='Giới tính bệnh nhân mới'),
    'date_of_birth': fields.String(description='Ngày sinh của bệnh nhân mới'),
    'appointment_date': fields.Date(description='Ngày hẹn'),
    'start_time': fields.String(description='Thời gian bắt đầu HH:MM:SS'),
    'end_time': fields.String(description='Thời gian kết thúc HH:MM:SS'),
    'note': fields.String(description='Ghi chú'),
    'diagnosis':fields.String(description='Chuẩn đoán'),
    'status': fields.String(enum=[e.value for e in AppointmentStatusEnum], description='Trạng thái'),
    'user': fields.Nested(api.model('PatientBasicInfo', {
        'id': fields.Integer(description='ID bệnh nhân'),
        'firstname': fields.String(description='Tên'),
        'lastname': fields.String(description='Họ'),
        'gender': fields.String(description='Giới tính'),
        'phone_number': fields.String(description='Số điện thoại')
    }))
})


prescription_model = api.model('Prescription', {
    'id': fields.Integer(readOnly=True, description='ID toa thuốc'),
    'appointment_id': fields.Integer(description='ID lịch hẹn'),
    'note': fields.String(description='Ghi chú toa thuốc'),
    'created_at': fields.DateTime(description='Ngày tạo toa thuốc'),
    'status': fields.String(enum=[e.value for e in PrescriptionStatusEnum], description='Trạng thái')
})

prescription_detail_model = api.model('PrescriptionDetail', {
    'prescription_id': fields.Integer(required=True),
    'medicine_id': fields.Integer(required=True),
    'medicine_name': fields.String(attribute='medicine.name'),  # chỉ lấy name
    'dosage': fields.Integer(required=True),
    'unit': fields.String(required=True),
    'duration_days': fields.Integer(required=True),
    'note': fields.String,
    'price': fields.Float(required=True)
})

invoice_model = api.model('Invoice', {
    'appointment_id': fields.Integer(readOnly=True, description='ID lịch hẹn'),
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

post_model = api.model('Post', {
    'id': fields.Integer(readOnly=True, description='ID bài viết'),
    'title': fields.String(required=True, description='Tiêu đề bài viết'),
    'content': fields.String(description='Nội dung bài viết'),
    'img': fields.String(description='URL ảnh'),
    'created_at': fields.DateTime(description='Ngày tạo'),
    'updated_at': fields.DateTime(description='Ngày cập nhật'),
})

user_booking_stat_model=api.model('UserBookingStat',{
    'id': fields.Integer(readOnly=True, description='ID bảng thông số'),
    'cancel_count_day': fields.Integer(description='Số lần hủy 1 ngày'),
    'last_cancel_at': fields.String(description='Thời gian của lần hủy gần nhất'),
    'blocked_until': fields.String(description='Thời gian cấm')
})

pagination_model = dentist_ns.model("Pagination", {
    "page": fields.Integer,
    "per_page": fields.Integer,
    "total": fields.Integer,
    "total_pages": fields.Integer,
})

dentist_response_model = dentist_ns.model("DentistResponse", {
    "data": fields.List(fields.Nested(dentist_model)),
    "pagination": fields.Nested(pagination_model)
})

patient_appointment_pagination_res_model = appointment_ns.model("AppointmentResponse", {
    "data": fields.List(fields.Nested(appointment_with_user_model)),
    "pagination": fields.Nested(pagination_model)
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

appointment_creation_parser.add_argument('dentist_id', type=int, required=True)
appointment_creation_parser.add_argument('appointment_date', type=str, required=True)
appointment_creation_parser.add_argument('start_time', type=str, required=True)
appointment_creation_parser.add_argument('end_time', type=str, required=True)
appointment_creation_parser.add_argument('patient_id', type=int, required=False)
appointment_creation_parser.add_argument('patient_name', type=str, required=False)
appointment_creation_parser.add_argument('patient_phone', type=str, required=False)
appointment_creation_parser.add_argument('date_of_birth', type=str, required=False)
appointment_creation_parser.add_argument('gender', type=str, required=False)

appointment_creation_parser.add_argument('note', type=str, required=False)


''' APPOINTMENT UPDATE '''
appointment_update_parser = reqparse.RequestParser()
appointment_update_parser.add_argument('appointment_date', type=str, required=False, help='Ngày khám (YYYY-MM-DD)')
appointment_update_parser.add_argument('start_time', type=str, required=False, help='Giờ bắt đầu (HH:MM:SS)')
appointment_update_parser.add_argument('end_time', type=str, required=False, help='Giờ kết thúc (HH:MM:SS)')
appointment_update_parser.add_argument('note', type=str, required=False, help='Ghi chú')
appointment_update_parser.add_argument('status',type=str,required=False,help='Trạng thái')
appointment_update_parser.add_argument('diagnosis',type=str,required=False,help='Chuẩn đoán bác sĩ')


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

''' MEDICINE '''
medicine_parser = reqparse.RequestParser()
medicine_parser.add_argument('name', type=str, required=True, help='Tên thuốc')
medicine_parser.add_argument('type', type=str, required=True, choices=['PILL', 'CREAM', 'LIQUID', 'OTHER'], help='Loại thuốc')
medicine_parser.add_argument('amount_per_unit', type=int, required=True, help='Số lượng trên 1 đơn vị')
medicine_parser.add_argument('retail_unit', type=str, required=True, help='Đơn vị bán lẻ')
medicine_parser.add_argument('selling_price', type=int, required=True, help='Giá bán')

''' MEDICINE IMPORT '''
medicine_import_parser = reqparse.RequestParser()
medicine_import_parser.add_argument('user_id', type=int, required=True, help='ID nhân viên nhập thuốc')
medicine_import_parser.add_argument('medicine_id', type=int, required=True, help='ID thuốc được nhập')
medicine_import_parser.add_argument('quantity_imported', type=int, required=True, help='Số lượng nhập')
medicine_import_parser.add_argument('import_date', type=str, required=False, help='Ngày nhập')
medicine_import_parser.add_argument('production_date', type=str, required=True, help='Ngày sản xuất (YYYY-MM-DD)')
medicine_import_parser.add_argument('expiration_date', type=str, required=True, help='Hạn sử dụng (YYYY-MM-DD)')
medicine_import_parser.add_argument('price', type=float, required=True, help='Giá nhập lô thuốc')

''' PRESCRIPTION '''
prescription_parser = reqparse.RequestParser()
prescription_parser.add_argument('appointment_id', type=int, required=True, location='json', help='Appointment ID')
prescription_parser.add_argument('note', type=str, required=False, location='json')
prescription_parser.add_argument('status', type=str, required=True, help='Trạng thái toa thuốc')

''' PRESCRIPTION DETAILS '''
prescription_detail_parser = reqparse.RequestParser()
prescription_detail_parser.add_argument('medicine_id', type=int, required=True, help='ID thuốc trong toa')
prescription_detail_parser.add_argument('dosage', type=int, required=True, help='Liều lượng dùng mỗi lần')
prescription_detail_parser.add_argument('unit', type=str, required=True, help='Đơn vị liều lượng (viên, ml, g...)')
prescription_detail_parser.add_argument('duration_days', type=int, required=True, help='Số ngày dùng thuốc')
prescription_detail_parser.add_argument('note', type=str, required=False, help='Ghi chú thêm (nếu có)')
prescription_detail_parser.add_argument('price', type=float, required=True, help='Giá thuốc trong toa')

''' POST CREATION PARSER '''
post_creation_parser = reqparse.RequestParser()
post_creation_parser.add_argument('title', type=str, required=True, help='Tiêu đề bài viết', location='form')
post_creation_parser.add_argument('content', type=str, required=False, help='Nội dung bài viết', location='form')
post_creation_parser.add_argument('img', type=FileStorage, required=True, action='append', location='files', help='Danh sách ảnh')

''' INVOICE '''
invoice_parser = reqparse.RequestParser()
invoice_parser.add_argument('appointment_id', type=int, required=True, help='ID của lịch hẹn')
