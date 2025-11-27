from app.dao import dao_dentist_schedule
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import dentist_shedule_model, dentist_shedule_parser, dentist_shedule_ns, multiple_schedule_model

@dentist_shedule_ns.route('/')
class Dental_Schedule(Resource):
    @dentist_shedule_ns.doc('create_dentist_schedule')
    @dentist_shedule_ns.expect(multiple_schedule_model)   # Định nghĩa định dạng request body cho Swagger UI
    @dentist_shedule_ns.marshal_with(multiple_schedule_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo lịch hẹn mới"
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
    @dentist_shedule_ns.marshal_list_with(dentist_shedule_model) # Định nghĩa định dạng response
    def get(self, dentist_id):
        "Lấy danh sách lịch làm việc của nha sĩ theo ID và ngày trong tuần (nếu có)"
        day_of_week = request.args.get('day_of_week')
        schedules = dao_dentist_schedule.get_dentist_schedules(dentist_id, day_of_week)
        return schedules



@dentist_shedule_ns.route('/<int:dentist_id>/<string:day_of_week>')
class DentistScheduleByDay(Resource):
    @dentist_shedule_ns.doc('delete_dentist_schedules_by_day')
    @dentist_shedule_ns.response(200, 'Xóa thành công')
    @dentist_shedule_ns.response(400, 'day_of_week không hợp lệ')
    def delete(self, dentist_id, day_of_week):
        """
        Xóa tất cả lịch làm việc của bác sĩ trong một ngày cụ thể
        """
        try:
            deleted_count = dao_dentist_schedule.delete_dentist_schedules_by_day(
                dentist_id, 
                day_of_week.upper()
            )
            
            # Trả về 200 cho cả trường hợp không có lịch để xóa
            return {
                'message': f'Đã xóa {deleted_count} lịch làm việc' if deleted_count > 0 else 'Không có lịch làm việc nào để xóa',
                'deleted_count': deleted_count
            }, 200
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': 'Lỗi server', 'detail': str(e)}, 500

