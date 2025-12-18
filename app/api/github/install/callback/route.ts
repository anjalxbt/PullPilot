import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storeInstallation } from '@/lib/repositories';
import { getInstallationRepos } from '@/lib/github-app';

/**
 * GitHub App Installation Callback
 * 
 * This endpoint is called after a user installs the GitHub App.
 * It receives an installation_id and setup_action parameter.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
        }

        const searchParams = request.nextUrl.searchParams;
        const installationId = searchParams.get('installation_id');
        const setupAction = searchParams.get('setup_action');

        if (!installationId) {
            return NextResponse.redirect(
                new URL('/dashboard?error=missing_installation_id', request.url)
            );
        }

        // Fetch installation details from GitHub
        const installationIdNum = parseInt(installationId, 10);

        try {
            // Get installation repositories to verify and get account info
            const reposData = await getInstallationRepos(installationIdNum);

            // Extract account information from the response
            // The installation repositories endpoint returns account info
            const accountLogin = reposData.repositories?.[0]?.owner?.login || 'unknown';
            const accountType = reposData.repositories?.[0]?.owner?.type || 'User';

            // Store installation in database
            await storeInstallation({
                installation_id: installationIdNum,
                account_id: installationIdNum, // Using installation_id as account_id for now
                account_login: accountLogin,
                account_type: accountType,
                target_type: accountType,
                user_id: session.user.id,
            });

            // Redirect to dashboard with success message
            const redirectUrl = new URL('/dashboard', request.url);
            redirectUrl.searchParams.set('installation', 'success');

            return NextResponse.redirect(redirectUrl);
        } catch (error) {
            console.error('Error processing installation:', error);
            return NextResponse.redirect(
                new URL('/dashboard?error=installation_failed', request.url)
            );
        }
    } catch (error) {
        console.error('Installation callback error:', error);
        return NextResponse.redirect(
            new URL('/dashboard?error=server_error', request.url)
        );
    }
}
