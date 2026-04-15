from fastapi import APIRouter, HTTPException
from database import get_connection
from models import PurchaseInvoiceCreate

router = APIRouter()


@router.get("/purchase-invoices")
def get_invoices():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM purchase_invoices ORDER BY created_at DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


@router.get("/purchase-invoices/{invoice_number}")
def get_invoice(invoice_number: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM purchase_invoices WHERE invoice_number = %s", (invoice_number,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return row


@router.post("/purchase-invoices")
def create_invoice(inv: PurchaseInvoiceCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO purchase_invoices
               (invoice_number, vendor_id, vendor_name, invoice_date, grn_number, po_number,
                subtotal, tax_percent, tax_amount, total_amount, payment_status, due_date, remarks)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (inv.invoice_number, inv.vendor_id, inv.vendor_name, inv.invoice_date, inv.grn_number,
             inv.po_number, inv.subtotal, inv.tax_percent, inv.tax_amount, inv.total_amount,
             inv.payment_status, inv.due_date, inv.remarks)
        )
        conn.commit()
        cursor.execute("SELECT * FROM purchase_invoices WHERE id = LAST_INSERT_ID()")
        return cursor.fetchone()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.patch("/purchase-invoices/{invoice_number}/paid")
def mark_paid(invoice_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE purchase_invoices SET payment_status='Paid' WHERE invoice_number=%s", (invoice_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Invoice marked as paid"}


@router.delete("/purchase-invoices/{invoice_number}")
def delete_invoice(invoice_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM purchase_invoices WHERE invoice_number = %s", (invoice_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Invoice deleted"}
