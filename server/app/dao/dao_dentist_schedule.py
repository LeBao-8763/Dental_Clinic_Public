from app import db
from app.models import DentistSchedule, DayOfWeekEnum, ClinicHours, DentistCustomSchedule
from datetime import datetime, date, timedelta
from app.dao import dao_appointment

def create_dentist_schedule(dentist_id, day_of_week, start_time, end_time):
    try:
        day_enum = DayOfWeekEnum(day_of_week)
    except ValueError:
        raise ValueError("day_of_week phải là 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY' hoặc 'SUNDAY'")

    clinic_hour = ClinicHours.query.filter_by(day_of_week=day_enum).first()
    if not clinic_hour:
        raise ValueError(f"Chưa có giờ hoạt động cho ngày {day_of_week}")

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
    try:
        schedule_list = []
        try:
            day_enum = DayOfWeekEnum(day_of_week)
        except ValueError:
            raise ValueError("day_of_week phải là 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY' hoặc 'SUNDAY'")

        clinic_hour = ClinicHours.query.filter_by(day_of_week=day_enum).first()
        if not clinic_hour:
            raise ValueError(f"Chưa có giờ hoạt động cho ngày {day_of_week}")

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

def get_dentist_schedules(dentist_id,day_of_week=None):
    query = DentistSchedule.query.filter_by(dentist_id=dentist_id)
    if day_of_week:
        try:
            day_enum = DayOfWeekEnum(day_of_week)
            query = query.filter_by(day_of_week=day_enum)
        except ValueError:
            raise ValueError("day_of_week phải là 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY' hoặc 'SUNDAY'")
    return query.all()


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

def get_day_of_week_enum(date_obj):
    return DayOfWeekEnum[date_obj.strftime("%A").upper()]

def is_slot_booked(slot_start, slot_end, appointments):
    for apt in appointments:
        if slot_start < apt.end_time and slot_end > apt.start_time:
            return True
    return False

def get_base_schedules(dentist_id, appointment_date):
    day_of_week = get_day_of_week_enum(appointment_date)

    custom = DentistCustomSchedule.query.filter_by(
        dentist_id=dentist_id,
        custom_date=appointment_date
    ).all()

    if custom:
        if any(c.is_day_off for c in custom):
            return []

        return custom

    return DentistSchedule.query.filter(
        DentistSchedule.dentist_id == dentist_id,
        DentistSchedule.day_of_week == day_of_week
    ).all()

def get_available_schedule_by_date(dentist_id, appointment_date):

    if isinstance(appointment_date, str):
        appointment_date = datetime.strptime(
            appointment_date, "%Y-%m-%d"
        ).date()

    base_slots=get_base_schedules(dentist_id, appointment_date)

    if not base_slots:
        return []
    
    booked=dao_appointment.get_booked_slots(dentist_id, appointment_date)

    available_slots=[]

    for slot in base_slots:
        start=slot.start_time
        end=slot.end_time

        if not is_slot_booked(start, end, booked):
            available_slots.append(slot)
    
    return available_slots

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