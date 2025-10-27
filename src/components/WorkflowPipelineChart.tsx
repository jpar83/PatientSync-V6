import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Order } from '@/lib/types';
import workflowData from '../../schemas/workflow.json';
import { daysOld } from '../lib/utils';

const allStages = workflowData.workflow.map(w => w.stage);

// Gradient-like color scale: teals -> blues -> purples -> grays
const stageColors = [
  '#14b8a6', '#0d9488', '#0f766e', // Teals
  '#0ea5e9', '#3b82f6', '#6366f1', // Blues
  '#8b5cf6', '#a855f7',             // Purples
  '#6b7280', '#4b5563'              // Grays
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0]; // `name` is the dataKey (stage name), `value` is the count
    const avgDays = payload[0].payload[`${name}_avgDays`]; // Access avgDays from the payload
    
    return (
      <div className="soft-card p-3 text-sm shadow-lg">
        <p className="font-bold text-text">{name}</p>
        <p className="text-muted">Active Referrals: <span className="font-semibold text-text">{value}</span></p>
        {avgDays !== undefined && (
          <p className="text-muted">Avg. Days in Stage: <span className="font-semibold text-text">{avgDays.toFixed(1)}</span></p>
        )}
      </div>
    );
  }
  return null;
};

const WorkflowPipelineChart: React.FC<{ orders: Order[] }> = ({ orders }) => {
    const { chartData, stageDetails } = useMemo(() => {
        const details = allStages.map(stage => {
            const stageOrders = orders.filter(o => o.workflow_stage === stage);
            const count = stageOrders.length;
            const totalDays = stageOrders.reduce((sum, o) => sum + daysOld(o.last_stage_change), 0);
            const avgDays = count > 0 ? totalDays / count : 0;
            return {
                name: stage,
                count,
                avgDays,
            };
        });

        const dataForChart = [{
            name: 'Pipeline',
            ...details.reduce((acc, metric) => {
                // @ts-ignore
                acc[metric.name] = metric.count;
                // @ts-ignore
                acc[`${metric.name}_avgDays`] = metric.avgDays;
                return acc;
            }, {})
        }];

        return { chartData: dataForChart, stageDetails: details };
    }, [orders]);

    if (orders.length === 0) {
        return (
            <div>
                <h3 className="text-lg font-semibold text-text mb-3">Live Workflow Distribution</h3>
                <p className="text-center text-sm text-muted py-8">No active orders to display in pipeline.</p>
            </div>
        );
    }
    
    const visibleStageDetails = stageDetails.filter(s => s.count > 0);

    return (
        <div>
            <h3 className="text-lg font-semibold text-text mb-3">Live Workflow Distribution</h3>
            <div className="w-full h-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" barCategoryGap={0} barSize={40}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        {visibleStageDetails.map((stage, index) => (
                            <Bar 
                                key={stage.name} 
                                dataKey={stage.name} 
                                stackId="a" 
                                fill={stageColors[allStages.indexOf(stage.name) % stageColors.length]} 
                                radius={
                                    visibleStageDetails.length === 1 ? [5, 5, 5, 5] :
                                    index === 0 ? [5, 0, 0, 5] : 
                                    index === visibleStageDetails.length - 1 ? [0, 5, 5, 0] : 0
                                } 
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                {stageDetails.map((stage, index) => {
                    if (stage.count === 0) return null;
                    return (
                        <div key={stage.name} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stageColors[index % stageColors.length] }} />
                            <span className="text-muted">{stage.name}:</span>
                            <span className="font-semibold text-text">{stage.count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WorkflowPipelineChart;
