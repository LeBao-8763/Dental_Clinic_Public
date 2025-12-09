from app import db
from app.models import User, UserBookingStats

MAX_CANCEL_PER_DAY = 4
BLOCK_HOURS = 24

def create_user_booking_stats(user_id):
    user=User.query.filter_by(id=user_id).first()

    if not user:
        raise ValueError("Không có user này tồn tại!")
    
   # Nếu user đã có stats thì bỏ qua
    if user.booking_stats:
        return user.booking_stats

    stats = UserBookingStats(
        user_id=user_id,
        cancel_count_day=0,
        last_cancel_at=None,
        blocked_until=None
    )

    db.session.add(stats)
    db.session.commit()
    
    return stats

def update_user_booking_stats(user_id):
    stats = UserBookingStats.query.filter_by(user_id=user_id).first()

    if not stats:
        stats = create_user_booking_stats(user_id)
    
    now = datetime.utcnow()

    stats.cancel_count_day+=1
    stats.last_cancel_at=now

    if stats.cancel_count_day >= MAX_CANCEL_PER_DAY:
        stats.blocked_until = now + timedelta(hours=BLOCK_HOURS)

    db.session.commit()
    return stats


