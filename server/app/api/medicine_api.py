from flask import request
from flask_restx import Resource
from app.api_conf import api, medicine_ns, medicine_model, medicine_parser
from app.dao import dao_medicine
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.dao.dao_medicine import get_medicine_list


@medicine_ns.route('/')
class MedicineList(Resource):
    @medicine_ns.marshal_list_with(medicine_model)
    def get(self):
        "Lấy danh sách thuốc"
        data = []
        for med, total_stock in get_medicine_list():
            data.append({
                "id": med.id,
                "name": med.name,
                "type": med.type.name if med.type else None,
                "selling_price": float(med.selling_price),
                "reserved_quantity": med.reserved_quantity,
                "amount_per_unit": med.amount_per_unit,
                "retail_unit": med.retail_unit,
                "total_stock": total_stock
            })
        return data, 200

    @medicine_ns.expect(medicine_parser, validate=True)
    @medicine_ns.marshal_with(medicine_model, code=201)
    #@jwt_required()  # chỉ admin/staff mới thao tác
    def post(self):
        "Thêm thuốc mới vào danh mục"
        #current_user = get_jwt_identity()  # có thể check role
        data = medicine_parser.parse_args()

        new_medicine = dao_medicine.create_medicine(
            name=data['name'],
            type=data['type'],
            amount_per_unit=data['amount_per_unit'],
            retail_unit=data['retail_unit'],
            selling_price=data['selling_price'],
        )

        if new_medicine:
            return new_medicine, 201

        return {'message': 'Server Error'}, 500

#huy-dev
#Cập nhật thông tin thuốc
@medicine_ns.route('/<int:medicine_id>')
class MedicineResource(Resource):
    @medicine_ns.expect(medicine_parser, validate=True)
    @medicine_ns.marshal_with(medicine_model, code=200)
    #@jwt_required()
    def patch(self, medicine_id):
        """Admin cập nhật thông tin thuốc"""
        data = medicine_parser.parse_args()
        updated_medicine = dao_medicine.update_medicine(
            medicine_id,
            name=data.get('name'),
            production_date=data.get('production_date'),
            expiration_date=data.get('expiration_date'),
            type=data.get('type'),
            amount_per_unit=data.get('amount_per_unit'),
            retail_unit=data.get('retail_unit')
        )
        if updated_medicine:
            return updated_medicine, 200
        return {"msg": "Không tìm thấy thuốc"}, 404

#Xóa thuốc khỏi danh mục
@medicine_ns.route('/<int:medicine_id>/delete')
class DeleteMedicine(Resource):
    #@jwt_required()
    def delete(self, medicine_id):
        """Admin xóa thuốc theo ID"""
        success = dao_medicine.delete_medicine(medicine_id)
        if success:
            return {"msg": "Đã xóa thuốc"}, 200
        return {"msg": "Không tìm thấy thuốc"}, 404