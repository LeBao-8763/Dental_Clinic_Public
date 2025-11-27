from app import db
from app.models import DentistCustomSchedule, User

from datetime import datetime
from app import db
from app.models import User, DentistCustomSchedule

def create_custom_schedule(dentist_id, custom_date, note=None, schedules_data=None):
    """
    Tạo custom schedule cho bác sĩ:
    - Nếu không truyền schedules_data → tạo ngày nghỉ (day off)
    - Nếu truyền schedules_data → tạo nhiều khung giờ làm việc cho ngày đó
      schedules_data dạng:
      [
        {"start_time": "09:00:00", "end_time": "11:00:00"},
        {"start_time": "13:00:00", "end_time": "17:00:00"}
      ]
    """

    try:
        # Kiểm tra bác sĩ tồn tại
        if User.query.get(dentist_id) is None:
            raise ValueError("Bác sĩ với ID đã cho không tồn tại")

        # --------------------------
        # CASE 1: NGÀY NGHỈ
        # --------------------------
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

        # --------------------------
        # CASE 2: NHIỀU KHUNG GIỜ CUSTOM
        # --------------------------
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

