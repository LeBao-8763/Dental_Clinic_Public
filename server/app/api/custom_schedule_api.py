from app import db
from app.dao import dao_dentist_custom_schedule
from flask import request
from flask_restx import Resource
from app.api_conf import dentist_custom_schedule_input_model,dentist_custom_schedule_model,dentist_custom_shedule_ns,multiple_dentist_custom_schedule_model
from flask_jwt_extended import jwt_required
from app.utils.check_role import role_required
from app.models import RoleEnum, DentistCustomSchedule


@dentist_custom_shedule_ns.route('/')
class Dentist_Custom_Schedule(Resource):
    @dentist_custom_shedule_ns.doc('create_dentist_custom_schedule')
    @dentist_custom_shedule_ns.expect(multiple_dentist_custom_schedule_model)
    @dentist_custom_shedule_ns.marshal_with(multiple_dentist_custom_schedule_model, code=201) 
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def post(self):

        data=request.get_json()
        dentist_id=data.get('dentist_id')
        custom_date=data.get('custom_date')
        note=data.get('note')
        schedules_data=data.get('schedules',[])

        new_custom_schedule=dao_dentist_custom_schedule.create_custom_schedule(
            dentist_id=dentist_id,
            custom_date=custom_date,
            note=note,
            schedules_data=schedules_data,
        )
        if new_custom_schedule:
            return {
                'dentist_id': dentist_id,
                'custom_date':custom_date,
                'is_day_off':new_custom_schedule[0].is_day_off,
                'note':note,
                'schedules': new_custom_schedule
            }, 201

        return 500

@dentist_custom_shedule_ns.route('/<int:dentist_id>')
class Dentist_Custom_Schedule_By_Id(Resource):
    @dentist_custom_shedule_ns.doc('get_custom_schedule_by_id')
    @dentist_custom_shedule_ns.marshal_with(dentist_custom_schedule_model, code=201)
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def get(self, dentist_id):

        custom_schedules=dao_dentist_custom_schedule.get_custom_schedule_by_id(dentist_id)
        return custom_schedules

@dentist_custom_shedule_ns.route('/<int:dentist_id>/<string:custom_date>')
class Dentist_Custom_Schedule_Delete(Resource):
    @dentist_custom_shedule_ns.doc('delete_custom_schedule_by_date')
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def delete(self, dentist_id, custom_date):

        try:
            deleted_count = dao_dentist_custom_schedule.delete_custom_schedule_by_date(
                dentist_id=dentist_id,
                custom_date=custom_date
            )

            return {
                "message": "Xoá lịch custom thành công",
                "deleted": deleted_count,
                "status": "nothing_to_delete" if deleted_count == 0 else "deleted"
            }, 200

        except ValueError as e:
            return {"error": str(e)}, 400

        except Exception as e:
            return {"error": "Lỗi server: " + str(e)}, 500

@dentist_custom_shedule_ns.route('/all')
class AllDentistCustomSchedules(Resource):
    @dentist_custom_shedule_ns.doc('get_all_custom_schedules')
    @dentist_custom_shedule_ns.marshal_list_with(dentist_custom_schedule_model)
    def get(self):

        schedules = dao_dentist_custom_schedule.get_all_custom_schedules()
        return schedules, 200

@dentist_custom_shedule_ns.route('/update/<int:schedule_id>')
class UpdateDentistCustomSchedule(Resource):
    @dentist_custom_shedule_ns.doc('update_custom_schedule')
    @dentist_custom_shedule_ns.expect(dentist_custom_schedule_input_model, validate=True)
    @dentist_custom_shedule_ns.marshal_with(dentist_custom_schedule_model, code=200)
    def patch(self, schedule_id):

        data = request.get_json()
        updated_schedule = dao_dentist_custom_schedule.update_custom_schedule(
            schedule_id,
            custom_date=data.get('custom_date'),
            note=data.get('note'),
            schedules_data=data.get('schedules', [])
        )
        if updated_schedule:
            return updated_schedule, 200
        return {"msg": "Không tìm thấy lịch"}, 404


@dentist_custom_shedule_ns.route('/stats')
class CustomScheduleStats(Resource):
    def get(self):
        """Admin thống kê số lượng custom schedule theo nha sĩ"""
        from sqlalchemy import func
        stats = db.session.query(
            DentistCustomSchedule.dentist_id,
            func.count(DentistCustomSchedule.id)
        ).group_by(DentistCustomSchedule.dentist_id).all()

        return [{"dentist_id": dentist_id, "count": count} for dentist_id, count in stats], 200