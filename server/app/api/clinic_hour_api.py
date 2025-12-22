from app.dao import dao_clinic_hour
from flask_restx import Resource
from app.api_conf import clinic_hours_model, clinic_hours_parser, clinic_hours_ns

@clinic_hours_ns.route('/')
class UserList(Resource):
    @clinic_hours_ns.doc('create_clinic_hour')
    @clinic_hours_ns.expect(clinic_hours_parser)
    @clinic_hours_ns.marshal_with(clinic_hours_model, code=201)
    def post(self):

        args=clinic_hours_parser.parse_args()
        new_clinic_hour=dao_clinic_hour.create_clinic_hour(
            day_of_week=args.get('day_of_week'),
            open_time=args.get('open_time'),
            close_time=args.get('close_time'),
            slot_duration_minutes=args.get('slot_duration_minutes')
        )
        if new_clinic_hour:
            return new_clinic_hour, 201

        return 500
    @clinic_hours_ns.doc('get_all_clinic_hours')
    @clinic_hours_ns.marshal_list_with(clinic_hours_model)
    def get(self):

        clinic_hours=dao_clinic_hour.get_all_clinic_hours()
        return clinic_hours


@clinic_hours_ns.route('/<int:clinic_hour_id>')
class ClinicHourById(Resource):
    @clinic_hours_ns.doc('update_clinic_hour')
    @clinic_hours_ns.expect(clinic_hours_parser, validate=True)
    @clinic_hours_ns.marshal_with(clinic_hours_model, code=200)
    def patch(self, clinic_hour_id):

        args = clinic_hours_parser.parse_args()
        updated_clinic_hour = dao_clinic_hour.update_clinic_hour(
            clinic_hour_id,
            day_of_week=args.get('day_of_week'),
            open_time=args.get('open_time'),
            close_time=args.get('close_time'),
            slot_duration_minutes=args.get('slot_duration_minutes')
        )
        if updated_clinic_hour:
            return updated_clinic_hour, 200
        return {"msg": "Không tìm thấy lịch làm việc"}, 404


@clinic_hours_ns.route('/<int:clinic_hour_id>/delete')
class DeleteClinicHour(Resource):
    def delete(self, clinic_hour_id):

        success = dao_clinic_hour.delete_clinic_hour(clinic_hour_id)
        if success:
            return {"msg": "Đã xóa lịch làm việc"}, 200
        return {"msg": "Không tìm thấy lịch làm việc"}, 404



