from app.dao import dao_stats
from app.api_conf import stats_ns
from flask_restx import Resource

@stats_ns.route('/')
class ClinicSummaryAPI(Resource):
    def get(self):
        """
        Thống kê tổng quan phòng khám
        """
        data = dao_stats.general_revenue()
        return {
            "status": 200,
            "data": data
        }