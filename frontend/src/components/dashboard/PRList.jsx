import React from 'react';
import PRCard from './PRCard';

const PRList = ({ prs, onMerge, onViewDetails }) => {
    if (!prs || prs.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                <p className="text-gray-500">No pull requests found for this issue.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {prs.map((pr, index) => (
                <PRCard
                    key={pr.number}
                    pr={pr}
                    rank={pr.score !== undefined ? index + 1 : null}
                    onMerge={onMerge}
                    onViewDetails={onViewDetails}
                />
            ))}
        </div>
    );
};

export default PRList;
