'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface FixDetails {
    id: string;
    fix_type: string;
    file_path: string;
    line_number: number;
    description: string;
    pr_number: number;
    pr_author: string;
    status: string;
    repo_full_name?: string;
}

interface ApplyResult {
    success: boolean;
    message?: string;
    error?: string;
    commitSha?: string;
    prUrl?: string;
}

export default function FixPageContent() {
    const searchParams = useSearchParams();
    const fixId = searchParams.get('id');

    const [status, setStatus] = useState<'loading' | 'applying' | 'success' | 'error' | 'not-found'>('loading');
    const [fixDetails, setFixDetails] = useState<FixDetails | null>(null);
    const [result, setResult] = useState<ApplyResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (!fixId) {
            setStatus('not-found');
            setErrorMessage('No fix ID provided');
            return;
        }

        // Fetch fix details first
        fetchFixDetails();
    }, [fixId]);

    const fetchFixDetails = async () => {
        try {
            const response = await fetch(`/api/github/fix-details?id=${fixId}`);
            const data = await response.json();

            if (!response.ok) {
                setStatus('error');
                setErrorMessage(data.error || 'Failed to fetch fix details');
                return;
            }

            setFixDetails(data.fix);
            setStatus('applying');

            // Auto-apply the fix
            applyFix();
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Failed to fetch fix details');
        }
    };

    const applyFix = async () => {
        try {
            const response = await fetch(`/api/github/apply-fix?id=${fixId}`, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setResult(data);
                setStatus('success');

                // Redirect to PR after 3 seconds
                if (data.prUrl) {
                    setTimeout(() => {
                        window.location.href = data.prUrl;
                    }, 3000);
                }
            } else {
                setStatus('error');
                setErrorMessage(data.error || 'Failed to apply fix');
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Failed to apply fix');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔧</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">PullPilot Auto-Fix</h1>
                    </div>

                    {/* Status Display */}
                    {status === 'loading' && (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-300">Loading fix details...</p>
                        </div>
                    )}

                    {status === 'applying' && (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                            <p className="text-gray-300">Applying fix...</p>
                            {fixDetails && (
                                <div className="mt-4 text-left bg-gray-900/50 rounded-lg p-4">
                                    <p className="text-sm text-gray-400">
                                        <span className="text-gray-500">File:</span>{' '}
                                        <code className="text-blue-400">{fixDetails.file_path}</code>
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        <span className="text-gray-500">Line:</span>{' '}
                                        <span className="text-yellow-400">{fixDetails.line_number}</span>
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        <span className="text-gray-500">Fix:</span>{' '}
                                        {fixDetails.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">✅</span>
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">Suggestion Posted!</h2>
                            <p className="text-gray-400 mb-4">
                                A fix suggestion has been added to the PR as a comment.
                            </p>
                            <div className="bg-gray-900/50 rounded-lg p-4 text-left text-sm text-gray-400 mb-4">
                                <p className="mb-2"><strong>Next step:</strong></p>
                                <p>Click <span className="text-blue-400 font-medium">&quot;Apply suggestion&quot;</span> in the PR to apply the fix with one click.</p>
                            </div>
                            {result?.prUrl && (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-400">Redirecting to PR in 3 seconds...</p>
                                    <a
                                        href={result.prUrl}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        Go to PR →
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">❌</span>
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">Failed to Apply Fix</h2>
                            <p className="text-red-400 mb-4">{errorMessage}</p>

                            <div className="bg-gray-900/50 rounded-lg p-4 text-left text-sm text-gray-400 mb-4">
                                <p className="mb-2"><strong>Possible reasons:</strong></p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>The file may have been modified since the fix was suggested</li>
                                    <li>The branch may have been deleted</li>
                                    <li>You may not have permission to apply this fix</li>
                                    <li>You need to be logged in with GitHub</li>
                                </ul>
                            </div>

                            <div className="space-x-4">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                                <Link
                                    href="/dashboard"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-block"
                                >
                                    Go to Dashboard
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === 'not-found' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">🔍</span>
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">Fix Not Found</h2>
                            <p className="text-gray-400 mb-4">{errorMessage || 'The fix suggestion was not found or has expired.'}</p>
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-block"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-4">
                    Powered by PullPilot
                </p>
            </div>
        </div>
    );
}
