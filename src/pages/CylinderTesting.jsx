import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Save, X, Wrench } from 'lucide-react';

const REASONS = ['Hydro Testing','Valve Repair','Damage Inspection','General Maintenance','Repainting','Visual Inspection'];
const emptyItem = () => ({serial_number:'', reason:'Hydro Testing'});
const emptyForm = () => ({
  transaction_id: `CT-${Date.now().toString().slice(-8)}`,
  vendor_name: '',
  date_sent: new Date().toISOString().split('T')[0],
  expected_return_date: '',
  status: 'Sent',
  items: [emptyItem()],
});

const statusColor = (s) => {
  if (s==='Returned') return 'bg-[#dcfce7] text-[#16a34a]';
  if (s==='Overdue') return 'bg-[#fee2e2] text-[#dc2626]';
  return 'bg-[#fef3c7] text-[#d97706]';
};

export default function CylinderTesting() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };

  const fetchRecords = async () => {
    const res = await fetch('/api/cylinder-testing');
    setRecords(await res.json());
  };
  useEffect(()=>{ fetchRecords(); },[]);

  const handleField = (e) => setForm(f=>({...f,[e.target.name]:e.target.value}));
  const handleItem = (i, e) => {
    const items = [...form.items];
    items[i] = {...items[i], [e.target.name]:e.target.value};
    setForm(f=>({...f, items}));
  };
  const addItem = () => setForm(f=>({...f, items:[...f.items, emptyItem()]}));
  const removeItem = (i) => setForm(f=>({...f, items:f.items.filter((_,idx)=>idx!==i)}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch('/api/cylinder-testing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,items:form.items.filter(it=>it.serial_number)})});
      if (!res.ok) throw new Error(await res.text());
      await fetchRecords(); showMsg('Testing record saved!'); setMode('list');
    } catch(err){showMsg('Error: '+err.message,'error');}
    finally{setLoading(false);}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await fetch(`/api/cylinder-testing/${id}`,{method:'DELETE'});
    await fetchRecords(); showMsg('Deleted.');
  };

  if (mode !== 'list') {
    const readOnly = mode==='view';
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{readOnly?'Testing Record Details':'Send Cylinders for Testing / Repair'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Track cylinders sent to testing agency or repair shop</p>
          </div>
          <button onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15}/>Back</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Wrench size={15} className="text-[#1a56db]"/>Testing Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Transaction ID</label>
                <input value={form.transaction_id} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Testing Agency / Vendor *</label>
                <input name="vendor_name" value={form.vendor_name} onChange={handleField} readOnly={readOnly} required
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}
                  placeholder="Agency name"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date Sent</label>
                <input name="date_sent" type="date" value={form.date_sent} onChange={handleField} readOnly={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Expected Return Date</label>
                <input name="expected_return_date" type="date" value={form.expected_return_date||''} onChange={handleField} readOnly={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleField} disabled={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  {['Sent','In Progress','Returned','Overdue'].map(s=><option key={s}>{s}</option>)}
                </select></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Cylinders Sent ({form.items.length})</h3>
              {!readOnly&&<button type="button" onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-xs font-medium hover:bg-[#1e429f]"><Plus size={13}/>Add Cylinder</button>}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>{['#','Serial Number','Reason',''].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {form.items.map((it,i)=>(
                  <tr key={i} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-2.5 text-[#6b7280] text-xs">{i+1}</td>
                    <td className="px-4 py-2.5">
                      <input name="serial_number" value={it.serial_number} onChange={e=>handleItem(i,e)} readOnly={readOnly}
                        className={`w-48 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#1a56db]/40 ${readOnly?'bg-transparent border-transparent':''}`}
                        placeholder="e.g. CYL-OX-00001"/>
                    </td>
                    <td className="px-4 py-2.5">
                      <select name="reason" value={it.reason} onChange={e=>handleItem(i,e)} disabled={readOnly}
                        className={`px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${readOnly?'bg-transparent border-transparent':''}`}>
                        {REASONS.map(r=><option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">{!readOnly&&form.items.length>1&&(<button type="button" onClick={()=>removeItem(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={13}/></button>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!readOnly&&(<div className="flex justify-end gap-3">
            <button type="button" onClick={()=>setMode('list')} className="px-5 py-2.5 border border-[#e5e7eb] rounded-lg text-sm hover:bg-[#f3f4f6]">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] disabled:opacity-60">
              <Save size={15}/>{loading?'Saving...':'Save Record'}
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
        <h3 className="text-sm text-[#6b7280]">{records.length} testing records</h3>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm">
          <Plus size={16}/>Send for Testing
        </button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
            <tr>{['Transaction ID','Vendor / Agency','Date Sent','Expected Return','Cylinders','Status','Actions'].map(h=>(
              <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {records.length===0&&(<tr><td colSpan={7} className="text-center py-12 text-[#6b7280]">No testing records yet.</td></tr>)}
            {records.map(r=>(
              <tr key={r.transaction_id} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#1a56db] text-xs">{r.transaction_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.vendor_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.date_sent}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.expected_return_date||'—'}</td>
                <td className="px-5 py-3.5 text-[#6b7280]">{r.items?.length||0} cylinders</td>
                <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span></td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <button onClick={()=>{setForm(r);setMode('view');}} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]"><Eye size={14}/></button>
                    <button onClick={()=>handleDelete(r.transaction_id)} className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
