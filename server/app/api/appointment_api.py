from app.dao import dao_appointment
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import appointment_ns, appointment_model, appointment_creation_parser

@appointment_ns.route('/')
class Appointment(Resource):
    @appointment_ns.doc('create_appointment')
    @appointment_ns.expect(appointment_creation_parser)   # Định nghĩa định dạng request body cho Swagger UI
    @appointment_ns.marshal_with(appointment_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo lịch hẹn mới"
        args=appointment_creation_parser.parse_args()
        new_appointment=dao_appointment.create_appointment(
            dentist_id=args.get('dentist_id'),
            patient_id=args.get('patient_id'),
            appointment_date=args.get('appointment_date'),
            start_time=args.get('start_time'),
            end_time=args.get('end_time'),
            note=args.get('note')
        )
        if new_appointment:
            return new_appointment, 201

        return 500


