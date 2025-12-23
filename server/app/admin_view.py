import enum
import json

import bcrypt
import cloudinary
from flask import flash, redirect, request
from flask_admin.contrib.sqla import ModelView
from markupsafe import Markup
from wtforms import MultipleFileField, FileField
from wtforms.validators import DataRequired, Regexp

from app.dao import dao_stats
from app.extensions import db
from app.models import User, Medicine, ClinicHours, RoleEnum, StatusEnum, \
    MedicineImport, Service, DentistProfile, Post
from flask_admin import BaseView, expose
from flask_login import logout_user, current_user

class AuthenticatedBaseView(BaseView):
    def is_accessible(self):
        return current_user.is_authenticated

class AuthenticatedModelView(ModelView):
    def is_accessible(self):
        return (current_user.is_authenticated
                and current_user.status == StatusEnum.ACTIVE
                and current_user.role == RoleEnum.ROLE_ADMIN)

class LogoutView(AuthenticatedBaseView):
    @expose('/')
    def index(self):
        logout_user()
        return redirect('/admin')

class StatsView(AuthenticatedBaseView):
    @expose('/')
    def index(self):
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        dentist_id = request.args.get('dentist_id', type=int)

        dentists = dao_stats.db.session.query(
            dao_stats.User.id,
            dao_stats.User.name,
        ).filter(dao_stats.User.role == dao_stats.RoleEnum.ROLE_DENTIST).all()

        if dentist_id:
            daily_revenue = dao_stats.revenue_by_day(month=month, year=year, dentist_id=dentist_id)
            overall = dao_stats.overall_stats(month=month, year=year)
            dentist_revenue = dao_stats.revenue_by_dentist(month=month, year=year)
            top_services = dao_stats.top_services(month=month, year=year)
            top_medicines = dao_stats.top_medicines(month=month, year=year)
        else:
            daily_revenue = dao_stats.revenue_by_day(month=month, year=year)
            overall = dao_stats.overall_stats(month=month, year=year)
            dentist_revenue = dao_stats.revenue_by_dentist(month=month, year=year)
            top_services = dao_stats.top_services(month=month, year=year)
            top_medicines = dao_stats.top_medicines(month=month, year=year)

        return self.render(
            'admin/stats.html',
            daily_revenue=daily_revenue,
            total_revenue=overall["total_revenue"],
            total_appointments=overall["total_appointments"],
            avg_per_dentist=overall["avg_per_dentist"],
            dentist_revenue=dentist_revenue,
            top_services=top_services,
            top_medicines=top_medicines,
            dentists=dentists,
            selected_month=month,
            selected_year=year,
            selected_dentist=dentist_id
        )

