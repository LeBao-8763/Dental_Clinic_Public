from flask import request
from flask_restx import Resource
from app.api_conf import medicine_import_ns, medicine_import_model, medicine_import_parser
from app.dao import dao_medicine_import, dao_medicine


# from flask_jwt_extended import jwt_required, get_jwt_identity

@medicine_import_ns.route('/')
class MedicineImportList(Resource):
    @medicine_import_ns.marshal_list_with(medicine_import_model)
    def get(self):
        "Lấy danh sách các loại thuốc"
        return dao_medicine_import.get_medicine_import_list()

    @medicine_import_ns.expect(medicine_import_parser, validate=True)
    @medicine_import_ns.marshal_with(medicine_import_model, code=201)
    #@jwt_required()  # nếu muốn chỉ admin/staff
    def post(self):
        "Nhập thuốc vào kho"
        data = medicine_import_parser.parse_args()

        new_import = dao_medicine_import.import_medicine(
            user_id=data['user_id'],
            medicine_id=data['medicine_id'],
            quantity=data['quantity_imported'],
            production_date=data['production_date'],
            expiration_date=data['expiration_date'],
            price=data['price']
        )

        if new_import:
            return new_import, 201

        return {'message': 'Không tìm thấy thuốc'}, 404
