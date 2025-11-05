from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()  # nạp biến môi trường từ file .env

app = Flask(__name__)

# Lấy thông tin từ env
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")


app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{DB_USER}:{DB_PASS}@localhost/dental_clinic"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)