import re

from werkzeug.exceptions import BadRequest

from app.dao import dao_user, dao_appointment
from app.api_conf import user_ns, user_creation_parser,user_model, dentist_ns, dentist_model, appointment_model
from flask_restx import Resource
from app.models import User
from cloudinary import uploader

@user_ns.route('/')
class UserList(Resource):
    @user_ns.doc('create_user')
    @user_ns.expect(user_creation_parser)   # Định nghĩa định dạng request body cho Swagger UI
    @user_ns.marshal_with(user_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo một người dùng mới"
        args=user_creation_parser.parse_args()
        avatar=args.get('avatar')
        avatar_url = None  # <-- khởi tạo mặc định

        # ✅ Validate username
        username = args.get('username')
        if not username or len(username) < 3:
            raise BadRequest("Tên người dùng phải có ít nhất 3 ký tự")

        # ✅ Validate phone number
        phone = args.get('phonenumber')
        if not re.match(r"^(0)\d{9,10}$", phone or ""):
            raise BadRequest("Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84)")

        # ✅ Validate password
        password = args.get('password')
        if not password or len(password) < 8:
            raise BadRequest("Mật khẩu phải có ít nhất 8 ký tự")

        if not re.search(r"[A-Z]", password):
            raise BadRequest("Mật khẩu phải chứa ít nhất một chữ hoa")
        if not re.search(r"[a-z]", password):
            raise BadRequest("Mật khẩu phải chứa ít nhất một chữ thường")
        if not re.search(r"\d", password):
            raise BadRequest("Mật khẩu phải chứa ít nhất một số")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise BadRequest("Mật khẩu phải chứa ít nhất một ký tự đặc biệt")

        if avatar:
            upload_result = uploader.upload(avatar)
            avatar_url = upload_result.get('secure_url')

        new_user=dao_user.create_user(
            username=args.get('username'),
            phone_number=args.get('phonenumber'),
            firstname=args.get('firstname'),
            lastname=args.get('lastname'),
            role=args.get('role'),
            gender=args.get('gender'),
            avatar=avatar_url,
            password=args.get('password')
        )
        if new_user:
            return new_user, 201

        return 500

    @user_ns.doc('get_list_user')
    @user_ns.marshal_with(user_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def get(self):
        "Lấy danh sách người dùng"
        users=dao_user.get_user_list("ROLE_PATIENT")
        return users, 200


@dentist_ns.route('/')
class DentistList(Resource):
    @dentist_ns.doc('get_user_list')
    @dentist_ns.marshal_list_with(dentist_model)  # Định nghĩa định dạng response cho Swagger UI
    def get(self):
        "Lấy danh sách bác sĩ"
        dentists = dao_user.get_user_list("ROLE_DENTIST")
        return dentists, 200



@user_ns.route('/<int:user_id>')
@user_ns.param('user_id', 'ID của người dùng')
class UserResource(Resource):
    @user_ns.doc('get_user')
    @user_ns.marshal_with(user_model)  # Định nghĩa định dạng response cho Swagger UI
    def get(self, user_id):
        "Lấy thông tin người dùng theo ID"
        user = dao_user.get_user_by_id(user_id)
        if user:
            return user,200
        user_ns.abort(404, "User not found")

#huy-dev
#Lấy danh sách tất cả người dùng
@user_ns.route('/all')
class AllUsers(Resource):
    @user_ns.doc('get_all_users')
    @user_ns.marshal_list_with(user_model)
    def get(self):
        """Admin lấy danh sách tất cả người dùng"""
        users = dao_user.get_all_users()
        return users, 200

#Cập nhật thông tin người dùng
@user_ns.route('/<int:user_id>/update')
class UpdateUser(Resource):
    @user_ns.doc('update_user')
    @user_ns.expect(user_creation_parser, validate=True)
    @user_ns.marshal_with(user_model, code=200)
    def patch(self, user_id):
        """Admin cập nhật thông tin người dùng"""
        args = user_creation_parser.parse_args()
        updated_user = dao_user.update_user(
            user_id,
            username=args.get('username'),
            phone_number=args.get('phonenumber'),
            firstname=args.get('firstname'),
            lastname=args.get('lastname'),
            role=args.get('role'),
            gender=args.get('gender'),
            password=args.get('password')
        )
        if updated_user:
            return updated_user, 200
        return {"msg": "Không tìm thấy người dùng"}, 404

#Xóa người dùng
@user_ns.route('/<int:user_id>/delete')
class DeleteUser(Resource):
    @user_ns.doc('delete_user')
    def delete(self, user_id):
        """Admin xóa người dùng theo ID"""
        success = dao_user.delete_user(user_id)
        if success:
            return {"msg": "Đã xóa người dùng"}, 200
        return {"msg": "Không tìm thấy người dùng"}, 404