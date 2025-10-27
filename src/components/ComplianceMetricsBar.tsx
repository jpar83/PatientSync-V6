import React from 'react';

interface ComplianceMetrics {
  filteredCount: number;
  readyForParCount: number;
  avgCompletion: number;
}

interface Props {
  metrics: ComplianceMetrics;
}

const ComplianceMetricsBar: React.FC<Props> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4 text-center">
        <div className="text-sm font-medium text-gray-500">Filtered Results</div>
        <div className="text-3xl font-bold text-gray-800 mt-1">{metrics.filteredCount}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4 text-center">
        <div className="text-sm font-medium text-gray-500">Ready for PAR</div>
        <div className="text-3xl font-bold text-teal-600 mt-1">{metrics.readyForParCount}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4 text-center">
        <div className="text-sm font-medium text-gray-500">Avg. Doc Completion</div>
        <div className="text-3xl font-bold text-teal-600 mt-1">{metrics.avgCompletion}%</div>
      </div>
    </div>
  );
};

export default ComplianceMetricsBar;
