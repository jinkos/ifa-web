/**
 * Redirects the user to Intelliflo OAuth2 authorization endpoint
 */
const connectToIntelliflo = () => {
    const originFallback = typeof window !== 'undefined' ? window.location.origin : '';
    const appBaseUrl = originFallback.replace(/\/$/, '');
    const redirectUri = `${appBaseUrl}/auth/intelliflo/callback`;

    if (!process.env.NEXT_PUBLIC_INTELLIFLO_CLIENT_ID) {
        console.warn('Missing NEXT_PUBLIC_INTELLIFLO_CLIENT_ID; Intelliflo login may fail.');
    }

    console.log("Connecting to Intelliflo with redirect URI:", redirectUri);

    const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_INTELLIFLO_CLIENT_ID!,
        response_type: "code",
        redirect_uri: redirectUri,
        scope: "openid profile myprofile client_data offline_access",
        state: crypto.randomUUID(),
    });

    const url = "https://identity.gb.intelliflo.net/core/connect/authorize?" + params.toString();


    window.location.href = url;
};
export { connectToIntelliflo };

