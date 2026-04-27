import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Eye, Save, X, Truck, FileText, CheckCircle, Clock } from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { useSortableTable, SortableHeader } from '../hooks/useSortableTable';

function genGRN() { return `GRN-${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}`; }

const emptyLine = () => ({item_code:'',item_name:'',ordered_qty:0,received_qty:0,rejected_qty:0,accepted_qty:0,uom:'Nos',remarks:''});

const StatusIcon = ({ s }) => {
  if (s === 'Posted' || s === 'Received') return <CheckCircle size={13} />;
  return <Clock size={13} />;
};
const emptyForm = () => ({
  grn_number: genGRN(),
  po_number: '',
  vendor_id: '',
  vendor_name: '',
  receipt_date: new Date().toISOString().split('T')[0],
  warehouse_location: '',
  qc_required: 'No',
  status: 'Draft',
  line_items: [emptyLine()],
});

export default function GoodsReceiptNote() {
  const { grns, fetchGRNs, vendors, pos } = useProcurement();
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
    setForm(f=>({...f,vendor_id:id,vendor_name:v?.vendor_name||''}));
  };

  const handlePOChange = (e) => {
    const po_number = e.target.value;
    const po = pos.find(p => p.po_number === po_number);
    if (po) {
      const newLineItems = po.line_items?.length
        ? po.line_items.map(l => ({
            item_code: l.item_code || '',
            item_name: l.item_name || '',
            ordered_qty: parseFloat(l.quantity || 0),
            received_qty: 0,
            rejected_qty: 0,
            accepted_qty: 0,
            uom: l.uom || 'Nos',
            remarks: '',
          }))
        : [emptyLine()];
      setForm(f => ({
        ...f,
        po_number,
        vendor_id: po.vendor_id || f.vendor_id,
        vendor_name: po.vendor_name || f.vendor_name,
        line_items: newLineItems,
      }));
    } else {
      setForm(f => ({ ...f, po_number }));
    }
  };

  const handleLine = (i, e) => {
    const lines = [...form.line_items];
    lines[i] = {...lines[i], [e.target.name]: e.target.value};
    const l = lines[i];
    lines[i].accepted_qty = Math.max(0, (parseFloat(l.received_qty)||0) - (parseFloat(l.rejected_qty)||0));
    setForm(f=>({...f, line_items:lines}));
  };

  const addLine = () => setForm(f=>({...f, line_items:[...f.line_items, emptyLine()]}));
  const removeLine = (i) => setForm(f=>({...f, line_items:f.line_items.filter((_,idx)=>idx!==i)}));

  const handleAction = async (actionStatus) => {
    setLoading(true);
    try {
      const payload = {...form, status: actionStatus, line_items:form.line_items.filter(l=>l.item_name)};
      const url = mode==='edit'?`/api/goods-receipts/${form.grn_number}`:'/api/goods-receipts';
      const method = mode==='edit'?'PUT':'POST';
      const res = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if (!res.ok) throw new Error(await res.text());
      await fetchGRNs(); showMsg(`GRN ${actionStatus === 'Posted' ? 'posted' : 'saved'}!`); setMode('list');
    } catch(err){showMsg('Error: '+err.message,'error');}
    finally{setLoading(false);}
  };

  const filtered = grns.filter(g=>g.grn_number?.toLowerCase().includes(search.toLowerCase())||g.vendor_name?.toLowerCase().includes(search.toLowerCase()));

  const { sorted: displayList, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const readOnly = mode==='view';
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{mode==='view'?'GRN Details':'New Goods Receipt Note'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{mode==='view'?'Viewing receipt details':'Record materials received from vendor'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && (
              <>
                <button type="button" onClick={()=>handleAction('Saved')} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors disabled:opacity-60">
                  <Save size={15}/> Save
                </button>
                <button type="button" onClick={()=>{ if(confirm('Post this GRN? It cannot be edited later.')) handleAction('Posted'); }} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] text-white rounded-lg text-sm font-medium hover:bg-[#047857] transition-colors disabled:opacity-60">
                  <FileText size={15}/> Post
                </button>
              </>
            )}
            <button onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm transition-colors"><X size={15}/>Back</button>
          </div>
        </div>
        <form className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Truck size={15} className="text-[#1a56db]"/>Receipt Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">GRN Number</label>
                <input value={form.grn_number} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">PO Reference</label>
                <select name="po_number" value={form.po_number||''} onChange={handlePOChange} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  <option value="">None</option>{pos.map(p=><option key={p.po_number} value={p.po_number}>{p.po_number}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor</label>
                <select value={form.vendor_id||''} onChange={handleVendorChange} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  <option value="">Select Vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Receipt Date</label>
                <input name="receipt_date" type="date" value={form.receipt_date} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Warehouse Location</label>
                <input name="warehouse_location" value={form.warehouse_location||''} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">QC Required</label>
                <div className={`flex gap-4 mt-2 ${readOnly?'opacity-60':''}`}>
                  {['Yes','No'].map(opt=>(
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="qc_required" value={opt} checked={form.qc_required===opt} onChange={handleField} disabled={readOnly} className="accent-[#1a56db]"/>
                      <span className="text-sm text-[#374151]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
                <input value={form.status} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]" />
              </div>
            </div>
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
                  <tr>{['#','Code','Item Name','Ordered','Received','Rejected','Accepted','Remarks',''].map(h=>(
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {form.line_items.map((l,i)=>(
                    <tr key={i} className="hover:bg-[#f9fafb]">
                      <td className="px-3 py-2 text-[#6b7280] text-xs">{i+1}</td>
                      {['item_code','item_name'].map(f=>(
                        <td key={f} className="px-3 py-2">
                          <input name={f} value={l[f]||''} onChange={e=>handleLine(i,e)} readOnly={readOnly} className={`w-full px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-transparent border-transparent':''}`}/>
                        </td>
                      ))}
                      {['ordered_qty','received_qty','rejected_qty'].map(f=>(
                        <td key={f} className="px-3 py-2">
                          <input name={f} type="number" value={l[f]||0} onChange={e=>handleLine(i,e)} readOnly={readOnly} className={`w-20 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-transparent border-transparent':''}`}/>
                        </td>
                      ))}
                      <td className="px-3 py-2 font-semibold text-[#16a34a]">{l.accepted_qty||0}</td>
                      <td className="px-3 py-2"><input name="remarks" value={l.remarks||''} onChange={e=>handleLine(i,e)} readOnly={readOnly} className={`w-full px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${readOnly?'bg-transparent border-transparent':''}`}/></td>
                      <td className="px-3 py-2">{!readOnly&&form.line_items.length>1&&(<button type="button" onClick={()=>removeLine(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={13}/></button>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


        </form>
      </div>
    );
  }

  return (
    <div>
      {msg&&(<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>)}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search GRNs..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white"/>
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm">
          <Plus size={16}/>New GRN
        </button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                <SortableHeader label="GRN Number"  sortKey="grn_number"         sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="PO Reference" sortKey="po_number"          sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Vendor"       sortKey="vendor_name"        sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Date"         sortKey="receipt_date"       sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Warehouse"    sortKey="warehouse_location" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="QC"           sortKey="qc_required"        sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Status"       sortKey="status"             sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap bg-[#f9fafb]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {displayList.length===0&&(<tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">No GRNs found.</td></tr>)}
              {displayList.map(g=>(
                <tr key={g.grn_number} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#1a56db]">{g.grn_number}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{g.po_number||'—'}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{g.vendor_name}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{g.receipt_date}</td>
                  <td className="px-5 py-3.5 text-[#6b7280]">{g.warehouse_location||'—'}</td>
                  <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${g.qc_required==='Yes'?'bg-[#fef3c7] text-[#d97706]':'bg-[#f3f4f6] text-[#6b7280]'}`}>{g.qc_required}</span></td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${g.status === 'Posted'?'bg-[#dcfce7] text-[#16a34a]':'bg-[#e8f0fe] text-[#1a56db]'}`}>
                      <StatusIcon s={g.status || 'Received'} /> {g.status || 'Received'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>{setForm({...g,line_items:g.line_items||[]});setMode('view');}} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]" title="View"><Eye size={14}/></button>
                      {g.status !== 'Posted' && (
                        <button onClick={()=>{setForm({...g,line_items:g.line_items||[]});setMode('edit');}} className="p-1.5 rounded-lg hover:bg-[#fef3c7] text-[#d97706]" title="Edit"><Edit2 size={14}/></button>
                      )}
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
