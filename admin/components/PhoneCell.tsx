"use client";
import { useState } from "react";
import { MessageCircle, Copy, Check } from "lucide-react";

export default function PhoneCell({ phone }: { phone?: string }) {
  const [copied, setCopied] = useState(false);

  if (!phone) return <span className="text-gray-600 text-sm">—</span>;

  const waLink = `https://wa.me/91${phone}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
        title="Open in WhatsApp"
      >
        <MessageCircle size={13} />
        {phone}
      </a>
      <button
        onClick={handleCopy}
        title="Copy number"
        className="text-gray-500 hover:text-white transition-colors"
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      </button>
    </div>
  );
}
