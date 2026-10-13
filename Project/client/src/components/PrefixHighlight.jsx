import React from 'react';

/**
 * Component to render text with the matching query prefix highlighted.
 * Elegant Indigo/Blue highlight with clean typography.
 */
export default function PrefixHighlight({ text, prefix }) {
  if (!text) return null;
  if (!prefix || !prefix.trim()) {
    return <span className="text-neutral-800 font-medium">{text}</span>;
  }

  const normalizedText = text.toLowerCase();
  const normalizedPrefix = prefix.toLowerCase().trim();

  if (normalizedText.startsWith(normalizedPrefix)) {
    const matchedPart = text.slice(0, normalizedPrefix.length);
    const remainingPart = text.slice(normalizedPrefix.length);

    return (
      <span className="font-normal tracking-tight text-neutral-900">
        <span className="bg-[#FFE600] text-black font-extrabold px-1.5 py-0.5 rounded-sm border border-black/40 shadow-[1px_1px_0px_0px_#000] text-[14px] inline-block mr-0.5">
          {matchedPart}
        </span>
        <span className="text-neutral-800 font-semibold">{remainingPart}</span>
      </span>
    );
  }

  return <span className="text-neutral-800 font-medium">{text}</span>;
}
