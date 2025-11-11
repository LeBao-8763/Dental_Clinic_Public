import os
from dotenv import load_dotenv
from datetime import timedelta
import cloudinary

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'fallback-jwt-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # SQLAlchemy
    DB_USER = os.getenv("DB_USER")
    DB_PASS = os.getenv("DB_PASS")
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@localhost/dental_clinic"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Cloudinary
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True
    )
