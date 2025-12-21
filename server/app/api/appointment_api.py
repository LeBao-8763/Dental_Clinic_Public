from flask import jsonify, request
from flask_restx import Resource
from app.api_conf import appointment_ns, appointment_model, appointment_creation_parser,appointment_with_user_model,appointment_update_parser,patient_appointment_pagination_res_model
from app.dao import dao_appointment
from datetime import datetime
from flask_jwt_extended import jwt_required
from app.utils.check_role import role_required
from app.models import RoleEnum


@appointment_ns.route('/')
class AppointmentCreateResource(Resource):
    @appointment_ns.expect(appointment_creation_parser, validate=True)
    @appointment_ns.marshal_with(appointment_model, code=201)
    @jwt_required()
    def post(self):
        data = appointment_creation_parser.parse_args()

        try:
            new_appointment = dao_appointment.create_appointment(
                dentist_id=data['dentist_id'],
                appointment_date=data['appointment_date'],
                start_time=data['start_time'],
                end_time=data['end_time'],

                # user booking
                patient_id=data.get('patient_id'),

                # guest booking (chưa dùng thì None)
                patient_name=data.get('patient_name'),
                patient_phone=data.get('patient_phone'),
                date_of_birth=data.get('date_of_birth'),
                gender=data.get('gender'),

                note=data.get('note')
            )
            return new_appointment, 201

        except ValueError as e:
            return {"message": str(e)}, 400

        except Exception:
            return {"message": "Server Error"}, 500


    @appointment_ns.marshal_list_with(appointment_with_user_model)
    @jwt_required()
    @role_required([RoleEnum.ROLE_STAFF.value])
    def get(self):
        status = request.args.get('status')
        date_str = request.args.get('date')
        keyword= request.args.get('keyword')

        appointment_date = None
        if date_str:
            appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        appointments = dao_appointment.get_all_appointment_with_filter(
            status=status,
            appointment_date=appointment_date,
            keyword=keyword
        )

        for appt in appointments:
            appt.user = appt.patient

        return appointments, 200
        

@appointment_ns.route('/<int:appointment_id>')
class AppointmentById(Resource):
    @appointment_ns.marshal_list_with(appointment_with_user_model)
    def get(self, appointment_id):
        """Lấy danh sách lịch hẹn của bác sĩ kèm thông tin bệnh nhân dựa theo id của cuộc hẹn"""
        appointments = dao_appointment.get_appointments_by_id(appointment_id)

        appointments.user = appointments.patient

        return appointments, 200

    @appointment_ns.doc("update_appointment")
    @appointment_ns.expect(appointment_update_parser,validate=True)
    @appointment_ns.marshal_with(appointment_model,code=201)
    @jwt_required()
    def patch(self, appointment_id):
        """Cập nhật một cuộc hẹn theo id"""
        args = appointment_update_parser.parse_args()

        appointment = dao_appointment.update_appointment(appointment_id, **args)

        if appointment:
            return appointment, 201
        
        return {"message": "Server Error when update appointment"}, 500

@appointment_ns.route('/dentist/<int:dentist_id>')
class AppointmentByDentistResource(Resource):
    @appointment_ns.marshal_list_with(appointment_with_user_model)
    @jwt_required()
    @role_required([RoleEnum.ROLE_DENTIST.value])
    def get(self, dentist_id):
        """Lấy danh sách lịch hẹn của bác sĩ kèm thông tin bệnh nhân"""

        status = request.args.get('status')
        date_str = request.args.get('date')
        keyword= request.args.get('keyword')

        appointment_date = None
        if date_str:
            appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        appointments = dao_appointment.get_appointments_by_dentist(
            dentist_id=dentist_id,
            status=status,
            appointment_date=appointment_date,
            keyword=keyword
        )

         # Gán patient vào user
        for appt in appointments:
            appt.user = appt.patient


        return appointments, 200
        
@appointment_ns.route('/check-max/<int:dentist_id>/<string:date>')
class CheckMaxAppointment(Resource):
    def get(self, dentist_id, date):
        """Check xem bác sĩ đã có 5 lịch trên ngày hay chưa"""
        return dao_appointment.check_max_dentist_schedule(dentist_id, date)

@appointment_ns.route('/check-weekly-booking/<int:patient_id>/<string:date>')
class CheckMaxAppointment(Resource):
    def get(self, patient_id,date):
        """Check xem trong tuần đó bệnh nhân đã có lịch hay chưa"""
        target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else None
        blocked = dao_appointment.has_unfinished_appointment_in_current_week(
            patient_id=patient_id,
            target_date=target_date
        )
        return blocked, 200


@appointment_ns.route('/patient/<int:patient_id>')
class AppointmentByPatientResource(Resource):
    @appointment_ns.marshal_list_with(patient_appointment_pagination_res_model)
    @jwt_required()
    def get(self, patient_id):
        """Lấy danh sách lịch hẹn của bác sĩ kèm thông tin bệnh nhân"""

        status = request.args.get('status')
        start_date_str=request.args.get('start_date')
        end_date_str=request.args.get('end_date')
        keyword=request.args.get('keyword')
        
        page = request.args.get('page', type=int)
        per_page = request.args.get('per_page', type=int)

        
        start_date = None
        end_date = None

        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date= datetime.strptime(end_date_str,"%Y-%m-%d").date()

        result = dao_appointment.get_appointments_by_patient(
            patient_id=patient_id,
            status=status,
            start_date=start_date,
            end_date=end_date,
            keyword=keyword,
            page=page,
            per_page=per_page
        )

        for appt in result["items"]:
            appt.user = appt.dentist

        return {
            "data": result["items"],
            "pagination": {
                "page": result["page"],
                "per_page": result["per_page"],
                "total": result["total"],
                "total_pages": result["total_pages"]
            }
        }, 200

#huy-dev 
#Lấy tất cả lịch hẹn không giới hạn bác sĩ
@appointment_ns.route('/all')
class AllAppointments(Resource):
    @appointment_ns.marshal_list_with(appointment_with_user_model)
    def get(self):
        """Admin lấy tất cả lịch hẹn"""
        appointments = dao_appointment.get_all_appointments()
        return appointments, 200

#Xóa lịch hẹn theo ID
@appointment_ns.route('/<int:appointment_id>/delete')
class DeleteAppointment(Resource):
    def delete(self, appointment_id):
        """Admin xóa lịch hẹn theo ID"""
        success = dao_appointment.delete_appointment(appointment_id)
        if success:
            return {"message": "Đã xóa lịch hẹn"}, 200
        return {"message": "Không tìm thấy lịch hẹn"}, 404

#Thống kê số lượng lịch hẹn theo ngày
@appointment_ns.route('/stats/by-date')
class AppointmentStats(Resource):
    def get(self):
        """Admin thống kê số lượng lịch hẹn theo ngày"""
        from sqlalchemy import func
        stats = db.session.query(
            Appointment.appointment_date,
            func.count(Appointment.id)
        ).group_by(Appointment.appointment_date).all()

        return [{"date": str(date), "count": count} for date, count in stats], 200