import React from 'react';

interface BackendSupportProps {
  interpreter?: 'full' | 'partial' | 'no';
  jit?: 'full' | 'partial' | 'no';
  nativeJit?: 'full' | 'partial' | 'no';
  aot?: 'full' | 'partial' | 'no';
  wasm?: 'full' | 'partial' | 'no';
}

const badgeMap = {
  full: { text: 'Full', bg: '#d1fae5', color: '#065f46' },
  partial: { text: 'Partial', bg: '#fef3c7', color: '#92400e' },
  no: { text: 'No', bg: '#fee2e2', color: '#991b1b' },
};

export default function BackendSupport({
  interpreter = 'full',
  jit,
  nativeJit = 'partial',
  aot = 'partial',
  wasm = 'partial',
}: BackendSupportProps) {
  const jitStatus = jit ?? nativeJit;
  const backends = [
    { name: 'Interpreter', status: interpreter },
    { name: 'JIT Compiler', status: jitStatus },
    { name: 'AOT (Native)', status: aot },
    { name: 'WASM', status: wasm },
  ];

  return (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--ifm-color-emphasis-100)' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Execution Backend</th>
            <th style={{ padding: '8px 12px', textAlign: 'center' }}>Support Status</th>
          </tr>
        </thead>
        <tbody>
          {backends.map((b) => {
            const badge = badgeMap[b.status];
            return (
              <tr key={b.name} style={{ borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 500 }}>{b.name}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85em',
                      fontWeight: 600,
                      backgroundColor: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.text}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
