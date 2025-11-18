from app.dao import dao_service
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import service_model, service_parser, service_ns

@service_ns.route('/')
class UserList(Resource):
    @service_ns.doc('create_clinic_hour')
    @service_ns.expect(service_parser)   # Định nghĩa định dạng request body cho Swagger UI
    @service_ns.marshal_with(service_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo dịch vụ mới"
        args=service_parser.parse_args()
        new_service=dao_service.create_user(
            name=args.get('name'),
            price=args.get('price'),
            description=args.get('description')
        )
        if new_service:
            return new_service, 201

        return 500


