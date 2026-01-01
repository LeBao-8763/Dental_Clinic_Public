from decimal import Decimal
from sqlalchemy import func
from app import db
from app.models import (
    Appointment, Prescription, PrescriptionDetail, Medicine,
    MedicineImport, TreatmentRecord, Invoice,
    PrescriptionStatusEnum, AppointmentStatusEnum, MedicineTypeEnum
)
from app.dao.dao_prescription import calculate_total_dose


def deduct_stock_fifo(medicine, qty_needed):
    """Trừ tồn kho theo nguyên tắc FIFO (hạn sớm dùng trước)."""
    imports = (
        MedicineImport.query
        .filter_by(medicine_id=medicine.id)
        .filter(MedicineImport.stock_quantity > 0)
        .order_by(MedicineImport.expiration_date.asc())
        .all()
    )

    qty_to_deduct = qty_needed
    for imp in imports:
        if qty_to_deduct <= 0:
            break
        deduct = min(imp.stock_quantity, qty_to_deduct)
        imp.stock_quantity -= deduct
        qty_to_deduct -= deduct

    if qty_to_deduct > 0:
        return False  # Không đủ tồn kho

    return True


def calculate_service_fee(appointment_id):
    return Decimal(
        db.session.query(func.coalesce(func.sum(TreatmentRecord.price), 0))
        .filter(TreatmentRecord.appointment_id == appointment_id)
        .scalar()
    )

def create_invoice(appointment_id):
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return {"error": "Không tìm thấy lịch hẹn."}, 404

        # Cập nhật trạng thái lịch hẹn
        if appointment.status not in [AppointmentStatusEnum.PAID, AppointmentStatusEnum.CANCELLED]:
            appointment.status = AppointmentStatusEnum.PAID
            db.session.add(appointment)

        # Lấy toa thuốc
        prescription = Prescription.query.filter_by(appointment_id=appointment_id).first()
        if not prescription:
            return {"error": "Không tìm thấy toa thuốc."}, 404
        prescription.status = PrescriptionStatusEnum.CONFIRMED
        db.session.add(prescription)

        # --- Tính tiền thuốc ---
        total_medicine_fee = Decimal(0)
        details = PrescriptionDetail.query.filter_by(prescription_id=prescription.id).all()

        for d in details:
            medicine = Medicine.query.get(d.medicine_id)
            if not medicine:
                return {"error": f"Thuốc ID {d.medicine_id} không tồn tại."}, 400

            qty_used = calculate_total_dose(d.dosage, d.duration_days, medicine.type, medicine.capacity_per_unit)
            if not deduct_stock_fifo(medicine, qty_used):
                return {"error": f"Không đủ tồn kho cho thuốc {medicine.name}."}, 400

            medicine.reserved_quantity = max((medicine.reserved_quantity or 0) - qty_used, 0)
            total_medicine_fee += Decimal(qty_used) * Decimal(d.price or 0)
            db.session.add(medicine)

        # --- Tính phí dịch vụ + VAT ---
        total_service_fee = calculate_service_fee(appointment_id)
        vat = (total_service_fee + total_medicine_fee) * Decimal('0.1')
        total = total_service_fee + total_medicine_fee + vat

        # --- Lưu hóa đơn ---
        invoice = Invoice.query.get(appointment_id)
        if not invoice:
            invoice = Invoice(appointment_id=appointment_id)
            db.session.add(invoice)

        invoice.total_service_fee = total_service_fee
        invoice.total_medicine_fee = total_medicine_fee
        invoice.vat = vat
        invoice.total = total

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
