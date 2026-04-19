import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, Save, X, ShoppingCart, CheckSquare, FileText } from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { useSortableTable, SortableHeader } from '../hooks/useSortableTable';

const UOMS = ['Nos', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set', 'Pair', 'Service'];

function genRFQ() {
  const d = new Date();
  return `RFQ-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`;
}

const emptyLine = () => ({ item_code:'', item_name:'', quantity:0, uom:'Nos', expected_rate:0 });
const emptyForm = () => ({
  rfq_number: genRFQ(),
  rfq_date: new Date().toISOString().split('T')[0],
  pr_number: '',
  validity_date: '',
  vendor_ids: [],
  status: 'Open',
  line_items: [emptyLine()],
});

const statusColor = (s) => {
  if (s === 'Posted' || s === 'Closed') return 'bg-[#dcfce7] text-[#16a34a]';
  if (s === 'Cancelled') return 'bg-[#fee2e2] text-[#dc2626]';
  return 'bg-[#e8f0fe] text-[#1a56db]';
};

export default function RequestForQuotation() {
  const { rfqs, fetchRFQs, vendors, prs } = useProcurement();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const showMsg = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };
  const handleField = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      let updated = { ...f, [name]: value };
      if (name === 'pr_number' && value) {
        const pr = prs.find(p => p.pr_number === value);
        if (pr && pr.line_items?.length) {
          updated.line_items = pr.line_items.map(l => ({
            item_code: l.item_code,
            item_name: l.item_name,
            quantity: l.quantity_required || 0,
            uom: l.uom || 'Nos',
            expected_rate: 0
          }));
        }
      }
      return updated;
    });
  };
  const handleLine = (i, e) => {
    const lines = [...form.line_items];
    lines[i] = {...lines[i], [e.target.name]: e.target.value};
    setForm(f => ({...f, line_items: lines}));
  };
  const addLine = () => setForm(f => ({...f, line_items: [...f.line_items, emptyLine()]}));
  const removeLine = (i) => setForm(f => ({...f, line_items: f.line_items.filter((_,idx)=>idx!==i)}));

  const toggleVendor = (id) => {
    setForm(f => ({
      ...f,
      vendor_ids: f.vendor_ids.includes(id) ? f.vendor_ids.filter(v=>v!==id) : [...f.vendor_ids, id]
    }));
  };

  const handleAction = async (actionStatus) => {
    setLoading(true);
    try {
      const payload = { ...form, status: actionStatus, line_items: form.line_items.filter(l=>l.item_name) };
      const url = mode === 'edit' ? `/api/rfqs/${form.rfq_number}` : '/api/rfqs';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchRFQs();
      showMsg(`RFQ ${actionStatus === 'Posted' ? 'posted' : 'saved'}!`);
      setMode('list');
    } catch (err) { showMsg('Error: '+err.message,'error'); }
    finally { setLoading(false); }
  };

  const handleEdit = (rfq) => { setForm({...rfq, line_items: rfq.line_items?.length ? rfq.line_items : [emptyLine()], vendor_ids: rfq.vendor_ids || []}); setMode('edit'); };
  const handleView = (rfq) => { setForm({...rfq, line_items: rfq.line_items || [], vendor_ids: rfq.vendor_ids || []}); setMode('view'); };

  const filtered = rfqs.filter(r=>
    r.rfq_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.pr_number?.toLowerCase().includes(search.toLowerCase())
  );

  const { sorted: displayList, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const readOnly = mode === 'view';
    const selectedVendorNames = vendors.filter(v => form.vendor_ids.includes(v.id)).map(v=>v.vendor_name).join(', ');
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{mode==='view'?'RFQ Details':mode==='edit'?'Edit RFQ':'New Request for Quotation'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{mode==='view'?'Viewing record':'Fill in the details below'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && (
              <>
                <button type="button" onClick={()=>handleAction(form.status)} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors disabled:opacity-60">
                  <Save size={15}/> Save
                </button>
                <button type="button" onClick={()=>{ if(confirm('Post this RFQ? It cannot be edited later.')) handleAction('Posted'); }} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] text-white rounded-lg text-sm font-medium hover:bg-[#047857] transition-colors disabled:opacity-60">
                  <FileText size={15}/> Post
                </button>
              </>
            )}
            <button onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm transition-colors">
              <X size={15}/> Back
            </button>
          </div>
        </div>
        <form className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2">
              <ShoppingCart size={15} className="text-[#1a56db]"/> RFQ Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {label:'RFQ Number',name:'rfq_number',readOnly:true},
                {label:'RFQ Date',name:'rfq_date',type:'date'},
                {label:'Validity Date',name:'validity_date',type:'date'},
              ].map(f=>(
                <div key={f.name}>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">{f.label}</label>
                  <input name={f.name} type={f.type||'text'} value={form[f.name]||''} onChange={handleField}
                    readOnly={readOnly||f.readOnly}
                    className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors ${(readOnly||f.readOnly)?'bg-[#f9fafb] text-[#6b7280]':'bg-white'}`}/>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">PR Reference</label>
                <select name="pr_number" value={form.pr_number||''} onChange={handleField} disabled={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  <option value="">-- No PR Reference --</option>
                  {prs.filter(p => !readOnly || p.pr_number === form.pr_number).map(p=><option key={p.pr_number} value={p.pr_number}>{p.pr_number} — {p.requested_by}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
                <input value={form.status} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]" />
              </div>
            </div>
          </div>

          {/* Vendor Multi-select */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-3">
              Vendors <span className="text-[#1a56db] font-bold">({form.vendor_ids.length} selected)</span>
            </h3>
            {readOnly ? (
              <p className="text-sm text-[#374151]">{selectedVendorNames || 'None selected'}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {vendors.map(v=>(
                  <label key={v.id} onClick={()=>toggleVendor(v.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm
                      ${form.vendor_ids.includes(v.id)?'border-[#1a56db] bg-[#e8f0fe] text-[#1a56db] font-medium':'border-[#e5e7eb] hover:border-[#1a56db]/40 text-[#374151]'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${form.vendor_ids.includes(v.id)?'bg-[#1a56db] border-[#1a56db]':'border-[#d1d5db]'}`}>
                      {form.vendor_ids.includes(v.id) && <CheckSquare size={10} className="text-white"/>}
                    </div>
                    <span className="truncate">{v.vendor_name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Line Items</h3>
              {!readOnly && (
                <button type="button" onClick={addLine} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-xs font-medium hover:bg-[#1e429f] transition-colors">
                  <Plus size={13}/> Add Item
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <tr>
                    {['#','Item Code','Item Name','Quantity','UOM','Expected Rate',''].map(h=>(
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {form.line_items.map((line,i)=>(
                    <tr key={i} className="hover:bg-[#f9fafb]">
                      <td className="px-4 py-2 text-[#6b7280] text-xs">{i+1}</td>
                      {['item_code','item_name'].map(f=>(
                        <td key={f} className="px-4 py-2">
                          <input name={f} value={line[f]||''} onChange={e=>handleLine(i,e)} readOnly={readOnly}
                            className={`w-full px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]/40 ${readOnly?'bg-transparent border-transparent':''}`}/>
                        </td>
                      ))}
                      <td className="px-4 py-2"><input name="quantity" type="number" value={line.quantity} onChange={e=>handleLine(i,e)} readOnly={readOnly} className={`w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-transparent border-transparent':''}`}/></td>
                      <td className="px-4 py-2">
                        <select name="uom" value={line.uom} onChange={e=>handleLine(i,e)} disabled={readOnly} className={`px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${readOnly?'bg-transparent border-transparent':''}`}>
                          {UOMS.map(u=><option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2"><input name="expected_rate" type="number" value={line.expected_rate} onChange={e=>handleLine(i,e)} readOnly={readOnly} className={`w-28 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-transparent border-transparent':''}`}/></td>
                      <td className="px-4 py-2">{!readOnly && form.line_items.length>1 && (<button type="button" onClick={()=>removeLine(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={13}/></button>)}</td>
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
      {msg && (<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>)}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search RFQs..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white"/>
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors shadow-sm">
          <Plus size={16}/> New RFQ
        </button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                <SortableHeader label="RFQ Number"   sortKey="rfq_number"   sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Date"          sortKey="rfq_date"     sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="PR Reference"  sortKey="pr_number"    sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Validity Date" sortKey="validity_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap bg-[#f9fafb]">Vendors</th>
                <SortableHeader label="Status"        sortKey="status"        sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap bg-[#f9fafb]">Items</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap bg-[#f9fafb]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {displayList.length===0&&(<tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">No RFQs found. Create your first RFQ.</td></tr>)}
              {displayList.map(rfq=>(
                <tr key={rfq.rfq_number} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#1a56db]">{rfq.rfq_number}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{rfq.rfq_date}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{rfq.pr_number||'—'}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{rfq.validity_date}</td>
                  <td className="px-5 py-3.5 text-[#6b7280]">{rfq.vendor_ids?.length||0} vendors</td>
                  <td className="px-5 py-3.5"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(rfq.status)}`}>{rfq.status}</span></td>
                  <td className="px-5 py-3.5 text-[#6b7280]">{rfq.line_items?.length||0} items</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>handleView(rfq)} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db] transition-colors"><Eye size={14}/></button>
                      {rfq.status !== 'Posted' && (
                        <button onClick={()=>handleEdit(rfq)} className="p-1.5 rounded-lg hover:bg-[#fef3c7] text-[#d97706] transition-colors"><Edit2 size={14}/></button>
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
