import React, { useMemo, useState, useEffect } from 'react';

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

export default function ToolLogo({
  tool,
  className = 'w-full h-full',
  imageClassName = 'w-full h-full object-contain',
  fallbackClassName = 'w-full h-full bg-slate-900 text-white rounded-[inherit] flex items-center justify-center font-black text-xl',
}) {
  const [fallbackIdx, setFallbackIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFallbackIdx(0);
    setFailed(false);
  }, [tool?.id, tool?._id, tool?.name, tool?.logoUrl, tool?.logo, tool?.url, tool?.twitter, tool?.builder?.twitter, tool?.builder?.handle]);

  const sources = useMemo(() => {
    const domain = tool?.url ? getDomain(tool.url) : null;
    const twitterHandle = extractTwitterHandle(tool?.twitter || tool?.builder?.twitter || tool?.builder?.handle);

    const list = [
      tool?.logoUrl,
      tool?.logo,
      twitterHandle ? `https://unavatar.io/twitter/${twitterHandle}?fallback=false` : null,
      domain ? `https://logo.clearbit.com/${domain}?size=128` : null,
      domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
    ].filter(Boolean);

    return [...new Set(list)];
  }, [tool]);

  const currentSrc = sources[fallbackIdx];

  if (!currentSrc || failed) {
    return (
      <div className={className}>
        <div className={fallbackClassName}>{tool?.name?.charAt(0)?.toUpperCase() || '?'}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={currentSrc}
        alt={tool?.name || 'Tool logo'}
        className={imageClassName}
        onError={() => {
          if (fallbackIdx + 1 < sources.length) {
            setFallbackIdx((prev) => prev + 1);
          } else {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}
