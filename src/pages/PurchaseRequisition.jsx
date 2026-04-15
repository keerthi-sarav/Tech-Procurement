import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, Save, X, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';

const DEPTS = ['Production', 'Quality Control', 'Maintenance', 'Admin', 'Finance', 'Stores', 'Safety'];
const UOMS = ['Nos', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set', 'Pair', 'Service'];

function genPRNumber() {
  const d = new Date();
  return `PR-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`;
}

const statusColor = (s) => {
  if (s === 'Approved') return 'bg-[#dcfce7] text-[#16a34a]';
  if (s === 'Rejected') return 'bg-[#fee2e2] text-[#dc2626]';
  return 'bg-[#fef3c7] text-[#d97706]';
};

const StatusIcon = ({ s }) => {
  if (s === 'Approved') return <CheckCircle size={13} />;
  if (s === 'Rejected') return <XCircle size={13} />;
  return <Clock size={13} />;
};

const emptyLine = () => ({ item_code: '', item_name: '', quantity_required: '', uom: 'Nos', remarks: '' });
const emptyForm = () => ({
  pr_number: genPRNumber(),
  pr_date: new Date().toISOString().split('T')[0],
  requested_by: '',
  department: '',
  required_date: '',
  status: 'Draft',
  remarks: '',
  line_items: [emptyLine()],
});

export default function PurchaseRequisition() {
  const { prs, fetchPRs } = useProcurement();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list'); // list | new | edit | view
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const showMsg = (text, type='success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleField = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleLine = (i, e) => {
    const lines = [...form.line_items];
    lines[i] = { ...lines[i], [e.target.name]: e.target.value };
    setForm(f => ({ ...f, line_items: lines }));
  };

  const addLine = () => setForm(f => ({ ...f, line_items: [...f.line_items, emptyLine()] }));
  const removeLine = (i) => setForm(f => ({ ...f, line_items: f.line_items.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = mode === 'edit' ? `/api/purchase-requisitions/${form.pr_number}` : '/api/purchase-requisitions';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, line_items: form.line_items.filter(l => l.item_name) }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchPRs();
      showMsg(mode === 'edit' ? 'PR updated successfully!' : 'PR created successfully!');
      setMode('list');
    } catch (err) {
      showMsg('Error: ' + err.message, 'error');
    } finally { setLoading(false); }
  };

  const handleDelete = async (pr_number) => {
    if (!confirm('Delete this PR?')) return;
    await fetch(`/api/purchase-requisitions/${pr_number}`, { method: 'DELETE' });
    await fetchPRs();
    showMsg('PR deleted.');
  };

  const handleEdit = (pr) => {
    setForm({ ...pr, line_items: pr.line_items?.length ? pr.line_items : [emptyLine()] });
    setMode('edit');
  };
  const handleView = (pr) => {
    setForm({ ...pr, line_items: pr.line_items?.length ? pr.line_items : [] });
    setMode('view');
  };
  const handleNew = () => { setForm(emptyForm()); setMode('new'); };

  const filtered = prs.filter(p =>
    p.pr_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.requested_by?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (mode !== 'list') {
    const readOnly = mode === 'view';
    return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              {mode === 'view' ? 'PR Details' : mode === 'edit' ? 'Edit Purchase Requisition' : 'New Purchase Requisition'}
            </h2>
            <p className="text-sm text-[#6b7280] mt-1">
              {mode === 'view' ? 'Viewing record — read only' : 'Fill in the details below'}
            </p>
          </div>
          <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] transition-colors text-sm">
            <X size={15} /> Back to List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2">
              <FileText size={15} className="text-[#1a56db]" /> Requisition Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'PR Number', name: 'pr_number', readOnly: true },
                { label: 'PR Date', name: 'pr_date', type: 'date' },
                { label: 'Requested By', name: 'requested_by', placeholder: 'Employee name' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">{f.label}</label>
                  <input
                    name={f.name} type={f.type || 'text'} value={form[f.name] || ''}
                    onChange={handleField} readOnly={readOnly || f.readOnly}
                    placeholder={f.placeholder}
                    className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors
                      ${(readOnly || f.readOnly) ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Department</label>
                <select name="department" value={form.department} onChange={handleField} disabled={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors
                    ${readOnly ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`}>
                  <option value="">Select Department</option>
                  {DEPTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Required Date</label>
                <input name="required_date" type="date" value={form.required_date} onChange={handleField} readOnly={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors
                    ${readOnly ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleField} disabled={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors
                    ${readOnly ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`}>
                  {['Draft','Pending','Approved','Rejected'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-[#6b7280] mb-1">Remarks</label>
              <textarea name="remarks" value={form.remarks || ''} onChange={handleField} readOnly={readOnly} rows={2}
                className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors
                  ${readOnly ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`}
                placeholder="Optional remarks..." />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Line Items</h3>
              {!readOnly && (
                <button type="button" onClick={addLine}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-xs font-medium hover:bg-[#1e429f] transition-colors">
                  <Plus size={13} /> Add Item
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <tr>
                    {['#','Item Code','Item Name','Qty Required','UOM','Remarks',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {form.line_items.map((line, i) => (
                    <tr key={i} className="hover:bg-[#f9fafb]">
                      <td className="px-4 py-2 text-[#6b7280] text-xs">{i+1}</td>
                      {['item_code','item_name'].map(f => (
                        <td key={f} className="px-4 py-2">
                          <input name={f} value={line[f]} onChange={e => handleLine(i,e)} readOnly={readOnly}
                            className={`w-full px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]/40 ${readOnly?'bg-transparent border-transparent':''}`} />
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <input name="quantity_required" type="number" value={line.quantity_required} onChange={e => handleLine(i,e)} readOnly={readOnly}
                          className={`w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]/40 ${readOnly?'bg-transparent border-transparent':''}`} />
                      </td>
                      <td className="px-4 py-2">
                        <select name="uom" value={line.uom} onChange={e => handleLine(i,e)} disabled={readOnly}
                          className={`px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-transparent border-transparent':''}`}>
                          {UOMS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input name="remarks" value={line.remarks || ''} onChange={e => handleLine(i,e)} readOnly={readOnly}
                          className={`w-full px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-transparent border-transparent':''}`} />
                      </td>
                      <td className="px-4 py-2">
                        {!readOnly && form.line_items.length > 1 && (
                          <button type="button" onClick={() => removeLine(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626] transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!readOnly && (
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMode('list')}
                className="px-5 py-2.5 border border-[#e5e7eb] rounded-lg text-sm text-[#374151] hover:bg-[#f3f4f6] transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors disabled:opacity-60">
                <Save size={15} /> {loading ? 'Saving...' : mode === 'edit' ? 'Update PR' : 'Create PR'}
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div>
      {msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in
          ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626] border border-[#dc2626]/20' : 'bg-[#dcfce7] text-[#16a34a] border border-[#16a34a]/20'}`}>
          {msg.text}
        </div>
      )}

      {/* Top actions */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PRs..."
            className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={handleNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors shadow-sm">
          <Plus size={16} /> New Purchase Requisition
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>
                {['PR Number','Date','Requested By','Department','Required Date','Status','Items','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">No purchase requisitions found. Create your first PR.</td></tr>
              )}
              {filtered.map(pr => (
                <tr key={pr.pr_number} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#1a56db]">{pr.pr_number}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{pr.pr_date}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{pr.requested_by}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{pr.department}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{pr.required_date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(pr.status)}`}>
                      <StatusIcon s={pr.status} /> {pr.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#6b7280]">{pr.line_items?.length || 0} items</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleView(pr)} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db] transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleEdit(pr)} className="p-1.5 rounded-lg hover:bg-[#fef3c7] text-[#d97706] transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(pr.pr_number)} className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626] transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
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
