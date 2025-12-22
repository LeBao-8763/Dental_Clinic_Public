from datetime import datetime
from app import db
from app.models import User, DentistCustomSchedule

from datetime import timedelta,date

def create_custom_schedule(dentist_id, custom_date, note=None, schedules_data=None):

    try:
        if User.query.get(dentist_id) is None:
            raise ValueError("Bác sĩ với ID đã cho không tồn tại")

        if datetime.strptime(custom_date, "%Y-%m-%d").date()-date.today() <= timedelta(days=3):
            raise ValueError("Không được thay đổi khi lịch cố định gần hơn 3 ngày!")
        if not schedules_data:
            custom_schedule = DentistCustomSchedule(
                dentist_id=dentist_id,
                custom_date=custom_date,
                is_day_off=True,
                start_time=None,
                end_time=None,
                note=note
            )
            db.session.add(custom_schedule)
            db.session.commit()
            return [custom_schedule]

        schedule_list = []

        for schedule_data in schedules_data:

            start_time = datetime.strptime(schedule_data['start_time'], "%H:%M:%S").time()
            end_time = datetime.strptime(schedule_data['end_time'], "%H:%M:%S").time()

            custom_schedule = DentistCustomSchedule(
                dentist_id=dentist_id,
                custom_date=custom_date,
                is_day_off=False,
                start_time=start_time,
                end_time=end_time,
                note=note
            )

            db.session.add(custom_schedule)
            schedule_list.append(custom_schedule)

        db.session.commit()
        return schedule_list

    except Exception as e:
        db.session.rollback()
        raise e

def get_custom_schedule_by_id(dentist_id):
    custom_schedules=DentistCustomSchedule.query.filter_by(dentist_id=dentist_id).all()
    return custom_schedules

def delete_custom_schedule_by_date(dentist_id,custom_date):
    if User.query.get(dentist_id) is None:
            raise ValueError("Bác sĩ với ID đã cho không tồn tại")
    
    deleted_count = DentistCustomSchedule.query.filter_by(
        dentist_id=dentist_id,
        custom_date=custom_date
    ).delete()
    
    db.session.commit()
    return deleted_count

def get_all_custom_schedules():
    return DentistCustomSchedule.query.all()

def update_custom_schedule(schedule_id, custom_date=None, note=None, schedules_data=None):
    schedule = DentistCustomSchedule.query.get(schedule_id)
    if not schedule:
        return None
    if custom_date: schedule.custom_date = custom_date
    if note: schedule.note = note
    if schedules_data is not None: schedule.schedules = schedules_data
    db.session.commit()
    return schedule