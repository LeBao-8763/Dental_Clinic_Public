from flask import request
from flask_restx import Resource
from app import db
from app.api_conf import prescription_ns, prescription_model, prescription_parser, prescription_detail_parser
from app.dao import dao_prescription
from flask_jwt_extended import jwt_required

from app.models import Prescription, RoleEnum
from app.utils.check_role import role_required

@prescription_ns.route('/')
class PrescriptionList(Resource):
    @prescription_ns.marshal_list_with(prescription_model)
    def get(self):
        return dao_prescription.get_all_prescriptions()

    @prescription_ns.expect(prescription_parser)
    @prescription_ns.marshal_with(prescription_model, code=201)
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def post(self):
        data = request.get_json()
        if not data or 'appointment_id' not in data:
            return {'message': 'Thiếu appointment_id'}, 400

        data['status'] = data.get('status', 'DRAFT')
        prescription = dao_prescription.create_prescription(data)
        return {
            'id': prescription.id,
            'appointment_id': prescription.appointment_id,
            'note': prescription.note,
            'status': prescription.status.name
        }, 201


@prescription_ns.route('/<int:id>')
@prescription_ns.response(404, 'Không tìm thấy toa thuốc')
class PrescriptionDetail(Resource):
    @prescription_ns.marshal_with(prescription_model)
    def get(self, id):
        prescription = dao_prescription.get_prescription_by_id(id)
        if not prescription:
            prescription_ns.abort(404, 'Không tìm thấy toa thuốc')
        return prescription

    def delete(self, id):
        success = dao_prescription.delete_prescription(id)
        if not success:
            prescription_ns.abort(404, 'Không tìm thấy toa thuốc')
        return {'message': 'Đã xóa toa thuốc thành công'}, 200


@prescription_ns.route('/<int:prescription_id>/details')
class PrescriptionDetailList(Resource):
    def get(self, prescription_id):
        print("Start 1")
        return dao_prescription.get_details_by_prescription(prescription_id)

    @prescription_ns.expect(prescription_detail_parser)
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def post(self, prescription_id):
        data = request.get_json()

        if not data or 'details' not in data:
            return {'message': 'Thiếu danh sách thuốc (details)'}, 400

        data['prescription_id'] = prescription_id
        success = dao_prescription.add_details(data)

        if success:
            return {'success': True, 'message': 'Cập nhật toa thuốc thành công'}, 201
        return {'success': False, 'message': 'Có lỗi khi lưu toa thuốc'}, 400

@prescription_ns.route('/<int:prescription_id>/details/<int:medicine_id>')
class PrescriptionDetailItem(Resource):
    def delete(self, prescription_id, medicine_id):
        success = dao_prescription.delete_detail(prescription_id, medicine_id)
        if not success:
            prescription_ns.abort(404, 'Không tìm thấy chi tiết toa thuốc')
        return {'message': 'Đã xóa thuốc khỏi toa'}, 200

@prescription_ns.route('/by-appointment/<int:appointment_id>')
class PrescriptionByAppointment(Resource):
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value, RoleEnum.ROLE_STAFF.value])
    def get(self, appointment_id):
        prescription = dao_prescription.get_prescription_by_appointment(appointment_id)
        if not prescription:
            return {'message': 'Chưa có toa thuốc cho cuộc hẹn này'}, 404
        return prescription, 200

@prescription_ns.route('/<int:id>/update')
class UpdatePrescription(Resource):
    @prescription_ns.doc('update_prescription')
    @prescription_ns.expect(prescription_parser, validate=True)
    @prescription_ns.marshal_with(prescription_model, code=200)
    def patch(self, id):
        args = prescription_parser.parse_args()
        updated_prescription = dao_prescription.update_prescription(id, args)
        if updated_prescription:
            return updated_prescription, 200
        return {"msg": "Không tìm thấy toa thuốc"}, 404

@prescription_ns.route('/<int:prescription_id>/details/<int:medicine_id>/update')
class UpdatePrescriptionDetail(Resource):
    @prescription_ns.doc('update_prescription_detail')
    @prescription_ns.expect(prescription_detail_parser, validate=True)
    def patch(self, prescription_id, medicine_id):
        args = prescription_detail_parser.parse_args()
        success = dao_prescription.update_detail(prescription_id, medicine_id, args)
        if success:
            return {"msg": "Cập nhật chi tiết toa thuốc thành công"}, 200
        return {"msg": "Không tìm thấy chi tiết toa thuốc"}, 404

@prescription_ns.route('/stats/by-dentist')
class PrescriptionStatsByDentist(Resource):
    def get(self):
        from sqlalchemy import func
        stats = db.session.query(
            Prescription.dentist_id,
            func.count(Prescription.id)
        ).group_by(Prescription.dentist_id).all()

        return [{"dentist_id": dentist_id, "count": count} for dentist_id, count in stats], 200
