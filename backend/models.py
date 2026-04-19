from pydantic import BaseModel
from typing import Optional, List


# ─── Vendor Models ────────────────────────────────────────────────────────────

class VendorCreate(BaseModel):
    vendor_code: str
    vendor_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: Optional[int] = 1

class VendorOut(BaseModel):
    id: int
    vendor_code: str
    vendor_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: int


# ─── Items Master Models ────────────────────────────────────────────────────

class ItemMasterCreate(BaseModel):
    item_code: str
    item_name: str
    category: Optional[str] = None
    uom: Optional[str] = "Nos"
    description: Optional[str] = None

class ItemMasterOut(BaseModel):
    id: int
    item_code: str
    item_name: str
    category: Optional[str] = None
    uom: str
    description: Optional[str] = None


# ─── Purchase Requisition Models ────────────────────────────────────────────

class PRLineItemCreate(BaseModel):
    item_code: str
    item_name: str
    quantity_required: float = 0
    uom: str = "Nos"
    remarks: Optional[str] = None

class PRLineItemOut(BaseModel):
    id: int
    item_code: str
    item_name: str
    quantity_required: float
    uom: str
    remarks: Optional[str] = None

class PRCreate(BaseModel):
    pr_number: str
    pr_date: str
    requested_by: str
    department: str
    required_date: str
    status: Optional[str] = "Draft"
    remarks: Optional[str] = None
    line_items: List[PRLineItemCreate] = []

class PROut(BaseModel):
    id: int
    pr_number: str
    pr_date: str
    requested_by: str
    department: str
    required_date: str
    status: str
    remarks: Optional[str] = None
    line_items: List[PRLineItemOut] = []


# ─── RFQ Models ─────────────────────────────────────────────────────────────

class RFQLineItemCreate(BaseModel):
    item_code: str
    item_name: str
    quantity: float = 0
    uom: str = "Nos"
    expected_rate: float = 0

class RFQLineItemOut(BaseModel):
    id: int
    item_code: str
    item_name: str
    quantity: float
    uom: str
    expected_rate: float

class RFQCreate(BaseModel):
    rfq_number: str
    rfq_date: str
    pr_number: Optional[str] = None
    validity_date: str
    vendor_ids: List[int] = []
    status: Optional[str] = "Open"
    line_items: List[RFQLineItemCreate] = []

class RFQOut(BaseModel):
    id: int
    rfq_number: str
    rfq_date: str
    pr_number: Optional[str] = None
    validity_date: str
    status: str
    vendor_ids: List[int] = []
    line_items: List[RFQLineItemOut] = []


# ─── Vendor Quotation Models ────────────────────────────────────────────────

class VendorQuotationCreate(BaseModel):
    quote_number: str
    rfq_number: str
    vendor_id: int
    vendor_name: str
    quote_date: str
    rate: float = 0
    delivery_days: int = 0
    payment_terms: Optional[str] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    quantity: float = 0
    uom: str = "Nos"
    total_amount: float = 0
    status: Optional[str] = "Draft"
    remarks: Optional[str] = None

class VendorQuotationOut(BaseModel):
    id: int
    quote_number: str
    rfq_number: str
    vendor_id: int
    vendor_name: str
    quote_date: str
    rate: float
    delivery_days: int
    payment_terms: Optional[str] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    quantity: float
    uom: str
    total_amount: float
    is_selected: int
    status: str
    remarks: Optional[str] = None


# ─── Purchase Order Models ──────────────────────────────────────────────────

class POLineItemCreate(BaseModel):
    item_code: str
    item_name: str
    quantity: float = 0
    uom: str = "Nos"
    rate: float = 0
    tax_percent: float = 0
    discount_percent: float = 0
    total_amount: float = 0

class POLineItemOut(BaseModel):
    id: int
    item_code: str
    item_name: str
    quantity: float
    uom: str
    rate: float
    tax_percent: float
    discount_percent: float
    total_amount: float

class POCreate(BaseModel):
    po_number: str
    vendor_id: int
    vendor_name: str
    po_date: str
    delivery_date: str
    payment_terms: Optional[str] = None
    currency: Optional[str] = "INR"
    terms_conditions: Optional[str] = None
    approval_status: Optional[str] = "Pending"
    total_amount: float = 0
    rfq_number: Optional[str] = None
    pr_number: Optional[str] = None
    line_items: List[POLineItemCreate] = []

class POOut(BaseModel):
    id: int
    po_number: str
    vendor_id: int
    vendor_name: str
    po_date: str
    delivery_date: str
    payment_terms: Optional[str] = None
    currency: str
    terms_conditions: Optional[str] = None
    approval_status: str
    total_amount: float
    rfq_number: Optional[str] = None
    pr_number: Optional[str] = None
    line_items: List[POLineItemOut] = []


# ─── GRN Models ─────────────────────────────────────────────────────────────

class GRNLineItemCreate(BaseModel):
    item_code: str
    item_name: str
    ordered_qty: float = 0
    received_qty: float = 0
    rejected_qty: float = 0
    accepted_qty: float = 0
    uom: str = "Nos"
    remarks: Optional[str] = None

