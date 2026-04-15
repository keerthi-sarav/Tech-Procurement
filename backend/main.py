from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database import init_database, seed_demo_data
from routes.vendors import router as vendors_router
from routes.purchase_requisitions import router as pr_router
from routes.rfqs import router as rfq_router
from routes.vendor_quotations import router as quotation_router
from routes.purchase_orders import router as po_router
from routes.goods_receipts import router as grn_router
from routes.purchase_invoices import router as invoice_router
from routes.cylinders import router as cylinder_router

app = FastAPI(title="SOGFusion Procurement API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
app.include_router(vendors_router, prefix="/api", tags=["Vendors"])
app.include_router(pr_router, prefix="/api", tags=["Purchase Requisitions"])
app.include_router(rfq_router, prefix="/api", tags=["RFQs"])
app.include_router(quotation_router, prefix="/api", tags=["Vendor Quotations"])
app.include_router(po_router, prefix="/api", tags=["Purchase Orders"])
app.include_router(grn_router, prefix="/api", tags=["Goods Receipts"])
app.include_router(invoice_router, prefix="/api", tags=["Purchase Invoices"])
app.include_router(cylinder_router, prefix="/api", tags=["Cylinders"])


@app.get("/")
def root():
    return {"message": "SOGFusion Procurement API is running", "docs": "/docs"}


if __name__ == "__main__":
    print("Initializing procurement database...")
    init_database()
    seed_demo_data()
    print("Starting SOGFusion Procurement API server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
