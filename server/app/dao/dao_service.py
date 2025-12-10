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

#huy-dev
def update_service(service_id, name=None, price=None, description=None):
    service = Service.query.get(service_id)
    if not service:
        return None
    if name: service.name = name
    if price: service.price = price
    if description: service.description = description
    db.session.commit()
    return service

def delete_service(service_id):
    service = Service.query.get(service_id)
    if not service:
        return False
    db.session.delete(service)
    db.session.commit()
    return True