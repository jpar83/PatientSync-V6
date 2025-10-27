import React from 'react';

const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
    return (
        <div className="w-full p-3 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-t-lg"></div>
            <div className="space-y-2 mt-2">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-50 rounded"></div>
                ))}
            </div>
        </div>
    );
};
export default TableSkeleton;
