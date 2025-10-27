import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Order } from '@/lib/types';
import workflowData from '../../schemas/workflow.json';

const allStages = workflowData.workflow.map(w => w.stage);

const stageColors = [
  '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8', '#60a5fa',
  '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'
];

interface StageDistributionChartProps {
  orders: Order[];
}

const StageDistributionChart: React.FC<StageDistributionChartProps> = ({ orders }) => {
  const stageCounts = allStages.map(stage => {
    const count = orders.filter(o => o.workflow_stage === stage).length;
    return { name: stage, count };
  }).filter(item => item.count > 0); // Only show stages with active orders

  if (orders.length === 0) {
    return <p className="text-center text-sm text-muted py-8">No active orders to display.</p>;
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stageCounts} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
          <XAxis type="number" stroke="var(--color-muted)" fontSize={12} allowDecimals={false} />
          <YAxis type="category" dataKey="name" stroke="var(--color-muted)" fontSize={12} width={150} tick={{ width: 150, textAnchor: 'start' }} dx={-155} />
          <Tooltip
            cursor={{ fill: 'rgba(200, 200, 200, 0.1)' }}
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
          <Bar dataKey="count" name="Referrals" barSize={20}>
            {stageCounts.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={stageColors[index % stageColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StageDistributionChart;
