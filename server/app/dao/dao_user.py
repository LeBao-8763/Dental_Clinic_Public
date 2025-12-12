from app import db
from app.models import User
from app.models import GenderEnum, RoleEnum, StatusEnum
import bcrypt
from .dao_user_booking_stats import create_user_booking_stats

def create_user(firstname, lastname, gender,username, password, phone_number, specialization_id=None,address=None,role=None, avatar=None):
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
            firstname=firstname,
            lastname=lastname,
            gender=gender_enum,
            username=username,
            password=hashed_pw,
            avatar=avatar,
            phone_number=phone_number,)
    else:
         user = User(
            firstname=firstname,
            lastname=lastname,
            gender=gender_enum,
            username=username,
            password=hashed_pw,
            role=RoleEnum(role),
            avatar=avatar,
            phone_number=phone_number,)
    db.session.add(user)
    db.session.commit()

    # Nếu là bệnh nhân -> tạo stats
    if user.role == RoleEnum.ROLE_PATIENT:
        create_user_booking_stats(user.id)

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

def get_user_by_id(user_id):
    return User.query.get(user_id)

def get_user_list(role):
    try:
        role_enum = RoleEnum(role)   # convert string -> Enum
    except ValueError:
        raise ValueError("Invalid role")

    return User.query.filter_by(role=role_enum, status=StatusEnum.ACTIVE).all()

def get_dentist_list():
    return User.query.filter_by(role=RoleEnum.ROLE_DENTIST, status=StatusEnum.ACTIVE).all()

#huy-dev
# def get_user_by_id(user_id):
#     return User.query.get(user_id)

def get_all_users():
    return User.query.all()

# def create_user(username, password, role):
#     user = User(username=username,
#                 #password=hash_password(password),
#                 role=RoleEnum[role])
#     db.session.add(user)
#     db.session.commit()
#     return user

def update_user_role(user_id, new_role):
    user = User.query.get(user_id)
    if not user:
        return None
    user.role = RoleEnum[new_role]
    db.session.commit()
    return user

# def get_all_users():
#     return User.query.all()

def update_user(user_id, username=None, phone_number=None, firstname=None, lastname=None, role=None, gender=None, password=None):
    user = User.query.get(user_id)
    if not user:
        return None
    if username: user.username = username
    if phone_number: user.phone_number = phone_number
    if firstname: user.firstname = firstname
    if lastname: user.lastname = lastname
    if role: user.role = role
    if gender: user.gender = gender
    #if password: user.password = hash_password(password)  # nếu có hàm hash
    db.session.commit()
    return user

def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return False
    db.session.delete(user)
    db.session.commit()
    return True