from fastapi import APIRouter, HTTPException
from database import get_connection
from models import (CylinderPurchaseCreate, CylinderRegistryCreate,
                    CylinderTestingCreate, CylinderReturnCreate)

router = APIRouter()


# ─── Cylinder Purchases ──────────────────────────────────────────────────────

@router.get("/cylinder-purchases")
def get_cylinder_purchases():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cylinder_purchases ORDER BY created_at DESC")
    purchases = cursor.fetchall()
    for p in purchases:
        cursor.execute("SELECT * FROM cylinder_purchase_items WHERE purchase_id = %s", (p["purchase_id"],))
        p["items"] = cursor.fetchall()
    cursor.close()
    conn.close()
    return purchases


@router.post("/cylinder-purchases")
def create_cylinder_purchase(cp: CylinderPurchaseCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO cylinder_purchases (purchase_id, vendor_id, vendor_name, purchase_date, invoice_number, total_amount, status) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (cp.purchase_id, cp.vendor_id, cp.vendor_name, cp.purchase_date, cp.invoice_number, cp.total_amount, cp.status)
        )
        for item in cp.items:
            cursor.execute(
                "INSERT INTO cylinder_purchase_items (purchase_id, cylinder_type, quantity, unit_cost, total_cost) VALUES (%s,%s,%s,%s,%s)",
                (cp.purchase_id, item.cylinder_type, item.quantity, item.unit_cost, item.total_cost)
            )
        conn.commit()
        cursor.execute("SELECT * FROM cylinder_purchases WHERE purchase_id = %s", (cp.purchase_id,))
        result = cursor.fetchone()
        cursor.execute("SELECT * FROM cylinder_purchase_items WHERE purchase_id = %s", (cp.purchase_id,))
        result["items"] = cursor.fetchall()
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/cylinder-purchases/{purchase_id}")
def update_cylinder_purchase(purchase_id: str, cp: CylinderPurchaseCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "UPDATE cylinder_purchases SET vendor_id=%s, vendor_name=%s, purchase_date=%s, invoice_number=%s, total_amount=%s, status=%s WHERE purchase_id=%s",
            (cp.vendor_id, cp.vendor_name, cp.purchase_date, cp.invoice_number, cp.total_amount, cp.status, purchase_id)
        )
        cursor.execute("DELETE FROM cylinder_purchase_items WHERE purchase_id=%s", (purchase_id,))
        for item in cp.items:
            cursor.execute(
                "INSERT INTO cylinder_purchase_items (purchase_id, cylinder_type, quantity, unit_cost, total_cost) VALUES (%s,%s,%s,%s,%s)",
                (purchase_id, item.cylinder_type, item.quantity, item.unit_cost, item.total_cost)
            )
        conn.commit()
        cursor.execute("SELECT * FROM cylinder_purchases WHERE purchase_id = %s", (purchase_id,))
        result = cursor.fetchone()
        cursor.execute("SELECT * FROM cylinder_purchase_items WHERE purchase_id = %s", (purchase_id,))
        result["items"] = cursor.fetchall()
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/cylinder-purchases/{purchase_id}")
def delete_cylinder_purchase(purchase_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cylinder_purchases WHERE purchase_id = %s", (purchase_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Deleted"}


# ─── Cylinder Registry ───────────────────────────────────────────────────────

@router.get("/cylinder-registry")
def get_cylinder_registry():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cylinder_registry ORDER BY created_at DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


@router.post("/cylinder-registry")
def create_cylinder_serial(cyl: CylinderRegistryCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO cylinder_registry
               (serial_number, barcode, cylinder_type, capacity, capacity_unit,
                manufacturing_date, test_due_date, ownership, status, purchase_id)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (cyl.serial_number, cyl.barcode, cyl.cylinder_type, cyl.capacity, cyl.capacity_unit,
             cyl.manufacturing_date, cyl.test_due_date, cyl.ownership, cyl.status, cyl.purchase_id)
        )
        conn.commit()
        cursor.execute("SELECT * FROM cylinder_registry WHERE id = LAST_INSERT_ID()")
        return cursor.fetchone()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/cylinder-registry/{serial_number}")
def update_cylinder(serial_number: str, cyl: CylinderRegistryCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """UPDATE cylinder_registry SET barcode=%s, cylinder_type=%s, capacity=%s,
               capacity_unit=%s, manufacturing_date=%s, test_due_date=%s, ownership=%s,
               status=%s, purchase_id=%s WHERE serial_number=%s""",
            (cyl.barcode, cyl.cylinder_type, cyl.capacity, cyl.capacity_unit,
             cyl.manufacturing_date, cyl.test_due_date, cyl.ownership, cyl.status,
             cyl.purchase_id, serial_number)
        )
        conn.commit()
        cursor.execute("SELECT * FROM cylinder_registry WHERE serial_number = %s", (serial_number,))
        return cursor.fetchone()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/cylinder-registry/{serial_number}")
def delete_cylinder(serial_number: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cylinder_registry WHERE serial_number = %s", (serial_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Deleted"}


# ─── Cylinder Testing ────────────────────────────────────────────────────────

@router.get("/cylinder-testing")
def get_testing():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cylinder_testing ORDER BY created_at DESC")
    tests = cursor.fetchall()
    for t in tests:
        cursor.execute("SELECT * FROM cylinder_testing_items WHERE transaction_id = %s", (t["transaction_id"],))
        t["items"] = cursor.fetchall()
    cursor.close()
    conn.close()
    return tests


