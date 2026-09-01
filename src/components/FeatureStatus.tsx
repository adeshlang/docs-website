import React from 'react';

export type StatusType = 'STABLE' | 'BETA' | 'EXPERIMENTAL' | 'PARTIAL' | 'INTERNAL' | 'PLANNED' | 'UNSUPPORTED';

interface Props {
  status: StatusType;
  details?: string;
}

const colorMap: Record<StatusType, { bg: string; text: string; border: string }> = {
  STABLE: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
  BETA: { bg: '#e0f2fe', text: '#075985', border: '#0284c7' },
  EXPERIMENTAL: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  PARTIAL: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
  INTERNAL: { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' },
  PLANNED: { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' },
  UNSUPPORTED: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
};

export default function FeatureStatus({ status, details }: Props) {
  const style = colorMap[status] || colorMap.PLANNED;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.85em',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        marginBottom: '8px',
      }}
    >
      <span>●</span> {status}
      {details && <span style={{ opacity: 0.85, fontWeight: 400 }}>({details})</span>}
    </span>
  );
}
