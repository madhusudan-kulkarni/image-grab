import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';

type ImageInfo = {
  src: string;
  originalName: string;
  ext: string;
  width: number;
  height: number;
};

type BatchModalProps = {
  isOpen: boolean;
  images: ImageInfo[];
  onClose: () => void;
  onDownloadSelected: (images: ImageInfo[]) => Promise<void>;
};

export default function BatchModal({ isOpen, images, onClose, onDownloadSelected }: BatchModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(images.map((img) => img.src)));
    }
  }, [isOpen, images]);

  const selectedCount = selected.size;

  const selectedImages = useMemo(
    () => images.filter((img) => selected.has(img.src)),
    [images, selected],
  );

  const toggleAll = () => {
    if (selectedCount === images.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(images.map((img) => img.src)));
  };

  const toggleOne = (src: string) => {
    const next = new Set(selected);
    if (next.has(src)) next.delete(src);
    else next.add(src);
    setSelected(next);
  };

  const startDownload = async () => {
    if (!selectedImages.length) return;
    setDownloading(true);
    await onDownloadSelected(selectedImages);
    setDownloading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>Batch Download Images ({images.length})</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.controlRow}>
          <button onClick={toggleAll} style={styles.textBtn}>
            {selectedCount === images.length ? 'Select None' : 'Select All'}
          </button>
          <span style={styles.metaText}>{selectedCount} selected</span>
        </div>

        <div style={styles.gridWrap}>
          {!images.length ? (
            <div style={styles.empty}>No images found on this page.</div>
          ) : (
            <div style={styles.grid}>
              {images.map((img) => {
                const checked = selected.has(img.src);
                return (
                  <label key={img.src} style={{ ...styles.tile, borderColor: checked ? '#2563eb' : '#d1d5db' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleOne(img.src)} />
                    <img src={img.src} alt={img.originalName} style={styles.thumb} />
                    <span style={styles.dim}>{img.width}x{img.height}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.footerRow}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={startDownload} disabled={!selectedCount || downloading} style={styles.downloadBtn}>
            {downloading ? 'Downloading...' : `Download ${selectedCount}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.62)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2147483647,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
  card: {
    width: '92%',
    maxWidth: '900px',
    maxHeight: '88vh',
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: { margin: 0, fontSize: '18px', color: '#111827' },
  closeBtn: { background: 'transparent', border: 0, fontSize: '24px', cursor: 'pointer', color: '#6b7280' },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  textBtn: { background: 'transparent', border: 0, cursor: 'pointer', color: '#1d4ed8', fontWeight: 600 },
  metaText: { color: '#6b7280', fontSize: '13px' },
  gridWrap: { padding: '14px 20px', overflow: 'auto', flex: 1 },
  empty: { textAlign: 'center', color: '#6b7280', padding: '28px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '12px' },
  tile: {
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    cursor: 'pointer',
  },
  thumb: { width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' },
  dim: { fontSize: '11px', color: '#6b7280' },
  footerRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    borderTop: '1px solid #e5e7eb',
    padding: '12px 20px',
  },
  cancelBtn: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' },
  downloadBtn: {
    border: 0,
    background: '#2563eb',
    color: '#fff',
    borderRadius: '6px',
    padding: '8px 14px',
    cursor: 'pointer',
  },
};
