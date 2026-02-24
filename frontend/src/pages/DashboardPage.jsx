import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import RepoSelector from '../components/dashboard/RepoSelector';
import RepoStats from '../components/dashboard/RepoStats';
import IssueSelector from '../components/dashboard/IssueSelector';
import PRList from '../components/dashboard/PRList';
import PRDetailsModal from '../components/dashboard/PRDetailsModal';
import { Link } from 'react-router-dom';
import { Sparkles, Cpu } from 'lucide-react';

const DashboardPage = () => {
    const { api } = useAuth();

    // Repos
    const [repositories, setRepositories] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [repoStats, setRepoStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Settings (API keys + token)
    const [settings, setSettings] = useState({});

    // Issues
    const [issues, setIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [loadingIssues, setLoadingIssues] = useState(false);
    const [error, setError] = useState('');

    // PR Data
    const [prs, setPrs] = useState([]);
    const [loadingPrs, setLoadingPrs] = useState(false);

    // Ranking
    const [scores, setScores] = useState({});
    const [ranking, setRanking] = useState(false);
    const [rankingProgress, setRankingProgress] = useState('');

    // LLM Provider
    const [selectedProvider, setSelectedProvider] = useState('gemini');

    // Modal
    const [selectedPrForDetails, setSelectedPrForDetails] = useState(null);

    // Load repos and settings on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [reposRes, settingsRes] = await Promise.all([
                    api.get('/repositories'),
                    api.get('/users/me/settings')
                ]);
                setRepositories(reposRes.data);
                setSettings(settingsRes.data);

                // Auto-select first repo
                if (reposRes.data.length > 0) {
                    setSelectedRepo(reposRes.data[0]);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        loadInitialData();
    }, []);

    // Load stats + issues when repo changes
    useEffect(() => {
        if (!selectedRepo || !settings.github_token) return;

        const loadRepoData = async () => {
            setLoadingStats(true);
            setLoadingIssues(true);
            setIssues([]);
            setSelectedIssue(null);
            setPrs([]);
            setScores({});
            setRepoStats(null);
            setError('');

            try {
                // Stats and issues in parallel
                const [statsRes, issuesRes] = await Promise.all([
                    api.get(`/repositories/${selectedRepo.id}/stats`),
                    api.get('/issues', {
                        params: { owner: selectedRepo.owner, repo: selectedRepo.repo },
                        headers: { 'X-GitHub-Token': settings.github_token }
                    })
                ]);
                setRepoStats(statsRes.data);
                setIssues(issuesRes.data.issues || []);
            } catch (err) {
                console.error("Failed to load repo data", err);
                setError('Failed to load repository data.');
            } finally {
                setLoadingStats(false);
                setLoadingIssues(false);
            }
        };

        loadRepoData();
    }, [selectedRepo]);

    const handleIssueSelect = async (issue) => {
        setSelectedIssue(issue);
        setLoadingPrs(true);
        setPrs([]);
        setScores({});
        try {
            const prsRes = await api.get(`/issues/${issue.number}/prs`, {
                params: { owner: selectedRepo.owner, repo: selectedRepo.repo },
                headers: { 'X-GitHub-Token': settings.github_token }
            });
            setPrs(prsRes.data.prs || []);
        } catch (err) {
            console.error("Failed to fetch PRs", err);
        } finally {
            setLoadingPrs(false);
        }
    };

    const handleRankPrs = async () => {
        if (!prs.length) return;
        setRanking(true);

        const provider = selectedProvider;
        if (provider === 'gemini' && !settings.gemini_api_key) {
            alert('No Gemini API key configured. Go to Settings to add one, or select a different provider.');
            setRanking(false);
            return;
        }
        if (provider === 'groq' && !settings.groq_api_key) {
            alert('No Groq API key configured. Go to Settings to add one, or select a different provider.');
            setRanking(false);
            return;
        }
        if (provider === 'openai' && !settings.openai_api_key) {
            alert('No OpenAI API key configured. Go to Settings to add one, or select a different provider.');
            setRanking(false);
            return;
        }
        if (provider === 'claude' && !settings.claude_api_key) {
            alert('No Claude API key configured. Go to Settings to add one, or select a different provider.');
            setRanking(false);
            return;
        }

        const newScores = {};
        for (let i = 0; i < prs.length; i++) {
            const pr = prs[i];
            setRankingProgress(`Scoring PR ${i + 1} of ${prs.length}...`);
            try {
                const diffRes = await api.get(`/prs/${pr.number}/raw_diff`, {
                    params: { owner: selectedRepo.owner, repo: selectedRepo.repo },
                    headers: { 'X-GitHub-Token': settings.github_token }
                });
                const rawDiff = diffRes.data.raw_diff;

                const scoreRes = await api.post('/score_pr', {
                    issue_description: `${selectedIssue.title}\n\n${selectedIssue.body || ''}`,
                    raw_diff: rawDiff,
                    provider: provider,
                    gemini_api_key: settings.gemini_api_key,
                    groq_api_key: settings.groq_api_key,
                    openai_api_key: settings.openai_api_key,
                    claude_api_key: settings.claude_api_key
                });
                newScores[pr.number] = scoreRes.data;
            } catch (err) {
                console.error(`Failed to score PR ${pr.number}`, err);
                newScores[pr.number] = { score: 0, summary: "Scoring failed" };
            }
        }
        setScores(newScores);
        setRanking(false);
        setRankingProgress('');
    };

    const handleMerge = async (pr) => {
        if (!window.confirm(`Are you sure you want to merge PR #${pr.number} "${pr.title}"?`)) return;
        try {
            const res = await api.put(`/prs/${pr.number}/merge`, {}, {
                params: { owner: selectedRepo.owner, repo: selectedRepo.repo },
                headers: { 'X-GitHub-Token': settings.github_token }
            });
            if (res.data.merged) {
                alert(`PR #${pr.number} merged successfully!`);
                handleIssueSelect(selectedIssue);
            } else {
                alert(`Merge failed: ${res.data.message}`);
            }
        } catch (err) {
            console.error("Merge failed", err);
            alert("Merge request failed.");
        }
    };

    const sortedPrs = [...prs].sort((a, b) => {
        const scoreA = scores[a.number]?.score || 0;
        const scoreB = scores[b.number]?.score || 0;
        return scoreB - scoreA;
    });

    const prsWithScores = sortedPrs.map(pr => ({
        ...pr,
        ...scores[pr.number]
    }));

    const noRepos = repositories.length === 0;
    const noToken = !settings.github_token;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 overflow-auto p-4 pt-14 sm:p-6 md:p-8 md:pt-8">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-6 sm:mb-8">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                    </header>

                    {(noRepos || noToken) && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md">
                            <p className="text-sm text-yellow-700">
                                {noToken ? 'Please configure your GitHub token in Settings.' : 'No repositories found. Add one in Settings.'}
                                <Link to="/settings" className="font-medium underline ml-2 hover:text-yellow-600">
                                    Go to Settings
                                </Link>
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-md">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Repo Selector */}
                    {!noRepos && !noToken && (
                        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 border border-gray-200">
                            <RepoSelector
                                repositories={repositories}
                                selectedRepo={selectedRepo}
                                onSelect={setSelectedRepo}
                            />
                        </div>
                    )}

                    {/* Repo Stats */}
                    {selectedRepo && (
                        <div className="mb-6">
                            <RepoStats stats={repoStats} loading={loadingStats} />
                        </div>
                    )}

                    {/* Issue Selector */}
                    {selectedRepo && !noToken && (
                        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Issues</h3>
                            {loadingIssues ? (
                                <div className="text-center py-4 text-gray-500">Loading issues...</div>
                            ) : (
                                <IssueSelector
                                    issues={issues}
                                    selectedIssue={selectedIssue}
                                    onSelect={handleIssueSelect}
                                />
                            )}
                        </div>
                    )}

                    {/* PR Section */}
                    {selectedIssue && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                    PRs for Issue #{selectedIssue.number}
                                </h2>
                                {prs.length > 0 && (
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm">
                                            <Cpu className="h-4 w-4 text-gray-500 shrink-0" />
                                            <select
                                                value={selectedProvider}
                                                onChange={(e) => setSelectedProvider(e.target.value)}
                                                className="bg-transparent border-none outline-none text-gray-700 text-sm font-medium cursor-pointer pr-2"
                                                disabled={ranking}
                                            >
                                                <option value="gemini">Gemini</option>
                                                <option value="groq">Groq</option>
                                                <option value="openai">OpenAI</option>
                                                <option value="claude">Claude</option>
                                                <option value="ollama">Ollama (local)</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={handleRankPrs}
                                            disabled={ranking}
                                            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${ranking ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            {ranking ? rankingProgress || 'Ranking...' : 'Rank PRs with AI'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {Object.keys(scores).length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-4 text-xs">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800">81-100: Excellent</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">51-80: Good</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-800">21-50: Partial</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800">0-20: Poor</span>
                                </div>
                            )}

                            {loadingPrs ? (
                                <div className="bg-white shadow rounded-lg p-6 border border-gray-200 text-center text-gray-500">Loading PRs...</div>
                            ) : (
                                <PRList
                                    prs={prsWithScores}
                                    onMerge={handleMerge}
                                    onViewDetails={(pr) => setSelectedPrForDetails(pr)}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {selectedPrForDetails && (
                <PRDetailsModal
                    pr={selectedPrForDetails}
                    repoInfo={{ owner: selectedRepo.owner, repo: selectedRepo.repo, token: settings.github_token }}
                    onClose={() => setSelectedPrForDetails(null)}
                />
            )}
        </div>
    );
};

export default DashboardPage;
