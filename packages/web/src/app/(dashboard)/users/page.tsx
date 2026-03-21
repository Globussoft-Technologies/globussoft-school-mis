'use client';

import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role: string;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  SCHOOL_ADMIN: 'bg-purple-100 text-purple-700',
  TEACHER: 'bg-blue-100 text-blue-700',
  STUDENT: 'bg-green-100 text-green-700',
  PARENT: 'bg-yellow-100 text-yellow-700',
  STAFF: 'bg-gray-100 text-gray-700',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  useEffect(() => {
    fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(data => {
        setUsers(Array.isArray(data) ? data : data.users ?? data.data ?? []);
        setLoading(false);
      })
      .catch(err => { setError(`Failed to load users: ${err.message}`); setLoading(false); });
  }, []);

  const roles = ['All', ...Array.from(new Set(users.map(u => u.role))).sort()];

  const filtered = users.filter(u => {
    const name = u.name ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    const matchesSearch = !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {users.length} total users
        </div>
      </div>

      {/* Role Summary Cards */}
      {!loading && users.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {Object.entries(roleCounts).map(([role, count]) => (
            <button
              key={role}
              onClick={() => setSelectedRole(selectedRole === role ? 'All' : role)}
              className={`rounded-lg border p-3 text-center transition-all hover:shadow-sm ${
                selectedRole === role ? 'ring-2 ring-primary' : ''
              }`}
            >
              <p className="text-xl font-bold">{count}</p>
              <span className={`px-1.5 py-0.5 rounded text-xs ${roleColors[role] ?? 'bg-gray-100 text-gray-700'}`}>
                {role}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-card rounded-lg border p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full border rounded-md pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[160px]">
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border">
        {error && <div className="p-4 text-sm text-red-600 bg-red-50 border-b">{error}</div>}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {search || selectedRole !== 'All' ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-center px-4 py-3 font-medium">Role</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const name = user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '--';
                  const isActive = user.isActive !== false && user.status !== 'INACTIVE';
                  return (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email ?? '--'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.phone ?? '--'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 text-xs text-muted-foreground border-t">
              Showing {filtered.length} of {users.length} users
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
