from functools import wraps
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from flask_restx import abort

def role_required(required_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role", None)
            if user_role not in required_roles:
                abort(403, description="Bạn không có quyền truy cập tài nguyên này.")
            return fn(*args, **kwargs)

        return wrapper

    return decorator