class GRNLineItemOut(BaseModel):
    id: int
    item_code: str
    item_name: str
    ordered_qty: float
    received_qty: float
    rejected_qty: float
    accepted_qty: float
    uom: str
    remarks: Optional[str] = None

class GRNCreate(BaseModel):
    grn_number: str
    po_number: Optional[str] = None
    vendor_id: Optional[int] = None
    vendor_name: str
    receipt_date: str
    warehouse_location: Optional[str] = None
    qc_required: Optional[str] = "No"
    status: Optional[str] = "Received"
    line_items: List[GRNLineItemCreate] = []

class GRNOut(BaseModel):
    id: int
    grn_number: str
    po_number: Optional[str] = None
    vendor_id: Optional[int] = None
    vendor_name: str
    receipt_date: str
    warehouse_location: Optional[str] = None
    qc_required: str
    status: str
    line_items: List[GRNLineItemOut] = []


# ─── Purchase Invoice Models ────────────────────────────────────────────────

class PurchaseInvoiceCreate(BaseModel):
    invoice_number: str
    vendor_id: Optional[int] = None
    vendor_name: str
    invoice_date: str
    grn_number: Optional[str] = None
    po_number: Optional[str] = None
    subtotal: float = 0
    tax_percent: float = 0
    tax_amount: float = 0
    total_amount: float = 0
    payment_status: Optional[str] = "Unpaid"
    status: Optional[str] = "Draft"
    due_date: Optional[str] = None
    remarks: Optional[str] = None

class PurchaseInvoiceOut(BaseModel):
    id: int
    invoice_number: str
    vendor_id: Optional[int] = None
    vendor_name: str
    invoice_date: str
    grn_number: Optional[str] = None
    po_number: Optional[str] = None
    subtotal: float
    tax_percent: float
    tax_amount: float
    total_amount: float
    payment_status: str
    status: str
    due_date: Optional[str] = None
    remarks: Optional[str] = None


# ─── Cylinder Purchase Models ───────────────────────────────────────────────

class CylinderPurchaseItemCreate(BaseModel):
    cylinder_type: str
    quantity: int = 0
    unit_cost: float = 0
    total_cost: float = 0

class CylinderPurchaseItemOut(BaseModel):
    id: int
    cylinder_type: str
    quantity: int
    unit_cost: float
    total_cost: float

class CylinderPurchaseCreate(BaseModel):
    purchase_id: str
    vendor_id: Optional[int] = None
    vendor_name: str
    purchase_date: str
    invoice_number: Optional[str] = None
    total_amount: float = 0
    status: Optional[str] = "Draft"
    items: List[CylinderPurchaseItemCreate] = []

class CylinderPurchaseOut(BaseModel):
    id: int
    purchase_id: str
    vendor_id: Optional[int] = None
    vendor_name: str
    purchase_date: str
    invoice_number: Optional[str] = None
    total_amount: float
    status: str
    items: List[CylinderPurchaseItemOut] = []


# ─── Cylinder Registry Models ───────────────────────────────────────────────

class CylinderRegistryCreate(BaseModel):
    serial_number: str
    barcode: Optional[str] = None
    cylinder_type: Optional[str] = None
    capacity: float = 0
    capacity_unit: str = "Kg"
    manufacturing_date: Optional[str] = None
    test_due_date: Optional[str] = None
    ownership: Optional[str] = "Company"
    status: Optional[str] = "Active"
    purchase_id: Optional[str] = None

class CylinderRegistryOut(BaseModel):
    id: int
    serial_number: str
    barcode: Optional[str] = None
    cylinder_type: Optional[str] = None
    capacity: float
    capacity_unit: str
    manufacturing_date: Optional[str] = None
    test_due_date: Optional[str] = None
    ownership: Optional[str] = None
    status: str
    purchase_id: Optional[str] = None


# ─── Cylinder Testing Models ────────────────────────────────────────────────

class CylinderTestingItemCreate(BaseModel):
    serial_number: str
    reason: str = "Hydro Testing"

class CylinderTestingItemOut(BaseModel):
    id: int
    serial_number: str
    reason: str

class CylinderTestingCreate(BaseModel):
    transaction_id: str
    vendor_name: str
    date_sent: str
    expected_return_date: Optional[str] = None
    status: Optional[str] = "Sent"
    items: List[CylinderTestingItemCreate] = []

class CylinderTestingOut(BaseModel):
    id: int
    transaction_id: str
    vendor_name: str
    date_sent: str
    expected_return_date: Optional[str] = None
    status: str
    items: List[CylinderTestingItemOut] = []


# ─── Cylinder Return Models ─────────────────────────────────────────────────

class CylinderReturnItemCreate(BaseModel):
    serial_number: str
    status: str = "Passed"
    next_test_due_date: Optional[str] = None
    repair_cost: float = 0

class CylinderReturnItemOut(BaseModel):
    id: int
    serial_number: str
    status: str
    next_test_due_date: Optional[str] = None
    repair_cost: float

class CylinderReturnCreate(BaseModel):
    return_id: str
    vendor_name: str
    date_received: str
    status: Optional[str] = "Draft"
    items: List[CylinderReturnItemCreate] = []

class CylinderReturnOut(BaseModel):
    id: int
    return_id: str
    vendor_name: str
    date_received: str
    status: str
    items: List[CylinderReturnItemOut] = []
