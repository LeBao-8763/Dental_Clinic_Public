from app import db
from app.dao import dao_dentist_schedule
from flask import request
from flask_restx import Resource
from app.api_conf import dentist_shedule_model, dentist_shedule_parser, dentist_shedule_ns, multiple_schedule_model
from flask_jwt_extended import jwt_required
from app.utils.check_role import role_required
from app.models import RoleEnum, DentistSchedule


@dentist_shedule_ns.route('/')
class Dental_Schedule(Resource):
    @dentist_shedule_ns.doc('create_dentist_schedule')
    @dentist_shedule_ns.expect(multiple_schedule_model)
    @dentist_shedule_ns.marshal_with(multiple_schedule_model, code=201) 
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def post(self):

        data=request.get_json()
        dentist_id=data.get('dentist_id')
        day_of_week=data.get('day_of_week')
        schedules_data=data.get('schedules',[])

        new_dentist_schedule=dao_dentist_schedule.create_multiple_dentist_schedules(
            dentist_id=dentist_id,
            day_of_week=day_of_week,
            schedules_data=schedules_data
        )
        if new_dentist_schedule:
            return {
                'dentist_id': dentist_id,
                'day_of_week': day_of_week,
                'schedules': new_dentist_schedule
            }, 201

        return 500


@dentist_shedule_ns.route('/<int:dentist_id>')
class DentistScheduleList(Resource):
    @dentist_shedule_ns.doc('get_dentist_schedules')
    @dentist_shedule_ns.param('day_of_week', "Ngày trong tuần để lọc lịch làm việc (tùy chọn)")
    @dentist_shedule_ns.marshal_list_with(dentist_shedule_model)
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def get(self, dentist_id):

        day_of_week = request.args.get('day_of_week')
        schedules = dao_dentist_schedule.get_dentist_schedules(dentist_id, day_of_week)
        return schedules


@dentist_shedule_ns.route('/<int:dentist_id>/<string:date>')
class DentistScheduleList(Resource):
    @dentist_shedule_ns.doc('get_available_dentist_schedules')
    @dentist_shedule_ns.marshal_list_with(dentist_shedule_model)
    def get(self, dentist_id, date):

        schedules=dao_dentist_schedule.get_available_schedule_by_date(dentist_id, date)

        if schedules:
            return schedules, 201
        return 500

@dentist_shedule_ns.route('/<int:dentist_id>/<string:day_of_week>')
class DentistScheduleByDay(Resource):
    @dentist_shedule_ns.doc('delete_dentist_schedules_by_day')
    @dentist_shedule_ns.response(200, 'Xóa thành công')
    @dentist_shedule_ns.response(400, 'day_of_week không hợp lệ')
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def delete(self, dentist_id, day_of_week):

        try:
            deleted_count = dao_dentist_schedule.delete_dentist_schedules_by_day(
                dentist_id, 
                day_of_week.upper()
            )
            

            return {
                'message': f'Đã xóa {deleted_count} lịch làm việc' if deleted_count > 0 else 'Không có lịch làm việc nào để xóa',
                'deleted_count': deleted_count
            }, 200
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': 'Lỗi server', 'detail': str(e)}, 500


@dentist_shedule_ns.route('/all')
class AllDentistSchedules(Resource):
    @dentist_shedule_ns.doc('get_all_dentist_schedules')
    @dentist_shedule_ns.marshal_list_with(dentist_shedule_model)
    def get(self):

        schedules = dao_dentist_schedule.get_all_dentist_schedules()
        return schedules, 200


@dentist_shedule_ns.route('/update/<int:schedule_id>')
class UpdateDentistSchedule(Resource):
    @dentist_shedule_ns.doc('update_dentist_schedule')
    @dentist_shedule_ns.expect(dentist_shedule_parser, validate=True)
    @dentist_shedule_ns.marshal_with(dentist_shedule_model, code=200)
    def patch(self, schedule_id):

        args = dentist_shedule_parser.parse_args()
        updated_schedule = dao_dentist_schedule.update_dentist_schedule(
            schedule_id,
            day_of_week=args.get('day_of_week'),
            start_time=args.get('start_time'),
            end_time=args.get('end_time')
        )
        if updated_schedule:
            return updated_schedule, 200
        return {"msg": "Không tìm thấy lịch làm việc"}, 404


@dentist_shedule_ns.route('/stats')
class DentistScheduleStats(Resource):
    def get(self):

        from sqlalchemy import func
        stats = db.session.query(
            DentistSchedule.dentist_id,
            func.count(DentistSchedule.id)
        ).group_by(DentistSchedule.dentist_id).all()

        return [{"dentist_id": dentist_id, "count": count} for dentist_id, count in stats], 200