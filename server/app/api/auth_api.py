from app.dao import dao_user
from flask import jsonify
from flask_restx import Resource
from app.api_conf import auth_ns, auth_parser
from flask_jwt_extended import create_access_token

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.doc('login_user')
    @auth_ns.expect(auth_parser)
    def post(self):

        args = auth_parser.parse_args()
        account_identifier = args['account_identifier']
        password = args['password']
        user = dao_user.login(password, account_identifier)

        if not user:
            return jsonify({"msg": "Bad username or password"}), 401

        access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role.value})
        return {"user_id":user.id,"access_token": access_token}, 200


