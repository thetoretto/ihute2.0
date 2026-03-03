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
import { formatRwf } from '@shared';

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
            tick={{ fontSize: 'var(--chart-tick-font-size)', fill: 'var(--lp-muted)' }}
            stroke="var(--lp-line)"
          />
          <YAxis
            tick={{ fontSize: 'var(--chart-tick-font-size-y)', fill: 'var(--lp-muted)' }}
            stroke="var(--lp-line)"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--lp-white)',
              border: '1px solid var(--lp-line)',
              borderRadius: 'var(--chart-tooltip-radius)',
            }}
            formatter={(value: number) => [formatRwf(value), '']}
            labelFormatter={(label) => label}
          />
          <Legend
            wrapperStyle={{ fontSize: 'var(--chart-legend-font-size)' }}
            formatter={() => 'Earnings'}
            iconType="square"
            iconSize={10}
          />
          <Bar
            dataKey="gross"
            name="Earnings"
            fill="var(--chart-bar-fill)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
