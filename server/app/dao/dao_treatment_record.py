from app import db
from app.models import TreatmentRecord

def create_treatment_record(appointment_id, service_id, price, note):
