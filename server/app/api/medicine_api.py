from flask import request
from flask_restx import Resource
from app.api_conf import api, medicine_ns, medicine_model, medicine_parser
from app.dao import dao_medicine
from flask_jwt_extended import jwt_required, get_jwt_identity

@medicine_ns.route('/')
class MedicineList(Resource):
    @medicine_ns.marshal_list_with(medicine_model)
    def get(self):
        "Lấy danh sách thuốc"
        return dao_medicine.get_medicine_list()

    @medicine_ns.expect(medicine_parser, validate=True)
    @medicine_ns.marshal_with(medicine_model, code=201)
    #@jwt_required()  # chỉ admin/staff mới thao tác
    def post(self):
        "Thêm thuốc mới vào danh mục"
        #current_user = get_jwt_identity()  # có thể check role
        data = medicine_parser.parse_args()

        new_medicine = dao_medicine.create_medicine(
            name=data['name'],
            production_date=data['production_date'],
            expiration_date=data['expiration_date'],
            type=data['type'],
            amount_per_unit=data['amount_per_unit'],
            retail_unit=data['retail_unit']
        )

        if new_medicine:
            return new_medicine, 201

        return {'message': 'Server Error'}, 500
