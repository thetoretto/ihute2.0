import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface TrendDataPoint {
  period: string;
  gross: number;
  commission: number;
  net: number;
}

interface BarChartTrendProps {
  data: TrendDataPoint[];
  height?: number;
}

const formatRwf = (n: number) =>
  `${Number(n).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`;

export default function BarChartTrend({ data, height = 280 }: BarChartTrendProps) {
  const chartData = data.map((d) => ({
    name: d.period.length > 10 ? d.period.slice(0, 7) : d.period,
    gross: d.gross,
    net: d.net,
  }));

  return (
    <div className="chart-container" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--lp-line-soft)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: 'var(--lp-muted)' }}
            stroke="var(--lp-line)"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--lp-muted)' }}
            stroke="var(--lp-line)"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--lp-white)',
              border: '1px solid var(--lp-line)',
              borderRadius: 8,
            }}
            formatter={(value: number) => [formatRwf(value), '']}
            labelFormatter={(label) => label}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={() => 'Earnings'}
            iconType="square"
            iconSize={10}
          />
          <Bar
            dataKey="gross"
            name="Earnings"
            fill="rgba(100, 149, 237, 0.7)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
