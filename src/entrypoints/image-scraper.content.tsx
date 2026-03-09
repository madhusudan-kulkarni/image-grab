type ScrapedImage = {
  src: string;
  originalName: string;
  ext: string;
  width: number;
  height: number;
};

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const settings = {
      hoverOverlayEnabled: true,
    };

    try {
      const fromBg = await browser.runtime.sendMessage({ type: 'get-settings' });
      settings.hoverOverlayEnabled = Boolean(fromBg.hoverOverlayEnabled);
    } catch {
      // ignore
    }

    const ui = await createShadowRootUi(ctx, {
      name: 'fast-save-image-batch-ui',
      position: 'inline',
      anchor: 'html',
      onMount: (container) => {
        const modal = createBatchModal(container, async (selected) => {
          await browser.runtime.sendMessage({ type: 'download-batch', images: selected });
          modal.close();
        });

        const onMessage = (message: { type?: string }) => {
          if (message.type === 'open-batch-modal') {
            modal.open(scrapeImages());
          }
          if (message.type === 'settings-updated') {
            browser.runtime.sendMessage({ type: 'get-settings' }).then((next) => {
              settings.hoverOverlayEnabled = Boolean(next.hoverOverlayEnabled);
            });
          }
        };

        browser.runtime.onMessage.addListener(onMessage);

        return { modal, onMessage };
      },
      onRemove: (mounted) => {
        if (!mounted) return;
        browser.runtime.onMessage.removeListener(mounted.onMessage);
        mounted.modal.destroy();
      },
    });

    ui.mount();

    if (settings.hoverOverlayEnabled) {
      injectHoverSaveButtons();
    }

  },
});

function createBatchModal(root: HTMLElement, onDownloadSelected: (images: ScrapedImage[]) => Promise<void>) {
  const backdrop = document.createElement('div');
  const card = document.createElement('div');
  const title = document.createElement('h2');
  const closeBtn = document.createElement('button');
  const selectAllBtn = document.createElement('button');
  const selectedInfo = document.createElement('span');
  const gridWrap = document.createElement('div');
  const grid = document.createElement('div');
  const empty = document.createElement('div');
  const cancelBtn = document.createElement('button');
  const downloadBtn = document.createElement('button');

  let images: ScrapedImage[] = [];
  let selected = new Set<string>();
  let downloading = false;

  Object.assign(backdrop.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.62)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '2147483647',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  });

  Object.assign(card.style, {
    width: '92%',
    maxWidth: '900px',
    maxHeight: '88vh',
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  });

  const headerRow = document.createElement('div');
  Object.assign(headerRow.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  });

  Object.assign(title.style, { margin: '0', fontSize: '18px', color: '#111827' });
  Object.assign(closeBtn.style, {
    background: 'transparent',
    border: '0',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  });
  closeBtn.textContent = 'x';

  const controlRow = document.createElement('div');
  Object.assign(controlRow.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    borderBottom: '1px solid #e5e7eb',
  });

  Object.assign(selectAllBtn.style, {
    background: 'transparent',
    border: '0',
    cursor: 'pointer',
    color: '#1d4ed8',
    fontWeight: '600',
  });
  Object.assign(selectedInfo.style, { color: '#6b7280', fontSize: '13px' });

  Object.assign(gridWrap.style, {
    padding: '14px 20px',
    overflow: 'auto',
    flex: '1',
  });

  Object.assign(empty.style, {
    textAlign: 'center',
    color: '#6b7280',
    padding: '28px 0',
  });
  empty.textContent = 'No images found on this page.';

  Object.assign(grid.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
    gap: '12px',
  });

  const footerRow = document.createElement('div');
  Object.assign(footerRow.style, {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    borderTop: '1px solid #e5e7eb',
    padding: '12px 20px',
  });

  Object.assign(cancelBtn.style, {
    border: '1px solid #cbd5e1',
    background: '#fff',
    borderRadius: '6px',
    padding: '8px 14px',
    cursor: 'pointer',
  });
  cancelBtn.textContent = 'Cancel';

  Object.assign(downloadBtn.style, {
    border: '0',
    background: '#2563eb',
    color: '#fff',
    borderRadius: '6px',
    padding: '8px 14px',
    cursor: 'pointer',
  });

  const close = () => {
    backdrop.style.display = 'none';
  };

  const refreshHeader = () => {
    title.textContent = `Batch Download Images (${images.length})`;
    selectedInfo.textContent = `${selected.size} selected`;
    selectAllBtn.textContent = selected.size === images.length ? 'Select None' : 'Select All';
    downloadBtn.textContent = downloading ? 'Downloading...' : `Download ${selected.size}`;
    downloadBtn.disabled = selected.size === 0 || downloading;
  };

  const toggleOne = (src: string) => {
    if (selected.has(src)) {
      selected.delete(src);
    } else {
      selected.add(src);
    }
    renderGrid();
  };

  const renderGrid = () => {
    grid.replaceChildren();
    if (!images.length) {
      gridWrap.replaceChildren(empty);
      refreshHeader();
      return;
    }

    for (const img of images) {
      const checked = selected.has(img.src);
      const tile = document.createElement('label');
      Object.assign(tile.style, {
        border: `2px solid ${checked ? '#2563eb' : '#d1d5db'}`,
        borderRadius: '8px',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: 'pointer',
      });

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = checked;
      checkbox.addEventListener('change', () => toggleOne(img.src));

      const thumb = document.createElement('img');
      thumb.src = img.src;
      thumb.alt = img.originalName;
      Object.assign(thumb.style, {
        width: '100%',
        height: '110px',
        objectFit: 'cover',
        borderRadius: '6px',
      });

      const dim = document.createElement('span');
      dim.textContent = `${img.width}x${img.height}`;
      Object.assign(dim.style, { fontSize: '11px', color: '#6b7280' });

      tile.append(checkbox, thumb, dim);
      grid.appendChild(tile);
    }

    gridWrap.replaceChildren(grid);
    refreshHeader();
  };

  const open = (nextImages: ScrapedImage[]) => {
    images = nextImages;
    selected = new Set(images.map((img) => img.src));
    downloading = false;
    backdrop.style.display = 'flex';
    renderGrid();
  };

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });

  selectAllBtn.addEventListener('click', () => {
    if (selected.size === images.length) {
      selected = new Set();
    } else {
      selected = new Set(images.map((img) => img.src));
    }
    renderGrid();
  });

  downloadBtn.addEventListener('click', async () => {
    if (downloading || selected.size === 0) return;
    downloading = true;
    refreshHeader();
    try {
      const selectedImages = images.filter((img) => selected.has(img.src));
      await onDownloadSelected(selectedImages);
    } finally {
      downloading = false;
      refreshHeader();
    }
  });

  headerRow.append(title, closeBtn);
  controlRow.append(selectAllBtn, selectedInfo);
  footerRow.append(cancelBtn, downloadBtn);
  card.append(headerRow, controlRow, gridWrap, footerRow);
  backdrop.appendChild(card);
  root.appendChild(backdrop);

  return {
    open,
    close,
    destroy: () => backdrop.remove(),
  };
}

