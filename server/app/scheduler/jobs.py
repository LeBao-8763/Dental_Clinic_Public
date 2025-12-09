from datetime import datetime

def reset_daily_cancel():
    from app import db
    from app.models import UserBookingStats

    now = datetime.utcnow().date()

    stats_list = UserBookingStats.query.all()

    for stats in stats_list:
        stats.cancel_count_day = 0

        if stats.blocked_until and stats.blocked_until <= datetime.utcnow():
            stats.blocked_until = None

    db.session.commit()
