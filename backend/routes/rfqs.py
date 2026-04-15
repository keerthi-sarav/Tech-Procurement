from fastapi import APIRouter, HTTPException
from database import get_connection
from models import RFQCreate

router = APIRouter()


def _get_rfq_full(cursor, rfq_number):
    cursor.execute("SELECT * FROM rfqs WHERE rfq_number = %s", (rfq_number,))
    rfq = cursor.fetchone()
    if not rfq:
        return None
    cursor.execute("SELECT * FROM rfq_line_items WHERE rfq_number = %s", (rfq_number,))
    rfq["line_items"] = cursor.fetchall()
    cursor.execute("SELECT vendor_id FROM rfq_vendors WHERE rfq_number = %s", (rfq_number,))
    rfq["vendor_ids"] = [row["vendor_id"] for row in cursor.fetchall()]
    return rfq


@router.get("/rfqs")
def get_rfqs():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM rfqs ORDER BY created_at DESC")
    rfqs = cursor.fetchall()
    for rfq in rfqs:
        cursor.execute("SELECT * FROM rfq_line_items WHERE rfq_number = %s", (rfq["rfq_number"],))
        rfq["line_items"] = cursor.fetchall()
        cursor.execute("SELECT vendor_id FROM rfq_vendors WHERE rfq_number = %s", (rfq["rfq_number"],))
        rfq["vendor_ids"] = [row["vendor_id"] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return rfqs


@router.get("/rfqs/{rfq_number}")
def get_rfq(rfq_number: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    rfq = _get_rfq_full(cursor, rfq_number)
    cursor.close()
    conn.close()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return rfq


@router.post("/rfqs")
def create_rfq(rfq: RFQCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO rfqs (rfq_number, rfq_date, pr_number, validity_date, status) VALUES (%s,%s,%s,%s,%s)",
            (rfq.rfq_number, rfq.rfq_date, rfq.pr_number, rfq.validity_date, rfq.status)
        )
        for vid in rfq.vendor_ids:
            cursor.execute("INSERT INTO rfq_vendors (rfq_number, vendor_id) VALUES (%s,%s)", (rfq.rfq_number, vid))
        for item in rfq.line_items:
            cursor.execute(
                "INSERT INTO rfq_line_items (rfq_number, item_code, item_name, quantity, uom, expected_rate) VALUES (%s,%s,%s,%s,%s,%s)",
                (rfq.rfq_number, item.item_code, item.item_name, item.quantity, item.uom, item.expected_rate)
            )
        conn.commit()
        result = _get_rfq_full(cursor, rfq.rfq_number)
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/rfqs/{rfq_number}")
def update_rfq(rfq_number: str, rfq: RFQCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "UPDATE rfqs SET rfq_date=%s, pr_number=%s, validity_date=%s, status=%s WHERE rfq_number=%s",
            (rfq.rfq_date, rfq.pr_number, rfq.validity_date, rfq.status, rfq_number)
        )
        cursor.execute("DELETE FROM rfq_vendors WHERE rfq_number=%s", (rfq_number,))
        cursor.execute("DELETE FROM rfq_line_items WHERE rfq_number=%s", (rfq_number,))
        for vid in rfq.vendor_ids:
            cursor.execute("INSERT INTO rfq_vendors (rfq_number, vendor_id) VALUES (%s,%s)", (rfq_number, vid))
        for item in rfq.line_items:
            cursor.execute(
                "INSERT INTO rfq_line_items (rfq_number, item_code, item_name, quantity, uom, expected_rate) VALUES (%s,%s,%s,%s,%s,%s)",
                (rfq_number, item.item_code, item.item_name, item.quantity, item.uom, item.expected_rate)
            )
        conn.commit()
        result = _get_rfq_full(cursor, rfq_number)
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/rfqs/{rfq_number}")
def delete_rfq(rfq_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM rfqs WHERE rfq_number = %s", (rfq_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "RFQ deleted successfully"}
