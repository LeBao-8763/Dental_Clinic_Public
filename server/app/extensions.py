from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_admin import Admin

db = SQLAlchemy()
jwt = JWTManager()
admin = Admin(name="QUẢN TRỊ PHÒNG KHÁM NHA KHOA", template_mode="bootstrap4")
