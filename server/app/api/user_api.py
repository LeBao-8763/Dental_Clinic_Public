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


