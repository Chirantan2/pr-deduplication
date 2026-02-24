import React from 'react';

const IssueSelector = ({ issues, selectedIssue, onSelect }) => {
    return (
        <div className="mb-6">
            <label htmlFor="issue-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select an Issue
            </label>
            <div className="relative">
                <select
                    id="issue-select"
                    className="block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm border"
                    value={selectedIssue?.number || ''}
                    onChange={(e) => {
                        const issue = issues.find(i => i.number === parseInt(e.target.value));
                        onSelect(issue);
                    }}
                >
                    <option value="" disabled>Choose an issue...</option>
                    {issues.map((issue) => (
                        <option key={issue.number} value={issue.number}>
                            #{issue.number} {issue.title}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default IssueSelector;
