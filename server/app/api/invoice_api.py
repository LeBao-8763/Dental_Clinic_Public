
from flask_jwt_extended import jwt_required
from flask_restx import Resource


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
        if "error" in result:
            return result, status

        return result, status

@invoice_ns.route('/<int:apt_id>')
class InvoiceAptId(Resource):
    @invoice_ns.doc ("get_invoice_by_apt_id")
    @invoice_ns.marshal_with(invoice_model)
    def get(self, apt_id):
        invoice=dao_invoice.get_invoice_by_aptId(apt_id)

        if invoice:
            return invoice, 201
        return 500
