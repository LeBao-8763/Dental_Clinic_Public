from app import db
from app.models import DentistSchedule, DayOfWeekEnum, ClinicHours
from datetime import datetime, date, timedelta

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

def create_multiple_dentist_schedules(dentist_id,day_of_week, schedules_data):
    """
    Tạo nhiều lịch làm việc cho một nha sĩ
    schedules_data: list of dict [{'day_of_week': 'MONDAY', 'start_time': '09:00:00', 'end_time': '17:00:00'}, ...]
    """
    try:
        schedule_list = []
        try:
            day_enum = DayOfWeekEnum(day_of_week)
        except ValueError:
            raise ValueError("day_of_week phải là 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY' hoặc 'SUNDAY'")

         # Lấy giờ hoạt động phòng khám
        clinic_hour = ClinicHours.query.filter_by(day_of_week=day_enum).first()
        if not clinic_hour:
            raise ValueError(f"Chưa có giờ hoạt động cho ngày {day_of_week}")

        #Check xem có tôn tại lịch trước đó chưa
        existing_count = DentistSchedule.query.filter_by(
            dentist_id=dentist_id,
            day_of_week=day_enum
        ).count()

        if existing_count==0:
            effective_from = date.today()
        else:
            effective_from = date.today() + timedelta(days=7)

        for schedule_data in schedules_data:

            start_time=datetime.strptime(schedule_data['start_time'], "%H:%M:%S").time()
            end_time=datetime.strptime(schedule_data['end_time'], "%H:%M:%S").time()
            # Check giờ nằm trong khung clinic
            if (start_time < clinic_hour.open_time or 
                end_time > clinic_hour.close_time):
                raise ValueError(
                    f"Thời gian làm việc phải nằm trong khoảng {clinic_hour.open_time} - {clinic_hour.close_time}"
                )

            schedule = DentistSchedule(
                dentist_id=dentist_id,
                day_of_week=day_enum,
                start_time=schedule_data['start_time'],
                end_time=schedule_data['end_time'],
                effective_from=effective_from
            )
            db.session.add(schedule)
            schedule_list.append(schedule)
        
        db.session.commit()
        return schedule_list
    except Exception as e:
        db.session.rollback()
        raise e

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


# Xoá lịch làm việc của nha sĩ theo ngày trong tuần
def delete_dentist_schedules_by_day(dentist_id, day_of_week):
    try:
        day_enum = DayOfWeekEnum(day_of_week)
    except ValueError:
        raise ValueError("day_of_week phải là 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY' hoặc 'SUNDAY'")

    
    deleted_count = DentistSchedule.query.filter_by(
        dentist_id=dentist_id,
        day_of_week=day_enum
    ).delete()
    
    db.session.commit()
    return deleted_count

#huy-dev
def get_all_dentist_schedules():
    return DentistSchedule.query.all()

def update_dentist_schedule(schedule_id, day_of_week=None, start_time=None, end_time=None):
    schedule = DentistSchedule.query.get(schedule_id)
    if not schedule:
        return None
    if day_of_week: schedule.day_of_week = day_of_week
    if start_time: schedule.start_time = start_time
    if end_time: schedule.end_time = end_time
    db.session.commit()
    return schedule