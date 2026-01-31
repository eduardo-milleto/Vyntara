const { config } = require('./config');

function isAllowedUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (config.safety.allowlistDomains.length === 0) return true;
    return config.safety.allowlistDomains.some(d => u.hostname.includes(d));
  } catch {
    return false;
  }
}

async function fetchPageText(url) {
  if (!config.fetch.enabled) return null;
  if (!isAllowedUrl(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.fetch.timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'user-agent': 'VyntaraOSINTBot/1.0 (public-info; no-personal-data-collection)'
      }
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    const text = await res.text();
    
    if (text.length > config.fetch.maxBytes) {
      return cleanHtml(text.slice(0, config.fetch.maxBytes));
    }

    return cleanHtml(text);
  } catch (error) {
    console.log(`[Vyntara] Falha ao buscar ${url}: ${error.message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function cleanHtml(text) {
  const noScript = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const noStyle = noScript.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const noTags = noStyle.replace(/<[^>]+>/g, ' ');
  const normalized = noTags.replace(/\s+/g, ' ').trim();

  if (normalized.length < 300) return null;
  return normalized.slice(0, 12000);
}

module.exports = { fetchPageText };
