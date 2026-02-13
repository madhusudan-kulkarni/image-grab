export function formatFilename(
  template: string,
  options: {
    originalName: string;
    ext: string;
    domain: string;
    timestamp: string;
    index: number;
  }
): string {
  const { originalName, ext, domain, timestamp, index } = options;
  
  return template
    .replace(/\$\{original_name\}/g, originalName)
    .replace(/\$\{ext\}/g, ext)
    .replace(/\$\{domain\}/g, domain)
    .replace(/\$\{timestamp\}/g, timestamp)
    .replace(/\$\{index\}/g, String(index));
}

export function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.split('?')[0]?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    return validExtensions.includes(ext || '') ? ext || 'jpg' : 'jpg';
  } catch {
    return 'jpg';
  }
}

export function getOriginalName(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split('/').pop() || 'image';
    return filename.split('.')[0] || 'image';
  } catch {
    return 'image';
  }
}
