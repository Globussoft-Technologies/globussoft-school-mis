'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building, Plus, X, Users, BedDouble, CheckCircle, AlertCircle } from 'lucide-react';

interface HostelRoom {
  id: string;
  roomNumber: string;
  floor: number;
  block: string;
  capacity: number;
  occupied: number;
  type: string;
  amenities: string[];
  isActive: boolean;
  allocations: Allocation[];
}

interface Allocation {
  id: string;
  studentId: string;
  bedNumber?: number;
  startDate: string;
}

interface OccupancyStats {
  totalRooms: number;
  totalCapacity: number;
  totalOccupied: number;
  totalAvailable: number;
  occupancyRate: number;
  byBlock: Record<string, { capacity: number; occupied: number }>;
}

function getRoomColor(occupied: number, capacity: number) {
  if (occupied === 0) return 'bg-green-50 border-green-300';
  if (occupied < capacity) return 'bg-yellow-50 border-yellow-300';
  return 'bg-red-50 border-red-300';
}

function getRoomBadge(occupied: number, capacity: number) {
  if (occupied === 0) return 'bg-green-100 text-green-700';
  if (occupied < capacity) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function getRoomLabel(occupied: number, capacity: number) {
  if (occupied === 0) return 'Available';
  if (occupied < capacity) return 'Partial';
  return 'Full';
}

export default function HostelPage() {
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [stats, setStats] = useState<OccupancyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockFilter, setBlockFilter] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<HostelRoom | null>(null);

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roomForm, setRoomForm] = useState({
    roomNumber: '', floor: '1', block: 'A', capacity: '4', type: 'SHARED', amenities: '',
  });
  const [allocForm, setAllocForm] = useState({
    studentId: '', roomId: '', bedNumber: '', startDate: new Date().toISOString().split('T')[0],
  });

  const base = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = blockFilter ? `?block=${blockFilter}` : '';
      const [roomsRes, statsRes] = await Promise.all([
        fetch(`${base}/hostel/rooms${params}`, { headers }),
        fetch(`${base}/hostel/occupancy`, { headers }),
      ]);
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {}
    setLoading(false);
  }, [base, blockFilter]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  async function addRoom() {
    setSaving(true);
    try {
      const res = await fetch(`${base}/hostel/rooms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          roomNumber: roomForm.roomNumber,
          floor: parseInt(roomForm.floor, 10),
          block: roomForm.block,
          capacity: parseInt(roomForm.capacity, 10),
          type: roomForm.type,
          amenities: roomForm.amenities ? roomForm.amenities.split(',').map((a) => a.trim()) : [],
        }),
      });
      if (res.ok) {
        setShowAddRoom(false);
        setRoomForm({ roomNumber: '', floor: '1', block: 'A', capacity: '4', type: 'SHARED', amenities: '' });
        fetchRooms();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to add room');
      }
    } catch {}
    setSaving(false);
  }

  async function allocateStudent() {
    setSaving(true);
    try {
      const res = await fetch(`${base}/hostel/allocate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          studentId: allocForm.studentId,
          roomId: allocForm.roomId,
          bedNumber: allocForm.bedNumber ? parseInt(allocForm.bedNumber, 10) : undefined,
          startDate: allocForm.startDate,
        }),
      });
      if (res.ok) {
        setShowAllocate(false);
        setAllocForm({ studentId: '', roomId: '', bedNumber: '', startDate: new Date().toISOString().split('T')[0] });
        fetchRooms();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to allocate student');
      }
    } catch {}
    setSaving(false);
  }

  async function vacateAllocation(allocationId: string) {
    if (!confirm('Vacate this student from the room?')) return;
    try {
      const res = await fetch(`${base}/hostel/vacate/${allocationId}`, { method: 'PATCH', headers });
      if (res.ok) {
        setSelectedRoom(null);
        fetchRooms();
      }
    } catch {}
  }

  // Group rooms by block
  const blocks = [...new Set(rooms.map((r) => r.block))].sort();
  const roomsByBlock: Record<string, HostelRoom[]> = {};
  for (const b of blocks) roomsByBlock[b] = rooms.filter((r) => r.block === b);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Hostel Management</h1>
            <p className="text-sm text-muted-foreground">Manage boarding rooms and student allocations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAllocate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            <Users className="h-4 w-4" /> Allocate Student
          </button>
          <button
            onClick={() => setShowAddRoom(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add Room
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Rooms</p>
            <p className="text-2xl font-bold mt-1">{stats.totalRooms}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Capacity</p>
            <p className="text-2xl font-bold mt-1">{stats.totalCapacity}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Occupied</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{stats.totalOccupied}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{stats.totalAvailable}</p>
          </div>
        </div>
      )}

      {/* Occupancy bar */}
      {stats && (
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Occupancy</span>
            <span className="text-sm font-bold">{stats.occupancyRate}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {Object.entries(stats.byBlock).map(([block, info]) => (
              <div key={block} className="text-xs">
                <span className="font-semibold">Block {block}:</span>{' '}
                {info.occupied}/{info.capacity} occupied
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-green-300 bg-green-50" /> Available</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-yellow-300 bg-yellow-50" /> Partially Occupied</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-red-300 bg-red-50" /> Full</div>
      </div>

      {/* Block filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setBlockFilter('')}
          className={`px-3 py-1.5 rounded text-sm ${!blockFilter ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}
        >
          All Blocks
        </button>
        {blocks.map((b) => (
          <button
            key={b}
            onClick={() => setBlockFilter(b)}
            className={`px-3 py-1.5 rounded text-sm ${blockFilter === b ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}
          >
            Block {b}
          </button>
        ))}
      </div>

      {/* Room grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading rooms...</div>
      ) : (
        <div className="space-y-6">
          {(blockFilter ? [blockFilter] : blocks).map((block) => (
            <div key={block}>
              <h2 className="text-lg font-semibold mb-3">Block {block}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(roomsByBlock[block] ?? []).map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`border-2 rounded-lg p-3 text-left transition-all hover:shadow-md ${getRoomColor(room.occupied, room.capacity)}`}
                  >
                    <div className="font-bold text-sm">{room.roomNumber}</div>
                    <div className="text-xs text-muted-foreground">Floor {room.floor}</div>
                    <div className={`mt-2 text-xs font-medium px-1.5 py-0.5 rounded inline-block ${getRoomBadge(room.occupied, room.capacity)}`}>
                      {getRoomLabel(room.occupied, room.capacity)}
                    </div>
                    <div className="text-xs mt-1 text-muted-foreground">{room.occupied}/{room.capacity} beds</div>
                  </button>
                ))}
              </div>
              {(!roomsByBlock[block] || roomsByBlock[block].length === 0) && (
                <p className="text-sm text-muted-foreground">No rooms in block {block}</p>
              )}
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No rooms found. Add your first room to get started.
            </div>
          )}
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Room {selectedRoom.roomNumber} — Block {selectedRoom.block}</h2>
              <button onClick={() => setSelectedRoom(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-muted rounded p-2 text-center">
                  <div className="font-semibold">Floor</div>
                  <div className="text-lg font-bold">{selectedRoom.floor}</div>
                </div>
                <div className="bg-muted rounded p-2 text-center">
                  <div className="font-semibold">Capacity</div>
                  <div className="text-lg font-bold">{selectedRoom.capacity}</div>
                </div>
                <div className="bg-muted rounded p-2 text-center">
                  <div className="font-semibold">Occupied</div>
                  <div className="text-lg font-bold">{selectedRoom.occupied}</div>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">TYPE:</span>{' '}
                <span className="text-sm">{selectedRoom.type}</span>
              </div>
              {selectedRoom.amenities.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">AMENITIES:</span>{' '}
                  <span className="text-sm">{selectedRoom.amenities.join(', ')}</span>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold mb-2">Bed Assignments ({selectedRoom.allocations.length})</h3>
                {selectedRoom.allocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active allocations</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedRoom.allocations.map((alloc) => (
                      <li key={alloc.id} className="flex items-center justify-between border rounded p-2 text-sm">
                        <div>
                          <span className="font-medium">Bed {alloc.bedNumber ?? '–'}</span>
                          <span className="text-muted-foreground ml-2 text-xs">ID: {alloc.studentId.slice(0, 8)}…</span>
                        </div>
                        <button
                          onClick={() => vacateAllocation(alloc.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Vacate
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Add New Room</h2>
              <button onClick={() => setShowAddRoom(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Room Number *</label>
                  <input
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="e.g. 101"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Block *</label>
                  <select
                    value={roomForm.block}
                    onChange={(e) => setRoomForm({ ...roomForm, block: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {['A', 'B', 'C', 'D'].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Floor *</label>
                  <input
                    type="number" min="1"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Capacity</label>
                  <input
                    type="number" min="1"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Type</label>
                <select
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="SINGLE">Single</option>
                  <option value="SHARED">Shared</option>
                  <option value="DORMITORY">Dormitory</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Amenities (comma-separated)</label>
                <input
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="e.g. AC, Attached Bathroom, Wi-Fi"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddRoom(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button
                  onClick={addRoom}
                  disabled={saving || !roomForm.roomNumber}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Student Modal */}
      {showAllocate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Allocate Student to Room</h2>
              <button onClick={() => setShowAllocate(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Student ID *</label>
                <input
                  value={allocForm.studentId}
                  onChange={(e) => setAllocForm({ ...allocForm, studentId: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Paste student UUID"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Room *</label>
                <select
                  value={allocForm.roomId}
                  onChange={(e) => setAllocForm({ ...allocForm, roomId: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select a room...</option>
                  {rooms
                    .filter((r) => r.occupied < r.capacity)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Block {r.block} — Room {r.roomNumber} (Floor {r.floor}) [{r.occupied}/{r.capacity}]
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Bed Number</label>
                  <input
                    type="number" min="1"
                    value={allocForm.bedNumber}
                    onChange={(e) => setAllocForm({ ...allocForm, bedNumber: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={allocForm.startDate}
                    onChange={(e) => setAllocForm({ ...allocForm, startDate: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAllocate(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button
                  onClick={allocateStudent}
                  disabled={saving || !allocForm.studentId || !allocForm.roomId}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
                >
                  {saving ? 'Allocating...' : 'Allocate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
