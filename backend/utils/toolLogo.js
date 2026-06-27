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

  const domain = getDomain(tool.url || '');
  if (domain) {
    return {
      logoUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      logoSource: 'google-favicon'
    };
  }

  const twitterHandle = extractTwitterHandle(tool.twitter || tool?.builder?.twitter || tool?.builder?.handle);
  if (twitterHandle) {
    return {
      logoUrl: `https://unavatar.io/twitter/${twitterHandle}`,
      logoSource: 'unavatar-twitter'
    };
  }

  return { logoUrl: '', logoSource: 'none' };
};

module.exports = {
  deriveToolLogo,
  extractTwitterHandle,
  getDomain,
};
