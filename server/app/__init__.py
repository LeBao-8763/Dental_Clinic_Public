from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config

# Khởi tạo các extension (chỉ tạo, chưa gắn vào app)
db = SQLAlchemy()
jwt = JWTManager()


def create_app():
    """Hàm khởi tạo ứng dụng Flask và cấu hình toàn bộ API."""
    app = Flask(__name__)

    # --------------------------
    # Cấu hình ứng dụng + bật CORS
    # --------------------------
    app.config.from_object(Config)
    CORS(app)

    # --------------------------
    # Gắn các extension vào ứng dụng
    # --------------------------
    db.init_app(app)
    jwt.init_app(app)

    # --------------------------
    # Đăng ký Blueprint chứa toàn bộ API
    # --------------------------
    from .api_conf import api_bp
    app.register_blueprint(api_bp)

    # --------------------------
    # Import các file API để kích hoạt route
    # (Lưu ý: chỉ cần import, không cần dùng trực tiếp)
    # --------------------------
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
        post_api
    )

    return app
