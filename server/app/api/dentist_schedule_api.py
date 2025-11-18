from app.dao import dao_dentist_schedule
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import dentist_shedule_model, dentist_shedule_parser, dentist_shedule_ns

@dentist_shedule_ns.route('/')
class UserList(Resource):
    @dentist_shedule_ns.doc('create_dentist_schedule')
    @dentist_shedule_ns.expect(dentist_shedule_parser)   # Định nghĩa định dạng request body cho Swagger UI
    @dentist_shedule_ns.marshal_with(dentist_shedule_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo lịch hẹn mới"
        args=dentist_shedule_parser.parse_args()
        new_dentist_schedule=dao_dentist_schedule.create_dentist_schedule(
            dentist_id=args.get('dentist_id'),
            day_of_week=args.get('day_of_week'),
            start_time=args.get('start_time'),
            end_time=args.get('end_time')
        )
        if new_dentist_schedule:
            return new_dentist_schedule, 201

        return 500


