'use client';

import { Suspense } from 'react';
import FixPageContent from './FixPageContent';

export default function FixPage() {
    return (
        <Suspense fallback={<FixLoadingState />}>
            <FixPageContent />
        </Suspense>
    );
}

function FixLoadingState() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔧</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-8">PullPilot Auto-Fix</h1>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-300">Loading...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
