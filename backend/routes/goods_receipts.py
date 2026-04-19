from fastapi import APIRouter, HTTPException
from database import get_connection
from models import GRNCreate

router = APIRouter()


def _get_grn_full(cursor, grn_number):
    cursor.execute("SELECT * FROM goods_receipts WHERE grn_number = %s", (grn_number,))
    grn = cursor.fetchone()
    if not grn:
        return None
    cursor.execute("SELECT * FROM grn_line_items WHERE grn_number = %s", (grn_number,))
    grn["line_items"] = cursor.fetchall()
    return grn


@router.get("/goods-receipts")
def get_grns():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM goods_receipts ORDER BY created_at DESC")
    grns = cursor.fetchall()
    for grn in grns:
        cursor.execute("SELECT * FROM grn_line_items WHERE grn_number = %s", (grn["grn_number"],))
        grn["line_items"] = cursor.fetchall()
    cursor.close()
    conn.close()
    return grns


@router.get("/goods-receipts/{grn_number}")
def get_grn(grn_number: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    grn = _get_grn_full(cursor, grn_number)
    cursor.close()
    conn.close()
    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")
    return grn


@router.post("/goods-receipts")
def create_grn(grn: GRNCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO goods_receipts
               (grn_number, po_number, vendor_id, vendor_name, receipt_date, warehouse_location, qc_required, status)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
            (grn.grn_number, grn.po_number, grn.vendor_id, grn.vendor_name, grn.receipt_date,
             grn.warehouse_location, grn.qc_required, grn.status)
        )
        for item in grn.line_items:
            accepted = item.received_qty - item.rejected_qty
            cursor.execute(
                """INSERT INTO grn_line_items
                   (grn_number, item_code, item_name, ordered_qty, received_qty, rejected_qty, accepted_qty, uom, remarks)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (grn.grn_number, item.item_code, item.item_name, item.ordered_qty,
                 item.received_qty, item.rejected_qty, accepted, item.uom, item.remarks)
            )
        conn.commit()
        return _get_grn_full(cursor, grn.grn_number)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/goods-receipts/{grn_number}")
def update_grn(grn_number: str, grn: GRNCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """UPDATE goods_receipts SET 
               po_number=%s, vendor_id=%s, vendor_name=%s, receipt_date=%s, warehouse_location=%s, qc_required=%s, status=%s
               WHERE grn_number=%s""",
            (grn.po_number, grn.vendor_id, grn.vendor_name, grn.receipt_date,
             grn.warehouse_location, grn.qc_required, grn.status, grn_number)
        )
        cursor.execute("DELETE FROM grn_line_items WHERE grn_number=%s", (grn_number,))
        for item in grn.line_items:
            accepted = item.received_qty - item.rejected_qty
            cursor.execute(
                """INSERT INTO grn_line_items
                   (grn_number, item_code, item_name, ordered_qty, received_qty, rejected_qty, accepted_qty, uom, remarks)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (grn_number, item.item_code, item.item_name, item.ordered_qty,
                 item.received_qty, item.rejected_qty, accepted, item.uom, item.remarks)
            )
        conn.commit()
        return _get_grn_full(cursor, grn_number)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/goods-receipts/{grn_number}")
def delete_grn(grn_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM goods_receipts WHERE grn_number = %s", (grn_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "GRN deleted"}
