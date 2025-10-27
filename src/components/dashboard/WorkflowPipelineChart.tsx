import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Order } from '@/lib/types';
import workflowData from '../../../schemas/workflow.json';
import { useNavigate } from 'react-router-dom';

const allStages = workflowData.workflow.map(w => w.stage);

const stageColors = [
  '#0d9488', '#2563eb', '#9333ea', '#c026d3', '#e11d48',
  '#f97316', '#ca8a04', '#16a34a', '#0ea5e9', '#475569',
];

const CustomTooltip = ({ active, payload, total, hoveredStage }: any) => {
  if (active && payload && payload.length && hoveredStage) {
    const data = payload.find((p: any) => p.name === hoveredStage);
    if (!data) return null;

    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
    return (
      <div className="bg-surface p-2 rounded-lg shadow-lg border border-border-color">
        <p className="font-semibold text-sm text-text">{data.name}</p>
        <p className="text-xs text-muted">
          Referrals: <span className="font-bold text-text">{data.value}</span> ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const WorkflowPipelineChart: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const navigate = useNavigate();
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const stageCounts = useMemo(() => {
    return allStages.map(stage => ({
      name: stage,
      count: orders.filter(o => o.workflow_stage === stage).length,
    }));
  }, [orders]);

  const total = orders.length;

  if (total === 0) {
    return <p className="text-center text-sm text-muted py-8">No active orders to display in pipeline.</p>;
  }

  const chartData = [{ name: 'Pipeline', ...stageCounts.reduce((acc, stage) => ({ ...acc, [stage.name]: stage.count }), {}) }];
  const visibleStages = stageCounts.filter(s => s.count > 0);

  const handleBarClick = (stageName: string) => {
    navigate(`/referrals?stage=${encodeURIComponent(stageName)}`);
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={40}>
        <BarChart
          data={chartData}
          layout="vertical"
          barCategoryGap={0}
          onMouseLeave={() => setHoveredStage(null)}
        >
          <XAxis type="number" hide domain={[0, total]} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={<CustomTooltip total={total} hoveredStage={hoveredStage} />}
            isAnimationActive={false}
          />
          {visibleStages.map((stage, index) => (
            <Bar 
                key={stage.name} 
                dataKey={stage.name} 
                stackId="a" 
                fill={stageColors[allStages.indexOf(stage.name) % stageColors.length]} 
                name={stage.name}
                radius={
                    visibleStages.length === 1 ? [5, 5, 5, 5] :
                    index === 0 ? [5, 0, 0, 5] : 
                    index === visibleStages.length - 1 ? [0, 5, 5, 0] : 0
                } 
                onMouseEnter={() => setHoveredStage(stage.name)}
                onClick={() => handleBarClick(stage.name)}
                className="cursor-pointer"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 text-xs">
        {visibleStages.map((stage) => (
          <button 
            key={stage.name} 
            className="flex items-center gap-1.5 group"
            onClick={() => handleBarClick(stage.name)}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageColors[allStages.indexOf(stage.name) % stageColors.length] }} />
            <span className="text-muted group-hover:text-text">{stage.name} ({stage.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WorkflowPipelineChart;
