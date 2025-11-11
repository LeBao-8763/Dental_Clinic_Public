from app.dao import dao_user
from app.api_conf import user_ns, user_creation_parser,user_ref
from flask_restx import Resource
from app.models import User
from cloudinary import uploader

@user_ns.route('/')
class UserList(Resource):
    @user_ns.doc('create_user')
    @user_ns.expect(user_creation_parser)   # Định nghĩa định dạng request body cho Swagger UI
    @user_ns.marshal_with(user_ref, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo một người dùng mới"
        args=user_creation_parser.parse_args()
        avatar=args.get('avatar')
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