# OAuth Authentication Setup Guide

This guide explains how to configure OAuth authentication providers (Google, Apple, and Microsoft) for your NUUM application.

## Prerequisites

- Access to your Supabase project dashboard
- Admin access to the OAuth provider platforms (Google Cloud Console, Apple Developer, Azure Portal)

## Important URLs

Your application uses the following OAuth callback URL:
- **Development**: `http://localhost:5173/auth/callback`
- **Production**: `https://yourdomain.com/auth/callback`

**Important**: Replace `yourdomain.com` with your actual production domain.

## Supabase Configuration

### 1. Authentication Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to **Authentication** > **URL Configuration**
3. Add the following URLs:

**Site URL**:
- Development: `http://localhost:5173`
- Production: `https://yourdomain.com`

**Redirect URLs** (add both):
```
http://localhost:5173/auth/callback
https://yourdomain.com/auth/callback
```

### 2. Enable OAuth Providers

Navigate to **Authentication** > **Providers** and enable each provider you want to use.

## Provider-Specific Setup

### Google OAuth Setup

1. **Create OAuth 2.0 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select or create a project
   - Navigate to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Select **Web application**

2. **Configure OAuth Consent Screen**
   - Go to **APIs & Services** > **OAuth consent screen**
   - Choose **External** (unless you have a Google Workspace)
   - Fill in:
     - App name: `NUUM`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

3. **Add Authorized Redirect URIs**
   - In your OAuth client settings, add:
   ```
   https://hunrzxpemygzbgqqcakh.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback
   https://yourdomain.com/auth/callback
   ```

4. **Configure in Supabase**
   - Copy your **Client ID** and **Client Secret**
   - In Supabase Dashboard > Authentication > Providers > Google
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Click **Save**

### Apple Sign In Setup

1. **Register an App ID**
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Navigate to **Certificates, Identifiers & Profiles**
   - Click **Identifiers** > **+** button
   - Select **App IDs** and click **Continue**
   - Fill in:
     - Description: `NUUM Web App`
     - Bundle ID: `com.nuum.webapp` (or your own)
   - Enable **Sign in with Apple**
   - Click **Continue** and **Register**

2. **Create a Services ID**
   - Go to **Identifiers** > **+** button
   - Select **Services IDs** and click **Continue**
   - Fill in:
     - Description: `NUUM Sign In`
     - Identifier: `com.nuum.signin` (or your own)
   - Enable **Sign in with Apple**
   - Click **Configure**
   - Add your domains and return URLs:
     - Domains: `hunrzxpemygzbgqqcakh.supabase.co`, `yourdomain.com`
     - Return URLs: `https://hunrzxpemygzbgqqcakh.supabase.co/auth/v1/callback`

3. **Create a Private Key**
   - Go to **Keys** > **+** button
   - Name: `NUUM Sign In Key`
   - Enable **Sign in with Apple**
   - Click **Configure** and select your App ID
   - Click **Continue** and **Register**
   - Download the `.p8` key file (you can only do this once!)
   - Note your **Key ID** and **Team ID**

4. **Configure in Supabase**
   - In Supabase Dashboard > Authentication > Providers > Apple
   - Enable Apple provider
   - Enter:
     - Services ID (Client ID): Your Services ID (e.g., `com.nuum.signin`)
     - Key ID: From the key you created
     - Team ID: Your Apple Team ID
     - Private Key: Contents of the `.p8` file
   - Click **Save**

### Microsoft (Azure AD) OAuth Setup

1. **Register an Application**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to **Azure Active Directory** > **App registrations**
   - Click **New registration**
   - Fill in:
     - Name: `NUUM`
     - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
     - Redirect URI:
       - Platform: **Web**
       - URL: `https://hunrzxpemygzbgqqcakh.supabase.co/auth/v1/callback`
   - Click **Register**

2. **Add Additional Redirect URIs**
   - In your app registration, go to **Authentication**
   - Under **Web** > **Redirect URIs**, click **Add URI**
   - Add:
   ```
   http://localhost:5173/auth/callback
   https://yourdomain.com/auth/callback
   ```
   - Click **Save**

3. **Create a Client Secret**
   - Go to **Certificates & secrets**
   - Click **New client secret**
   - Description: `NUUM Web Client`
   - Expires: Choose an appropriate duration
   - Click **Add**
   - **Copy the secret value immediately** (you won't be able to see it again)

4. **Configure API Permissions**
   - Go to **API permissions**
   - Click **Add a permission**
   - Select **Microsoft Graph**
   - Select **Delegated permissions**
   - Add: `email`, `openid`, `profile`
   - Click **Add permissions**

5. **Configure in Supabase**
   - In Supabase Dashboard > Authentication > Providers > Azure (Microsoft)
   - Enable Azure provider
   - Enter:
     - Client ID: Your Application (client) ID from Azure
     - Client Secret: The secret value you copied
     - Azure Tenant: Use `common` for multi-tenant, or your specific tenant ID
   - Click **Save**

## Testing OAuth Flow

### Development Testing

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Click on any social login button
4. You should be redirected to the provider's login page
5. After authentication, you should be redirected back to `/auth/callback`
6. The callback handler will create your profile and workspace
7. You'll be redirected to `/dashboard`

### Troubleshooting

**"Provider not enabled" error**:
- Verify the provider is enabled in Supabase Dashboard > Authentication > Providers
- Check that Client ID and Client Secret are correctly entered
- Ensure you clicked **Save** after configuration

**Redirect URL mismatch error**:
- Verify redirect URLs match exactly in both Supabase and the OAuth provider
- Check for trailing slashes and http vs https
- Ensure the Supabase callback URL is added to authorized redirect URIs

**"Invalid client" error**:
- Double-check your Client ID and Client Secret
- Verify the OAuth client is active in the provider's dashboard
- For Microsoft: ensure tenant is set correctly (usually `common`)

**Nothing happens when clicking OAuth button**:
- Check browser console for errors
- Verify Supabase URL and anon key are set in `.env`
- Check that popup blockers aren't interfering

**OAuth works but user not created**:
- Check browser console for profile/workspace creation errors
- Verify database RLS policies allow insertions
- Check Supabase logs for any database errors

## Security Best Practices

1. **Never commit secrets to git**
   - Client secrets should only be in Supabase dashboard
   - Keep your `.env` file in `.gitignore`

2. **Use environment-specific configurations**
   - Different OAuth credentials for development/production
   - Separate OAuth apps for staging environments

3. **Regularly rotate secrets**
   - Update client secrets periodically
   - Revoke and regenerate keys when team members leave

4. **Monitor OAuth usage**
   - Check Supabase logs for failed authentication attempts
   - Review OAuth provider dashboards for usage patterns

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