class UserView(AuthenticatedModelView):
    can_view_details = True
    column_display_pk = True
    can_delete = False
    column_filters = ['name', 'username']
    column_searchable_list = ['name', 'username']

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
    form_args = {
        'username': {
            'validators': [
                DataRequired(message='Vui lòng nhập tên đăng nhập'),
                Regexp(r'^\S+$', message='Tên đăng nhập không được chứa khoảng trắng')
            ]
        },
        'phone_number': {
            'validators': [
                Regexp(r'^\d{10,11}$', message='Số điện thoại phải gồm 10-11 chữ số')
            ]
        },
        'password': {
            'validators': [
                DataRequired(message='Vui lòng nhập mật khẩu'),
                Regexp(
                    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
                    message='Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
                )
            ]
        }
    }
    column_exclude_list = ['avatar', 'password']
    column_labels = {
        'id': 'Mã',
        'name': 'Tên',
        'gender': 'Giới tính',
        'phone_number': 'Số điện thoại',
        'username': 'Tên đăng nhập',
        'created_date': 'Ngày tạo',
        'role': 'Vai trò',
        'status': 'Trạng thái',
    }
    column_formatters = {
        'gender': lambda v, c, m, p: {
            'MALE': 'Nam',
            'FEMALE': 'Nữ',
            'OTHER': 'Khác'
        }.get(m.gender.value if isinstance(m.gender, enum.Enum) else m.gender, 'Không xác định'),

        'role': lambda v, c, m, p: {
            'ROLE_ADMIN': 'Quản trị viên',
            'ROLE_DENTIST': 'Nha sĩ',
            'ROLE_STAFF': 'Nhân viên',
            'ROLE_PATIENT': 'Bệnh nhân'
        }.get(m.role.value if isinstance(m.role, enum.Enum) else m.role, 'Không xác định'),

        'status': lambda v, c, m, p: {
            'ACTIVE': 'Hoạt động',
            'INACTIVE': 'Ngừng hoạt động'
        }.get(m.status.value if isinstance(m.status, enum.Enum) else m.status, 'Không xác định')
    }
    form_overrides = {
        'avatar': FileField
    }

    common_fields = ('name', 'gender', 'username', 'phone_number', 'role', 'status', 'avatar')


    form_create_rules = common_fields + ('password',)


    form_edit_rules = common_fields



    def on_model_change(self, form, model, is_created):
        if is_created:

            if form.password.data:
                model.password = bcrypt.hashpw(model.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        file = form.avatar.data
        if file and hasattr(file, 'filename') and file.filename:
            try:
                upload_result = cloudinary.uploader.upload(file)
                model.avatar = upload_result.get('secure_url')
            except Exception as e:
                flash(f"Lỗi upload avatar: {e}", "error")

        return super().on_model_change(form, model, is_created)



    def on_form_prefill(self, form, id):
        user = self.session.get(self.model, id)
        if user:
            if user.gender:
                form.gender.data = user.gender.name
            if user.role:
                form.role.data = user.role.name
            if user.status:
                form.status.data = user.status.name

class DentistProfileView(AuthenticatedModelView):
    can_view_details = True
    edit_modal = True
    column_list = ('dentist', 'education', 'experience', 'created_at')
    form_columns = ('dentist', 'introduction', 'education', 'experience')
    form_ajax_refs = {
        'dentist': {'fields': (User.name,)}
    }
    column_labels = {
        'dentist': 'Bác sĩ',
        'introduction': 'Giới thiệu',
        'education': 'Học vấn',
        'experience': 'Kinh nghiệm',
        'created_at': 'Ngày tạo',
        'updated_at': 'Cập nhật lần cuối',
    }

class MedicineView(AuthenticatedModelView):
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
        'capacity_per_unit': 'Lượng trên 1 đơn vị',
        'selling_price': 'Giá bán (VNĐ)',
    }
    form_choices = {
        'type': [
            ('PILL', 'Viên uống'),
            ('CREAM', 'Kem bôi'),
            ('LIQUID', 'Dung dịch'),
        ]
    }
    column_formatters = {
        'type': lambda v, c, m, p: {
            'PILL': 'Viên uống',
            'CREAM': 'Kem bôi',
            'LIQUID': 'Dung dịch',
        }.get(m.type.value if isinstance(m.type, enum.Enum) else m.type, 'Không xác định')
    }

class MedicineImportView(AuthenticatedModelView):
    can_view_details = True


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


class ClinicHoursView(AuthenticatedModelView):
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

class ServiceView(AuthenticatedModelView):
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
    form_excluded_columns = ('treatments')

class PostView(AuthenticatedModelView):
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
        files = form.img.data
        if files:
            urls = self._upload_many_to_cloudinary(files)
            if urls:
                model.img = json.dumps(urls)


def init_admin(admin):
    admin.add_view(UserView(User, db.session, name="Người dùng", endpoint="user"))
    admin.add_view(DentistProfileView(DentistProfile, db.session, name="Hồ sơ bác sĩ", endpoint="dentist_profile"))
    admin.add_view(MedicineView(Medicine, db.session, name="Thuốc", endpoint="medicine"))
    admin.add_view(MedicineImportView(MedicineImport, db.session, name="Lô thuốc", endpoint="medicine_import"))
    admin.add_view(ClinicHoursView(ClinicHours, db.session, name="Giờ khám",  endpoint="clinic_hours"))
    admin.add_view(ServiceView(Service, db.session, name="Dịch vụ", endpoint="service"))
    admin.add_view(PostView(Post, db.session, name="Bài viết", endpoint="post"))
    admin.add_view(StatsView(name="Thống kê"))
    admin.add_view(LogoutView(name="Đăng xuất"))