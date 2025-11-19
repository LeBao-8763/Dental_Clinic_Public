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
