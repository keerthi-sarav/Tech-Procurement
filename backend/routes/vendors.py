from fastapi import APIRouter, HTTPException
from database import get_connection
from models import VendorCreate, VendorOut

router = APIRouter()


@router.get("/vendors", response_model=list[VendorOut])
def get_vendors():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vendors ORDER BY vendor_name")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


@router.get("/vendors/{vendor_id}", response_model=VendorOut)
def get_vendor(vendor_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vendors WHERE id = %s", (vendor_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return row


@router.post("/vendors", response_model=VendorOut)
def create_vendor(vendor: VendorCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO vendors (vendor_code, vendor_name, contact_person, phone, email, address, payment_terms, is_active) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (vendor.vendor_code, vendor.vendor_name, vendor.contact_person, vendor.phone, vendor.email, vendor.address, vendor.payment_terms, vendor.is_active)
        )
        conn.commit()
        cursor.execute("SELECT * FROM vendors WHERE id = LAST_INSERT_ID()")
        row = cursor.fetchone()
        return row
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/vendors/{vendor_id}", response_model=VendorOut)
def update_vendor(vendor_id: int, vendor: VendorCreate):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "UPDATE vendors SET vendor_code=%s, vendor_name=%s, contact_person=%s, phone=%s, email=%s, address=%s, payment_terms=%s, is_active=%s WHERE id=%s",
            (vendor.vendor_code, vendor.vendor_name, vendor.contact_person, vendor.phone, vendor.email, vendor.address, vendor.payment_terms, vendor.is_active, vendor_id)
        )
        conn.commit()
        cursor.execute("SELECT * FROM vendors WHERE id = %s", (vendor_id,))
        row = cursor.fetchone()
        return row
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/vendors/{vendor_id}")
def delete_vendor(vendor_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vendors WHERE id = %s", (vendor_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Vendor deleted successfully"}


@router.get("/items-master", response_model=list[dict])
def get_items():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM items_master ORDER BY item_name")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


@router.post("/items-master")
def create_item(item: dict):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO items_master (item_code, item_name, category, uom, description) VALUES (%s,%s,%s,%s,%s)",
            (item.get("item_code"), item.get("item_name"), item.get("category"), item.get("uom", "Nos"), item.get("description"))
        )
        conn.commit()
        return {"message": "Item created", "item_code": item.get("item_code")}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()
