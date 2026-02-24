import React from 'react';
import { Star, GitFork, Code, AlertCircle, Users, GitCommit, Clock } from 'lucide-react';

const StatTile = ({ icon: Icon, label, value, subtext, color = 'text-gray-700' }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <Icon className={`h-3.5 w-3.5 ${color}`} />
            {label}
        </div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        {subtext && <div className="text-xs text-gray-400 truncate">{subtext}</div>}
    </div>
);

const RepoStats = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
                        <div className="h-6 w-12 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const commitDate = stats.recent_commit?.date
        ? new Date(stats.recent_commit.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        : null;

    return (
        <div className="space-y-3">
            {stats.description && (
                <p className="text-sm text-gray-600 italic">{stats.description}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatTile icon={Star} label="Stars" value={stats.stars} color="text-yellow-600" />
                <StatTile icon={GitFork} label="Forks" value={stats.forks} color="text-blue-600" />
                <StatTile icon={Code} label="Language" value={stats.language || '—'} color="text-purple-600" />
                <StatTile icon={AlertCircle} label="Open Issues" value={stats.open_issues} color="text-orange-600" />
                <StatTile icon={Users} label="Contributors" value={stats.contributors} color="text-green-600" />
                {stats.recent_commit && (
                    <StatTile
                        icon={GitCommit}
                        label="Latest Commit"
                        value={stats.recent_commit.sha}
                        subtext={stats.recent_commit.message}
                        color="text-gray-700"
                    />
                )}
                {commitDate && (
                    <StatTile icon={Clock} label="Last Updated" value={commitDate} color="text-gray-600" />
                )}
            </div>
        </div>
    );
};

export default RepoStats;
