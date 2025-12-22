from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
from app.models import User, RoleEnum

def is_admin():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return user and user.role == RoleEnum.ADMIN

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if not is_admin():
            return jsonify({"message": "Bạn không có quyền admin"}), 403
        return fn(*args, **kwargs)
    return wrapper