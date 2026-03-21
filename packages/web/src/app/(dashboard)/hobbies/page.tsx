'use client';

import { useEffect, useState, useCallback } from 'react';
import { Palette, Users, Plus, X } from 'lucide-react';

interface Hobby {
  id: string;
  name: string;
  category: string;
  capacity: number;
  enrolled: number;
  coordinator: string;
  description?: string;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface UserProfile {
  schoolId: string;
  school?: { id: string };
}

const categoryFilterLabels = ['All', 'Visual Arts', 'Performing Arts', 'Sports', 'Technology', 'Literary', 'Photography'];

// Map display labels to API enum values
const categoryLabelToEnum: Record<string, string> = {
  'Visual Arts': 'VISUAL_ARTS',
  'Performing Arts': 'PERFORMING_ARTS',
  'Sports': 'SPORTS',
  'Technology': 'TECHNOLOGY',
  'Literary': 'LITERARY',
  'Photography': 'PHOTOGRAPHY',
};

const categoryEnumToLabel: Record<string, string> = Object.fromEntries(
  Object.entries(categoryLabelToEnum).map(([k, v]) => [v, k]),
);

const categoryColors: Record<string, string> = {
  VISUAL_ARTS: 'bg-pink-100 text-pink-700',
  PERFORMING_ARTS: 'bg-purple-100 text-purple-700',
  SPORTS: 'bg-green-100 text-green-700',
  TECHNOLOGY: 'bg-blue-100 text-blue-700',
  LITERARY: 'bg-yellow-100 text-yellow-700',
  PHOTOGRAPHY: 'bg-orange-100 text-orange-700',
  // fallback for display-label keys
  'Visual Arts': 'bg-pink-100 text-pink-700',
  'Performing Arts': 'bg-purple-100 text-purple-700',
  Sports: 'bg-green-100 text-green-700',
  Technology: 'bg-blue-100 text-blue-700',
  Literary: 'bg-yellow-100 text-yellow-700',
  Photography: 'bg-orange-100 text-orange-700',
};

const EMPTY_FORM = {
  name: '',
  category: 'VISUAL_ARTS',
  description: '',
  maxCapacity: '20',
  coordinatorId: '',
};

export default function HobbiesPage() {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<UserOption[]>([]);
  const [schoolId, setSchoolId] = useState('');

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const fetchHobbies = useCallback(async () => {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await fetch('/api/v1/hobby', { headers });
      if (res.ok) {
        const data = await res.json();
        setHobbies(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchHobbies();
  }, [fetchHobbies]);

  // Load coordinator options + school id when form opens
  useEffect(() => {
    if (!showForm) return;
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/v1/users/me', { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/v1/users', { headers }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([me, users]) => {
        if (me) setSchoolId(me.schoolId ?? me.school?.id ?? '');
        setTeachers(Array.isArray(users) ? users : []);
      })
      .catch(() => {});
  }, [showForm]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/v1/hobby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          description: form.description || undefined,
          maxCapacity: Number(form.maxCapacity),
          coordinatorId: form.coordinatorId,
          schoolId,
          isActive: true,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(EMPTY_FORM);
        fetchHobbies();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `Error ${res.status}`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = selectedCategory === 'All'
    ? hobbies
    : hobbies.filter((h) => {
        const enumVal = categoryLabelToEnum[selectedCategory];
        return h.category === enumVal || h.category === selectedCategory;
      });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Hobby Management</h1>
        <button
          onClick={() => { setShowForm((v) => !v); setError(''); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Hobby'}
        </button>
      </div>

      {/* Slide-down Add Hobby Form */}
      {showForm && (
        <div className="bg-card rounded-lg border p-6 mb-6 animate-in slide-in-from-top-2">
          <h2 className="text-lg font-semibold mb-4">Add New Hobby</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hobby Name *</label>
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Painting, Football"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="VISUAL_ARTS">Visual Arts</option>
                  <option value="PERFORMING_ARTS">Performing Arts</option>
                  <option value="SPORTS">Sports</option>
                  <option value="TECHNOLOGY">Technology</option>
                  <option value="LITERARY">Literary</option>
                  <option value="PHOTOGRAPHY">Photography</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Capacity *</label>
                <input
                  required
                  type="number"
                  min="1"
                  name="maxCapacity"
                  value={form.maxCapacity}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Coordinator *</label>
                <select
                  required
                  name="coordinatorId"
                  value={form.coordinatorId}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select coordinator</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description of this hobby..."
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); setForm(EMPTY_FORM); }}
                className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-60"
              >
                {submitting ? 'Saving...' : 'Add Hobby'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categoryFilterLabels.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hobby Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-card rounded-lg border p-8 text-center text-muted-foreground">
            No hobbies found{selectedCategory !== 'All' ? ` in "${selectedCategory}"` : ''}. Add one to get started.
          </div>
        ) : (
          filtered.map((hobby) => {
            const capacity = hobby.capacity ?? 0;
            const enrolled = hobby.enrolled ?? 0;
            const enrollmentPct = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
            const isFull = enrolled >= capacity;
            const displayCategory = categoryEnumToLabel[hobby.category] ?? hobby.category;
            return (
              <div key={hobby.id} className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${categoryColors[hobby.category] ?? 'bg-gray-100 text-gray-700'}`}>
                    {displayCategory}
                  </span>
                </div>
                <h3 className="font-semibold mb-1">{hobby.name}</h3>
                {hobby.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{hobby.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Users className="h-4 w-4" />
                  <span>{enrolled} / {capacity} enrolled</span>
                </div>
                {/* Enrollment progress bar */}
                <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                  <div
                    className={`h-1.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(enrollmentPct, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Coordinator: {typeof hobby.coordinator === "object" ? ((hobby.coordinator as any)?.firstName + " " + (hobby.coordinator as any)?.lastName) : hobby.coordinator}</p>
                  <button
                    className={`text-xs px-3 py-1 rounded ${
                      isFull
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                    disabled={isFull}
                  >
                    {isFull ? 'Full' : 'Enroll'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
