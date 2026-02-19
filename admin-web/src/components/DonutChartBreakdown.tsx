import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export interface BreakdownItem {
  name: string;
  value: number;
}

interface DonutChartBreakdownProps {
  data: BreakdownItem[];
  centerLabel: string;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  'rgba(255, 193, 7, 0.85)',
  'rgba(147, 112, 219, 0.75)',
  'rgba(100, 149, 237, 0.75)',
  'rgba(100, 116, 139, 0.7)',
  'rgba(34, 197, 94, 0.7)',
];

export default function DonutChartBreakdown({
  data,
  centerLabel,
  height = 280,
  colors = DEFAULT_COLORS,
}: DonutChartBreakdownProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="chart-container" style={{ minHeight: height, position: 'relative' }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} stroke="var(--lp-white)" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--lp-white)',
              border: '1px solid var(--lp-line)',
              borderRadius: 8,
            }}
            formatter={(value: number) =>
              [Number(value).toLocaleString('en-RW', { maximumFractionDigits: 0 }), '']
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(name, entry) =>
              `${name}${entry?.payload?.value != null ? ` (${Number(entry.payload.value).toLocaleString('en-RW', { maximumFractionDigits: 0 })})` : ''}`
            }
            iconType="square"
            iconSize={10}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--lp-text)' }}>
          {total.toLocaleString('en-RW', { maximumFractionDigits: 0 })}
        </span>
        <br />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lp-muted)', textTransform: 'uppercase' }}>
          {centerLabel}
        </span>
      </div>
    </div>
  );
}
