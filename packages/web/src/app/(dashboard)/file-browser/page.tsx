'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HardDrive, Folder, FolderOpen, FileText, Video, Headphones, Image,
  FileUp, Download, Trash2, ChevronRight, BarChart2, RefreshCw, X,
} from 'lucide-react';

interface BrowseResult {
  prefix: string;
  folders: string[];
  files: FileItem[];
}

interface FileItem {
  name: string;
  size: number;
  lastModified: string;
  etag?: string;
}

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
}

const TYPE_COLORS: Record<string, string> = {
  VIDEO: 'text-red-600 bg-red-50',
  AUDIO: 'text-purple-600 bg-purple-50',
  DOCUMENT: 'text-blue-600 bg-blue-50',
  PRESENTATION: 'text-orange-600 bg-orange-50',
  IMAGE: 'text-green-600 bg-green-50',
  OTHER: 'text-gray-600 bg-gray-50',
};

const STAT_COLORS: Record<string, string> = {
  VIDEO: '#ef4444',
  AUDIO: '#a855f7',
  DOCUMENT: '#3b82f6',
  PRESENTATION: '#f97316',
  IMAGE: '#22c55e',
  OTHER: '#6b7280',
};

function extToType(name: string): string {
  const ext = (name.split('.').pop() ?? '').toLowerCase();
  const map: Record<string, string> = {
    mp4: 'VIDEO', webm: 'VIDEO',
    mp3: 'AUDIO', ogg: 'AUDIO',
    pdf: 'DOCUMENT', doc: 'DOCUMENT', docx: 'DOCUMENT',
    ppt: 'PRESENTATION', pptx: 'PRESENTATION',
    jpg: 'IMAGE', jpeg: 'IMAGE', png: 'IMAGE', gif: 'IMAGE', webp: 'IMAGE',
  };
  return map[ext] ?? 'OTHER';
}

