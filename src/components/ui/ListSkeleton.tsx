import React from 'react';

const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-20 bg-gray-200 rounded-md"></div>
                        <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};
export default ListSkeleton;
