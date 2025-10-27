import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StoplightDonutChartProps {
  data: {
    green: number;
    yellow: number;
    red: number;
  };
}

const COLORS = {
  green: '#22c55e',
  yellow: '#facc15',
  red: '#ef4444',
};

const StoplightDonutChart: React.FC<StoplightDonutChartProps> = ({ data }) => {
  const chartData = [
    { name: 'Green', value: data.green },
    { name: 'Yellow', value: data.yellow },
    { name: 'Red', value: data.red },
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return <p className="text-center text-sm text-muted py-8">No data to display.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            borderRadius: '0.75rem',
          }}
        />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default StoplightDonutChart;
