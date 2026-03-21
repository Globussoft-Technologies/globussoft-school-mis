'use client';

import { useEffect, useState } from 'react';

interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  sortOrder: number;
}

interface GalleryAlbum {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  eventDate?: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
  photos?: GalleryPhoto[];
  _count?: { photos: number };
}

const CATEGORIES = ['EVENTS', 'SPORTS', 'ACADEMICS', 'CULTURAL', 'TRIPS', 'INFRASTRUCTURE', 'OTHER'];

const CAT_COLORS: Record<string, string> = {
  EVENTS:        'bg-pink-100 text-pink-700',
  SPORTS:        'bg-orange-100 text-orange-700',
  ACADEMICS:     'bg-blue-100 text-blue-700',
  CULTURAL:      'bg-indigo-100 text-indigo-700',
  TRIPS:         'bg-cyan-100 text-cyan-700',
  INFRASTRUCTURE:'bg-gray-100 text-gray-700',
  OTHER:         'bg-yellow-100 text-yellow-700',
};

export default function GalleryPage() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [filterPublished, setFilterPublished] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [albumForm, setAlbumForm] = useState({
    title: '',
    description: '',
    category: 'EVENTS',
    eventDate: '',
    coverUrl: '',
  });

  const [photoForm, setPhotoForm] = useState({
    url: '',
    caption: '',
    sortOrder: '0',
  });

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });
  const jsonHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });
  const base = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

  useEffect(() => {
    loadAlbums();
  }, [filterCat, filterPublished]);

  function loadAlbums() {
    setLoading(true);
    let url = `${base}/gallery/albums`;
    const params: string[] = [];
    if (filterCat) params.push(`category=${filterCat}`);
    if (filterPublished) params.push(`isPublished=${filterPublished}`);
    if (params.length) url += '?' + params.join('&');

    fetch(url, { headers: headers() })
      .then(r => r.json())
      .then(data => setAlbums(Array.isArray(data) ? data : []))
      .catch(() => setAlbums([]))
      .finally(() => setLoading(false));
  }

  function loadAlbum(id: string) {
    fetch(`${base}/gallery/albums/${id}`, { headers: headers() })
      .then(r => r.json())
      .then(data => setSelectedAlbum(data))
      .catch(() => {});
  }

  async function handleCreateAlbum(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!albumForm.title) { setFormError('Title is required'); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: albumForm.title,
        category: albumForm.category,
      };
      if (albumForm.description) payload.description = albumForm.description;
      if (albumForm.eventDate) payload.eventDate = albumForm.eventDate;
      if (albumForm.coverUrl) payload.coverUrl = albumForm.coverUrl;

      const res = await fetch(`${base}/gallery/albums`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.message || 'Failed to create album');
        return;
      }
      setShowCreateForm(false);
      setAlbumForm({ title: '', description: '', category: 'EVENTS', eventDate: '', coverUrl: '' });
      loadAlbums();
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAlbum || !photoForm.url) { setFormError('URL is required'); return; }
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/gallery/albums/${selectedAlbum.id}/photos`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          url: photoForm.url,
          caption: photoForm.caption || undefined,
          sortOrder: parseInt(photoForm.sortOrder) || 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.message || 'Failed to add photo');
        return;
      }
      setShowAddPhoto(false);
      setPhotoForm({ url: '', caption: '', sortOrder: '0' });
      loadAlbum(selectedAlbum.id);
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Delete this photo?')) return;
    try {
      await fetch(`${base}/gallery/photos/${photoId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (selectedAlbum) loadAlbum(selectedAlbum.id);
    } catch {}
  }

  async function togglePublish(album: GalleryAlbum, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`${base}/gallery/albums/${album.id}/publish`, {
        method: 'PATCH',
        headers: headers(),
      });
      loadAlbums();
      if (selectedAlbum?.id === album.id) {
        setSelectedAlbum(a => a ? { ...a, isPublished: !a.isPublished } : a);
      }
    } catch {}
  }

  async function handleDeleteAlbum(albumId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this album and all its photos?')) return;
    try {
      await fetch(`${base}/gallery/albums/${albumId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (selectedAlbum?.id === albumId) setSelectedAlbum(null);
      loadAlbums();
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">School Gallery</h1>
          <p className="text-muted-foreground text-sm">Manage photo albums and media collections</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          + Create Album
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setFilterCat('')}
          className={`px-3 py-1.5 text-xs rounded-full border ${!filterCat ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
        >
          All Categories
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 text-xs rounded-full border ${filterCat === c ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto">
          <select
            value={filterPublished}
            onChange={e => setFilterPublished(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-xs bg-background"
          >
            <option value="">All</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        </div>
      </div>

      {/* Album Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : albums.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No albums found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {albums.map(album => (
            <div
              key={album.id}
              className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { loadAlbum(album.id); }}
            >
              {/* Cover placeholder */}
              <div className="h-36 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center relative">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-primary/40">
                    {album.category === 'SPORTS' ? '🏆' : album.category === 'CULTURAL' ? '🎭' : album.category === 'TRIPS' ? '✈️' : '📸'}
                  </span>
                )}
                {/* Published badge */}
                <span
                  className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${album.isPublished ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                >
                  {album.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{album.title}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded font-medium ${CAT_COLORS[album.category] ?? 'bg-gray-100 text-gray-700'}`}>
                      {album.category}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {album._count?.photos ?? 0} photos
                  </span>
                </div>
                {album.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{album.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => togglePublish(album, e)}
                    className={`flex-1 py-1 text-xs rounded border ${album.isPublished ? 'border-orange-300 text-orange-600 hover:bg-orange-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                  >
                    {album.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={(e) => handleDeleteAlbum(album.id, e)}
                    className="px-2 py-1 text-xs rounded border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Album Detail Modal */}
      {selectedAlbum && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{selectedAlbum.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs rounded font-medium ${CAT_COLORS[selectedAlbum.category] ?? 'bg-gray-100 text-gray-700'}`}>
                    {selectedAlbum.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedAlbum.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {selectedAlbum.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedAlbum.photos?.length ?? 0} photos
                  </span>
                </div>
                {selectedAlbum.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedAlbum.description}</p>
                )}
              </div>
              <button onClick={() => setSelectedAlbum(null)} className="text-muted-foreground hover:text-foreground text-xl px-2">✕</button>
            </div>
            <div className="p-5">
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => { setShowAddPhoto(true); setFormError(''); }}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90"
                >
                  + Add Photo
                </button>
              </div>
              {!selectedAlbum.photos || selectedAlbum.photos.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No photos in this album yet.</div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {selectedAlbum.photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <div className="h-28 bg-muted rounded-lg overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.caption || ''}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      {photo.caption && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Photo Form */}
              {showAddPhoto && (
                <form onSubmit={handleAddPhoto} className="mt-4 border-t pt-4 space-y-3">
                  <h3 className="font-semibold text-sm">Add Photo</h3>
                  <div>
                    <label className="block text-xs font-medium mb-1">Photo URL *</label>
                    <input
                      value={photoForm.url}
                      onChange={e => setPhotoForm(f => ({ ...f, url: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Caption</label>
                      <input
                        value={photoForm.caption}
                        onChange={e => setPhotoForm(f => ({ ...f, caption: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        placeholder="Photo caption..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={photoForm.sortOrder}
                        onChange={e => setPhotoForm(f => ({ ...f, sortOrder: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        min="0"
                      />
                    </div>
                  </div>
                  {formError && <p className="text-red-500 text-xs">{formError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
                    >
                      {submitting ? 'Adding...' : 'Add Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddPhoto(false); setFormError(''); }}
                      className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Album Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Create Album</h2>
            <form onSubmit={handleCreateAlbum} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Title *</label>
                <input
                  value={albumForm.title}
                  onChange={e => setAlbumForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="Annual Sports Day 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Category *</label>
                <select
                  value={albumForm.category}
                  onChange={e => setAlbumForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  value={albumForm.description}
                  onChange={e => setAlbumForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
                  placeholder="Album description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Event Date</label>
                  <input
                    type="date"
                    value={albumForm.eventDate}
                    onChange={e => setAlbumForm(f => ({ ...f, eventDate: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cover URL</label>
                  <input
                    value={albumForm.coverUrl}
                    onChange={e => setAlbumForm(f => ({ ...f, coverUrl: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {formError && <p className="text-red-500 text-xs">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Album'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setFormError(''); }}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
