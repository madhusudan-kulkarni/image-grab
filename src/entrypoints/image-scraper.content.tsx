import { createRoot } from 'react-dom/client';
import BatchModal from '../components/BatchModal';

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
        const root = createRoot(container);

        const render = (isOpen: boolean) => {
          const images = isOpen ? scrapeImages() : [];

          root.render(
            <BatchModal
              isOpen={isOpen}
              images={images}
              onClose={() => render(false)}
              onDownloadSelected={async (selected) => {
                await browser.runtime.sendMessage({ type: 'download-batch', images: selected });
                render(false);
              }}
            />,
          );
        };

        render(false);

        browser.runtime.onMessage.addListener((message) => {
          if (message.type === 'open-batch-modal') {
            render(true);
          }
          if (message.type === 'settings-updated') {
            browser.runtime.sendMessage({ type: 'get-settings' }).then((next) => {
              settings.hoverOverlayEnabled = Boolean(next.hoverOverlayEnabled);
            });
          }
        });

        return root;
      },
      onRemove: (root) => root?.unmount(),
    });

    if (settings.hoverOverlayEnabled) {
      injectHoverSaveButtons();
    }

    ctx.addEventListener('unload', () => ui.hide());
  },
});

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
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
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
