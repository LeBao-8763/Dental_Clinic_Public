from decimal import Decimal

from app import db
from app.models import (
    Appointment, Prescription, PrescriptionDetail,
    Medicine, MedicineImport, TreatmentRecord, Invoice, PrescriptionStatusEnum, AppointmentStatusEnum
)
from sqlalchemy import func


def create_invoice(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        if (appointment.status != AppointmentStatusEnum.PAID
                and appointment.status != AppointmentStatusEnum.CANCELLED):
            appointment.status = AppointmentStatusEnum.PAID

        prescription = Prescription.query.filter_by(appointment_id=appointment_id).first()
        if not prescription:
            return {"error": "Không tìm thấy toa thuốc của lịch hẹn này."}, 404

        prescription.status = PrescriptionStatusEnum.CONFIRMED

        details = PrescriptionDetail.query.filter_by(prescription_id=prescription.id).all()
        total_medicine_fee = Decimal(0)

        for d in details:
            medicine = Medicine.query.get(d.medicine_id)
            if not medicine:
                return {"error": f"Thuốc ID {d.medicine_id} không tồn tại."}, 400

            total_medicine_fee += Decimal(d.price or 0) * Decimal(d.dosage or 0) * Decimal(d.duration_days or 1)

            qty_to_deduct = (d.dosage or 0) * (d.duration_days or 1)
            qty_used = qty_to_deduct

            imports = (
                MedicineImport.query.filter_by(medicine_id=medicine.id)
                .filter(MedicineImport.stock_quantity > 0)
                .order_by(MedicineImport.expiration_date.asc())
                .all()
            )

            for imp in imports:
                if qty_to_deduct <= 0:
                    break
                if imp.stock_quantity >= qty_to_deduct:
                    imp.stock_quantity -= qty_to_deduct
                    qty_to_deduct = 0
                else:
                    qty_to_deduct -= imp.stock_quantity
                    imp.stock_quantity = 0

            if qty_to_deduct > 0:
                return {"error": f"Không đủ tồn kho cho thuốc {medicine.name}."}, 400

            reserved_now = medicine.reserved_quantity or 0
            medicine.reserved_quantity = max(reserved_now - qty_used, 0)
            db.session.add(medicine)

        total_service_fee = Decimal(
            db.session.query(func.coalesce(func.sum(TreatmentRecord.price), 0))
            .filter(TreatmentRecord.appointment_id == appointment_id)
            .scalar()
        )

        vat = (total_service_fee + total_medicine_fee) * Decimal(0.1)
        total = total_service_fee + total_medicine_fee + vat

        invoice = Invoice.query.get(appointment_id)
        if invoice:
            invoice.total_service_fee = total_service_fee
            invoice.total_medicine_fee = total_medicine_fee
            invoice.vat = vat
            invoice.total = total
        else:
            invoice = Invoice(
                appointment_id=appointment_id,
                total_service_fee=total_service_fee,
                total_medicine_fee=total_medicine_fee,
                vat=vat,
                total=total
            )
            db.session.add(invoice)

        db.session.commit()

        return {
            "message": "Tạo hóa đơn thành công.",
            "appointment_id": appointment_id,
            "total_service_fee": float(total_service_fee),
            "total_medicine_fee": float(total_medicine_fee),
            "vat": float(vat),
            "total": float(total)
        }, 201

    except Exception as e:
        db.session.rollback()
        print(e)
        return {"error": str(e)}, 500

def get_invoice_by_aptId(apt_id):
    return Invoice.query.filter_by(appointment_id=apt_id).first()
