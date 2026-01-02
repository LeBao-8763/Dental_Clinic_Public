import re
from werkzeug.exceptions import BadRequest
from app.dao import dao_user
from app.api_conf import user_ns, user_creation_parser,user_model, dentist_ns, dentist_response_model
from flask_restx import Resource
from cloudinary import uploader
from flask import request

@user_ns.route('/')
class UserList(Resource):
    @user_ns.doc('create_user')
    @user_ns.expect(user_creation_parser)
    @user_ns.marshal_with(user_model, code=201)
    def post(self):
        args=user_creation_parser.parse_args()
        avatar=args.get('avatar')
        avatar_url = None

        username = args.get('username')
        if not username or len(username) < 3:
            raise BadRequest("Tên người dùng phải có ít nhất 3 ký tự")

        phone = args.get('phonenumber')
        if not re.match(r"^(0)\d{9,10}$", phone or ""):
            raise BadRequest("Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84)")

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
            name=args.get('name'),
            role=args.get('role'),
            gender=args.get('gender'),
            avatar=avatar_url,
            password=args.get('password')
        )
        if new_user:
            return new_user, 201

        return 500

    @user_ns.doc('get_list_user')
    @user_ns.marshal_with(user_model, code=201)
    def get(self):
        result=dao_user.get_user_list("ROLE_PATIENT")
        return result["items"], 200


@dentist_ns.route('/')
class DentistList(Resource):
    @dentist_ns.doc('get_user_list')
    @dentist_ns.marshal_with(dentist_response_model)
    def get(self):
        gender = request.args.get("gender")
        day = request.args.get("day")
        from_time = request.args.get("from_time")
        to_time = request.args.get("to_time")

        page = request.args.get("page", type=int)
        per_page = request.args.get("per_page", type=int)


        result = dao_user.get_user_list(
            role="ROLE_DENTIST",
            gender=gender,
            dayOfWeek=day,
            from_time_str=from_time,
            to_time_str=to_time,
            page=page,
            per_page=per_page
        )

        return {
            "data": result["items"],
            "pagination": {
                "page": result["page"],
                "per_page": result["per_page"],
                "total": result["total"],
                "total_pages": result["total_pages"]
            }
        }, 200


@user_ns.route('/<int:user_id>')
@user_ns.param('user_id', 'ID của người dùng')
class UserResource(Resource):
    @user_ns.doc('get_user')
    @user_ns.marshal_with(user_model)
    def get(self, user_id):
        user = dao_user.get_user_by_id(user_id)
        if user:
            return user,200
        user_ns.abort(404, "User not found")



