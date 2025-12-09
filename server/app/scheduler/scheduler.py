from apscheduler.schedulers.background import BackgroundScheduler

def init_scheduler(app):
    scheduler = BackgroundScheduler(timezone="Asia/Ho_Chi_Minh")

    # Khai báo job chạy lúc 00:00
    @scheduler.scheduled_job(
        trigger="cron",
        hour=0,
        minute=0
    )
    def job_reset_daily():
        with app.app_context():
            from app.scheduler.jobs import reset_daily_cancel
            reset_daily_cancel()

    scheduler.start()
    app.scheduler = scheduler
