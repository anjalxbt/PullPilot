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
    console.log('=== GitHub App Installation Callback Triggered ===');

    try {
        const session = await getServerSession(authOptions);
        console.log('Session:', session ? 'exists' : 'null');
        console.log('Session user:', session?.user);
        console.log('Session user ID:', session?.user?.id);

        if (!session || !session.user) {
            console.error('No session or user found, redirecting to home');
            return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
        }

        if (!session.user.id) {
            console.error('Session user ID is missing!');
            return NextResponse.redirect(new URL('/?error=no_user_id', request.url));
        }

        const searchParams = request.nextUrl.searchParams;
        const installationId = searchParams.get('installation_id');
        const setupAction = searchParams.get('setup_action');

        console.log('Installation ID:', installationId);
        console.log('Setup Action:', setupAction);

        if (!installationId) {
            console.error('Missing installation_id parameter');
            return NextResponse.redirect(
                new URL('/dashboard?error=missing_installation_id', request.url)
            );
        }

        // Fetch installation details from GitHub
        const installationIdNum = parseInt(installationId, 10);
        console.log('Fetching installation repos for ID:', installationIdNum);

        try {
            // Get installation repositories to verify and get account info
            const reposData = await getInstallationRepos(installationIdNum);
            console.log('Repos data received:', reposData);

            // Extract account information from the response
            const accountLogin = reposData.repositories?.[0]?.owner?.login || 'unknown';
            const accountType = reposData.repositories?.[0]?.owner?.type || 'User';

            console.log('Account login:', accountLogin);
            console.log('Account type:', accountType);

            // Store installation in database
            console.log('Storing installation in database...');
            const installation = await storeInstallation({
                installation_id: installationIdNum,
                account_id: installationIdNum,
                account_login: accountLogin,
                account_type: accountType,
                target_type: accountType,
                user_id: session.user.id,
            });

            console.log('Installation stored successfully:', installation);

            // Redirect to dashboard with success message
            const redirectUrl = new URL('/dashboard', request.url);
            redirectUrl.searchParams.set('installation', 'success');

            return NextResponse.redirect(redirectUrl);
        } catch (error) {
            console.error('Error processing installation:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return NextResponse.redirect(
                new URL('/dashboard?error=installation_failed', request.url)
            );
        }
    } catch (error) {
        console.error('Installation callback error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return NextResponse.redirect(
            new URL('/dashboard?error=server_error', request.url)
        );
    }
}
