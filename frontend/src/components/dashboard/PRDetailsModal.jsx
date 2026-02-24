import React, { useEffect, useState } from 'react';
import { X, FileDiff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PRDetailsModal = ({ pr, onClose, repoInfo }) => {
    const { api } = useAuth();
    const [diff, setDiff] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (pr && repoInfo) {
            fetchDiff();
        }
    }, [pr]);

    const fetchDiff = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/prs/${pr.number}/raw_diff`, {
                params: { owner: repoInfo.owner, repo: repoInfo.repo },
                headers: { 'X-GitHub-Token': repoInfo.token }
            });
            setDiff(res.data.raw_diff);
        } catch (err) {
            console.error("Failed to fetch diff", err);
            setError('Failed to fetch diff data.');
        } finally {
            setLoading(false);
        }
    };

    if (!pr) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            #{pr.number} {pr.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            @{pr.user?.login} • {pr.state}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <span className="text-gray-500">Loading diff...</span>
                        </div>
                    ) : error ? (
                        <p className="text-red-500 text-center">{error}</p>
                    ) : diff && Object.keys(diff).length > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(diff).map(([filename, content]) => (
                                <div key={filename} className="bg-white rounded-md border border-gray-200 overflow-hidden">
                                    <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center font-mono text-xs text-gray-700">
                                        <FileDiff className="h-4 w-4 mr-2" />
                                        {filename}
                                    </div>
                                    <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-800 bg-white">
                                        <code>{content}</code>
                                    </pre>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">No changed files found or binary content.</p>
                    )}
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PRDetailsModal;
