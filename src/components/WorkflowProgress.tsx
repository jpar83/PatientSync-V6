import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import type { Order } from '@/lib/types';
import workflowData from '../../schemas/workflow.json';

const allStages = workflowData.workflow.map(w => w.stage);

const stageColors = [
  '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8', '#60a5fa',
  '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'
];

const WorkflowProgress: React.FC<{ data: Order[] }> = ({ data }) => {
  const navigate = useNavigate();
  const counts = allStages.map(stage => {
    const count = data.filter(r => r.workflow_stage === stage).length;
    return { name: stage, count };
  }).filter(item => item.count > 0);

  const handleBarClick = (payload: any) => {
    if (payload && payload.activePayload && payload.activePayload.length > 0) {
      const stageName = payload.activePayload[0].payload.name;
      navigate(`/referrals?stage=${encodeURIComponent(stageName)}`);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-text mb-3">Workflow Pipeline</h3>
        {counts.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 text-center py-8">
              No active orders to display.
            </p>
        ) : (
            <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={counts} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }} onClick={handleBarClick}>
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
                        <Bar dataKey="count" name="Referrals" barSize={16}>
                            {counts.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={stageColors[index % stageColors.length]} className="cursor-pointer" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )}
    </div>
  );
};

export default WorkflowProgress;
