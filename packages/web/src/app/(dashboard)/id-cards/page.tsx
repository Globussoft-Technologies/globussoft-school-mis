'use client';

import { useEffect, useState, useCallback } from 'react';
import { BadgeCheck, Plus, Printer, X, Search, RefreshCw } from 'lucide-react';

interface IdCard {
  id: string;
  userId: string;
  cardNumber: string;
  type: string;
  validFrom: string;
  validTo: string;
  status: string;
  photoUrl?: string;
  printedAt?: string;
  createdAt: string;
}

interface CardPrintData {
  card: IdCard;
  holder: {
    name: string;
    email?: string;
    phone?: string;
    className?: string;
    bloodGroup?: string;
    parentName?: string;
    emergencyContact?: string;
    admissionNo?: string;
  };
  school: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  qrData: string;
}

const typeColors: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-700',
  TEACHER: 'bg-purple-100 text-purple-700',
  STAFF: 'bg-orange-100 text-orange-700',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
  REVOKED: 'bg-red-100 text-red-700',
  LOST: 'bg-yellow-100 text-yellow-700',
};

const API = '/api/v1';

export default function IdCardsPage() {
  const [cards, setCards] = useState<IdCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Generate form
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [genForm, setGenForm] = useState({ userId: '', type: 'STUDENT', photoUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Bulk generate
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkClassId, setBulkClassId] = useState('');

  // Print modal
  const [printData, setPrintData] = useState<CardPrintData | null>(null);
  const [printLoading, setPrintLoading] = useState(false);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API}/id-cards?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setCards(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/id-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          userId: genForm.userId,
          type: genForm.type,
          ...(genForm.photoUrl ? { photoUrl: genForm.photoUrl } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.message || 'Failed to generate ID card');
        return;
      }
      setShowGenerateForm(false);
      setGenForm({ userId: '', type: 'STUDENT', photoUrl: '' });
      load();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkGenerate() {
    if (!bulkClassId.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/id-cards/bulk/${bulkClassId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.message || 'Bulk generation failed');
        return;
      }
      setShowBulkForm(false);
      setBulkClassId('');
      load();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this ID card?')) return;
    await fetch(`${API}/id-cards/${id}/revoke`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    load();
  }

  async function handlePrint(id: string) {
    setPrintLoading(true);
    try {
      const res = await fetch(`${API}/id-cards/${id}/print`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setPrintData(await res.json());
    } catch {}
    finally { setPrintLoading(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BadgeCheck className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">ID Cards</h1>
            <p className="text-sm text-muted-foreground">Generate and manage student, teacher, and staff ID cards</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkForm(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            Bulk Generate
          </button>
          <button
            onClick={() => setShowGenerateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Generate ID Card
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm flex items-center gap-2">
          <X className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">All Types</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="STAFF">Staff</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
          <option value="LOST">Lost</option>
        </select>
        <span className="text-sm text-muted-foreground ml-auto">{cards.length} card(s)</span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Card Number</th>
              <th className="text-left px-4 py-3 font-medium">User ID</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Valid From</th>
              <th className="text-left px-4 py-3 font-medium">Valid To</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : cards.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No ID cards found</td>
              </tr>
            ) : (
              cards.map((card) => (
                <tr key={card.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-medium">{card.cardNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">{card.userId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[card.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {card.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[card.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {card.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(card.validFrom).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{new Date(card.validTo).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePrint(card.id)}
                        disabled={printLoading}
                        className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-muted"
                      >
                        <Printer className="h-3 w-3" /> Print
                      </button>
                      {card.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevoke(card.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50"
                        >
                          Revoke
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

      {/* Generate ID Card Modal */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generate ID Card</h2>
              <button onClick={() => setShowGenerateForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter user UUID"
                    value={genForm.userId}
                    onChange={(e) => setGenForm({ ...genForm, userId: e.target.value })}
                    className="w-full border rounded-md pl-9 pr-3 py-2 text-sm bg-background"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Card Type</label>
                <select
                  value={genForm.type}
                  onChange={(e) => setGenForm({ ...genForm, type: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Photo URL (optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={genForm.photoUrl}
                  onChange={(e) => setGenForm({ ...genForm, photoUrl: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateForm(false)}
                  className="flex-1 px-4 py-2 border rounded-md text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Bulk Generate for Class</h2>
              <button onClick={() => setShowBulkForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Class ID</label>
                <input
                  type="text"
                  placeholder="Enter class UUID"
                  value={bulkClassId}
                  onChange={(e) => setBulkClassId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will generate STUDENT type ID cards for all students enrolled in the specified class.
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowBulkForm(false)}
                  className="flex-1 px-4 py-2 border rounded-md text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkGenerate}
                  disabled={submitting || !bulkClassId.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? 'Generating...' : 'Bulk Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">ID Card Print Preview</h2>
              <button onClick={() => setPrintData(null)}><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front of card */}
              <div className="border-2 border-primary/30 rounded-xl p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center mb-3">
                  <h3 className="font-bold text-primary text-sm">{printData.school.name}</h3>
                  <p className="text-xs text-muted-foreground">{printData.school.address}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-16 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                    {printData.card.photoUrl ? (
                      <img src={printData.card.photoUrl} alt="Photo" className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Photo</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{printData.holder.name}</p>
                    {printData.holder.admissionNo && (
                      <p className="text-xs text-muted-foreground">Adm: {printData.holder.admissionNo}</p>
                    )}
                    {printData.holder.className && (
                      <p className="text-xs text-muted-foreground">Class: {printData.holder.className}</p>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${typeColors[printData.card.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {printData.card.type}
                    </span>
                  </div>
                </div>
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-mono font-bold text-center">{printData.card.cardNumber}</p>
                  <div className="mt-1 text-xs text-center text-muted-foreground">
                    Valid: {new Date(printData.card.validFrom).toLocaleDateString()} – {new Date(printData.card.validTo).toLocaleDateString()}
                  </div>
                  {/* Barcode placeholder */}
                  <div className="mt-2 bg-black/10 rounded text-center py-1 text-xs font-mono tracking-[0.3em]">
                    ||||| {printData.card.cardNumber} |||||
                  </div>
                </div>
              </div>

              {/* Back of card */}
              <div className="border-2 border-muted rounded-xl p-4 bg-muted/20">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase mb-3">Emergency Information</h4>
                {printData.holder.bloodGroup && (
                  <div className="mb-2">
                    <span className="text-xs font-medium">Blood Group: </span>
                    <span className="text-xs font-bold text-red-600">{printData.holder.bloodGroup}</span>
                  </div>
                )}
                {printData.holder.parentName && (
                  <div className="mb-1">
                    <p className="text-xs font-medium">Parent/Guardian</p>
                    <p className="text-xs text-muted-foreground">{printData.holder.parentName}</p>
                  </div>
                )}
                {printData.holder.emergencyContact && (
                  <div className="mb-2">
                    <p className="text-xs font-medium">Emergency Contact</p>
                    <p className="text-xs text-muted-foreground">{printData.holder.emergencyContact}</p>
                  </div>
                )}
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-medium">{printData.school.name}</p>
                  {printData.school.address && <p className="text-xs text-muted-foreground">{printData.school.address}</p>}
                  {printData.school.phone && <p className="text-xs text-muted-foreground">Ph: {printData.school.phone}</p>}
                </div>
                {/* QR Code placeholder */}
                <div className="mt-3 border rounded p-2 text-center">
                  <p className="text-xs text-muted-foreground">QR: {printData.qrData}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setPrintData(null)}
                className="flex-1 px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
