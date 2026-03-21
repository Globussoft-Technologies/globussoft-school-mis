'use client';

import { useEffect, useState, useCallback } from 'react';
import { Settings2, Save, Edit2, X, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  label: string;
  type: string;
  schoolId: string;
  updatedBy?: string;
  updatedAt: string;
}

type GroupedSettings = Record<string, SystemSetting[]>;

const CATEGORIES = ['GENERAL', 'ACADEMIC', 'FEE', 'ATTENDANCE', 'GRADING', 'NOTIFICATION'];

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  ACADEMIC: 'Academic',
  FEE: 'Fee',
  ATTENDANCE: 'Attendance',
  GRADING: 'Grading',
  NOTIFICATION: 'Notification',
};

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function getSchoolId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.schoolId || '';
  } catch {
    return '';
  }
}

function getUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || '';
  } catch {
    return '';
  }
}

function renderValue(type: string, value: string) {
  if (type === 'JSON') {
    try {
      return (
        <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto max-w-sm">
          {JSON.stringify(JSON.parse(value), null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-sm font-mono">{value}</span>;
    }
  }
  if (type === 'BOOLEAN') {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        value === 'true' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {value === 'true' ? 'Enabled' : 'Disabled'}
      </span>
    );
  }
  return <span className="text-sm">{value}</span>;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const schoolId = getSchoolId();
      const params = schoolId ? `?schoolId=${schoolId}` : '';
      const res = await fetch(`${API}/settings${params}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      setSettings({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  function startEdit(setting: SystemSetting) {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue('');
  }

  async function saveEdit(key: string) {
    setSaving(true);
    try {
      const res = await fetch(`${API}/settings/${key}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ value: editValue }),
      });
      if (res.ok) {
        setEditingKey(null);
        setEditValue('');
        fetchSettings();
      }
    } finally {
      setSaving(false);
    }
  }

  async function seedDefaults() {
    setSeeding(true);
    try {
      const schoolId = getSchoolId();
      const params = schoolId ? `?schoolId=${schoolId}` : '';
      const res = await fetch(`${API}/settings/seed-defaults${params}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchSettings();
      }
    } finally {
      setSeeding(false);
    }
  }

  const adminRoles = ['SUPER_ADMIN', 'IT_ADMIN'];
  if (!adminRoles.includes(userRole) && userRole !== '') {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Access restricted to administrators only.
      </div>
    );
  }

  const activeSettings = settings[activeTab] || [];
  const hasAnySettings = Object.values(settings).some((arr) => arr.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-sm text-muted-foreground">Configure school-wide system parameters</p>
          </div>
        </div>
        <button
          onClick={seedDefaults}
          disabled={seeding}
          className="flex items-center gap-2 border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} />
          {seeding ? 'Seeding...' : 'Seed Defaults'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b">
        {CATEGORIES.map((cat) => {
          const count = (settings[cat] || []).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === cat
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {CATEGORY_LABELS[cat]}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading settings...</div>
      ) : !hasAnySettings ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">No settings found. Seed defaults to get started.</p>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : 'Seed Default Settings'}
          </button>
        </div>
      ) : activeSettings.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No settings in this category.
        </div>
      ) : (
        <div className="bg-card border rounded-lg divide-y">
          {activeSettings.map((setting) => (
            <div key={setting.key} className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{setting.label}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded font-mono">
                    {setting.key}
                  </span>
                  <span className="text-xs text-muted-foreground">[{setting.type}]</span>
                </div>
                {editingKey === setting.key ? (
                  <div className="flex items-start gap-2 mt-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={setting.type === 'JSON' ? 4 : 1}
                      className="flex-1 border rounded-md px-3 py-1.5 text-sm font-mono resize-y"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => saveEdit(setting.key)}
                        disabled={saving}
                        className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-2 py-1 border rounded text-xs hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1">{renderValue(setting.type, setting.value)}</div>
                )}
                {setting.updatedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(setting.updatedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {setting.updatedBy && ` by ${setting.updatedBy}`}
                  </p>
                )}
              </div>
              {editingKey !== setting.key && (
                <button
                  onClick={() => startEdit(setting)}
                  className="flex items-center gap-1 text-xs px-2 py-1.5 border rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
