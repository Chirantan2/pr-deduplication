import React from 'react';
import { Book, ChevronDown } from 'lucide-react';

const RepoSelector = ({ repositories, selectedRepo, onSelect }) => {
    if (!repositories || repositories.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500 text-sm">
                No repositories configured. Add one in Settings.
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <Book className="h-5 w-5 text-gray-500 shrink-0" />
            <div className="relative flex-1">
                <select
                    value={selectedRepo?.id || ''}
                    onChange={(e) => {
                        const repo = repositories.find(r => r.id === parseInt(e.target.value));
                        onSelect(repo);
                    }}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                    <option value="" disabled>Select a repository...</option>
                    {repositories.map(repo => (
                        <option key={repo.id} value={repo.id}>
                            {repo.owner}/{repo.repo}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
};

export default RepoSelector;
