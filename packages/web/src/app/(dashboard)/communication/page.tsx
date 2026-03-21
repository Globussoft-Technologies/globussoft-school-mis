'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Calendar, Plus, Clock, Users } from 'lucide-react';

interface PtmSlot {
  id: string;
  date: string;
  timeFrom?: string;
  timeTo?: string;
  startTime?: string;
  endTime?: string;
  teacher?: string;
  teacherName?: string;
  subject?: string;
  subjectName?: string;
  booked?: boolean;
  isBooked?: boolean;
  parentName?: string;
  studentName?: string;
}

interface Conversation {
  id: string;
  title?: string;
  subject?: string;
  participants?: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt?: string;
  isRead?: boolean;
  unreadCount?: number;
  from?: string;
  to?: string;
}

export default function CommunicationPage() {
  const [ptmSlots, setPtmSlots] = useState<PtmSlot[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token()}` };
    async function load() {
      try {
        const [ptmRes, convRes] = await Promise.all([
          fetch('/api/v1/communication/ptm/slots', { headers }),
          fetch('/api/v1/communication/conversations', { headers }),
        ]);
        if (ptmRes.ok) {
          const data = await ptmRes.json();
          setPtmSlots(Array.isArray(data) ? data : data.data ?? []);
        }
        if (convRes.ok) {
          const data = await convRes.json();
          setConversations(Array.isArray(data) ? data : data.data ?? []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Communication</h1>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
          <Plus className="h-4 w-4" /> New Message
        </button>
      </div>

      {/* PTM Scheduling */}
      <div className="bg-card rounded-lg border mb-6">
        <div className="p-4 border-b flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold">Parent-Teacher Meetings (PTM)</h2>
          <button className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline">
            <Plus className="h-3 w-3" /> Schedule Slot
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : ptmSlots.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No PTM slots scheduled. Create slots for parents to book.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Time</th>
                  <th className="text-left px-4 py-2 font-medium">Teacher</th>
                  <th className="text-left px-4 py-2 font-medium">Subject</th>
                  <th className="text-center px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Booked By</th>
                </tr>
              </thead>
              <tbody>
                {ptmSlots.map((slot) => {
                  const isBooked = slot.booked ?? slot.isBooked ?? false;
                  const timeFrom = slot.timeFrom ?? slot.startTime ?? '';
                  const timeTo = slot.timeTo ?? slot.endTime ?? '';
                  const teacherRaw = slot.teacher ?? slot.teacherName ?? '--';
                  const teacher = typeof teacherRaw === 'object' && teacherRaw !== null ? `${(teacherRaw as any).firstName || ''} ${(teacherRaw as any).lastName || ''}`.trim() : teacherRaw;
                  const subject = slot.subject ?? slot.subjectName ?? '--';
                  return (
                    <tr key={slot.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2">{new Date(slot.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeFrom}{timeTo ? ` – ${timeTo}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-2">{teacher}</td>
                      <td className="px-4 py-2 text-muted-foreground">{subject}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${isBooked ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {isBooked ? 'Booked' : 'Available'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">
                        {isBooked ? `${slot.parentName ?? ''} ${slot.studentName ? `(${slot.studentName})` : ''}`.trim() || '--' : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-purple-600" />
          <h2 className="font-semibold">Conversations</h2>
          {conversations.some(c => (c.unreadCount ?? 0) > 0 || c.isRead === false) && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
              {conversations.filter(c => (c.unreadCount ?? 0) > 0 || c.isRead === false).length} unread
            </span>
          )}
          <button className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline">
            <Plus className="h-3 w-3" /> New Conversation
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No conversations yet.
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => {
              const isUnread = conv.isRead === false || (conv.unreadCount ?? 0) > 0;
              const title = conv.title ?? conv.subject ?? 'Conversation';
              const timestamp = conv.lastMessageAt ?? conv.createdAt;
              const participants = conv.participants ?? (conv.from && conv.to ? [conv.from, conv.to] : []);
              return (
                <div
                  key={conv.id}
                  className={`p-4 hover:bg-muted/30 cursor-pointer ${isUnread ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>{title}</p>
                    <div className="flex items-center gap-2 ml-2">
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                      {timestamp && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {participants.length > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Users className="h-3 w-3" /> {participants.join(', ')}
                    </p>
                  )}
                  {conv.lastMessage && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{conv.lastMessage}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
