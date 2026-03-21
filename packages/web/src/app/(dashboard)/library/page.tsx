'use client';

import { useEffect, useState } from 'react';
import { BookMarked, Plus, Search, RotateCcw, AlertTriangle, X } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  publisher?: string;
  publicationYear?: number;
  totalCopies: number;
  availableCopies: number;
  location?: string;
  _count?: { issues: number };
}

interface Issue {
  id: string;
  bookId: string;
  borrowerId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  fine?: number;
  remarks?: string;
  book: Book;
}

const categoryColors: Record<string, string> = {
  TEXTBOOK: 'bg-blue-100 text-blue-700',
  REFERENCE: 'bg-purple-100 text-purple-700',
  FICTION: 'bg-green-100 text-green-700',
  NON_FICTION: 'bg-orange-100 text-orange-700',
  PERIODICAL: 'bg-pink-100 text-pink-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  ISSUED: 'bg-blue-100 text-blue-700',
  RETURNED: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  LOST: 'bg-gray-100 text-gray-700',
};

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [overdue, setOverdue] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'books' | 'overdue'>('books');

  // Forms
  const [showAddBook, setShowAddBook] = useState(false);
  const [showIssueBook, setShowIssueBook] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '', author: '', isbn: '', category: 'TEXTBOOK', publisher: '',
    publicationYear: '', totalCopies: '1', location: '', schoolId: '',
  });
  const [issueForm, setIssueForm] = useState({ bookId: '', borrowerId: '', dueDate: '', remarks: '' });
  const [saving, setSaving] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL;

  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  function getSchoolId() {
    if (typeof window === 'undefined') return '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.schoolId || '';
  }

  async function loadBooks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`${base}/library/books?${params}`, { headers: getHeaders() });
      if (res.ok) setBooks(await res.json());
    } catch {}
    setLoading(false);
  }

  async function loadOverdue() {
    try {
      const res = await fetch(`${base}/library/overdue`, { headers: getHeaders() });
      if (res.ok) setOverdue(await res.json());
    } catch {}
  }

  useEffect(() => { loadBooks(); loadOverdue(); }, [searchQuery, categoryFilter]);

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const schoolId = getSchoolId();
      const payload: any = {
        ...bookForm,
        totalCopies: parseInt(bookForm.totalCopies) || 1,
        publicationYear: bookForm.publicationYear ? parseInt(bookForm.publicationYear) : undefined,
        isbn: bookForm.isbn || undefined,
        publisher: bookForm.publisher || undefined,
        location: bookForm.location || undefined,
        schoolId,
      };
      const res = await fetch(`${base}/library/books`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowAddBook(false);
        setBookForm({ title: '', author: '', isbn: '', category: 'TEXTBOOK', publisher: '', publicationYear: '', totalCopies: '1', location: '', schoolId: '' });
        loadBooks();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to add book');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  async function handleIssueBook(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${base}/library/issue`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(issueForm),
      });
      if (res.ok) {
        setShowIssueBook(false);
        setIssueForm({ bookId: '', borrowerId: '', dueDate: '', remarks: '' });
        loadBooks();
        loadOverdue();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to issue book');
      }
    } catch { alert('Network error'); }
    setSaving(false);
  }

  async function handleReturn(issueId: string) {
    if (!confirm('Mark this book as returned?')) return;
    setReturningId(issueId);
    try {
      const res = await fetch(`${base}/library/return/${issueId}`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) {
        loadBooks();
        loadOverdue();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to return book');
      }
    } catch { alert('Network error'); }
    setReturningId(null);
  }

  const categories = ['', 'TEXTBOOK', 'REFERENCE', 'FICTION', 'NON_FICTION', 'PERIODICAL', 'OTHER'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookMarked className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Library Management</h1>
            <p className="text-sm text-muted-foreground">Books, issues, and returns</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowIssueBook(true)}
            className="flex items-center gap-2 border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Issue Book
          </button>
          <button
            onClick={() => setShowAddBook(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Book
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['books', 'overdue'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overdue' ? `Overdue (${overdue.length})` : 'Books'}
          </button>
        ))}
      </div>

      {activeTab === 'books' && (
        <>
          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, ISBN..."
                className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c || 'All Categories'}</option>
              ))}
            </select>
          </div>

          {/* Books Grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading books...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Title</th>
                    <th className="text-left px-4 py-3 font-medium">Author</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Location</th>
                    <th className="text-left px-4 py-3 font-medium">Copies</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No books found
                      </td>
                    </tr>
                  ) : (
                    books.map((book) => (
                      <tr key={book.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{book.title}</div>
                          {book.isbn && <div className="text-xs text-muted-foreground">ISBN: {book.isbn}</div>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{book.author}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[book.category] || 'bg-gray-100 text-gray-700'}`}>
                            {book.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{book.location || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${book.availableCopies === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {book.availableCopies}
                          </span>
                          <span className="text-muted-foreground text-xs"> / {book.totalCopies}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'overdue' && (
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="px-4 py-3 bg-red-50 border-b flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Overdue Books — Rs 2 fine per day</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Book</th>
                <th className="text-left px-4 py-3 font-medium">Borrower ID</th>
                <th className="text-left px-4 py-3 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 font-medium">Days Overdue</th>
                <th className="text-left px-4 py-3 font-medium">Fine</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overdue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No overdue books</td>
                </tr>
              ) : (
                overdue.map((issue) => {
                  const daysOverdue = Math.floor(
                    (Date.now() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const fine = daysOverdue * 2;
                  return (
                    <tr key={issue.id} className="border-t bg-red-50/30">
                      <td className="px-4 py-3 font-medium">{issue.book.title}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{issue.borrowerId.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-red-600 font-medium text-xs">
                        {new Date(issue.dueDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-red-600 font-bold">{daysOverdue}d</td>
                      <td className="px-4 py-3 font-bold text-red-700">₹{fine}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleReturn(issue.id)}
                          disabled={returningId === issue.id}
                          className="flex items-center gap-1 text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {returningId === issue.id ? '...' : 'Return'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Add New Book</h2>
              <button onClick={() => setShowAddBook(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddBook} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input type="text" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Author *</label>
                  <input type="text" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ISBN</label>
                  <input type="text" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {['TEXTBOOK', 'REFERENCE', 'FICTION', 'NON_FICTION', 'PERIODICAL', 'OTHER'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Publisher</label>
                  <input type="text" value={bookForm.publisher} onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Publication Year</label>
                  <input type="number" value={bookForm.publicationYear} onChange={(e) => setBookForm({ ...bookForm, publicationYear: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Copies *</label>
                  <input type="number" min="1" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location (Shelf)</label>
                  <input type="text" value={bookForm.location} onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })}
                    placeholder="e.g., Shelf A1"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Book'}
                </button>
                <button type="button" onClick={() => setShowAddBook(false)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Issue Book</h2>
              <button onClick={() => setShowIssueBook(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleIssueBook} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Book ID *</label>
                <input type="text" value={issueForm.bookId} onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                  placeholder="Enter book ID"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Borrower User ID *</label>
                <input type="text" value={issueForm.borrowerId} onChange={(e) => setIssueForm({ ...issueForm, borrowerId: e.target.value })}
                  placeholder="Student or teacher user ID"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date *</label>
                <input type="date" value={issueForm.dueDate} onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <input type="text" value={issueForm.remarks} onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving ? 'Issuing...' : 'Issue Book'}
                </button>
                <button type="button" onClick={() => setShowIssueBook(false)}
                  className="flex-1 border py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
