
from flask import request
from flask_restx import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.api_conf import auth_ns
from app.dao import dao_user


@auth_ns.route('/register')
class Register(Resource):
    @jwt_required()
    def post(self):

        current_user_id = get_jwt_identity()
        current_user = dao_user.get_user_by_id(current_user_id)

        if current_user.role.value != "ADMIN":
            return {"msg": "Bạn không có quyền tạo tài khoản"}, 403

        data = request.json
        new_user = dao_user.create_user(
            username=data['username'],
            password=data['password'],
            role=data['role']  # PATIENT, DENTIST, ADMIN
        )
        if new_user:
            return {"msg": "Tạo tài khoản thành công", "user_id": new_user.id}, 201
        return {"msg": "Lỗi khi tạo tài khoản"}, 500


@auth_ns.route('/users')
class UserList(Resource):
    @jwt_required()
    def get(self):

        current_user_id = get_jwt_identity()
        current_user = dao_user.get_user_by_id(current_user_id)

        if current_user.role.value != "ADMIN":
            return {"msg": "Bạn không có quyền"}, 403

        users = dao_user.get_all_users()
        return [{"id": u.id, "username": u.username, "role": u.role.value} for u in users], 200


@auth_ns.route('/users/<int:user_id>/role')
class UpdateUserRole(Resource):
    @jwt_required()
    def patch(self, user_id):

        current_user_id = get_jwt_identity()
        current_user = dao_user.get_user_by_id(current_user_id)

        if current_user.role.value != "ADMIN":
            return {"msg": "Bạn không có quyền"}, 403

        data = request.json
        updated_user = dao_user.update_user_role(user_id, data['role'])
        if updated_user:
            return {"msg": "Cập nhật quyền thành công"}, 200
        return {"msg": "Không tìm thấy người dùng"}, 404