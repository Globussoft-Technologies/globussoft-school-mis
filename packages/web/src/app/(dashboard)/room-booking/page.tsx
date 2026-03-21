'use client';

import { useEffect, useState } from 'react';
import {
  DoorClosed,
  Projector,
  Wind,
  Users,
  Search,
  PlusCircle,
  X,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface SchoolRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  floor?: number;
  building?: string;
  hasProjector: boolean;
  hasAC: boolean;
  isActive: boolean;
}

interface RoomBooking {
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  attendees?: number;
  remarks?: string;
  room: SchoolRoom;
}

const TYPE_COLORS: Record<string, string> = {
  CLASSROOM: 'bg-blue-50 text-blue-700 border-blue-200',
  LAB: 'bg-purple-50 text-purple-700 border-purple-200',
  AUDITORIUM: 'bg-orange-50 text-orange-700 border-orange-200',
  CONFERENCE: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  SPORTS_HALL: 'bg-green-50 text-green-700 border-green-200',
  LIBRARY: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RoomBookingPage() {
  const [rooms, setRooms] = useState<SchoolRoom[]>([]);
  const [myBookings, setMyBookings] = useState<RoomBooking[]>([]);
  const [availableRooms, setAvailableRooms] = useState<SchoolRoom[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'book' | 'mine' | 'available'>('rooms');

  // Search form state
  const [searchDate, setSearchDate] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');
  const [searching, setSearching] = useState(false);

  // Book form state
  const [bookForm, setBookForm] = useState({
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: '',
    remarks: '',
  });
  const [booking, setBooking] = useState(false);
  const [bookMsg, setBookMsg] = useState('');

  const base = process.env.NEXT_PUBLIC_API_URL;
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [roomsRes, bookingsRes] = await Promise.all([
          fetch(`${base}/rooms`, { headers }),
          fetch(`${base}/rooms/my-bookings`, { headers }),
        ]);
        if (roomsRes.ok) setRooms(await roomsRes.json());
        if (bookingsRes.ok) setMyBookings(await bookingsRes.json());
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function searchAvailable() {
    if (!searchDate || !searchStart || !searchEnd) return;
    setSearching(true);
    setAvailableRooms(null);
    try {
      const token = getToken();
      const res = await fetch(
        `${base}/rooms/available?date=${searchDate}&startTime=${searchStart}&endTime=${searchEnd}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        setAvailableRooms(await res.json());
        setActiveTab('available');
      }
    } catch {}
    finally { setSearching(false); }
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setBooking(true);
    setBookMsg('');
    try {
      const token = getToken();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${base}/rooms/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...bookForm,
          bookedBy: user.id,
          attendees: bookForm.attendees ? parseInt(bookForm.attendees) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookMsg('Room booked successfully!');
        setBookForm({ roomId: '', date: '', startTime: '', endTime: '', purpose: '', attendees: '', remarks: '' });
        // refresh my bookings
        const bookingsRes = await fetch(`${base}/rooms/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bookingsRes.ok) setMyBookings(await bookingsRes.json());
      } else {
        setBookMsg(data.message || 'Failed to book room');
      }
    } catch (err: any) {
      setBookMsg('Failed to book room');
    }
    finally { setBooking(false); }
  }

  async function cancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return;
    const token = getToken();
    const res = await fetch(`${base}/rooms/bookings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setMyBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    }
  }

  const displayRooms = activeTab === 'available' && availableRooms ? availableRooms : rooms;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DoorClosed className="h-6 w-6 text-primary" />
            Room / Resource Booking
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Book classrooms, labs and other school spaces</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Check Room Availability</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Date</label>
            <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Start Time</label>
            <input type="time" value={searchStart} onChange={(e) => setSearchStart(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">End Time</label>
            <input type="time" value={searchEnd} onChange={(e) => setSearchEnd(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button
            onClick={searchAvailable}
            disabled={searching || !searchDate || !searchStart || !searchEnd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {searching ? 'Searching...' : 'Find Available'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/40 p-1 rounded-lg w-fit">
        {[
          { id: 'rooms', label: 'All Rooms' },
          { id: 'available', label: `Available${availableRooms ? ` (${availableRooms.length})` : ''}` },
          { id: 'book', label: 'Book a Room' },
          { id: 'mine', label: `My Bookings (${myBookings.length})` },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.id ? 'bg-card shadow font-medium' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* All Rooms / Available Rooms */}
      {(activeTab === 'rooms' || activeTab === 'available') && (
        <div>
          {activeTab === 'available' && availableRooms !== null && (
            <p className="text-sm text-muted-foreground mb-4">
              {availableRooms.length} room(s) available on {searchDate} from {searchStart} to {searchEnd}
            </p>
          )}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading rooms...</div>
          ) : displayRooms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No rooms found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayRooms.map((room) => (
                <div key={room.id} className="bg-card border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-base">{room.name}</h3>
                      {room.building && (
                        <p className="text-xs text-muted-foreground">
                          {room.building}{room.floor !== undefined && room.floor !== null ? `, Floor ${room.floor}` : ''}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[room.type] || TYPE_COLORS.OTHER}`}>
                      {room.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {room.capacity} seats
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {room.hasProjector && (
                      <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        <Projector className="h-3 w-3" />
                        Projector
                      </span>
                    )}
                    {room.hasAC && (
                      <span className="flex items-center gap-1 text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-200">
                        <Wind className="h-3 w-3" />
                        AC
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setBookForm((f) => ({ ...f, roomId: room.id }));
                      setActiveTab('book');
                    }}
                    className="mt-4 w-full py-1.5 border border-primary text-primary rounded-md text-sm hover:bg-primary/5"
                  >
                    Book This Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book a Room */}
      {activeTab === 'book' && (
        <div className="max-w-xl">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Book a Room</h2>
            {bookMsg && (
              <div className={`mb-4 p-3 rounded-md text-sm ${bookMsg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {bookMsg}
              </div>
            )}
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Room *</label>
                <select
                  value={bookForm.roomId}
                  onChange={(e) => setBookForm((f) => ({ ...f, roomId: e.target.value }))}
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select a room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type.replace('_', ' ')}, Capacity: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input type="date" value={bookForm.date}
                  onChange={(e) => setBookForm((f) => ({ ...f, date: e.target.value }))}
                  required min={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time *</label>
                  <input type="time" value={bookForm.startTime}
                    onChange={(e) => setBookForm((f) => ({ ...f, startTime: e.target.value }))}
                    required
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time *</label>
                  <input type="time" value={bookForm.endTime}
                    onChange={(e) => setBookForm((f) => ({ ...f, endTime: e.target.value }))}
                    required
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purpose *</label>
                <input type="text" value={bookForm.purpose}
                  onChange={(e) => setBookForm((f) => ({ ...f, purpose: e.target.value }))}
                  required placeholder="e.g., Math class, Science lab, Parent meeting"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Attendees</label>
                <input type="number" value={bookForm.attendees}
                  onChange={(e) => setBookForm((f) => ({ ...f, attendees: e.target.value }))}
                  min="1" placeholder="Number of attendees"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea value={bookForm.remarks}
                  onChange={(e) => setBookForm((f) => ({ ...f, remarks: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
              <button type="submit" disabled={booking}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* My Bookings */}
      {activeTab === 'mine' && (
        <div>
          {myBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No bookings found.</div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Room</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">Purpose</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.map((b) => (
                    <tr key={b.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{b.room?.name}</div>
                        <div className="text-xs text-muted-foreground">{b.room?.type?.replace('_', ' ')}</div>
                      </td>
                      <td className="p-3">{formatDate(b.date)}</td>
                      <td className="p-3 font-mono text-xs">{b.startTime} – {b.endTime}</td>
                      <td className="p-3">{b.purpose}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[b.status] || ''}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {b.status !== 'CANCELLED' && (
                          <button onClick={() => cancelBooking(b.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
