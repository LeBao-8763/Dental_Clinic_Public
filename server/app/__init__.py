from flask import Flask
from flask_cors import CORS

from app.models import User, GenderEnum, RoleEnum, StatusEnum
from config import Config
from app.extensions import db, jwt, admin, login
from app.admin_view import init_admin

def create_default_admin():
    admin_username = "admin"
    existing_admin = User.query.filter_by(username=admin_username).first()

    if not existing_admin:
        admin = User(
            name="Super Admin",
            gender=GenderEnum.MALE,
            phone_number="0900000000",
            username=admin_username,
            avatar="",
            password="$2b$12$hyIMo6YEVU9idNLte253zubgnWmtUFEmmg4Qd6yBIZe/SyLNQKbs6",  # Gi@B@o123
            role=RoleEnum.ROLE_ADMIN,
            status=StatusEnum.ACTIVE
        )
        db.session.add(admin)
        db.session.commit()

def create_app():
    app = Flask(__name__)
    app.secret_key = "ifojaiwejfoijw%^^$@$@#fnjjkasd89432814FAfjwoif"
    app.config.from_object(Config)
    CORS(app)

    db.init_app(app)
    jwt.init_app(app)
    admin.init_app(app)
    login.init_app(app)


    from .api_conf import api_bp
    app.register_blueprint(api_bp)

    from .api import (
        auth_api,
        user_api,
        clinic_hour_api,
        appointment_api,
        dentist_schedule_api,
        service_api,
        treatment_record_api,
        dentist_profile_api,
        custom_schedule_api,
        medicine_api,
        medicine_import_api,
        prescription_api,
        post_api,
        invoice_api,
        user_booking_stat_api,
        stats_api
    )

    with app.app_context():
        init_admin(admin)
        create_default_admin()

    return app
