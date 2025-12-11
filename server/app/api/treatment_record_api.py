from app.dao import dao_treatment_record
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import treatment_record_ns,treatment_record_input_model,treatment_records_create_model,treatment_record_model

@treatment_record_ns.route('/')
class UserList(Resource):
    @treatment_record_ns.doc('create_treatment_record')
    @treatment_record_ns.expect(treatment_record_model)   # Định nghĩa định dạng request body cho Swagger UI
    @treatment_record_ns.marshal_with(treatment_record_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo một hoặc nhiều bảng ghi hồ sơ điều trị mới"
        data=request.get_json()
        appointment_id=data.get('appointment_id')
        services_data=data.get('services',[])

        new_treatment_records=dao_treatment_record.create_multiple_treatment_records(
            appointment_id=appointment_id,
            services_data=services_data
        )

        if new_treatment_records:
            return new_treatment_records, 201

        return 500

@treatment_record_ns.route('/appointment/<int:appointment_id>')
class TreatmentRecordByAppointment(Resource):
    @treatment_record_ns.doc('get_treatment_record_by_aptId')
    @treatment_record_ns.marshal_with(treatment_record_model, code=201)
    def get(self, appointment_id):
        '''Lấy các phương thức điều trị của một cuộc hẹn '''
        treatment_records=dao_treatment_record.get_treatment_record_by_aptId(appointment_id)

        if(treatment_records):
            return treatment_records, 200

        return 500

    @treatment_record_ns.doc('delete_treatment_records_by_aptId')
    @treatment_record_ns.response(200, 'Xóa thành công')
    @treatment_record_ns.response(400, 'Xóa lỗi')
    def delete(self, appointment_id):
        """
        Xóa tất cả bản ghi điều trị đã chọn
        """
        try:
            deleted_count = dao_treatment_record.delete_treatment_records_by_aptId(appointment_id)
            
            
            # Trả về 200 cho cả trường hợp không có lịch để xóa
            return {
                'message': f'Đã xóa {deleted_count} record' if deleted_count > 0 else 'Không có record nào để xóa',
                'deleted_count': deleted_count
            }, 200
            
        except ValueError as e:
            return {'error': str(e)}, 400
        except Exception as e:
            return {'error': 'Lỗi server', 'detail': str(e)}, 500

#huy-dev
#Lấy tất cả hồ sơ điều trị
@treatment_record_ns.route('/all')
class AllTreatmentRecords(Resource):
    @treatment_record_ns.doc('get_all_treatment_records')
    @treatment_record_ns.marshal_list_with(treatment_record_model)
    def get(self):
        """Admin lấy tất cả hồ sơ điều trị"""
        records = dao_treatment_record.get_all_treatment_records()
        return records, 200

#Cập nhật hồ sơ điều trị theo ID
@treatment_record_ns.route('/<int:record_id>/update')
class UpdateTreatmentRecord(Resource):
    @treatment_record_ns.doc('update_treatment_record')
    @treatment_record_ns.expect(treatment_record_input_model, validate=True)
    @treatment_record_ns.marshal_with(treatment_record_model, code=200)
    def patch(self, record_id):
        """Admin cập nhật hồ sơ điều trị theo ID"""
        data = request.get_json()
        updated_record = dao_treatment_record.update_treatment_record(
            record_id,
            service_id=data.get('service_id'),
            note=data.get('note')
        )
        if updated_record:
            return updated_record, 200
        return {"msg": "Không tìm thấy hồ sơ điều trị"}, 404

#Thống kê hồ sơ điều trị theo dịch vụ
@treatment_record_ns.route('/stats/by-service')
class TreatmentRecordStats(Resource):
    def get(self):
        """Admin thống kê số lượng hồ sơ điều trị theo dịch vụ"""
        from sqlalchemy import func
        stats = db.session.query(
            TreatmentRecord.service_id,
            func.count(TreatmentRecord.id)
        ).group_by(TreatmentRecord.service_id).all()

        return [{"service_id": service_id, "count": count} for service_id, count in stats], 200
