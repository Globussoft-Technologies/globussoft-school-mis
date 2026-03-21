'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, ExternalLink, FileText, Video, Headphones,
  Image, Link2, Zap, Calendar, User, BookOpen, GraduationCap,
} from 'lucide-react';

interface LmsContent {
  id: string;
  title: string;
  description?: string;
  type: string;
  isPublished: boolean;
  fileUrl?: string;
  externalUrl?: string;
  subject?: { id: string; name: string; code: string };
  class?: { id: string; name: string };
  uploader?: { id: string; firstName: string; lastName: string };
  topic?: { id: string; title: string };
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  duration?: number;
}

const typeColors: Record<string, string> = {
  VIDEO: 'bg-red-100 text-red-700',
  DOCUMENT: 'bg-blue-100 text-blue-700',
  PRESENTATION: 'bg-orange-100 text-orange-700',
  LINK: 'bg-green-100 text-green-700',
  AUDIO: 'bg-purple-100 text-purple-700',
  INTERACTIVE: 'bg-pink-100 text-pink-700',
};

const typeIcons: Record<string, React.ElementType> = {
  VIDEO: Video,
  DOCUMENT: FileText,
  PRESENTATION: FileText,
  LINK: Link2,
  AUDIO: Headphones,
  IMAGE: Image,
  INTERACTIVE: Zap,
};

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ContentViewer({ content, signedUrl }: { content: LmsContent; signedUrl: string | null }) {
  const url = signedUrl || content.fileUrl || content.externalUrl || '';

  switch (content.type) {
    case 'VIDEO': {
      if (content.externalUrl && isYouTubeUrl(content.externalUrl)) {
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <iframe
              src={getYouTubeEmbedUrl(content.externalUrl)}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      }
      if (url) {
        return (
          <div className="rounded-lg overflow-hidden bg-black">
            <video controls className="w-full max-h-[500px]" src={url}>
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
      break;
    }

    case 'AUDIO': {
      if (url) {
        return (
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-purple-50 rounded-full">
                <Headphones className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">{content.title}</p>
                {content.subject && <p className="text-sm text-muted-foreground">{content.subject.name}</p>}
              </div>
            </div>
            <audio controls className="w-full">
              <source src={url} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      }
      break;
    }

    case 'IMAGE': {
      if (url) {
        return (
          <div className="rounded-lg overflow-hidden border bg-muted flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={content.title} className="max-w-full max-h-[600px] object-contain rounded" />
          </div>
        );
      }
      break;
    }

    case 'DOCUMENT':
    case 'PRESENTATION': {
      if (url) {
        return (
          <div className="rounded-lg overflow-hidden border" style={{ height: '600px' }}>
            <iframe src={url} className="w-full h-full" title={content.title} />
          </div>
        );
      }
      break;
    }

    case 'LINK': {
      const linkUrl = content.externalUrl || url;
      if (linkUrl) {
        return (
          <div className="bg-card border rounded-lg p-8 text-center">
            <div className="p-4 bg-green-50 rounded-full inline-flex mb-4">
              <ExternalLink className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">External Resource</h3>
            <p className="text-sm text-muted-foreground mb-4 break-all">{linkUrl}</p>
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />
              Open Link
            </a>
          </div>
        );
      }
      break;
    }
  }

  // Fallback: show a download/open button
  return (
    <div className="bg-card border rounded-lg p-8 text-center">
      <div className="p-4 bg-muted rounded-full inline-flex mb-4">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground mb-4">Preview not available for this content type.</p>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm">
          <Download className="h-4 w-4" />
          Download / Open
        </a>
      )}
    </div>
  );
}

export default function LmsContentViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [content, setContent] = useState<LmsContent | null>(null);
  const [related, setRelated] = useState<LmsContent[]>([]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const h = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      setError('');

      try {
        // Fetch content detail
        const res = await fetch(`/api/v1/lms-content/${id}`, { headers: h() });
        if (!res.ok) {
          setError(res.status === 404 ? 'Content not found.' : 'Failed to load content.');
          setLoading(false);
          return;
        }
        const data: LmsContent = await res.json();
        setContent(data);

        // Get signed URL if there's a fileUrl stored in MinIO
        if (data.fileUrl && !data.fileUrl.startsWith('http://') && !data.fileUrl.startsWith('https://')) {
          // It's a MinIO object key — get signed URL
          const sigRes = await fetch(`/api/v1/files/${encodeURIComponent(data.fileUrl)}`, { headers: h() });
          if (sigRes.ok) {
            const sigData = await sigRes.json();
            setSignedUrl(sigData.signedUrl ?? null);
          }
        } else if (data.fileUrl) {
          setSignedUrl(data.fileUrl);
        }

        // Fetch related content from same subject
        if (data.subject?.id) {
          const relRes = await fetch(`/api/v1/lms-content?subjectId=${data.subject.id}`, { headers: h() });
          if (relRes.ok) {
            const relData: LmsContent[] = await relRes.json();
            setRelated(relData.filter(r => r.id !== id).slice(0, 5));
          }
        }
      } catch {
        setError('Network error.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading content...
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error || 'Content not found.'}</p>
        <Link href="/lms" className="text-primary hover:underline text-sm">Back to Library</Link>
      </div>
    );
  }

  const TypeIcon = typeIcons[content.type] ?? FileText;
  const downloadUrl = signedUrl || content.fileUrl || content.externalUrl || '';

  return (
    <div>
      {/* Back nav */}
      <Link href="/lms" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-start gap-3 mb-3">
              <span className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 ${typeColors[content.type] || 'bg-gray-100 text-gray-700'}`}>
                <TypeIcon className="h-3.5 w-3.5" />
                {content.type}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded font-medium ${content.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {content.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>

            <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
            {content.description && (
              <p className="text-muted-foreground">{content.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              {content.subject && (
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-medium truncate">{content.subject.name}</span>
                </div>
              )}
              {content.class && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Class:</span>
                  <span className="font-medium">{content.class.name}</span>
                </div>
              )}
              {content.uploader && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{content.uploader.firstName} {content.uploader.lastName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{formatDate(content.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Viewer */}
          <ContentViewer content={content} signedUrl={signedUrl} />

          {/* Download button */}
          {downloadUrl && content.type !== 'LINK' && (
            <div className="flex justify-end">
              <a
                href={downloadUrl}
                download={content.title}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          )}
        </div>

        {/* ── Related content sidebar ── */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-3 text-sm">
              {content.subject ? `More from ${content.subject.name}` : 'Related Content'}
            </h3>

            {related.length === 0 ? (
              <p className="text-sm text-muted-foreground">No related content found.</p>
            ) : (
              <div className="space-y-2">
                {related.map(r => {
                  const RIcon = typeIcons[r.type] ?? FileText;
                  return (
                    <Link
                      key={r.id}
                      href={`/lms/${r.id}`}
                      className="flex items-start gap-3 p-2.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className={`mt-0.5 p-1.5 rounded text-xs ${typeColors[r.type] || 'bg-gray-100'}`}>
                        <RIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.type} · {formatDate(r.createdAt)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold mb-3 text-sm">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {content.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-muted rounded text-xs">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