@router.post("/cylinder-testing")
def create_testing(ct: CylinderTestingCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO cylinder_testing (transaction_id, vendor_name, date_sent, expected_return_date, status) VALUES (%s,%s,%s,%s,%s)",
            (ct.transaction_id, ct.vendor_name, ct.date_sent, ct.expected_return_date, ct.status)
        )
        for item in ct.items:
            cursor.execute(
                "INSERT INTO cylinder_testing_items (transaction_id, serial_number, reason) VALUES (%s,%s,%s)",
                (ct.transaction_id, item.serial_number, item.reason)
            )
        conn.commit()
        cursor.execute("SELECT * FROM cylinder_testing WHERE transaction_id = %s", (ct.transaction_id,))
        result = cursor.fetchone()
        cursor.execute("SELECT * FROM cylinder_testing_items WHERE transaction_id = %s", (ct.transaction_id,))
        result["items"] = cursor.fetchall()
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/cylinder-testing/{transaction_id}")
def update_testing(transaction_id: str, ct: CylinderTestingCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "UPDATE cylinder_testing SET vendor_name=%s, date_sent=%s, expected_return_date=%s, status=%s WHERE transaction_id=%s",
            (ct.vendor_name, ct.date_sent, ct.expected_return_date, ct.status, transaction_id)
        )
        cursor.execute("DELETE FROM cylinder_testing_items WHERE transaction_id=%s", (transaction_id,))
        for item in ct.items:
            cursor.execute(
                "INSERT INTO cylinder_testing_items (transaction_id, serial_number, reason) VALUES (%s,%s,%s)",
                (transaction_id, item.serial_number, item.reason)
            )
        conn.commit()
        cursor.execute("SELECT * FROM cylinder_testing WHERE transaction_id = %s", (transaction_id,))
        result = cursor.fetchone()
        cursor.execute("SELECT * FROM cylinder_testing_items WHERE transaction_id = %s", (transaction_id,))
        result["items"] = cursor.fetchall()
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/cylinder-testing/{transaction_id}")
def delete_testing(transaction_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cylinder_testing WHERE transaction_id = %s", (transaction_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Deleted"}


# ─── Cylinder Returns ────────────────────────────────────────────────────────

@router.get("/cylinder-returns")
def get_returns():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cylinder_returns ORDER BY created_at DESC")
    returns = cursor.fetchall()
    for r in returns:
        cursor.execute("SELECT * FROM cylinder_return_items WHERE return_id = %s", (r["return_id"],))
        r["items"] = cursor.fetchall()
    cursor.close()
    conn.close()
    return returns


@router.post("/cylinder-returns")
def create_return(cr: CylinderReturnCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO cylinder_returns (return_id, vendor_name, date_received, status) VALUES (%s,%s,%s,%s)",
            (cr.return_id, cr.vendor_name, cr.date_received, cr.status)
        )
        for item in cr.items:
            cursor.execute(
                "INSERT INTO cylinder_return_items (return_id, serial_number, status, next_test_due_date, repair_cost) VALUES (%s,%s,%s,%s,%s)",
                (cr.return_id, item.serial_number, item.status, item.next_test_due_date, item.repair_cost)
            )
            if cr.status == "Posted":
                # Update cylinder registry status only when Posted
                new_status = "Active" if item.status == "Passed" else "Scrapped"
                cursor.execute(
                    "UPDATE cylinder_registry SET status=%s, test_due_date=%s WHERE serial_number=%s",
                    (new_status, item.next_test_due_date, item.serial_number)
                )
        conn.commit()
        cursor.execute("SELECT * FROM cylinder_returns WHERE return_id = %s", (cr.return_id,))
        result = cursor.fetchone()
        cursor.execute("SELECT * FROM cylinder_return_items WHERE return_id = %s", (cr.return_id,))
        result["items"] = cursor.fetchall()
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/cylinder-returns/{return_id}")
def update_return(return_id: str, cr: CylinderReturnCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "UPDATE cylinder_returns SET vendor_name=%s, date_received=%s, status=%s WHERE return_id=%s",
            (cr.vendor_name, cr.date_received, cr.status, return_id)
        )
        cursor.execute("DELETE FROM cylinder_return_items WHERE return_id=%s", (return_id,))
        for item in cr.items:
            cursor.execute(
                "INSERT INTO cylinder_return_items (return_id, serial_number, status, next_test_due_date, repair_cost) VALUES (%s,%s,%s,%s,%s)",
                (return_id, item.serial_number, item.status, item.next_test_due_date, item.repair_cost)
            )
            if cr.status == "Posted":
                new_status = "Active" if item.status == "Passed" else "Scrapped"
                cursor.execute(
                    "UPDATE cylinder_registry SET status=%s, test_due_date=%s WHERE serial_number=%s",
                    (new_status, item.next_test_due_date, item.serial_number)
                )
        conn.commit()
        cursor.execute("SELECT * FROM cylinder_returns WHERE return_id = %s", (return_id,))
        result = cursor.fetchone()
        cursor.execute("SELECT * FROM cylinder_return_items WHERE return_id = %s", (return_id,))
        result["items"] = cursor.fetchall()
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/cylinder-returns/{return_id}")
def delete_return(return_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cylinder_returns WHERE return_id = %s", (return_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Deleted"}
