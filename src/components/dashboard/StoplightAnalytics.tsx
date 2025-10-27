import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../ui/EmptyState';

interface StoplightAnalyticsProps {
  counts: {
    green: number;
    yellow: number;
    red: number;
  };
}

const COLORS = {
  green: '#22c55e',
  yellow: '#f59e0b', // amber-500 for better contrast
  red: '#ef4444',
};

const CustomTooltip = ({ active, payload, total, hoveredStage }: any) => {
  if (active && payload && payload.length && hoveredStage) {
    const data = payload.find((p: any) => p.dataKey === hoveredStage);
    if (!data) return null;

    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(0) : 0;
    const stageName = (hoveredStage as string).charAt(0).toUpperCase() + (hoveredStage as string).slice(1);

    return (
      <div className="bg-surface p-2 rounded-lg shadow-lg border border-border-color">
        <p className="font-semibold text-sm text-text capitalize">{stageName}</p>
        <p className="text-xs text-muted">
          Referrals: <span className="font-bold text-text">{data.value}</span> ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const StoplightAnalytics: React.FC<StoplightAnalyticsProps> = ({ counts }) => {
  const navigate = useNavigate();
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const total = useMemo(() => counts.green + counts.yellow + counts.red, [counts]);
  const chartData = useMemo(() => [{ name: 'Stoplight', ...counts }], [counts]);

  const handleBarClick = (stageName: 'green' | 'yellow' | 'red') => {
    navigate(`/referrals?stoplight_status=${stageName}`);
  };

  if (total === 0) {
    return <EmptyState title="No Data" message="No referrals with stoplight status in this period." />;
  }
  
  const visibleStatuses = (['green', 'yellow', 'red'] as const).filter(status => counts[status] > 0);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={20}>
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
            position={{ y: -40 }}
          />
          {visibleStatuses.map((status, index) => (
            <Bar
              key={status}
              dataKey={status}
              stackId="a"
              fill={COLORS[status]}
              onMouseEnter={() => setHoveredStage(status)}
              onClick={() => handleBarClick(status)}
              className="cursor-pointer"
              radius={
                visibleStatuses.length === 1 ? [5, 5, 5, 5] :
                index === 0 ? [5, 0, 0, 5] : 
                index === visibleStatuses.length - 1 ? [0, 5, 5, 0] : 0
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs">
        {visibleStatuses.map((status) => (
          <button
            key={status}
            className="flex items-center gap-1.5 group"
            onClick={() => handleBarClick(status)}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[status] }} />
            <span className="text-muted group-hover:text-text capitalize">{status}</span>
            <span className="font-semibold text-text">{counts[status]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoplightAnalytics;
