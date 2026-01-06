'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Repository {
    id: string;
    repo_name: string;
    repo_full_name: string;
    is_private: boolean;
    created_at: string;
}

interface Installation {
    id: string;
    account_login: string;
    account_type: string;
    installed_at: string;
    repositories?: Repository[];
}

export default function InstallGitHubApp() {
    const [installations, setInstallations] = useState<Installation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const githubAppClientId = process.env.NEXT_PUBLIC_GITHUB_APP_CLIENT_ID;

    useEffect(() => {
        fetchInstallations();
    }, []);

    const fetchInstallations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/github/installations');

            if (!response.ok) {
                throw new Error('Failed to fetch installations');
            }

            const data = await response.json();
            setInstallations(data.installations || []);
        } catch (err) {
            console.error('Error fetching installations:', err);
            setError('Failed to load installations');
        } finally {
            setLoading(false);
        }
    };

    const handleInstall = () => {
        if (!githubAppClientId) {
            alert('GitHub App not configured. Please set NEXT_PUBLIC_GITHUB_APP_CLIENT_ID in your environment variables.');
            return;
        }

        // Redirect to GitHub App installation page
        const installUrl = `https://github.com/apps/${githubAppClientId}/installations/new`;
        window.location.href = installUrl;
    };

    if (loading) {
        return (
            <Card className="p-6">
                <p className="text-gray-600">Loading installations...</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold">GitHub App Installation</h3>
                        <p className="text-gray-600 mt-1">
                            Install PullPilot on your repositories to enable automated PR reviews
                        </p>
                    </div>
                    <Button onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700">
                        Install GitHub App
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {installations.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-4">No installations yet</p>
                        <p className="text-sm text-gray-500">
                            Click the button above to install PullPilot on your repositories
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Installed On:</h4>
                        {installations.map((installation) => (
                            <div
                                key={installation.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-semibold text-lg">
                                                {installation.account_login.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {installation.account_login}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {installation.account_type} • Installed{' '}
                                                {new Date(installation.installed_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                            Active
                                        </span>
                                    </div>
                                </div>

                                {installation.repositories && installation.repositories.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Repositories ({installation.repositories.length}):
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {installation.repositories.slice(0, 6).map((repo) => (
                                                <div
                                                    key={repo.id}
                                                    className="text-sm text-gray-600 flex items-center space-x-2"
                                                >
                                                    <span className="text-gray-400">•</span>
                                                    <span>{repo.repo_name}</span>
                                                    {repo.is_private && (
                                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {installation.repositories.length > 6 && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                +{installation.repositories.length - 6} more
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Click &quot;Install GitHub App&quot; to authorize PullPilot</li>
                    <li>Select which repositories you want to enable</li>
                    <li>When a PR is opened or updated, PullPilot will automatically review it</li>
                    <li>AI-powered review comments will be posted directly on the PR</li>
                </ol>
            </Card>
        </div>
    );
}
