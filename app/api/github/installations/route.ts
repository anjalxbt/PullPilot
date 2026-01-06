import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserInstallations, getInstallationRepositories } from '@/lib/repositories';

/**
 * Get user's GitHub App installations
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch installations for the user
        const installations = await getUserInstallations(session.user.id);

        // Fetch repositories for each installation
        const installationsWithRepos = await Promise.all(
            installations.map(async (installation) => {
                const repositories = await getInstallationRepositories(installation.id);
                return {
                    ...installation,
                    repositories,
                };
            })
        );

        return NextResponse.json({
            installations: installationsWithRepos,
        });
    } catch (error) {
        console.error('Error fetching installations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch installations' },
            { status: 500 }
        );
    }
}
