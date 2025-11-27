from app.dao import dao_dentist_custom_schedule
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import dentist_custom_schedule_input_model,dentist_custom_schedule_model,dentist_custom_shedule_ns,multiple_dentist_custom_schedule_model

@dentist_custom_shedule_ns.route('/')
class Dentist_Custom_Schedule(Resource):
    @dentist_custom_shedule_ns.doc('create_dentist_custom_schedule')
    @dentist_custom_shedule_ns.expect(multiple_dentist_custom_schedule_model)   # Định nghĩa định dạng request body cho Swagger UI
    @dentist_custom_shedule_ns.marshal_with(multiple_dentist_custom_schedule_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo lịch hẹn mới"
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
    def get(self, dentist_id):
        "Lấy danh sách lịch làm việc custome của nha sĩ theo ID "
        custom_schedules=dao_dentist_custom_schedule.get_custom_schedule_by_id(dentist_id)
        return custom_schedules