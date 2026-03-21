'use client';

import { useEffect, useState } from 'react';
import { Bus, MapPin, Users } from 'lucide-react';

interface Vehicle {
  id: string;
  registrationNumber?: string;
  vehicleNumber?: string;
  model?: string;
  capacity?: number;
  driverName?: string;
  isActive?: boolean;
  status?: string;
}

interface Route {
  id: string;
  name: string;
  vehicleId?: string;
  busNumber?: string;
  driverName?: string;
  stops?: string[] | Array<{ name: string }>;
  studentsCount?: number;
  isActive?: boolean;
}

export default function BusPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => {
    async function load() {
      try {
        const [vRes, rRes] = await Promise.all([
          fetch('/api/v1/bus/vehicles', { headers: headers() }),
          fetch('/api/v1/bus/routes', { headers: headers() }),
        ]);
        if (vRes.ok) {
          const data = await vRes.json();
          setVehicles(Array.isArray(data) ? data : data.data ?? []);
        }
        if (rRes.ok) {
          const data = await rRes.json();
          setRoutes(Array.isArray(data) ? data : data.data ?? []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const activeVehicles = vehicles.filter(v => v.isActive !== false && v.status !== 'INACTIVE').length;
  const activeRoutes = routes.filter(r => r.isActive !== false).length;
  const totalStudents = routes.reduce((s, r) => s + (r.studentsCount ?? 0), 0);

  function getStopNames(stops?: string[] | Array<{ name: string }>): string[] {
    if (!stops) return [];
    return stops.map(s => typeof s === 'string' ? s : s.name);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bus Tracking</h1>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
          <Bus className="h-4 w-4" /> Add Route
        </button>
      </div>

      {/* Fleet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Bus className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Vehicles</p>
            <p className="text-xl font-bold">{loading ? '...' : (vehicles.length || '--')}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Routes</p>
            <p className="text-xl font-bold">{loading ? '...' : (activeRoutes || routes.length || '--')}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Students Assigned</p>
            <p className="text-xl font-bold">{loading ? '...' : (totalStudents || '--')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Vehicles ({vehicles.length})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No vehicles registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Registration</th>
                    <th className="text-left px-4 py-2 font-medium">Model</th>
                    <th className="text-center px-4 py-2 font-medium">Capacity</th>
                    <th className="text-left px-4 py-2 font-medium">Driver</th>
                    <th className="text-center px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{v.registrationNumber ?? v.vehicleNumber ?? '--'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{v.model ?? '--'}</td>
                      <td className="px-4 py-2 text-center">{v.capacity ?? '--'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{v.driverName ?? '--'}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          v.isActive !== false && v.status !== 'INACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {v.status ?? (v.isActive !== false ? 'Active' : 'Inactive')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Routes */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Routes ({routes.length})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : routes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No routes configured.</div>
          ) : (
            <div className="divide-y">
              {routes.map(route => {
                const stopNames = getStopNames(route.stops);
                return (
                  <div key={route.id} className="p-4 hover:bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{route.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {route.busNumber ? `Bus: ${route.busNumber}` : ''}
                          {route.driverName ? ` · Driver: ${route.driverName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {route.studentsCount != null && (
                          <span className="text-xs text-muted-foreground">{route.studentsCount} students</span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${route.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {route.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    {stopNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {stopNames.map((stop, idx) => (
                          <span key={idx} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                            <MapPin className="h-3 w-3" /> {stop}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
