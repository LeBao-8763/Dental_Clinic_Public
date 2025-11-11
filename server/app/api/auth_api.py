from app.dao import dao_user
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import auth_ns, auth_parser
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.doc('login_user')
    @auth_ns.expect(auth_parser)
    def post(self):
        """ Đăng nhập """
        args = auth_parser.parse_args()
        username = args['username']
        phonenumber=args['phonenumber']
        password = args['password']
        user = dao_user.login(password, username)

        if not user:
            return jsonify({"msg": "Bad username or password"}), 401

        access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role.value})
        return {"access_token": access_token}, 200


