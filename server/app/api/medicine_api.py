
from flask_restx import Resource
from app.api_conf import medicine_ns, medicine_model, medicine_parser
from app.dao import dao_medicine
from flask_jwt_extended import jwt_required

from app.dao.dao_medicine import get_medicine_list
from app.models import RoleEnum
from app.utils.check_role import role_required


@medicine_ns.route('/')
class MedicineList(Resource):
    @medicine_ns.marshal_list_with(medicine_model)
    @jwt_required()
    @role_required([RoleEnum.ROLE_ADMIN.value, RoleEnum.ROLE_DENTIST.value])
    def get(self):

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
    @jwt_required()
    @role_required([RoleEnum.ROLE_ADMIN.value])
    def post(self):

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


@medicine_ns.route('/<int:medicine_id>')
class MedicineResource(Resource):
    @medicine_ns.expect(medicine_parser, validate=True)
    @medicine_ns.marshal_with(medicine_model, code=200)

    def patch(self, medicine_id):

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


@medicine_ns.route('/<int:medicine_id>/delete')
class DeleteMedicine(Resource):

    def delete(self, medicine_id):

        success = dao_medicine.delete_medicine(medicine_id)
        if success:
            return {"msg": "Đã xóa thuốc"}, 200
        return {"msg": "Không tìm thấy thuốc"}, 404