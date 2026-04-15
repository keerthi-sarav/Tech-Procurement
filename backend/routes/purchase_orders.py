from fastapi import APIRouter, HTTPException
from database import get_connection
from models import POCreate

router = APIRouter()


def _get_po_full(cursor, po_number):
    cursor.execute("SELECT * FROM purchase_orders WHERE po_number = %s", (po_number,))
    po = cursor.fetchone()
    if not po:
        return None
    cursor.execute("SELECT * FROM po_line_items WHERE po_number = %s", (po_number,))
    po["line_items"] = cursor.fetchall()
    return po


@router.get("/purchase-orders")
def get_pos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM purchase_orders ORDER BY created_at DESC")
    pos = cursor.fetchall()
    for po in pos:
        cursor.execute("SELECT * FROM po_line_items WHERE po_number = %s", (po["po_number"],))
        po["line_items"] = cursor.fetchall()
    cursor.close()
    conn.close()
    return pos


@router.get("/purchase-orders/{po_number}")
def get_po(po_number: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    po = _get_po_full(cursor, po_number)
    cursor.close()
    conn.close()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    return po


@router.post("/purchase-orders")
def create_po(po: POCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO purchase_orders
               (po_number, vendor_id, vendor_name, po_date, delivery_date, payment_terms,
                currency, terms_conditions, approval_status, total_amount, rfq_number, pr_number)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (po.po_number, po.vendor_id, po.vendor_name, po.po_date, po.delivery_date,
             po.payment_terms, po.currency, po.terms_conditions, po.approval_status,
             po.total_amount, po.rfq_number, po.pr_number)
        )
        for item in po.line_items:
            cursor.execute(
                """INSERT INTO po_line_items
                   (po_number, item_code, item_name, quantity, uom, rate, tax_percent, discount_percent, total_amount)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (po.po_number, item.item_code, item.item_name, item.quantity, item.uom,
                 item.rate, item.tax_percent, item.discount_percent, item.total_amount)
            )
        conn.commit()
        return _get_po_full(cursor, po.po_number)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/purchase-orders/{po_number}")
def update_po(po_number: str, po: POCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """UPDATE purchase_orders SET vendor_id=%s, vendor_name=%s, po_date=%s, delivery_date=%s,
               payment_terms=%s, currency=%s, terms_conditions=%s, approval_status=%s, total_amount=%s,
               rfq_number=%s, pr_number=%s WHERE po_number=%s""",
            (po.vendor_id, po.vendor_name, po.po_date, po.delivery_date, po.payment_terms,
             po.currency, po.terms_conditions, po.approval_status, po.total_amount,
             po.rfq_number, po.pr_number, po_number)
        )
        cursor.execute("DELETE FROM po_line_items WHERE po_number=%s", (po_number,))
        for item in po.line_items:
            cursor.execute(
                """INSERT INTO po_line_items
                   (po_number, item_code, item_name, quantity, uom, rate, tax_percent, discount_percent, total_amount)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (po_number, item.item_code, item.item_name, item.quantity, item.uom,
                 item.rate, item.tax_percent, item.discount_percent, item.total_amount)
            )
        conn.commit()
        return _get_po_full(cursor, po_number)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.patch("/purchase-orders/{po_number}/approve")
def approve_po(po_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE purchase_orders SET approval_status='Approved' WHERE po_number=%s", (po_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "PO approved"}


@router.patch("/purchase-orders/{po_number}/reject")
def reject_po(po_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE purchase_orders SET approval_status='Rejected' WHERE po_number=%s", (po_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "PO rejected"}


@router.delete("/purchase-orders/{po_number}")
def delete_po(po_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM purchase_orders WHERE po_number = %s", (po_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "PO deleted"}
