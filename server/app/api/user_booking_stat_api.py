from app.dao import dao_user_booking_stats
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import user_booking_stat_model, user_booking_stat_ns

@user_booking_stat_ns.route("/<int:user_id>")
class UserBookingStat(Resource):
    @user_booking_stat_ns.doc('get_user_booking_stat')
    @user_booking_stat_ns.marshal_with(user_booking_stat_model, code=201)
    def get(self, user_id):
        user_booking_stat=dao_user_booking_stats.get_user_booking_stat_by_userId(user_id)

        if user_booking_stat:
            return user_booking_stat, 201
        return 500
        