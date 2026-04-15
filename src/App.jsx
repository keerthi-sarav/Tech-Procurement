import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProcurementProvider } from './context/ProcurementContext';
import Layout from './components/Layout';
import PurchaseRequisition from './pages/PurchaseRequisition';
import RequestForQuotation from './pages/RequestForQuotation';
import VendorQuotation from './pages/VendorQuotation';
import PurchaseOrder from './pages/PurchaseOrder';
import GoodsReceiptNote from './pages/GoodsReceiptNote';
import PurchaseInvoice from './pages/PurchaseInvoice';
import CylinderPurchase from './pages/CylinderPurchase';
import CylinderSerialNumber from './pages/CylinderSerialNumber';
import CylinderTesting from './pages/CylinderTesting';
import CylinderReturn from './pages/CylinderReturn';

function App() {
  return (
    <ProcurementProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/purchase-requisition" replace />} />
            <Route path="purchase-requisition" element={<PurchaseRequisition />} />
            <Route path="rfq" element={<RequestForQuotation />} />
            <Route path="vendor-quotation" element={<VendorQuotation />} />
            <Route path="purchase-order" element={<PurchaseOrder />} />
            <Route path="goods-receipt" element={<GoodsReceiptNote />} />
            <Route path="purchase-invoice" element={<PurchaseInvoice />} />
            <Route path="cylinder-purchase" element={<CylinderPurchase />} />
            <Route path="cylinder-serial" element={<CylinderSerialNumber />} />
            <Route path="cylinder-testing" element={<CylinderTesting />} />
            <Route path="cylinder-return" element={<CylinderReturn />} />
          </Route>
        </Routes>
      </Router>
    </ProcurementProvider>
  );
}

export default App;
