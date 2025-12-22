
from flask_jwt_extended import jwt_required
from flask_restx import Resource
from app.api_conf import medicine_import_ns, medicine_import_model, medicine_import_parser
from app.dao import dao_medicine_import
from app.models import RoleEnum
from app.utils.check_role import role_required


@medicine_import_ns.route('/')
class MedicineImportList(Resource):
    @medicine_import_ns.marshal_list_with(medicine_import_model)
    def get(self):

        return dao_medicine_import.get_medicine_import_list()

    @medicine_import_ns.expect(medicine_import_parser, validate=True)
    @medicine_import_ns.marshal_with(medicine_import_model, code=201)
    @jwt_required()
    @role_required([RoleEnum.ROLE_ADMIN.value])
    def post(self):

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


@medicine_import_ns.route('/<int:import_id>')
class MedicineImportDetail(Resource):
    @medicine_import_ns.marshal_with(medicine_import_model)
    def get(self, import_id):

        import_record = dao_medicine_import.get_import_by_id(import_id)
        if import_record:
            return import_record, 200
        return {"msg": "Không tìm thấy bản ghi nhập thuốc"}, 404


@medicine_import_ns.route('/<int:import_id>/update')
class UpdateMedicineImport(Resource):
    @medicine_import_ns.expect(medicine_import_parser, validate=True)
    @medicine_import_ns.marshal_with(medicine_import_model, code=200)
    def patch(self, import_id):

        data = medicine_import_parser.parse_args()
        updated_import = dao_medicine_import.update_import(
            import_id,
            user_id=data.get('user_id'),
            medicine_id=data.get('medicine_id'),
            quantity=data.get('quantity_imported'),
            price=data.get('price')
        )
        if updated_import:
            return updated_import, 200
        return {"msg": "Không tìm thấy bản ghi nhập thuốc"}, 404


@medicine_import_ns.route('/<int:import_id>/delete')
class DeleteMedicineImport(Resource):
    def delete(self, import_id):

        success = dao_medicine_import.delete_import(import_id)
        if success:
            return {"msg": "Đã xóa bản ghi nhập thuốc"}, 200
        return {"msg": "Không tìm thấy bản ghi nhập thuốc"}, 404