function FileTypeIcon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const t = extToType(name);
  const cls = `${className} ${t === 'VIDEO' ? 'text-red-500' : t === 'AUDIO' ? 'text-purple-500' : t === 'IMAGE' ? 'text-green-500' : 'text-blue-500'}`;
  if (t === 'VIDEO') return <Video className={cls} />;
  if (t === 'AUDIO') return <Headphones className={cls} />;
  if (t === 'IMAGE') return <Image className={cls} />;
  return <FileText className={cls} />;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Breadcrumb({ prefix, onNavigate }: { prefix: string; onNavigate: (p: string) => void }) {
  const parts = prefix ? prefix.split('/').filter(Boolean) : [];
  return (
    <div className="flex items-center gap-1 text-sm flex-wrap">
      <button onClick={() => onNavigate('')} className="text-primary hover:underline font-medium">Root</button>
      {parts.map((part, i) => {
        const path = parts.slice(0, i + 1).join('/') + '/';
        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            {i === parts.length - 1 ? (
              <span className="text-muted-foreground font-medium">{part}</span>
            ) : (
              <button onClick={() => onNavigate(path)} className="text-primary hover:underline">{part}</button>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function FileBrowserPage() {
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [browseData, setBrowseData] = useState<BrowseResult | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const h = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  const loadBrowse = useCallback(async (prefix: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/files/browse?prefix=${encodeURIComponent(prefix)}`, { headers: h() });
      if (!res.ok) throw new Error('Failed to load files');
      const data = await res.json();
      setBrowseData(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/v1/files/stats', { headers: h() });
      if (res.ok) setStats(await res.json());
    } catch {}
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    loadBrowse(currentPrefix);
    loadStats();
  }, [currentPrefix, loadBrowse, loadStats]);

  function navigate(prefix: string) {
    setCurrentPrefix(prefix);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append('file', file);
    if (currentPrefix) {
      fd.append('folder', currentPrefix.replace(/\/$/, ''));
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/v1/files/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('accessToken')}`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else {
            try { const d = JSON.parse(xhr.responseText); reject(new Error(d.message ?? 'Upload failed')); }
            catch { reject(new Error(`Upload failed: ${xhr.status}`)); }
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(fd);
      });
      await loadBrowse(currentPrefix);
      await loadStats();
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(fileName: string) {
    if (!confirm(`Delete "${fileName.split('/').pop()}"? This cannot be undone.`)) return;
    setDeletingFile(fileName);
    try {
      const res = await fetch(`/api/v1/files/${encodeURIComponent(fileName)}`, { method: 'DELETE', headers: h() });
      if (!res.ok) throw new Error('Delete failed');
      await loadBrowse(currentPrefix);
      await loadStats();
    } catch (err: any) {
      setError(err?.message ?? 'Delete failed');
    } finally {
      setDeletingFile(null);
    }
  }

  async function handleDownload(fileName: string) {
    try {
      const res = await fetch(`/api/v1/files/${encodeURIComponent(fileName)}`, { headers: h() });
      if (!res.ok) throw new Error('Could not get download link');
      const data = await res.json();
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      setError(err?.message ?? 'Download failed');
    }
  }

  const totalTypes = stats ? Object.entries(stats.byType) : [];
  const maxSize = totalTypes.reduce((m, [, v]) => Math.max(m, v.size), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <HardDrive className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">File Manager</h1>
            <p className="text-sm text-muted-foreground">Browse and manage uploaded files in MinIO storage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadBrowse(currentPrefix); loadStats(); }}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <FileUp className="h-4 w-4" />
            {uploading ? `Uploading ${uploadProgress ?? 0}%...` : 'Upload File'}
          </button>
          <input ref={fileInputRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Upload progress bar */}
      {uploading && uploadProgress !== null && (
        <div className="mb-4">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Storage Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4 md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <BarChart2 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Storage Overview</h2>
              {statsLoading && <div className="h-3 w-3 border border-primary border-t-transparent rounded-full animate-spin ml-auto" />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Files</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatBytes(stats.totalSize)}</p>
                <p className="text-xs text-muted-foreground">Total Size</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4 md:col-span-2">
            <h2 className="font-semibold mb-3 text-sm">By File Type</h2>
            <div className="space-y-2">
              {totalTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files yet</p>
              ) : totalTypes.map(([type, data]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium w-20 text-center ${TYPE_COLORS[type] || TYPE_COLORS.OTHER}`}>{type}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: maxSize ? `${(data.size / maxSize) * 100}%` : '0%',
                        backgroundColor: STAT_COLORS[type] || STAT_COLORS.OTHER,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {data.count} · {formatBytes(data.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File browser */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {/* Breadcrumb */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <Breadcrumb prefix={currentPrefix} onNavigate={navigate} />
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : !browseData ? null : (
          <div>
            {/* Folders */}
            {browseData.folders.length > 0 && (
              <div className="border-b">
                <div className="px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Folders ({browseData.folders.length})
                </div>
                {browseData.folders.map(folder => {
                  const name = folder.replace(currentPrefix, '').replace(/\/$/, '');
                  return (
                    <button
                      key={folder}
                      onClick={() => navigate(folder)}
                      className="flex items-center gap-3 px-4 py-3 w-full hover:bg-muted transition-colors border-b last:border-0 text-left"
                    >
                      <Folder className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      <span className="text-sm font-medium">{name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Files */}
            {browseData.files.length > 0 ? (
              <div>
                <div className="px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                  <span>Files ({browseData.files.length})</span>
                  <span className="ml-auto mr-28 hidden sm:block">Size</span>
                  <span className="hidden md:block mr-4">Modified</span>
                </div>
                {browseData.files.map(file => {
                  const shortName = file.name?.split('/').pop() ?? file.name;
                  const isDeleting = deletingFile === file.name;
                  return (
                    <div key={file.name} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <FileTypeIcon name={file.name ?? ''} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{shortName}</p>
                        <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-right hidden sm:block">{formatBytes(file.size)}</span>
                      <span className="text-xs text-muted-foreground hidden md:block w-40 text-right">{file.lastModified ? formatDate(file.lastModified) : ''}</span>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleDownload(file.name)}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.name)}
                          disabled={isDeleting}
                          className="p-1.5 hover:bg-red-50 rounded-md text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className={`h-4 w-4 ${isDeleting ? 'animate-pulse' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : browseData.folders.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>This folder is empty.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-primary hover:underline text-sm"
                >
                  Upload a file here
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
