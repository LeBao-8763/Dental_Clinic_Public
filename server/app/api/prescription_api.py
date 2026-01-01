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

@prescription_ns.route('/<int:prescription_id>/details')
class PrescriptionDetailList(Resource):

    @prescription_ns.expect(prescription_detail_parser)
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def post(self, prescription_id):
        data = request.get_json()
        result = dao_prescription.add_details(prescription_id, data)
        if result is True:
            return {'message': 'Thêm thuốc vào toa thành công'}, 201
        else:
            return result[0], 400
        
    @prescription_ns.expect(prescription_detail_parser)
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def delete(self, prescription_id):
        data = request.get_json()
        result = dao_prescription.delete_details(prescription_id, data)
        if result is True:
            return {'message': 'Xóa thuốc khỏi toa thành công'}, 200
        else:
            return result[0], 400

@prescription_ns.route('/by-appointment/<int:appointment_id>')
class PrescriptionByAppointment(Resource):
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value, RoleEnum.ROLE_STAFF.value])
    def get(self, appointment_id):
        prescription = dao_prescription.get_prescription_by_appointment(appointment_id)
        if not prescription:
            return {'message': 'Chưa có toa thuốc cho cuộc hẹn này'}, 404
        return prescription, 200

@prescription_ns.route('/stats/by-dentist')
class PrescriptionStatsByDentist(Resource):
    def get(self):
        from sqlalchemy import func
        stats = db.session.query(
            Prescription.dentist_id,
            func.count(Prescription.id)
        ).group_by(Prescription.dentist_id).all()

        return [{"dentist_id": dentist_id, "count": count} for dentist_id, count in stats], 200
