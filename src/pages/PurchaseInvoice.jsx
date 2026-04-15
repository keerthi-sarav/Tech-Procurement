import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Save, X, Receipt, CreditCard, CheckCircle } from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';

function genInvNum() { return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}`; }

const emptyForm = () => ({
  invoice_number: genInvNum(),
  vendor_id: '',
  vendor_name: '',
  invoice_date: new Date().toISOString().split('T')[0],
  grn_number: '',
  po_number: '',
  subtotal: 0,
  tax_percent: 18,
  tax_amount: 0,
  total_amount: 0,
  payment_status: 'Unpaid',
  due_date: '',
  remarks: '',
});

export default function PurchaseInvoice() {
  const { vendors, grns, pos } = useProcurement();
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const showMsg = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };

  const fetchInvoices = async () => {
    const res = await fetch('/api/purchase-invoices');
    setInvoices(await res.json());
  };
  useEffect(() => { fetchInvoices(); }, []);

  const handleField = (e) => {
    const {name, value} = e.target;
    setForm(f => {
      const updated = {...f, [name]: value};
      if (name==='subtotal'||name==='tax_percent') {
        const sub = parseFloat(updated.subtotal)||0;
        const tax = (sub * (parseFloat(updated.tax_percent)||0))/100;
        updated.tax_amount = tax;
        updated.total_amount = sub+tax;
      }
      return updated;
    });
  };

  const handleVendorChange = (e) => {
    const id = parseInt(e.target.value);
    const v = vendors.find(v=>v.id===id);
    setForm(f=>({...f, vendor_id:id, vendor_name:v?.vendor_name||''}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch('/api/purchase-invoices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      if (!res.ok) throw new Error(await res.text());
      await fetchInvoices(); showMsg('Invoice saved!'); setMode('list');
    } catch(err){showMsg('Error: '+err.message,'error');}
    finally{setLoading(false);}
  };

  const markPaid = async (inv_number) => {
    await fetch(`/api/purchase-invoices/${inv_number}/paid`,{method:'PATCH'});
    await fetchInvoices(); showMsg('Invoice marked as paid!');
  };

  const handleDelete = async (inv_number) => {
    if (!confirm('Delete?')) return;
    await fetch(`/api/purchase-invoices/${inv_number}`,{method:'DELETE'});
    await fetchInvoices(); showMsg('Deleted.');
  };

  const filtered = invoices.filter(inv=>inv.invoice_number?.toLowerCase().includes(search.toLowerCase())||inv.vendor_name?.toLowerCase().includes(search.toLowerCase()));

  if (mode !== 'list') {
    const readOnly = mode==='view';
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{mode==='view'?'Invoice Details':'New Purchase Invoice'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{mode==='view'?'Viewing invoice':'Record a vendor invoice'}</p>
          </div>
          <button onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm transition-colors"><X size={15}/>Back</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Receipt size={15} className="text-[#1a56db]"/>Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Invoice Number</label>
                <input value={form.invoice_number} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor</label>
                <select value={form.vendor_id||''} onChange={handleVendorChange} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  <option value="">Select Vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Invoice Date</label>
                <input name="invoice_date" type="date" value={form.invoice_date} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Due Date</label>
                <input name="due_date" type="date" value={form.due_date||''} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">GRN Reference</label>
                <select name="grn_number" value={form.grn_number||''} onChange={handleField} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  <option value="">None</option>{grns.map(g=><option key={g.grn_number} value={g.grn_number}>{g.grn_number}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">PO Reference</label>
                <select name="po_number" value={form.po_number||''} onChange={handleField} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  <option value="">None</option>{pos.map(p=><option key={p.po_number} value={p.po_number}>{p.po_number}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Subtotal (₹)</label>
                <input name="subtotal" type="number" step="0.01" value={form.subtotal} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Tax % (GST)</label>
                <input name="tax_percent" type="number" step="0.01" value={form.tax_percent} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Tax Amount (₹)</label>
                <input value={(parseFloat(form.tax_amount)||0).toFixed(2)} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#374151]"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Total Amount (₹)</label>
                <input value={(parseFloat(form.total_amount)||0).toFixed(2)} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#e8f0fe] text-[#1a56db] font-bold"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Payment Status</label>
                <select name="payment_status" value={form.payment_status} onChange={handleField} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  {['Unpaid','Partial','Paid'].map(s=><option key={s}>{s}</option>)}
                </select></div>
            </div>
            <div className="mt-4"><label className="block text-xs font-medium text-[#6b7280] mb-1">Remarks</label>
              <textarea name="remarks" value={form.remarks||''} onChange={handleField} readOnly={readOnly} rows={2} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
          </div>
          {!readOnly&&(<div className="flex justify-end gap-3">
            <button type="button" onClick={()=>setMode('list')} className="px-5 py-2.5 border border-[#e5e7eb] rounded-lg text-sm hover:bg-[#f3f4f6] transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] disabled:opacity-60">
              <Save size={15}/>{loading?'Saving...':'Save Invoice'}
            </button>
          </div>)}
        </form>
      </div>
    );
  }

  return (
    <div>
      {msg&&(<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>)}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search invoices..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white"/>
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm">
          <Plus size={16}/>New Invoice
        </button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>{['Invoice #','Vendor','Date','GRN Ref','Total (₹)','Status','Actions'].map(h=>(
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filtered.length===0&&(<tr><td colSpan={7} className="text-center py-12 text-[#6b7280] text-sm">No invoices found.</td></tr>)}
              {filtered.map(inv=>(
                <tr key={inv.invoice_number} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#1a56db]">{inv.invoice_number}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{inv.vendor_name}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{inv.invoice_date}</td>
                  <td className="px-5 py-3.5 text-[#6b7280]">{inv.grn_number||'—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#374151]">₹{parseFloat(inv.total_amount||0).toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${inv.payment_status==='Paid'?'bg-[#dcfce7] text-[#16a34a]':inv.payment_status==='Partial'?'bg-[#fef3c7] text-[#d97706]':'bg-[#fee2e2] text-[#dc2626]'}`}>
                      <CreditCard size={10} className="mr-1"/>{inv.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>{setForm(inv);setMode('view');}} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]"><Eye size={14}/></button>
                      {inv.payment_status!=='Paid'&&(<button onClick={()=>markPaid(inv.invoice_number)} title="Mark Paid" className="p-1.5 rounded-lg hover:bg-[#dcfce7] text-[#16a34a]"><CheckCircle size={14}/></button>)}
                      <button onClick={()=>handleDelete(inv.invoice_number)} className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
