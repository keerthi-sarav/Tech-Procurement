from fastapi import APIRouter, HTTPException
from database import get_connection
from models import VendorQuotationCreate

router = APIRouter()


@router.get("/vendor-quotations")
def get_quotations():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vendor_quotations ORDER BY created_at DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


@router.get("/vendor-quotations/compare/{rfq_number}")
def compare_quotations(rfq_number: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM vendor_quotations WHERE rfq_number = %s ORDER BY rate ASC",
        (rfq_number,)
    )
    quotes = cursor.fetchall()
    cursor.close()
    conn.close()
    # Mark the lowest rate
    if quotes:
        min_rate = min(q["rate"] for q in quotes)
        for q in quotes:
            q["is_lowest"] = q["rate"] == min_rate
    return quotes


@router.post("/vendor-quotations")
def create_quotation(q: VendorQuotationCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO vendor_quotations
               (quote_number, rfq_number, vendor_id, vendor_name, quote_date, rate, delivery_days,
                payment_terms, item_code, item_name, quantity, uom, total_amount, remarks)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (q.quote_number, q.rfq_number, q.vendor_id, q.vendor_name, q.quote_date, q.rate,
             q.delivery_days, q.payment_terms, q.item_code, q.item_name, q.quantity, q.uom,
             q.total_amount, q.remarks)
        )
        conn.commit()
        cursor.execute("SELECT * FROM vendor_quotations WHERE id = LAST_INSERT_ID()")
        return cursor.fetchone()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.patch("/vendor-quotations/{quote_id}/select")
def select_quotation(quote_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    # Get rfq_number for this quote
    cursor.execute("SELECT rfq_number FROM vendor_quotations WHERE id = %s", (quote_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Quotation not found")
    rfq_number = row["rfq_number"]
    # Deselect all for this RFQ, then select this one
    cursor.execute("UPDATE vendor_quotations SET is_selected = 0 WHERE rfq_number = %s", (rfq_number,))
    cursor.execute("UPDATE vendor_quotations SET is_selected = 1 WHERE id = %s", (quote_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Quotation selected"}


@router.delete("/vendor-quotations/{quote_id}")
def delete_quotation(quote_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vendor_quotations WHERE id = %s", (quote_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Quotation deleted"}
