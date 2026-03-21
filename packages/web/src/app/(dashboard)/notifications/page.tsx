'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const notificationTypes = ['All', 'Attendance', 'Test Result', 'Fee Due', 'Homework', 'Announcement', 'Discipline'];

const typeColors: Record<string, string> = {
  Attendance: 'bg-blue-100 text-blue-700',
  'Test Result': 'bg-green-100 text-green-700',
  'Fee Due': 'bg-red-100 text-red-700',
  Homework: 'bg-yellow-100 text-yellow-700',
  Announcement: 'bg-purple-100 text-purple-700',
  Discipline: 'bg-orange-100 text-orange-700',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch {}
  }

  async function markAllRead() {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch {}
  }

  async function markRead(id: string) {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  }

  const filtered = selectedType === 'All'
    ? notifications
    : notifications.filter((n) => n.type === selectedType);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 border border-input px-4 py-2 rounded-md text-sm hover:bg-muted"
          >
            <CheckCheck className="h-4 w-4" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {notificationTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-card rounded-lg border">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {selectedType === 'All' ? 'No notifications yet.' : `No "${selectedType}" notifications.`}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 hover:bg-muted/30 cursor-pointer ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                onClick={() => !notif.isRead && markRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${typeColors[notif.type] || 'bg-gray-100 text-gray-700'}`}>
                        {notif.type}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className={`text-sm ${!notif.isRead ? 'font-semibold' : 'font-medium'}`}>{notif.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
