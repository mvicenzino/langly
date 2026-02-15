import { useState, useEffect, useCallback, useMemo } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { fetchDriveFiles } from '../../api/drive';
import type { DriveFile } from '../../types/drive';

const NEW_BABY_FOLDER = '1ivKb7bPE5TZLKIPfXmNE9YRGmc-kkrmF';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function UltrasoundWidget() {
  const [images, setImages] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDriveFiles(50, NEW_BABY_FOLDER, true);
      const imgs = res.files.filter((f) => f.mimeType.startsWith('image/'));
      setImages(imgs);
      setCurrent(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const prev = useCallback(() => {
    setCurrent((c) => (c > 0 ? c - 1 : images.length - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c < images.length - 1 ? c + 1 : 0));
  }, [images.length]);

  const currentImage = images[current];
  const thumbnailUrl = useMemo(
    () => currentImage ? `/api/drive/thumbnail/${currentImage.id}` : '',
    [currentImage],
  );

  return (
    <WidgetPanel
      title="Ultrasounds"
      accentColor="rose"
      insightPrompt="Carolyn is pregnant, due August 12, 2026. Review the ultrasound images in Google Drive and provide context about what ultrasounds typically show at different stages of pregnancy."
      icon={
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M8 21V7a2 2 0 012-2h4a2 2 0 012 2v14" />
          <circle cx="12" cy="11" r="2" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <span className="text-[10px] text-gray-500 font-mono">
            {images.length > 0 ? `${current + 1} / ${images.length}` : '0'}
          </span>
        )
      }
    >
      <div className="flex flex-col h-full">
        {/* ── Loading ──────────────────────────────────── */}
        {loading && (
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500/30 border-t-rose-400" />
          </div>
        )}

        {/* ── Error ────────────────────────────────────── */}
        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-[11px] text-red-400/80">{error}</p>
            <button
              onClick={load}
              className="text-[10px] text-rose-400/60 hover:text-rose-400 uppercase tracking-wider transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Empty ────────────────────────────────────── */}
        {!loading && !error && images.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-10">
            <p className="text-[11px] text-gray-600 uppercase tracking-wider">
              No ultrasound images
            </p>
          </div>
        )}

        {/* ── Carousel ─────────────────────────────────── */}
        {!loading && !error && images.length > 0 && currentImage && (
          <div className="flex flex-col h-full">
            {/* Main image area */}
            <div className="relative group">
              <a
                href={currentImage.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div
                  className="w-full overflow-hidden bg-black/40"
                  style={{ aspectRatio: '4/3' }}
                >
                  <img
                    src={thumbnailUrl}
                    alt={currentImage.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
              </a>

              {/* Left arrow */}
              {images.length > 1 && (
                <button
                  onClick={prev}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Right arrow */}
              {images.length > 1 && (
                <button
                  onClick={next}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* External link icon */}
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={currentImage.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-6 w-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  title="Open in Google Drive"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Caption */}
            <div className="px-3 py-2 border-b border-white/5">
              <div className="text-[11px] text-gray-200 truncate">{currentImage.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {currentImage.folder && (
                  <span className="text-[9px] text-rose-400/60 uppercase tracking-wider">
                    {currentImage.folder}
                  </span>
                )}
                <span className="text-[9px] text-gray-600 font-mono">
                  {formatDate(currentImage.modifiedTime)}
                </span>
              </div>
            </div>

            {/* Dot indicators */}
            {images.length > 1 && images.length <= 20 && (
              <div className="flex items-center justify-center gap-1 py-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`rounded-full transition-all ${
                      i === current
                        ? 'h-2 w-2 bg-rose-400'
                        : 'h-1.5 w-1.5 bg-white/15 hover:bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex-1 min-h-0 border-t border-white/5">
                <div className="flex gap-1.5 overflow-x-auto p-2 custom-scrollbar">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrent(i)}
                      className={`shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                        i === current
                          ? 'border-rose-500/60 ring-1 ring-rose-500/20'
                          : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                      style={{ width: 48, height: 36 }}
                    >
                      <img
                        src={`/api/drive/thumbnail/${img.id}`}
                        alt={img.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </WidgetPanel>
  );
}
