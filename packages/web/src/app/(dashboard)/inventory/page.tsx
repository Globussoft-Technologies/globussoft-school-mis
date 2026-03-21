'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Search, AlertTriangle, X, RefreshCw } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  location?: string;
  condition: string;
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  warrantyExpiry?: string;
  assignedTo?: string;
  barcode?: string;
  schoolId: string;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  FURNITURE: 'bg-yellow-100 text-yellow-700',
  ELECTRONICS: 'bg-blue-100 text-blue-700',
  SPORTS: 'bg-green-100 text-green-700',
  LAB_EQUIPMENT: 'bg-purple-100 text-purple-700',
  STATIONERY: 'bg-gray-100 text-gray-700',
  VEHICLE: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-slate-100 text-slate-700',
};

const conditionColors: Record<string, string> = {
  NEW: 'bg-green-100 text-green-700',
  GOOD: 'bg-blue-100 text-blue-700',
  FAIR: 'bg-yellow-100 text-yellow-700',
  POOR: 'bg-orange-100 text-orange-700',
  DAMAGED: 'bg-red-100 text-red-700',
  DISPOSED: 'bg-gray-100 text-gray-400',
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', category: 'FURNITURE', description: '', quantity: '1',
    location: '', condition: 'GOOD', purchaseDate: '', purchasePrice: '',
    supplier: '', warrantyExpiry: '', assignedTo: '', barcode: '',
  });

  const [assignForm, setAssignForm] = useState({ assignedTo: '', toLocation: '', remarks: '' });

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  function getSchoolId() {
    if (typeof window === 'undefined') return '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.schoolId || '';
  }

  function getUserId() {
    if (typeof window === 'undefined') return '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || '';
  }

  async function loadItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (conditionFilter) params.set('condition', conditionFilter);
      const schoolId = getSchoolId();
      if (schoolId) params.set('schoolId', schoolId);
      const res = await fetch(`${base}/inventory?${params}`, { headers: getHeaders() });
      if (res.ok) setItems(await res.json());
    } catch {}
    setLoading(false);
  }

  async function loadLowStock() {
    try {
      const schoolId = getSchoolId();
      const res = await fetch(`${base}/inventory/low-stock?schoolId=${schoolId}`, { headers: getHeaders() });
      if (res.ok) setLowStock(await res.json());
    } catch {}
  }

  useEffect(() => {
    loadItems();
    loadLowStock();
  }, [categoryFilter, conditionFilter]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const schoolId = getSchoolId();
      const performedBy = getUserId();
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description || undefined,
        quantity: parseInt(form.quantity, 10) || 1,
        location: form.location || undefined,
        condition: form.condition,
        purchaseDate: form.purchaseDate || undefined,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
        supplier: form.supplier || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        assignedTo: form.assignedTo || undefined,
        barcode: form.barcode || undefined,
        schoolId,
        performedBy,
      };
      const res = await fetch(`${base}/inventory`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowAddForm(false);
        setForm({ name: '', category: 'FURNITURE', description: '', quantity: '1', location: '', condition: 'GOOD', purchaseDate: '', purchasePrice: '', supplier: '', warrantyExpiry: '', assignedTo: '', barcode: '' });
        loadItems();
        loadLowStock();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to add item');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!showAssignForm) return;
    setSaving(true);
    try {
      const res = await fetch(`${base}/inventory/${showAssignForm.id}/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...assignForm, performedBy: getUserId() }),
      });
      if (res.ok) {
        setShowAssignForm(null);
        setAssignForm({ assignedTo: '', toLocation: '', remarks: '' });
        loadItems();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to assign item');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  async function handleReturn(itemId: string) {
    try {
      const res = await fetch(`${base}/inventory/${itemId}/return`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ performedBy: getUserId(), remarks: 'Returned' }),
      });
      if (res.ok) loadItems();
      else alert('Failed to return item');
    } catch { alert('Network error'); }
  }

  function formatDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-sm text-muted-foreground">Track school assets and equipment</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Low Stock Warning */}
      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-700">Low Stock Alert — {lowStock.length} item(s) below threshold</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((item) => (
              <span key={item.id} className="text-xs bg-white border border-orange-200 rounded-full px-3 py-1">
                <span className="font-medium">{item.name}</span> — {item.quantity} remaining
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadItems()}
            placeholder="Search by name, barcode..."
            className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Categories</option>
          {['FURNITURE', 'ELECTRONICS', 'SPORTS', 'LAB_EQUIPMENT', 'STATIONERY', 'VEHICLE', 'OTHER'].map((c) => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Conditions</option>
          {['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'DISPOSED'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button onClick={loadItems} className="flex items-center gap-1 border px-3 py-2 rounded-md text-sm hover:bg-muted">
          <Search className="h-4 w-4" /> Search
        </button>
      </div>

      {/* Items Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="px-4 py-3 bg-muted/30 border-b">
          <span className="text-sm font-medium">{items.length} item(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Qty</th>
                <th className="text-left px-4 py-3 font-medium">Condition</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium">Purchase Date</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No items found</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className={`border-t hover:bg-muted/20 ${item.quantity < 5 ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      {item.barcode && <div className="text-xs text-muted-foreground font-mono">{item.barcode}</div>}
                      {item.description && <div className="text-xs text-muted-foreground truncate max-w-32">{item.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold text-sm ${item.quantity < 5 ? 'text-orange-600' : ''}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${conditionColors[item.condition] || 'bg-gray-100 text-gray-700'}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.location || '—'}</td>
                    <td className="px-4 py-3 text-sm">{item.assignedTo || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(item.purchaseDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setShowAssignForm(item); setAssignForm({ assignedTo: '', toLocation: '', remarks: '' }); }}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Assign
                        </button>
                        {item.assignedTo && (
                          <button
                            onClick={() => handleReturn(item.id)}
                            className="flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-muted"
                          >
                            <RefreshCw className="h-3 w-3" /> Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Add Inventory Item</h2>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Item Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Student Chair" required
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {['FURNITURE', 'ELECTRONICS', 'SPORTS', 'LAB_EQUIPMENT', 'STATIONERY', 'VEHICLE', 'OTHER'].map((c) => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Room 101, Science Lab"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Price (₹)</label>
                  <input type="number" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    placeholder="Vendor name"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Warranty Expiry</label>
                  <input type="date" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Barcode</label>
                  <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder="Unique barcode / serial"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Item'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Assign Item</h2>
              <button onClick={() => setShowAssignForm(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-3 bg-muted/30 border-b">
              <p className="text-sm font-medium">{showAssignForm.name}</p>
              <p className="text-xs text-muted-foreground">{showAssignForm.category} · Qty: {showAssignForm.quantity}</p>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Assign To *</label>
                <input type="text" value={assignForm.assignedTo} onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                  placeholder="User ID or department name" required
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Move To Location</label>
                <input type="text" value={assignForm.toLocation} onChange={(e) => setAssignForm({ ...assignForm, toLocation: e.target.value })}
                  placeholder="New location (optional)"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <input type="text" value={assignForm.remarks} onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })}
                  placeholder="Optional remarks"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Assigning...' : 'Assign'}
                </button>
                <button type="button" onClick={() => setShowAssignForm(null)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
