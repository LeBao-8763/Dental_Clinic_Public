from app.dao import dao_clinic_hour
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import clinic_hours_model, clinic_hours_parser, clinic_hours_ns

@clinic_hours_ns.route('/')
class UserList(Resource):
    @clinic_hours_ns.doc('create_clinic_hour')
    @clinic_hours_ns.expect(clinic_hours_parser)   # Định nghĩa định dạng request body cho Swagger UI
    @clinic_hours_ns.marshal_with(clinic_hours_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo lịch hẹn mới"
        args=clinic_hours_parser.parse_args()
        new_clinic_hour=dao_clinic_hour.create_user(
            day_of_week=args.get('day_of_week'),
            open_time=args.get('open_time'),
            close_time=args.get('close_time'),
            slot_duration_minutes=args.get('slot_duration_minutes')
        )
        if new_clinic_hour:
            return new_clinic_hour, 201

        return 500


