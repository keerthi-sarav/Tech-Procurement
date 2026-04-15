from fastapi import APIRouter, HTTPException
from database import get_connection
from models import PRCreate, PROut, PRLineItemOut

router = APIRouter()


def _get_pr_with_items(cursor, pr_number):
    cursor.execute("SELECT * FROM purchase_requisitions WHERE pr_number = %s", (pr_number,))
    pr = cursor.fetchone()
    if not pr:
        return None
    cursor.execute("SELECT * FROM pr_line_items WHERE pr_number = %s", (pr_number,))
    pr["line_items"] = cursor.fetchall()
    return pr


@router.get("/purchase-requisitions")
def get_prs():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM purchase_requisitions ORDER BY created_at DESC")
    prs = cursor.fetchall()
    for pr in prs:
        cursor.execute("SELECT * FROM pr_line_items WHERE pr_number = %s", (pr["pr_number"],))
        pr["line_items"] = cursor.fetchall()
    cursor.close()
    conn.close()
    return prs


@router.get("/purchase-requisitions/{pr_number}")
def get_pr(pr_number: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    pr = _get_pr_with_items(cursor, pr_number)
    cursor.close()
    conn.close()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    return pr


@router.post("/purchase-requisitions")
def create_pr(pr: PRCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO purchase_requisitions (pr_number, pr_date, requested_by, department, required_date, status, remarks) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (pr.pr_number, pr.pr_date, pr.requested_by, pr.department, pr.required_date, pr.status, pr.remarks)
        )
        for item in pr.line_items:
            cursor.execute(
                "INSERT INTO pr_line_items (pr_number, item_code, item_name, quantity_required, uom, remarks) VALUES (%s,%s,%s,%s,%s,%s)",
                (pr.pr_number, item.item_code, item.item_name, item.quantity_required, item.uom, item.remarks)
            )
        conn.commit()
        result = _get_pr_with_items(cursor, pr.pr_number)
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/purchase-requisitions/{pr_number}")
def update_pr(pr_number: str, pr: PRCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "UPDATE purchase_requisitions SET pr_date=%s, requested_by=%s, department=%s, required_date=%s, status=%s, remarks=%s WHERE pr_number=%s",
            (pr.pr_date, pr.requested_by, pr.department, pr.required_date, pr.status, pr.remarks, pr_number)
        )
        cursor.execute("DELETE FROM pr_line_items WHERE pr_number = %s", (pr_number,))
        for item in pr.line_items:
            cursor.execute(
                "INSERT INTO pr_line_items (pr_number, item_code, item_name, quantity_required, uom, remarks) VALUES (%s,%s,%s,%s,%s,%s)",
                (pr_number, item.item_code, item.item_name, item.quantity_required, item.uom, item.remarks)
            )
        conn.commit()
        result = _get_pr_with_items(cursor, pr_number)
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/purchase-requisitions/{pr_number}")
def delete_pr(pr_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM purchase_requisitions WHERE pr_number = %s", (pr_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "PR deleted successfully"}
