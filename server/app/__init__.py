from flask import Flask
from flask_cors import CORS
from config import Config
from app.scheduler.scheduler import init_scheduler
from app.extensions import db, jwt, admin, login
from app.admin_view import init_admin

def create_app():
    app = Flask(__name__)
    app.secret_key = "ifojaiwejfoijw%^^$@$@#fnjjkasd89432814FAfjwoif"
    app.config.from_object(Config)
    CORS(app)

    # Gắn extension
    db.init_app(app)
    jwt.init_app(app)
    admin.init_app(app)
    login.init_app(app)

    init_scheduler(app)

    from .api_conf import api_bp
    app.register_blueprint(api_bp)

    # Import routes
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
        user_booking_stat_api
    )

    # Khởi tạo admin sau khi app và db sẵn sàng
    with app.app_context():
        init_admin(admin)


    return app
