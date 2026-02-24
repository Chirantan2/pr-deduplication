import React, { useState } from 'react';
import { GitPullRequest, FileText, CheckCircle, ExternalLink, ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from 'lucide-react';

const getScoreColor = (score) => {
    if (score >= 81) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', ring: 'ring-green-500/20' };
    if (score >= 51) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', ring: 'ring-yellow-500/20' };
    if (score >= 21) return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', ring: 'ring-orange-500/20' };
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', ring: 'ring-red-500/20' };
};

const PRCard = ({ pr, onMerge, onViewDetails, rank }) => {
    const [expanded, setExpanded] = useState(false);
    const hasScore = pr.score !== undefined && pr.score !== null;
    const scoreColors = hasScore ? getScoreColor(pr.score) : null;

    return (
        <div className={`bg-white shadow rounded-lg hover:shadow-md transition-all border ${hasScore ? scoreColors.border : 'border-gray-200'}`}>
            {/* Main row */}
            <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            {rank && hasScore && (
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${scoreColors.bg} ${scoreColors.text}`}>
                                    #{rank}
                                </span>
                            )}
                            <GitPullRequest className="h-5 w-5 text-green-600 shrink-0" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{pr.title}</h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shrink-0">
                                #{pr.number}
                            </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500 gap-2 sm:gap-4">
                            <span>@{pr.user?.login || 'unknown'}</span>
                            <span>•</span>
                            <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Score badge + summary inline */}
                        {hasScore && (
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${scoreColors.bg} ${scoreColors.text} ring-1 ${scoreColors.ring}`}>
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    {pr.score}/100
                                </span>
                                {pr.summary && (
                                    <span className="text-sm text-gray-600 italic">{pr.summary}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        {hasScore && (pr.strengths?.length > 0 || pr.gaps?.length > 0) && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                {expanded ? 'Less' : 'More'}
                            </button>
                        )}
                        <button
                            onClick={() => onViewDetails(pr)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <FileText className="h-4 w-4 mr-1 sm:mr-2 text-gray-500" />
                            <span className="hidden sm:inline">Details</span>
                        </button>
                        <button
                            onClick={() => onMerge(pr)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Merge</span>
                        </button>
                        <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Expandable strengths/gaps section */}
            {expanded && hasScore && (
                <div className="border-t border-gray-100 px-4 sm:px-6 py-4 bg-gray-50/50 rounded-b-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pr.strengths && pr.strengths.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1.5 mb-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Strengths
                                </h4>
                                <ul className="space-y-1">
                                    {pr.strengths.map((s, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-green-500 mt-1 shrink-0">•</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {pr.gaps && pr.gaps.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-1.5 mb-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Gaps
                                </h4>
                                <ul className="space-y-1">
                                    {pr.gaps.map((g, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-amber-500 mt-1 shrink-0">•</span>
                                            {g}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PRCard;
