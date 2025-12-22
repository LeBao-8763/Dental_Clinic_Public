from app import db
from app.models import User, DentistSchedule, Appointment
from app.models import GenderEnum, RoleEnum, StatusEnum, DayOfWeekEnum
import bcrypt
from .dao_user_booking_stats import create_user_booking_stats
from datetime import datetime

def create_user(name, gender,username, password, phone_number,role=None, avatar=None):
    user=User.query.filter_by(phone_number=phone_number).first()

    if user is not None:
        return user
        
    try:
        gender_enum = GenderEnum(gender)
    except ValueError:
        raise ValueError("Gender phải là 'MALE', 'FEMALE' hoặc 'OTHER'")

    if password is not None:    
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


    if not role:
        user = User(
            name=name,
            gender=gender_enum,
            username=username,
            password=hashed_pw,
            avatar=avatar,
            phone_number=phone_number,)
    else:
         user = User(
            name=name,
            gender=gender_enum,
            username=username,
            password=hashed_pw,
            role=RoleEnum(role),
            avatar=avatar,
            phone_number=phone_number,)
    db.session.add(user)
    db.session.flush()

    guest_appointments = Appointment.query.filter(
        Appointment.is_guest == True,
        Appointment.patient_phone == user.phone_number
    ).all()

    for appt in guest_appointments:
        appt.patient_id = user.id
        appt.is_guest = False
        appt.patient_phone = None

    if user.role == RoleEnum.ROLE_PATIENT:
        create_user_booking_stats(user.id)

    db.session.commit()
    return user

def login(password, account_identifier):
    if account_identifier:
        user = User.query.filter(
            (User.username == account_identifier) | (User.phone_number == account_identifier)
        ).first()
    else:
        raise ValueError("Phải nhập ít nhất username hoặc phone_number")

    if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return user
    return None

def check_login(username, password):
    if username and password:
        user = User.query.filter(User.username == username.strip()).first()
        if user and bcrypt.checkpw(password.strip().encode('utf-8'), user.password.encode('utf-8')):
            return user
    return None

def get_user_by_id(user_id):
    return User.query.get(user_id)

def get_user_list(role, gender=None, from_time_str=None, to_time_str=None, dayOfWeek=None,  page=None,
    per_page=None):
    try:
        role_enum = RoleEnum(role)
    except ValueError:
        raise ValueError("Invalid role")

    query = (User.query.filter(User.role==role_enum, User.status==StatusEnum.ACTIVE))

    if gender:
        gender_enum=GenderEnum(gender)
        query=query.filter(User.gender==gender_enum)
    
    if dayOfWeek and from_time_str and to_time_str:
        dayOfWeek_enum=DayOfWeekEnum(dayOfWeek)
        from_time = datetime.strptime(from_time_str, "%H:%M").time()
        to_time = datetime.strptime(to_time_str, "%H:%M").time()

        query = (
            query
            .join(DentistSchedule, DentistSchedule.dentist_id == User.id)
            .filter(
                DentistSchedule.day_of_week == dayOfWeek_enum,
                DentistSchedule.start_time >= from_time,
                DentistSchedule.end_time <= to_time
            )
            .distinct(User.id)
        )

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    return {
        "items": pagination.items,
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total_pages": pagination.pages
    }

def get_all_users():
    return User.query.all()

def update_user_role(user_id, new_role):
    user = User.query.get(user_id)
    if not user:
        return None
    user.role = RoleEnum[new_role]
    db.session.commit()
    return user

def update_user(user_id, username=None, phone_number=None, name=None, role=None, gender=None):
    user = User.query.get(user_id)
    if not user:
        return None
    if username: user.username = username
    if phone_number: user.phone_number = phone_number
    if name: user.name = name
    if role: user.role = role
    if gender: user.gender = gender
    db.session.commit()
    return user

def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return False
    db.session.delete(user)
    db.session.commit()
    return True