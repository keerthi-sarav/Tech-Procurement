import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, Save, X, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';

function genPO() { return `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}`; }

const statusColor = (s) => {
  if (s==='Approved') return 'bg-[#dcfce7] text-[#16a34a]';
  if (s==='Rejected') return 'bg-[#fee2e2] text-[#dc2626]';
  return 'bg-[#fef3c7] text-[#d97706]';
};

const emptyLine = () => ({item_code:'',item_name:'',quantity:1,uom:'Nos',rate:0,tax_percent:0,discount_percent:0,total_amount:0});
const emptyForm = () => ({
  po_number: genPO(),
  vendor_id: '',
  vendor_name: '',
  po_date: new Date().toISOString().split('T')[0],
  delivery_date: '',
  payment_terms: '',
  currency: 'INR',
  terms_conditions: '',
  approval_status: 'Pending',
  total_amount: 0,
  rfq_number: '',
  pr_number: '',
  line_items: [emptyLine()],
});

export default function PurchaseOrder() {
  const { pos, fetchPOs, vendors, prs, rfqs } = useProcurement();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const showMsg = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };
  const handleField = (e) => setForm(f=>({...f,[e.target.name]:e.target.value}));

  const handleVendorChange = (e) => {
    const id = parseInt(e.target.value);
    const v = vendors.find(v=>v.id===id);
    setForm(f=>({...f, vendor_id:id, vendor_name:v?.vendor_name||'', payment_terms:v?.payment_terms||f.payment_terms}));
  };

  const handleLine = (i, e) => {
    const lines = [...form.line_items];
    lines[i] = {...lines[i], [e.target.name]: parseFloat(e.target.value)||e.target.value};
    const l = lines[i];
    const base = (l.quantity||0) * (l.rate||0);
    const disc = base * ((l.discount_percent||0)/100);
    const tax = (base-disc) * ((l.tax_percent||0)/100);
    lines[i].total_amount = base - disc + tax;
    setForm(f => ({...f, line_items: lines, total_amount: lines.reduce((s,l)=>s+(l.total_amount||0),0)}));
  };

  const addLine = () => setForm(f=>({...f, line_items:[...f.line_items, emptyLine()]}));
  const removeLine = (i) => {
    setForm(f => {
      const lines = f.line_items.filter((_,idx)=>idx!==i);
      return {...f, line_items:lines, total_amount:lines.reduce((s,l)=>s+(l.total_amount||0),0)};
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const url = mode==='edit'?`/api/purchase-orders/${form.po_number}`:'/api/purchase-orders';
      const method = mode==='edit'?'PUT':'POST';
      const res = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, line_items:form.line_items.filter(l=>l.item_name)})});
      if (!res.ok) throw new Error(await res.text());
      await fetchPOs(); showMsg(mode==='edit'?'PO updated!':'PO created!'); setMode('list');
    } catch(err){showMsg('Error: '+err.message,'error');} finally{setLoading(false);}
  };

  const handleApprove = async (po_number, action) => {
    await fetch(`/api/purchase-orders/${po_number}/${action}`, {method:'PATCH'});
    await fetchPOs(); showMsg(`PO ${action}d!`);
  };

  const handleDelete = async (po_number) => {
    if (!confirm('Delete this PO?')) return;
    await fetch(`/api/purchase-orders/${po_number}`,{method:'DELETE'});
    await fetchPOs(); showMsg('PO deleted.');
  };

  const filtered = pos.filter(p=>p.po_number?.toLowerCase().includes(search.toLowerCase())||p.vendor_name?.toLowerCase().includes(search.toLowerCase()));

  if (mode !== 'list') {
    const readOnly = mode==='view';
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{mode==='view'?'PO Details':mode==='edit'?'Edit Purchase Order':'New Purchase Order'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{mode==='view'?'View only':'Create a purchase order to a vendor'}</p>
          </div>
          <button onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm transition-colors"><X size={15}/>Back</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Package size={15} className="text-[#1a56db]"/>PO Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">PO Number</label>
                <input value={form.po_number} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor *</label>
                <select value={form.vendor_id||''} onChange={handleVendorChange} disabled={readOnly} required
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb] text-[#6b7280]':'bg-white'}`}>
                  <option value="">Select Vendor</option>
                  {vendors.map(v=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">PO Date</label>
                <input name="po_date" type="date" value={form.po_date} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Delivery Date</label>
                <input name="delivery_date" type="date" value={form.delivery_date} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Payment Terms</label>
                <input name="payment_terms" value={form.payment_terms||''} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Currency</label>
                <select name="currency" value={form.currency} onChange={handleField} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  {['INR','USD','EUR'].map(c=><option key={c}>{c}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">PR Reference</label>
                <select name="pr_number" value={form.pr_number||''} onChange={handleField} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  <option value="">None</option>{prs.map(p=><option key={p.pr_number} value={p.pr_number}>{p.pr_number}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">RFQ Reference</label>
                <select name="rfq_number" value={form.rfq_number||''} onChange={handleField} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  <option value="">None</option>{rfqs.map(r=><option key={r.rfq_number} value={r.rfq_number}>{r.rfq_number}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Approval Status</label>
                <select name="approval_status" value={form.approval_status} onChange={handleField} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  {['Pending','Approved','Rejected'].map(s=><option key={s}>{s}</option>)}
                </select></div>
            </div>
            <div className="mt-4"><label className="block text-xs font-medium text-[#6b7280] mb-1">Terms & Conditions</label>
              <textarea name="terms_conditions" value={form.terms_conditions||''} onChange={handleField} readOnly={readOnly} rows={2}
                className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none focus:outline-none ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Line Items</h3>
              {!readOnly&&<button type="button" onClick={addLine} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-xs font-medium hover:bg-[#1e429f]"><Plus size={13}/>Add Item</button>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <tr>{['#','Item Code','Item Name','Qty','UOM','Rate','Tax%','Disc%','Total',''].map(h=>(
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {form.line_items.map((l,i)=>(
                    <tr key={i} className="hover:bg-[#f9fafb]">
                      <td className="px-3 py-2 text-[#6b7280] text-xs">{i+1}</td>
                      {['item_code','item_name'].map(f=>(
                        <td key={f} className="px-3 py-2">
                          <input name={f} value={l[f]||''} onChange={e=>handleLine(i,e)} readOnly={readOnly} className={`w-full px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]/40 ${readOnly?'bg-transparent border-transparent':''}`}/>
                        </td>
                      ))}
                      {['quantity','rate','tax_percent','discount_percent'].map(f=>(
                        <td key={f} className="px-3 py-2">
                          <input name={f} type="number" step="0.01" value={l[f]||0} onChange={e=>handleLine(i,e)} readOnly={readOnly} className={`w-20 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-transparent border-transparent':''}`}/>
                        </td>
                      ))}
                      <select name="uom" value={l.uom} onChange={e=>handleLine(i,e)} disabled={readOnly} className="hidden"></select>
                      <td className="px-3 py-2 font-semibold text-[#1a56db] whitespace-nowrap">₹{(l.total_amount||0).toFixed(2)}</td>
                      <td className="px-3 py-2">{!readOnly&&form.line_items.length>1&&(<button type="button" onClick={()=>removeLine(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={13}/></button>)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#f9fafb] border-t border-[#e5e7eb]">
                  <tr>
                    <td colSpan={8} className="px-3 py-3 text-right text-sm font-bold text-[#374151]">Grand Total:</td>
                    <td className="px-3 py-3 font-bold text-[#1a56db]">₹{form.total_amount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {!readOnly&&(
            <div className="flex justify-end gap-3">
              <button type="button" onClick={()=>setMode('list')} className="px-5 py-2.5 border border-[#e5e7eb] rounded-lg text-sm hover:bg-[#f3f4f6] transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors disabled:opacity-60">
                <Save size={15}/>{loading?'Saving...':mode==='edit'?'Update PO':'Create PO'}
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div>
      {msg&&(<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>)}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search POs..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white"/>
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors shadow-sm">
          <Plus size={16}/>New Purchase Order
        </button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>{['PO Number','Vendor','PO Date','Delivery Date','Total (₹)','Status','Actions'].map(h=>(
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filtered.length===0&&(<tr><td colSpan={7} className="text-center py-12 text-[#6b7280] text-sm">No purchase orders found.</td></tr>)}
              {filtered.map(po=>(
                <tr key={po.po_number} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#1a56db]">{po.po_number}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{po.vendor_name}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{po.po_date}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{po.delivery_date}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#374151]">₹{parseFloat(po.total_amount||0).toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(po.approval_status)}`}>
                      {po.approval_status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>{setForm({...po,line_items:po.line_items?.length?po.line_items:[emptyLine()]});setMode('view');}} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]"><Eye size={14}/></button>
                      <button onClick={()=>{setForm({...po,line_items:po.line_items?.length?po.line_items:[emptyLine()]});setMode('edit');}} className="p-1.5 rounded-lg hover:bg-[#fef3c7] text-[#d97706]"><Edit2 size={14}/></button>
                      {po.approval_status==='Pending'&&(<>
                        <button onClick={()=>handleApprove(po.po_number,'approve')} title="Approve" className="p-1.5 rounded-lg hover:bg-[#dcfce7] text-[#16a34a]"><CheckCircle size={14}/></button>
                        <button onClick={()=>handleApprove(po.po_number,'reject')} title="Reject" className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626]"><XCircle size={14}/></button>
                      </>)}
                      <button onClick={()=>handleDelete(po.po_number)} className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={14}/></button>
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
