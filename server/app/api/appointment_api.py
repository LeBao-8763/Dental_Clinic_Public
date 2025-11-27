from app.dao import dao_appointment
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import appointment_ns, appointment_model, appointment_creation_parser

@appointment_ns.route('/')
class Appointment(Resource):
    @appointment_ns.expect(appointment_creation_parser, validate=True)
    @appointment_ns.marshal_with(appointment_model, code=201)
    def post(self):
        data = request.json    # <-- chuẩn nhất khi nhận JSON body

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

        return {'message': 'Server Error'}, 500

