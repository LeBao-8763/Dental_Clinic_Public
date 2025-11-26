from app import db
from app.models import ClinicHours, DayOfWeekEnum


def create_clinic_hour(day_of_week, open_time, close_time,slot_duration_minutes=None):
    try:
        day_enum = DayOfWeekEnum(day_of_week)
    except ValueError:
        raise ValueError("day_of_week phải là 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY' hoặc 'SUNDAY'")

    clinic_hour = ClinicHours(
        day_of_week=day_enum,
        open_time=open_time,
        close_time=close_time,
        slot_duration_minutes=slot_duration_minutes
    )
    db.session.add(clinic_hour)
    db.session.commit()
    return clinic_hour

def create_default_week_hours(default_open, default_close):
    for day in DayOfWeekEnum:
        create_clinic_hour(day.name, default_open, default_close)

def get_all_clinic_hours():
    return ClinicHours.query.all()
   