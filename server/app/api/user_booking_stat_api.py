from app.dao import dao_user_booking_stats
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import user_booking_stat_model, user_booking_stat_ns
from flask_jwt_extended import jwt_required
from app.utils.check_role import role_required
from app.models import RoleEnum

@user_booking_stat_ns.route("/<int:user_id>")
class UserBookingStat(Resource):
    @user_booking_stat_ns.doc('get_user_booking_stat')
    @user_booking_stat_ns.marshal_with(user_booking_stat_model, code=201)
    @jwt_required()
    def get(self, user_id):
        user_booking_stat=dao_user_booking_stats.get_user_booking_stat_by_userId(user_id)

        if user_booking_stat:
            return user_booking_stat, 201
        return 500
    
    @user_booking_stat_ns.doc('reset_user_booking_block')
    @user_booking_stat_ns.marshal_with(user_booking_stat_model, code=200)
    @jwt_required()
    def patch(self, user_id):
        """
        Reset block nếu đã hết hạn (blocked_until <= now)
        """
        user_booking_stat = dao_user_booking_stats.reset_block_if_expired(user_id)

        if not user_booking_stat:
            user_booking_stat_ns.abort(404, "User booking stat not found")

        return user_booking_stat, 200