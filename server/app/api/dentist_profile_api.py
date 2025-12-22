from app.dao import dao_dentist_profile

from flask_restx import Resource
from app.api_conf import dentist_profile_model, dentist_profile_parser, dentist_profile_ns
@dentist_profile_ns.route('/')
class Service(Resource):
    @dentist_profile_ns.doc('create_dentist_profile')
    @dentist_profile_ns.expect(dentist_profile_parser)
    @dentist_profile_ns.marshal_with(dentist_profile_model, code=201)
    def post(self):

        args=dentist_profile_parser.parse_args()
        new_dentist_profile=dao_dentist_profile.create_dentist_profile(
            dentist_id=args.get('user_id'),
            introduction=args.get('introduction'),
            education=args.get('education'),
            experience=args.get('experience')
        )

        if new_dentist_profile:
            return new_dentist_profile, 201

        return 500

@dentist_profile_ns.route('/<int:dentist_id>')
class DentistProfileResource(Resource):
    @dentist_profile_ns.doc('get_dentist_profile')
    @dentist_profile_ns.marshal_with(dentist_profile_model)
    def get(self, dentist_id):

        profile = dao_dentist_profile.get_dentist_profile_by_dentist_id(dentist_id)
        if profile:
            return profile,201
        dentist_profile_ns.abort(404, f"Hồ sơ bác sĩ với ID {dentist_id} không tồn tại")

@dentist_profile_ns.route('/<int:dentist_id>/update')
class UpdateDentistProfile(Resource):
    @dentist_profile_ns.doc('update_dentist_profile')
    @dentist_profile_ns.expect(dentist_profile_parser, validate=True)
    @dentist_profile_ns.marshal_with(dentist_profile_model, code=200)
    def patch(self, dentist_id):

        args = dentist_profile_parser.parse_args()
        updated_profile = dao_dentist_profile.update_dentist_profile(
            dentist_id=dentist_id,
            introduction=args.get('introduction'),
            education=args.get('education'),
            experience=args.get('experience')
        )
        if updated_profile:
            return updated_profile, 200
        return {"msg": "Không tìm thấy hồ sơ bác sĩ"}, 404


@dentist_profile_ns.route('/<int:dentist_id>/delete')
class DeleteDentistProfile(Resource):
    @dentist_profile_ns.doc('delete_dentist_profile')
    def delete(self, dentist_id):

        success = dao_dentist_profile.delete_dentist_profile(dentist_id)
        if success:
            return {"msg": "Đã xóa hồ sơ bác sĩ"}, 200
        return {"msg": "Không tìm thấy hồ sơ bác sĩ"}, 404