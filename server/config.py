import os
from dotenv import load_dotenv
from datetime import timedelta
import cloudinary

load_dotenv()

class Config:

    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-jwt-secret-key")
    
    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY is not set")

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=60)

    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    DB_USER = os.getenv("DB_USER", "root")
    DB_PASS = os.getenv("DB_PASS", "root")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "dental_clinic")
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "fallback-cloud-name"),
        api_key=os.getenv("CLOUDINARY_API_KEY", "fallback-api-key"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET", "fallback-api-secret"),
        secure=True
    )
