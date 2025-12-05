from flask import request
from flask_restx import Resource
from app.api_conf import appointment_ns, appointment_model, appointment_creation_parser,appointment_with_patient_model,appointment_update_parser
from app.dao import dao_appointment

@appointment_ns.route('/')
class AppointmentCreateResource(Resource):
    @appointment_ns.expect(appointment_creation_parser, validate=True)
    @appointment_ns.marshal_with(appointment_model, code=201)
    def post(self):
        # Lấy dữ liệu từ reqparse
        data = appointment_creation_parser.parse_args()

        new_appointment = dao_appointment.create_appointment(
            dentist_id=data['dentist_id'],
            patient_id=data['patient_id'],
            appointment_date=data['appointment_date'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            note=data.get('note')
        )

        if new_appointment:
            return new_appointment, 201
        
        return {"message": "Server Error"}, 500

@appointment_ns.route('/<int:appointment_id>')
class AppointmentById(Resource):
    @appointment_ns.marshal_list_with(appointment_with_patient_model)
    def get(self, appointment_id):
        """Lấy danh sách lịch hẹn của bác sĩ kèm thông tin bệnh nhân dựa theo id của cuộc hẹn"""
        appointments = dao_appointment.get_appointments_by_id(appointment_id)
        return appointments, 200

    @appointment_ns.doc("update_appointment")
    @appointment_ns.expect(appointment_update_parser,validate=True)
    @appointment_ns.marshal_with(appointment_model,code=201)
    def patch(self, appointment_id):
        """Cập nhật một cuộc hẹn theo id"""
        args = appointment_update_parser.parse_args()

        appointment = dao_appointment.update_appointment(appointment_id, **args)

        if appointment:
            return appointment, 201
        
        return {"message": "Server Error when update appointment"}, 500

@appointment_ns.route('/dentist/<int:dentist_id>')
class AppointmentByDentistResource(Resource):
    @appointment_ns.marshal_list_with(appointment_with_patient_model)
    def get(self, dentist_id):
        """Lấy danh sách lịch hẹn của bác sĩ kèm thông tin bệnh nhân"""
        appointments = dao_appointment.get_appointments_by_dentist(dentist_id)
        return appointments, 200

    