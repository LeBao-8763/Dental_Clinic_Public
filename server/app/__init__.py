from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from config import Config

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    from .api_conf import api_bp
    app.register_blueprint(api_bp)

    # Import API resources
    from .api import user_api, auth_api, clinic_hour_api, appointment_api, dentist_schedule_api, service_api

    return app
