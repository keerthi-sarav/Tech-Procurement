import os
import mysql.connector
from mysql.connector import Error

# Load from environment variables (set in backend/.env)
# Falls back to defaults if .env is not present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, relies on OS env vars or defaults

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "6369781582"),
    "port": int(os.getenv("DB_PORT", 3306)),
}

DB_NAME = os.getenv("DB_NAME", "procurement_db")


def get_connection():
    """Get a connection to the procurement_db database."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        raise


def init_database():
    """Create database and all procurement tables if they don't exist."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        cursor.close()
        conn.close()
    except Error as e:
        print(f"Error creating database: {e}")
        raise

    conn = get_connection()
    cursor = conn.cursor()

    # --- Vendors Master ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vendor_code VARCHAR(50) NOT NULL UNIQUE,
            vendor_name VARCHAR(200) NOT NULL,
            contact_person VARCHAR(200) DEFAULT NULL,
            phone VARCHAR(50) DEFAULT NULL,
            email VARCHAR(200) DEFAULT NULL,
            address TEXT DEFAULT NULL,
            payment_terms VARCHAR(100) DEFAULT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # --- Items Master ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS items_master (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_code VARCHAR(50) NOT NULL UNIQUE,
            item_name VARCHAR(200) NOT NULL,
            category VARCHAR(100) DEFAULT NULL,
            uom VARCHAR(30) DEFAULT 'Nos',
            description TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # --- Purchase Requisitions ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS purchase_requisitions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pr_number VARCHAR(100) NOT NULL UNIQUE,
            pr_date VARCHAR(20) NOT NULL,
            requested_by VARCHAR(200) NOT NULL,
            department VARCHAR(200) NOT NULL,
            required_date VARCHAR(20) NOT NULL,
            status VARCHAR(30) DEFAULT 'Draft',
            remarks TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pr_line_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pr_number VARCHAR(100) NOT NULL,
            item_code VARCHAR(50) NOT NULL,
            item_name VARCHAR(200) NOT NULL,
            quantity_required DOUBLE DEFAULT 0,
            uom VARCHAR(30) DEFAULT 'Nos',
            remarks TEXT DEFAULT NULL,
            FOREIGN KEY (pr_number) REFERENCES purchase_requisitions(pr_number) ON DELETE CASCADE
        )
    """)

    # --- RFQs ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rfqs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rfq_number VARCHAR(100) NOT NULL UNIQUE,
            rfq_date VARCHAR(20) NOT NULL,
            pr_number VARCHAR(100) DEFAULT NULL,
            validity_date VARCHAR(20) NOT NULL,
            status VARCHAR(30) DEFAULT 'Open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rfq_vendors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rfq_number VARCHAR(100) NOT NULL,
            vendor_id INT NOT NULL,
            FOREIGN KEY (rfq_number) REFERENCES rfqs(rfq_number) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rfq_line_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rfq_number VARCHAR(100) NOT NULL,
            item_code VARCHAR(50) NOT NULL,
            item_name VARCHAR(200) NOT NULL,
            quantity DOUBLE DEFAULT 0,
            uom VARCHAR(30) DEFAULT 'Nos',
            expected_rate DOUBLE DEFAULT 0,
            FOREIGN KEY (rfq_number) REFERENCES rfqs(rfq_number) ON DELETE CASCADE
        )
    """)

    # --- Vendor Quotations ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vendor_quotations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quote_number VARCHAR(100) NOT NULL UNIQUE,
            rfq_number VARCHAR(100) NOT NULL,
            vendor_id INT NOT NULL,
            vendor_name VARCHAR(200) NOT NULL,
            quote_date VARCHAR(20) NOT NULL,
            rate DOUBLE DEFAULT 0,
            delivery_days INT DEFAULT 0,
            payment_terms VARCHAR(200) DEFAULT NULL,
            item_code VARCHAR(50) DEFAULT NULL,
            item_name VARCHAR(200) DEFAULT NULL,
            quantity DOUBLE DEFAULT 0,
            uom VARCHAR(30) DEFAULT 'Nos',
            total_amount DOUBLE DEFAULT 0,
            is_selected TINYINT(1) DEFAULT 0,
            status VARCHAR(30) DEFAULT 'Draft',
            remarks TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # --- Purchase Orders ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS purchase_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            po_number VARCHAR(100) NOT NULL UNIQUE,
            vendor_id INT NOT NULL,
            vendor_name VARCHAR(200) NOT NULL,
            po_date VARCHAR(20) NOT NULL,
            delivery_date VARCHAR(20) NOT NULL,
            payment_terms VARCHAR(200) DEFAULT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            terms_conditions TEXT DEFAULT NULL,
            approval_status VARCHAR(30) DEFAULT 'Pending',
            total_amount DOUBLE DEFAULT 0,
            rfq_number VARCHAR(100) DEFAULT NULL,
            pr_number VARCHAR(100) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS po_line_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            po_number VARCHAR(100) NOT NULL,
            item_code VARCHAR(50) NOT NULL,
            item_name VARCHAR(200) NOT NULL,
            quantity DOUBLE DEFAULT 0,
            uom VARCHAR(30) DEFAULT 'Nos',
            rate DOUBLE DEFAULT 0,
            tax_percent DOUBLE DEFAULT 0,
            discount_percent DOUBLE DEFAULT 0,
            total_amount DOUBLE DEFAULT 0,
            FOREIGN KEY (po_number) REFERENCES purchase_orders(po_number) ON DELETE CASCADE
        )
    """)

    # --- Goods Receipt Notes ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goods_receipts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            grn_number VARCHAR(100) NOT NULL UNIQUE,
            po_number VARCHAR(100) DEFAULT NULL,
            vendor_id INT DEFAULT NULL,
            vendor_name VARCHAR(200) NOT NULL,
            receipt_date VARCHAR(20) NOT NULL,
            warehouse_location VARCHAR(200) DEFAULT NULL,
            qc_required VARCHAR(5) DEFAULT 'No',
            status VARCHAR(30) DEFAULT 'Received',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS grn_line_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            grn_number VARCHAR(100) NOT NULL,
            item_code VARCHAR(50) NOT NULL,
            item_name VARCHAR(200) NOT NULL,
            ordered_qty DOUBLE DEFAULT 0,
            received_qty DOUBLE DEFAULT 0,
            rejected_qty DOUBLE DEFAULT 0,
            accepted_qty DOUBLE DEFAULT 0,
            uom VARCHAR(30) DEFAULT 'Nos',
            remarks TEXT DEFAULT NULL,
            FOREIGN KEY (grn_number) REFERENCES goods_receipts(grn_number) ON DELETE CASCADE
        )
    """)

    # --- Purchase Invoices ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS purchase_invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_number VARCHAR(100) NOT NULL UNIQUE,
            vendor_id INT DEFAULT NULL,
            vendor_name VARCHAR(200) NOT NULL,
            invoice_date VARCHAR(20) NOT NULL,
            grn_number VARCHAR(100) DEFAULT NULL,
            po_number VARCHAR(100) DEFAULT NULL,
            subtotal DOUBLE DEFAULT 0,
            tax_percent DOUBLE DEFAULT 0,
            tax_amount DOUBLE DEFAULT 0,
            total_amount DOUBLE DEFAULT 0,
            status VARCHAR(30) DEFAULT 'Draft',
            payment_status VARCHAR(30) DEFAULT 'Unpaid',
            due_date VARCHAR(20) DEFAULT NULL,
            remarks TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # --- Cylinder Purchases ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cylinder_purchases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            purchase_id VARCHAR(100) NOT NULL UNIQUE,
            vendor_id INT DEFAULT NULL,
            vendor_name VARCHAR(200) NOT NULL,
            purchase_date VARCHAR(20) NOT NULL,
            invoice_number VARCHAR(100) DEFAULT NULL,
            total_amount DOUBLE DEFAULT 0,
            status VARCHAR(30) DEFAULT 'Draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cylinder_purchase_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            purchase_id VARCHAR(100) NOT NULL,
            cylinder_type VARCHAR(100) NOT NULL,
            quantity INT DEFAULT 0,
            unit_cost DOUBLE DEFAULT 0,
            total_cost DOUBLE DEFAULT 0,
            FOREIGN KEY (purchase_id) REFERENCES cylinder_purchases(purchase_id) ON DELETE CASCADE
        )
    """)

    # --- Cylinder Registry (Serial Numbers) ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cylinder_registry (
            id INT AUTO_INCREMENT PRIMARY KEY,
            serial_number VARCHAR(100) NOT NULL UNIQUE,
            barcode VARCHAR(200) DEFAULT NULL,
            cylinder_type VARCHAR(100) DEFAULT NULL,
            capacity DOUBLE DEFAULT 0,
            capacity_unit VARCHAR(10) DEFAULT 'Kg',
            manufacturing_date VARCHAR(20) DEFAULT NULL,
            test_due_date VARCHAR(20) DEFAULT NULL,
            ownership VARCHAR(200) DEFAULT 'Company',
            status VARCHAR(30) DEFAULT 'Active',
            purchase_id VARCHAR(100) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # --- Cylinder Testing / Repair ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cylinder_testing (
            id INT AUTO_INCREMENT PRIMARY KEY,
            transaction_id VARCHAR(100) NOT NULL UNIQUE,
            vendor_name VARCHAR(200) NOT NULL,
            date_sent VARCHAR(20) NOT NULL,
            expected_return_date VARCHAR(20) DEFAULT NULL,
            status VARCHAR(30) DEFAULT 'Sent',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cylinder_testing_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            transaction_id VARCHAR(100) NOT NULL,
            serial_number VARCHAR(100) NOT NULL,
            reason VARCHAR(100) DEFAULT 'Hydro Testing',
            FOREIGN KEY (transaction_id) REFERENCES cylinder_testing(transaction_id) ON DELETE CASCADE
        )
    """)

    # --- Cylinder Returns ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cylinder_returns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            return_id VARCHAR(100) NOT NULL UNIQUE,
            vendor_name VARCHAR(200) NOT NULL,
            date_received VARCHAR(20) NOT NULL,
            status VARCHAR(30) DEFAULT 'Draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cylinder_return_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            return_id VARCHAR(100) NOT NULL,
            serial_number VARCHAR(100) NOT NULL,
            status VARCHAR(30) DEFAULT 'Passed',
            next_test_due_date VARCHAR(20) DEFAULT NULL,
            repair_cost DOUBLE DEFAULT 0,
            FOREIGN KEY (return_id) REFERENCES cylinder_returns(return_id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print(f"Database '{DB_NAME}' initialized successfully!")


def seed_demo_data():
    """Insert demo data if the database is empty."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM vendors")
    count = cursor.fetchone()[0]

    if count == 0:
        # Demo vendors
        vendors = [
            ("VND-001", "Airgas India Pvt Ltd", "Ramesh Kumar", "9876543210", "ramesh@airgas.in", "Chennai, Tamil Nadu", "Net 30"),
            ("VND-002", "Bharat Gas Cylinders Ltd", "Suresh Patel", "9876543211", "suresh@bgcl.in", "Mumbai, Maharashtra", "Net 45"),
            ("VND-003", "National Gas Equipment", "Priya Sharma", "9876543212", "priya@nge.in", "Delhi, NCR", "Net 30"),
            ("VND-004", "Industrial Valve Co", "Anand Rajan", "9876543213", "anand@ivc.in", "Coimbatore, Tamil Nadu", "Advance 50%"),
        ]
        cursor.executemany(
            "INSERT INTO vendors (vendor_code, vendor_name, contact_person, phone, email, address, payment_terms) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            vendors
        )

        # Demo items
        items = [
            ("ITM-001", "Oxygen Cylinder Cap", "Caps & Valves", "Nos", "Cylinder caps for oxygen cylinders"),
            ("ITM-002", "Cylinder Valve Assembly", "Valves", "Nos", "Standard valve assembly"),
            ("ITM-003", "Safety Relief Valve", "Safety Equipment", "Nos", "Pressure relief valve"),
            ("ITM-004", "Cylinder Tare Weight Plate", "Accessories", "Nos", "Tare weight identification plate"),
            ("ITM-005", "Hydro Testing Service", "Services", "Service", "Cylinder hydro pressure testing"),
        ]
        cursor.executemany(
            "INSERT INTO items_master (item_code, item_name, category, uom, description) VALUES (%s,%s,%s,%s,%s)",
            items
        )

        conn.commit()
        print("Demo data seeded successfully!")
    else:
        print("Database already has data, skipping seed.")

    cursor.close()
    conn.close()
