from app import db
from app.models import DentistSchedule, DayOfWeekEnum

def create_dentist_schedule(dentist_id, day_of_week, start_time, end_time):
    try:
        day_enum = DayOfWeekEnum(day_of_week)
    except ValueError:
        raise ValueError("day_of_week phải là 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY' hoặc 'SUNDAY'")

    # Lấy giờ hoạt động phòng khám
    clinic_hour = ClinicHours.query.filter_by(day_of_week=day_enum).first()
    if not clinic_hour:
        raise ValueError(f"Chưa có giờ hoạt động cho ngày {day_of_week}")

    # Check giờ nằm trong khung clinic
    if start_time < clinic_hour.open_time or end_time > clinic_hour.close_time:
        raise ValueError(
            f"Thời gian làm việc phải nằm trong khoảng {clinic_hour.open_time} - {clinic_hour.close_time}"
        )

    schedule = DentistSchedule(
        dentist_id=dentist_id,
        day_of_week=day_enum,
        start_time=start_time,
        end_time=end_time
    )
    db.session.add(schedule)
    db.session.commit()
    return schedule

# Lấy lịch làm việc của nha sĩ theo ngày trong tuần (nếu có)
def get_dentist_schedules(dentist_id,day_of_week=None):
    query = DentistSchedule.query.filter_by(dentist_id=dentist_id)
    if day_of_week:
        try:
            day_enum = DayOfWeekEnum(day_of_week)
            query = query.filter_by(day_of_week=day_enum)
        except ValueError:
            raise ValueError("day_of_week phải là 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY' hoặc 'SUNDAY'")
    return query.all()


   