from decimal import Decimal

from app import db
from app.models import (
    Appointment, Prescription, PrescriptionDetail,
    Medicine, MedicineImport, TreatmentRecord, Invoice, PrescriptionStatusEnum
)
from sqlalchemy import func


def create_invoice(appointment_id):
    try:
        # 1️⃣ Lấy toa thuốc theo appointment_id (giả sử mỗi appointment chỉ có 1 prescription)
        prescription = Prescription.query.filter_by(appointment_id=appointment_id).first()
        if not prescription:
            return {"error": "Không tìm thấy toa thuốc của lịch hẹn này."}, 404

        # 2️⃣ Xác nhận toa thuốc
        prescription.status = PrescriptionStatusEnum.CONFIRMED

        # 3️⃣ Lấy tất cả thuốc trong toa
        details = PrescriptionDetail.query.filter_by(prescription_id=prescription.id).all()
        total_medicine_fee = Decimal(0)

        # 4️⃣ Duyệt qua từng thuốc và cập nhật tồn kho
        for d in details:
            medicine = Medicine.query.get(d.medicine_id)
            if not medicine:
                return {"error": f"Thuốc ID {d.medicine_id} không tồn tại."}, 400

            total_medicine_fee += Decimal(d.price or 0) * Decimal(d.dosage or 0) * Decimal(d.duration_days or 1)

            qty_to_deduct = d.dosage or 0

            # 🔹 Lấy các lô thuốc có cùng medicine_id, ưu tiên hạn sớm nhất (FEFO)
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

            # 🔹 Cập nhật lại reserved_quantity trong bảng medicine (trừ lượng đã xuất)
            reserved_now = medicine.reserved_quantity or 0
            medicine.reserved_quantity = max(reserved_now - (d.dosage or 0), 0)

        # 5️⃣ Tính tổng tiền dịch vụ
        total_service_fee = Decimal(
    db.session.query(func.coalesce(func.sum(TreatmentRecord.price), 0))
    .filter(TreatmentRecord.appointment_id == appointment_id)
    .scalar()
)

        # 6️⃣ Tính VAT và tổng cộng
        vat = (total_service_fee + total_medicine_fee) * Decimal(0.1)
        total = total_service_fee + total_medicine_fee + vat

        # 7️⃣ Tạo hóa đơn mới (hoặc cập nhật nếu đã có)
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

        # 8️⃣ Lưu toàn bộ thay đổi
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
        return {"error": str(e)}, 500

# if __name__ == "__main__":
#     from app import create_app
#
#     app = create_app()
#     with app.app_context():
#         # 🔹 Gọi hàm để test
#         result, status = create_invoice(appointment_id=2)
#         print("Status:", status)
#         print("Result:", result)
