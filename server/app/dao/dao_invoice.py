from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import func
from app import db
from app.models import (
    Appointment, Prescription, PrescriptionDetail, Medicine,
    MedicineImport, TreatmentRecord, Invoice,
    PrescriptionStatusEnum, AppointmentStatusEnum, MedicineTypeEnum
)
from app.dao.dao_prescription import calculate_total_dose
import os
from dotenv import load_dotenv

load_dotenv()

def deduct_stock_fifo(medicine, qty_needed, duration_days, is_payment=False):
    today = date.today()
    min_expiration_required = today + timedelta(days=duration_days)
    print(duration_days)
    print(min_expiration_required)

    """Trừ tồn kho theo nguyên tắc FIFO (hạn sớm dùng trước)."""
    imports = (
        MedicineImport.query
        .filter(
            MedicineImport.medicine_id == medicine.id,
            MedicineImport.stock_quantity > 0,
            MedicineImport.expiration_date >= min_expiration_required
        )
        .order_by(MedicineImport.expiration_date.asc())
        .all()
    )

    print(f"Available imports for medicine ID {medicine.id}: {[imp.id for imp in imports]}")

    qty_to_deduct = qty_needed
    for imp in imports:
        if qty_to_deduct <= 0:
            break
        deduct = min(imp.stock_quantity, qty_to_deduct)
        imp.stock_quantity -= deduct
        qty_to_deduct -= deduct
        if is_payment:
            db.session.add(imp)
    
    if qty_to_deduct > 0:
        return False  # Không đủ tồn kho
    
    db.session.commit()

    return True


def calculate_service_fee(appointment_id):
    return Decimal(
        db.session.query(func.coalesce(func.sum(TreatmentRecord.price), 0))
        .filter(TreatmentRecord.appointment_id == appointment_id)
        .scalar()
    )

def create_invoice(appointment_id):
    try:
        print(f"Creating invoice for appointment ID: {appointment_id}")
        appointment = Appointment.query.filter_by(
            id=appointment_id,
            status=AppointmentStatusEnum.COMPLETED
        ).first()
        print(f"Fetched appointment: {appointment.id if appointment else 'None'}")
        if not appointment:
            return {"error": "Không tìm thấy lịch hẹn."}, 404

        # Cập nhật trạng thái lịch hẹn
        appointment.status = AppointmentStatusEnum.PAID
        db.session.add(appointment)

        # Lấy và cập nhật trạng thái toa thuốc
        prescription = Prescription.query.filter_by(
            appointment_id=appointment_id,
            status=PrescriptionStatusEnum.DRAFT
        ).first()
        if not prescription:
            return {"error": "Không tìm thấy toa thuốc."}, 404
        prescription.status = PrescriptionStatusEnum.CONFIRMED
        db.session.add(prescription)

        # --- Tính tiền thuốc ---
        total_medicine_fee = Decimal(0)
        details = PrescriptionDetail.query.filter_by(prescription_id=prescription.id).all()

        print("tới lấy chi tiết rồi")

        for d in details:
            medicine = Medicine.query.get(d.medicine_id)
            print(f"Processing medicine ID: {medicine.id if medicine else 'None'}")
            if not medicine:
                return {"error": f"Thuốc ID {d.medicine_id} không tồn tại."}, 400

            qty_used = calculate_total_dose(d.dosage, d.duration_days, medicine.type, medicine.capacity_per_unit)
            print(f"Calculated qty_used: {qty_used}")
            success = deduct_stock_fifo(medicine, qty_used, d.duration_days, is_payment=True)
            print(f"Deduct stock FIFO success: {success}")
            if not success:
                return {"error": f"Không đủ tồn kho cho thuốc {medicine.name}."}, 400
            print("đang cập nhật")
            medicine.reserved_quantity = max((medicine.reserved_quantity or 0) - qty_used, 0)
            total_medicine_fee += Decimal(qty_used) * Decimal(d.price or 0)
            db.session.add(medicine)

        # --- Tính phí dịch vụ + VAT ---
        total_service_fee = calculate_service_fee(appointment_id)
        vat = (total_service_fee + total_medicine_fee) * Decimal(os.getenv("VAT", "0.1"))
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

        print("tới đây rồi")

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
