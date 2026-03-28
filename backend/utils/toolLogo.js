const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
};

const extractTwitterHandle = (value) => {
  if (!value) return null;
  const str = String(value).trim();

  const urlMatch = str.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
  if (urlMatch?.[1]) return urlMatch[1];

  const plain = str.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
  return plain || null;
};

const deriveToolLogo = (tool = {}) => {
  if (tool.logoUrl) {
    return { logoUrl: tool.logoUrl, logoSource: tool.logoSource || 'stored-logo-url' };
  }

  if (tool.logo) {
    return { logoUrl: tool.logo, logoSource: 'stored-logo' };
  }

  const twitterHandle = extractTwitterHandle(tool.twitter || tool?.builder?.twitter || tool?.builder?.handle);
  if (twitterHandle) {
    return {
      logoUrl: `https://unavatar.io/twitter/${twitterHandle}?fallback=false`,
      logoSource: 'unavatar-twitter'
    };
  }

  const domain = getDomain(tool.url || '');
  if (domain) {
    return {
      logoUrl: `https://logo.clearbit.com/${domain}?size=128`,
      logoSource: 'clearbit-domain'
    };
  }

  return { logoUrl: '', logoSource: 'none' };
};

module.exports = {
  deriveToolLogo,
  extractTwitterHandle,
  getDomain,
};