function scrapeImages(): ScrapedImage[] {
  const results: ScrapedImage[] = [];
  const seen = new Set<string>();
  const minPx = 50;

  const addImage = (src: string, width: number, height: number) => {
    if (!src || src.startsWith('data:') || seen.has(src)) return;
    if (width < minPx || height < minPx) return;

    seen.add(src);

    let href = src;
    try {
      href = new URL(src, window.location.href).href;
    } catch {
      // keep raw src
    }

    let originalName = 'image';
    let ext = 'jpg';
    try {
      const url = new URL(href);
      originalName = url.pathname.split('/').pop()?.split('.')[0] || 'image';
      ext = url.pathname.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    } catch {
      // keep defaults
    }

    results.push({ src: href, originalName, ext, width, height });
  };

  const parseSrcset = (value: string) => value.split(',').map((part) => part.trim().split(' ')[0]).filter(Boolean);

  document.querySelectorAll('img').forEach((img) => {
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    const srcCandidates = [img.currentSrc, img.src, img.dataset.src, img.dataset.lazySrc, img.dataset.originalSrc].filter(Boolean) as string[];

    srcCandidates.forEach((src) => addImage(src, width, height));

    const srcset = img.getAttribute('srcset') || '';
    parseSrcset(srcset).forEach((src) => addImage(src, width, height));
  });

  document.querySelectorAll('source[srcset]').forEach((source) => {
    const srcset = source.getAttribute('srcset') || '';
    parseSrcset(srcset).forEach((src) => addImage(src, 999, 999));
  });

  document.querySelectorAll('*').forEach((el) => {
    const style = getComputedStyle(el);
    const bg = style.backgroundImage;
    const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (!match?.[1]) return;

    const rect = el.getBoundingClientRect();
    addImage(match[1], Math.floor(rect.width), Math.floor(rect.height));
  });

  return results;
}

function injectHoverSaveButtons() {
  const styleId = 'fast-save-hover-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      '.fs-hover-wrap{position:relative!important;display:inline-block!important}.fs-hover-btn{position:absolute;top:8px;right:8px;width:30px;height:30px;border:none;border-radius:6px;background:rgba(0,0,0,.65);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;z-index:2147483647}.fs-hover-wrap:hover .fs-hover-btn{opacity:1}.fs-hover-btn svg{width:16px;height:16px;fill:#fff}';
    document.head.appendChild(style);
  }

  const process = (img: HTMLImageElement) => {
    if (img.dataset.fsHoverAdded) return;
    if ((img.naturalWidth || img.width) < 150 || (img.naturalHeight || img.height) < 150) return;

    const parent = img.parentElement;
    if (!parent) return;

    img.dataset.fsHoverAdded = '1';

    const wrapper = document.createElement('span');
    wrapper.className = 'fs-hover-wrap';
    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    const btn = document.createElement('button');
    btn.className = 'fs-hover-btn';
    btn.title = 'Save Image';
    btn.appendChild(createDownloadIcon());
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const src = img.currentSrc || img.src || img.dataset.src || img.dataset.lazySrc;
      if (!src || src.startsWith('data:')) return;
      await browser.runtime.sendMessage({ type: 'download-image', src });
    });

    wrapper.appendChild(btn);
  };

  document.querySelectorAll('img').forEach(process);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLImageElement) process(node);
        if (node instanceof Element) node.querySelectorAll('img').forEach(process);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function createDownloadIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z');

  svg.appendChild(path);
  return svg;
}
