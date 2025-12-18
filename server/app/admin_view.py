import enum
import json

import bcrypt
import cloudinary
from flask import flash
from flask_admin.contrib.sqla import ModelView
from markupsafe import Markup
from wtforms import MultipleFileField, SelectField, PasswordField
from app.extensions import db
from app.models import User, Medicine, ClinicHours, GenderEnum, RoleEnum, StatusEnum, MedicineTypeEnum, DayOfWeekEnum, \
    MedicineImport, Service, DentistProfile, Post
from werkzeug.security import generate_password_hash, check_password_hash

class UserView(ModelView):
    can_view_details = True
    column_display_pk = True
    can_delete = False
    column_filters = ['firstname', 'lastname', 'username']
    column_searchable_list = ['firstname', 'lastname', 'username']

    form_choices = {
        'gender': [
            ('MALE', 'Nam'),
            ('FEMALE', 'Nữ'),
            ('OTHER', 'Khác'),
        ],
        'role': [
            ('ROLE_ADMIN', 'Quản trị viên'),
            ('ROLE_DENTIST', 'Nha sĩ'),
            ('ROLE_STAFF', 'Nhân viên'),
            ('ROLE_PATIENT', 'Bệnh nhân'),
        ],
        'status': [
            ('ACTIVE', 'Hoạt động'),
            ('INACTIVE', 'Ngừng hoạt động'),
        ],
    }

    column_exclude_list = ['avatar', 'password']
    column_labels = {
        'id': 'Mã',
        'firstname': 'Họ',
        'lastname': 'Tên',
        'gender': 'Giới tính',
        'phone_number': 'Số điện thoại',
        'username': 'Tên đăng nhập',
        'created_date': 'Ngày tạo',
        'role': 'Vai trò',
        'status': 'Trạng thái',
    }

    # Các field chung
    common_fields = ('firstname', 'lastname', 'gender', 'username', 'phone_number', 'role', 'status')

    # Create form: có thêm password
    form_create_rules = common_fields + ('password',)

    # Edit form: KHÔNG có password
    form_edit_rules = common_fields

    # Xóa form_columns và form_overrides liên quan đến password
    # Không cần nữa vì rules sẽ quyết định field nào hiển thị

    def on_model_change(self, form, model, is_created):
        if is_created:
            # Chỉ hash khi tạo mới và có nhập password
            if form.password.data:
                model.password = bcrypt.hashpw(model.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        # Khi edit: không làm gì với password → giữ nguyên giá trị cũ trong DB
        return super().on_model_change(form, model, is_created)

    # Không cần on_form_prefill nữa vì password không xuất hiện ở edit

    def on_form_prefill(self, form, id):
        """Tự động điền giá trị enum khi edit"""
        user = self.session.get(self.model, id)
        if user:
            if user.gender:
                form.gender.data = user.gender.name
            if user.role:
                form.role.data = user.role.name
            if user.status:
                form.status.data = user.status.name

class DentistProfileView(ModelView):
    can_view_details = True
    edit_modal = True
    column_list = ('dentist', 'education', 'experience', 'created_at')
    form_columns = ('dentist', 'introduction', 'education', 'experience')
    form_ajax_refs = {
        'dentist': {'fields': (User.firstname, User.lastname)}
    }
    column_labels = {
        'dentist': 'Bác sĩ',
        'introduction': 'Giới thiệu',
        'education': 'Học vấn',
        'experience': 'Kinh nghiệm',
        'created_at': 'Ngày tạo',
        'updated_at': 'Cập nhật lần cuối',
    }

class MedicineView(ModelView):
    column_display_pk = True
    can_view_details = True
    edit_modal = True
    create_modal = True
    can_delete = False
    form_excluded_columns = ('imports', 'details')
    column_labels = {
        'id': 'Mã',
        'name': 'Tên thuốc',
        'reserved_quantity': 'Số lượng tạm giữ',
        'type': 'Loại thuốc',
        'amount_per_unit': 'Đơn vị',
        'retail_unit': 'Đơn vị bán lẻ',
        'selling_price': 'Giá bán (VNĐ)',
    }
    form_choices = {
        'type': [
            ('PILL', 'Viên uống'),
            ('CREAM', 'Kem bôi'),
            ('LIQUID', 'Dung dịch'),
            ('OTHER', 'Khác'),
        ]
    }
    column_formatters = {
        'type': lambda v, c, m, p: {
            'PILL': 'Viên uống',
            'CREAM': 'Kem bôi',
            'LIQUID': 'Dung dịch',
            'OTHER': 'Khác'
        }.get(m.type.value if isinstance(m.type, enum.Enum) else m.type, 'Không xác định')
    }

class MedicineImportView(ModelView):
    can_view_details = True

    # 🔹 Hiển thị cột trong danh sách
    column_list = (
        'medicine', 'import_date', 'production_date',
        'expiration_date', 'quantity_imported', 'price', 'stock_quantity'
    )
    column_labels = {
        'medicine': 'Thuốc',
        'import_date': 'Ngày nhập',
        'production_date': 'Ngày sản xuất',
        'expiration_date': 'Hạn sử dụng',
        'quantity_imported': 'Số lượng nhập',
        'price': 'Giá nhập (VNĐ)',
        'stock_quantity': 'Số lượng còn lại',
    }
    form_columns = (
        'medicine', 'import_date', 'production_date', 'expiration_date',
        'quantity_imported', 'price', 'stock_quantity'
    )
    form_ajax_refs = {
        'medicine': {'fields': (Medicine.name,)}
    }


class ClinicHoursView(ModelView):
    can_view_details = True
    column_list = ('day_of_week', 'open_time', 'close_time', 'slot_duration_minutes')
    column_labels = {
        'day_of_week': 'Ngày trong tuần',
        'open_time': 'Giờ mở cửa',
        'close_time': 'Giờ đóng cửa',
        'slot_duration_minutes': 'Thời lượng mỗi khung (phút)',
    }
    form_choices = {
        'day_of_week': [
            ('MONDAY', 'Thứ Hai'),
            ('TUESDAY', 'Thứ Ba'),
            ('WEDNESDAY', 'Thứ Tư'),
            ('THURSDAY', 'Thứ Năm'),
            ('FRIDAY', 'Thứ Sáu'),
            ('SATURDAY', 'Thứ Bảy'),
            ('SUNDAY', 'Chủ Nhật'),
        ]
    }
    column_formatters = {
        'day_of_week': lambda v, c, m, p: {
            'MONDAY': 'Thứ Hai',
            'TUESDAY': 'Thứ Ba',
            'WEDNESDAY': 'Thứ Tư',
            'THURSDAY': 'Thứ Năm',
            'FRIDAY': 'Thứ Sáu',
            'SATURDAY': 'Thứ Bảy',
            'SUNDAY': 'Chủ Nhật'
        }.get(m.day_of_week.value if isinstance(m.day_of_week, enum.Enum) else m.day_of_week, 'Không xác định')
    }

class ServiceView(ModelView):
    can_view_details = True
    can_delete = False
    column_list = ('id', 'name', 'price', 'description')
    column_display_pk = True
    column_labels = {
        'id': 'Mã',
        'name': 'Tên dịch vụ',
        'price': 'Giá (VNĐ)',
        'description': 'Mô tả dịch vụ',
    }

class PostView(ModelView):
    can_view_details = True
    create_modal = True
    edit_modal = True
    can_delete = False
    column_list = ('id', 'title', 'img', 'created_at', 'updated_at')
    column_display_pk = True
    column_labels = {
        'id': 'Mã',
        'title': 'Tiêu đề',
        'content': 'Nội dung',
        'img': 'Hình ảnh',
        'created_at': 'Ngày tạo',
        'updated_at': 'Cập nhật lần cuối',
    }
    form_overrides = {
        'img': MultipleFileField
    }

    form_columns = ('title', 'content', 'img')
    column_formatters = {
        'img': lambda v, c, m, p: Markup(
            ''.join(
                f'<img src="{url}" width="100" style="margin-right:5px">'
                for url in (json.loads(m.img) if m.img else [])
            )
        )
    }

    def _upload_many_to_cloudinary(self, file_list):
        """Upload nhiều file lên Cloudinary và trả về danh sách URL"""
        uploaded_urls = []
        for file in file_list:
            if file and hasattr(file, 'filename'):
                try:
                    result = cloudinary.uploader.upload(file)
                    uploaded_urls.append(result.get('secure_url'))
                except Exception as e:
                    flash(f'Lỗi upload Cloudinary: {e}', 'error')
        return uploaded_urls

    def on_model_change(self, form, model, is_created):
        """Khi admin nhấn Lưu"""
        files = form.img.data
        if files:
            urls = self._upload_many_to_cloudinary(files)
            if urls:
                model.img = json.dumps(urls)  # lưu dạng JSON chuỗi

def init_admin(admin):
    admin.add_view(UserView(User, db.session, name="Người dùng", endpoint="user"))
    admin.add_view(DentistProfileView(DentistProfile, db.session, name="Hồ sơ bác sĩ", endpoint="dentist_profile"))
    admin.add_view(MedicineView(Medicine, db.session, name="Thuốc", endpoint="medicine"))
    admin.add_view(MedicineImportView(MedicineImport, db.session, name="Lô thuốc", endpoint="medicine_import"))
    admin.add_view(ClinicHoursView(ClinicHours, db.session, name="Giờ khám",  endpoint="clinic_hours"))
    admin.add_view(ServiceView(Service, db.session, name="Dịch vụ", endpoint="service"))
    admin.add_view(PostView(Post, db.session, name="Bài viết", endpoint="post"))
