'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getAdminToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;)\s*sf-admin-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

interface PublishToggleProps {
  enabled: boolean;
  onChange?: (enabled: boolean) => void;
}

export function PublishToggle({ enabled, onChange }: PublishToggleProps) {
  const [value, setValue] = useState(enabled);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    const next = !value;
    setValue(next);
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/forge-shadowfeed/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-sf-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ publishEnabled: next }),
      });

      if (!res.ok) {
        // revert on failure
        setValue(!next);
        return;
      }

      onChange?.(next);
    } catch {
      setValue(!next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-[#808080] text-xs font-mono uppercase tracking-wider">
        AUTO-PUBLISH
      </span>
      <button
        onClick={handleToggle}
        disabled={saving}
        className={`relative w-10 h-5 rounded-full border transition-colors duration-200 disabled:opacity-50 ${
          value
            ? 'bg-[#8a00c4] border-[#8a00c4]'
            : 'bg-[#1e1e1e] border-[#2a2a2a]'
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span
        className={`text-xs font-mono ${value ? 'text-[#4ade80]' : 'text-[#808080]'}`}
      >
        {value ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
