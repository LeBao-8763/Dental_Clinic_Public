from app import db
from app.models import Service

def create_service(name, price, description):

    if Service.query.filter_by(name=name).first():
        raise ValueError("Dịch vụ với tên này đã tồn tại")

    if price < 0:
        raise ValueError("Giá dịch vụ không được âm")

    service = Service(
        name=name,
        price=price,
        description=description
    )
    db.session.add(service)
    db.session.commit()
    return service

def get_list_service():
    return Service.query.all()