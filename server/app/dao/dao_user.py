from app import db
from app.models import User
from app.models import GenderEnum, RoleEnum, StatusEnum
import bcrypt

def create_user(firstname, lastname, gender,username, password,avatar, phone_number, specialization_id=None,address=None,role=None):
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
    return user

def login (password,username=None, phone_number=None):
    if username:
        user=User.query.filter_by(username=username).first()
    elif phone_number:
        user=User.query.filter_by(phone_number=phone_number).first()
    else:
        raise ValueError("Phải nhập ít nhất username hoặc phone_number")

    if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return user
    return None