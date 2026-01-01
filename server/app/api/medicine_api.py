
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
    # @jwt_required()
    # @role_required([RoleEnum.ROLE_ADMIN.value, RoleEnum.ROLE_DENTIST.value])
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

