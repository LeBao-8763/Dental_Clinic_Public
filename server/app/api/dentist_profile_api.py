from app.dao import dao_dentist_profile
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import dentist_profile_model, dentist_profile_parser, dentist_profile_ns
@dentist_profile_ns.route('/')
class Service(Resource):
    @dentist_profile_ns.doc('create_dentist_profile')
    @dentist_profile_ns.expect(dentist_profile_parser)   # Định nghĩa định dạng request body cho Swagger UI
    @dentist_profile_ns.marshal_with(dentist_profile_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo thông tin bác sĩ mới"
        args=dentist_profile_parser.parse_args()
        new_dentist_profile=dao_dentist_profile.create_dentist_profile(
            dentist_id=args.get('user_id'),
            introduction=args.get('introduction'),
            education=args.get('education'),
            experience=args.get('experience')
        )
        if new_service:
            return new_dentist_profile, 201

        return 500

@dentist_profile_ns.route('/<int:dentist_id>')
class DentistProfileResource(Resource):
    @dentist_profile_ns.doc('get_dentist_profile')
    @dentist_profile_ns.marshal_with(dentist_profile_model) # Định nghĩa định dạng response
    def get(self, dentist_id):
        "Lấy thông tin hồ sơ bác sĩ theo ID"
        profile = dao_dentist_profile.get_dentist_profile_by_dentist_id(dentist_id)
        if profile:
            return profile,201
        dentist_profile_ns.abort(404, f"Hồ sơ bác sĩ với ID {dentist_id} không tồn tại")
