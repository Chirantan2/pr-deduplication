import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Plus, Trash2, Book } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';

const SettingsPage = () => {
    const { api } = useAuth();
    const [settings, setSettings] = useState({
        github_token: '',
        gemini_api_key: '',
        groq_api_key: '',
        openai_api_key: '',
        claude_api_key: ''
    });
    const [repositories, setRepositories] = useState([]);
    const [newRepo, setNewRepo] = useState({ owner: '', repo: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [addingRepo, setAddingRepo] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [settingsRes, reposRes] = await Promise.all([
                api.get('/users/me/settings'),
                api.get('/repositories')
            ]);
            if (settingsRes.data) {
                const data = settingsRes.data;
                setSettings({
                    github_token: data.github_token || '',
                    gemini_api_key: data.gemini_api_key || '',
                    groq_api_key: data.groq_api_key || '',
                    openai_api_key: data.openai_api_key || '',
                    claude_api_key: data.claude_api_key || ''
                });
            }
            setRepositories(reposRes.data || []);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await api.put('/users/me/settings', settings);
            setMessage('Settings saved successfully!');
        } catch (error) {
            console.error("Failed to save settings", error);
            setMessage('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddRepo = async () => {
        if (!newRepo.owner.trim() || !newRepo.repo.trim()) return;
        setAddingRepo(true);
        try {
            const res = await api.post('/repositories', newRepo);
            setRepositories([...repositories, res.data]);
            setNewRepo({ owner: '', repo: '' });
        } catch (error) {
            const detail = error.response?.data?.detail || 'Failed to add repository';
            alert(detail);
        } finally {
            setAddingRepo(false);
        }
    };

    const handleDeleteRepo = async (repoId) => {
        if (!window.confirm('Remove this repository?')) return;
        try {
            await api.delete(`/repositories/${repoId}`);
            setRepositories(repositories.filter(r => r.id !== repoId));
        } catch (error) {
            console.error("Failed to delete repo", error);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 overflow-auto p-4 pt-14 sm:p-6 md:p-8 md:pt-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Settings</h1>

                    {/* Repositories Section */}
                    <div className="bg-white shadow sm:rounded-lg border border-gray-200 mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                <Book className="h-5 w-5 text-gray-500" />
                                Repositories
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage the repositories you want to track. You can add multiple.
                            </p>

                            {/* Existing repos */}
                            {repositories.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {repositories.map(repo => (
                                        <div key={repo.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Book className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900">{repo.owner}/{repo.repo}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRepo(repo.id)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                                title="Remove"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new repo */}
                            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={newRepo.owner}
                                    onChange={(e) => setNewRepo({ ...newRepo, owner: e.target.value })}
                                    placeholder="Owner (e.g. octocat)"
                                    className="flex-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 bg-white"
                                />
                                <input
                                    type="text"
                                    value={newRepo.repo}
                                    onChange={(e) => setNewRepo({ ...newRepo, repo: e.target.value })}
                                    placeholder="Repository (e.g. Hello-World)"
                                    className="flex-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 bg-white"
                                />
                                <button
                                    onClick={handleAddRepo}
                                    disabled={addingRepo || !newRepo.owner.trim() || !newRepo.repo.trim()}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shrink-0"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    {addingRepo ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* API Keys & Token */}
                    <div className="bg-white shadow sm:rounded-lg border border-gray-200">
                        <div className="px-4 py-5 sm:p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">GitHub Token</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Shared across all repositories.
                                    </p>
                                    <div className="mt-4">
                                        <label htmlFor="github_token" className="block text-sm font-medium text-gray-700">
                                            Personal Access Token
                                        </label>
                                        <input
                                            type="password"
                                            name="github_token"
                                            id="github_token"
                                            value={settings.github_token}
                                            onChange={handleChange}
                                            className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 bg-white"
                                            placeholder="ghp_..."
                                        />
                                        <p className="mt-2 text-sm text-gray-500">
                                            Required scope: <code className="bg-gray-100 px-1 rounded text-xs">repo</code> to read PRs and merge them.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">LLM Configuration</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        API keys for AI-powered PR ranking.
                                    </p>
                                    <div className="mt-4 grid grid-cols-1 gap-y-4">
                                        <div>
                                            <label htmlFor="gemini_api_key" className="block text-sm font-medium text-gray-700">
                                                Google Gemini API Key
                                            </label>
                                            <input
                                                type="password"
                                                name="gemini_api_key"
                                                id="gemini_api_key"
                                                value={settings.gemini_api_key}
                                                onChange={handleChange}
                                                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 bg-white"
                                                placeholder="AIza..."
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="groq_api_key" className="block text-sm font-medium text-gray-700">
                                                Groq API Key
                                            </label>
                                            <input
                                                type="password"
                                                name="groq_api_key"
                                                id="groq_api_key"
                                                value={settings.groq_api_key}
                                                onChange={handleChange}
                                                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 bg-white"
                                                placeholder="gsk_..."
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="openai_api_key" className="block text-sm font-medium text-gray-700">
                                                OpenAI API Key
                                            </label>
                                            <input
                                                type="password"
                                                name="openai_api_key"
                                                id="openai_api_key"
                                                value={settings.openai_api_key}
                                                onChange={handleChange}
                                                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 bg-white"
                                                placeholder="sk-..."
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="claude_api_key" className="block text-sm font-medium text-gray-700">
                                                Anthropic Claude API Key
                                            </label>
                                            <input
                                                type="password"
                                                name="claude_api_key"
                                                id="claude_api_key"
                                                value={settings.claude_api_key}
                                                onChange={handleChange}
                                                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 bg-white"
                                                placeholder="sk-ant-..."
                                            />
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                            <p className="text-sm text-blue-700">
                                                <strong>Ollama</strong> uses a local instance at <code className="bg-blue-100 px-1 rounded text-xs">http://localhost:11434</code> — no API key required.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-gray-200">
                                    <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
                                        {message && (
                                            <span className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                                                {message}
                                            </span>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {saving ? 'Saving...' : 'Save Settings'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
