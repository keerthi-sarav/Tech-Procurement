import React, { createContext, useContext, useState, useEffect } from 'react';

const ProcurementContext = createContext(null);

export function ProcurementProvider({ children }) {
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [prs, setPrs] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [pos, setPos] = useState([]);
  const [grns, setGrns] = useState([]);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      setVendors(data);
    } catch (e) { console.error(e); }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items-master');
      const data = await res.json();
      setItems(data);
    } catch (e) { console.error(e); }
  };

  const fetchPRs = async () => {
    try {
      const res = await fetch('/api/purchase-requisitions');
      const data = await res.json();
      setPrs(data);
    } catch (e) { console.error(e); }
  };

  const fetchRFQs = async () => {
    try {
      const res = await fetch('/api/rfqs');
      const data = await res.json();
      setRfqs(data);
    } catch (e) { console.error(e); }
  };

  const fetchPOs = async () => {
    try {
      const res = await fetch('/api/purchase-orders');
      const data = await res.json();
      setPos(data);
    } catch (e) { console.error(e); }
  };

  const fetchGRNs = async () => {
    try {
      const res = await fetch('/api/goods-receipts');
      const data = await res.json();
      setGrns(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchVendors();
    fetchItems();
    fetchPRs();
    fetchRFQs();
    fetchPOs();
    fetchGRNs();
  }, []);

  return (
    <ProcurementContext.Provider value={{
      vendors, fetchVendors,
      items, fetchItems,
      prs, fetchPRs,
      rfqs, fetchRFQs,
      pos, fetchPOs,
      grns, fetchGRNs,
    }}>
      {children}
    </ProcurementContext.Provider>
  );
}

export function useProcurement() {
  return useContext(ProcurementContext);
}
