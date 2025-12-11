from app.dao import dao_service
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import service_model, service_parser, service_ns
from flask_jwt_extended import jwt_required

@service_ns.route('/')
class Service(Resource):
    @service_ns.doc('create_service')
    @service_ns.expect(service_parser)   # Định nghĩa định dạng request body cho Swagger UI
    @service_ns.marshal_with(service_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo dịch vụ mới"
        args=service_parser.parse_args()
        new_service=dao_service.create_service(
            name=args.get('name'),
            price=args.get('price'),
            description=args.get('description')
        )
        if new_service:
            return new_service, 201

        return 500

    @service_ns.doc('get_list_service')
    @service_ns.marshal_with(service_model, code=201)
    @jwt_required() # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def get(self):
        "Lấy danh sách các dịch vụ"
        return dao_service.get_list_service(),200

#huy-dev
#Xem chi tiết dịch vụ theo ID
@service_ns.route('/<int:service_id>')
class ServiceDetail(Resource):
    @service_ns.doc('get_service_by_id')
    @service_ns.marshal_with(service_model)
    def get(self, service_id):
        """Admin xem chi tiết dịch vụ theo ID"""
        service = dao_service.get_service_by_id(service_id)
        if service:
            return service, 200
        return {"msg": "Không tìm thấy dịch vụ"}, 404

#Cập nhật dịch vụ
@service_ns.route('/<int:service_id>/update')
class UpdateService(Resource):
    @service_ns.doc('update_service')
    @service_ns.expect(service_parser, validate=True)
    @service_ns.marshal_with(service_model, code=200)
    def patch(self, service_id):
        """Admin cập nhật dịch vụ"""
        args = service_parser.parse_args()
        updated_service = dao_service.update_service(
            service_id,
            name=args.get('name'),
            price=args.get('price'),
            description=args.get('description')
        )
        if updated_service:
            return updated_service, 200
        return {"msg": "Không tìm thấy dịch vụ"}, 404
    
#Xóa dịch vụ
@service_ns.route('/<int:service_id>/delete')
class DeleteService(Resource):
    @service_ns.doc('delete_service')
    def delete(self, service_id):
        """Admin xóa dịch vụ"""
        success = dao_service.delete_service(service_id)
        if success:
            return {"msg": "Đã xóa dịch vụ"}, 200
        return {"msg": "Không tìm thấy dịch vụ"}, 404