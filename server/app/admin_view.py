from flask_admin.contrib.sqla import ModelView
from wtforms.fields import SelectField
from app.extensions import db
from app.models import User, Medicine, ClinicHours, GenderEnum, RoleEnum, StatusEnum, MedicineTypeEnum, DayOfWeekEnum, \
    MedicineImport, Service


class UserView(ModelView):
    can_view_details = True

    form_overrides = {
        'gender': SelectField,
        'role': SelectField,
        'status': SelectField,
    }

    form_args = {
        'gender': {'choices': [(e.name, e.value) for e in GenderEnum]},
        'role': {'choices': [(e.name, e.value) for e in RoleEnum]},
        'status': {'choices': [(e.name, e.value) for e in StatusEnum]},
    }

class MedicineView(ModelView):
    can_view_details = True
    form_overrides = {
        'type': SelectField,
    }
    form_args = {
        'type': {'choices': [(e.name, e.value) for e in MedicineTypeEnum]},
    }

class MedicineImportView(ModelView):
    can_view_details = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("Relationships detected:", self._form_ajax_refs)



class ClinicHoursView(ModelView):
    can_view_details = True
    form_overrides = {
        'day_of_week': SelectField,
    }
    form_args = {
        'day_of_week': {'choices': [(e.name, e.value) for e in DayOfWeekEnum]},
    }

class ServiceView(ModelView):
    can_view_details = True


def init_admin(admin):
    """Đăng ký các bảng hiển thị trong Flask-Admin"""
    admin.add_view(UserView(User, db.session, endpoint="user"))
    admin.add_view(MedicineView(Medicine, db.session, endpoint="medicine"))
    admin.add_view(MedicineImportView(MedicineImport, db.session, endpoint="medicine_import"))
    admin.add_view(ClinicHoursView(ClinicHours, db.session, endpoint="clinic_hours"))
    admin.add_view(ServiceView(Service, db.session, endpoint="service"))
    # admin.add_view(ModelView(Specialization, db.session))

