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
  'var(--chart-donut-1)',
  'var(--chart-donut-2)',
  'var(--chart-donut-3)',
  'var(--chart-donut-4)',
  'var(--chart-donut-5)',
];

export default function DonutChartBreakdown({
  data,
  centerLabel,
  height = 280,
  colors = DEFAULT_COLORS,
}: DonutChartBreakdownProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="chart-container chart-container--donut" style={{ minHeight: height }}>
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
              borderRadius: 'var(--chart-tooltip-radius)',
            }}
            formatter={(value: number) =>
              [Number(value).toLocaleString('en-RW', { maximumFractionDigits: 0 }), '']
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 'var(--chart-legend-font-size)' }}
            formatter={(name, entry) =>
              `${name}${entry?.payload?.value != null ? ` (${Number(entry.payload.value).toLocaleString('en-RW', { maximumFractionDigits: 0 })})` : ''}`
            }
            iconType="square"
            iconSize={10}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <span className="donut-center-value">
          {total.toLocaleString('en-RW', { maximumFractionDigits: 0 })}
        </span>
        <br />
        <span className="donut-center-label">{centerLabel}</span>
      </div>
    </div>
  );
}
