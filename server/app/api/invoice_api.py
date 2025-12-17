# app/api/invoice_api.py
from flask_jwt_extended import jwt_required
from flask_restx import Resource
from flask import request

from app.api_conf import invoice_ns, invoice_parser, invoice_model
from app.dao import dao_invoice
from app.models import RoleEnum
from app.utils.check_role import role_required


@invoice_ns.route('/')
class CreateInvoice(Resource):
    @invoice_ns.doc ("create invoice")
    @invoice_ns.expect(invoice_parser)
    @invoice_ns.marshal_with(invoice_model)
    @jwt_required()
    @role_required([RoleEnum.ROLE_STAFF.value])
    def post(self):
        data = invoice_parser.parse_args()
        appointment_id = data.get("appointment_id")

        result, status = dao_invoice.create_invoice(appointment_id)
        return result, status
