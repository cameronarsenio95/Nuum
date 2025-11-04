# OAuth Quick Start Guide

OAuth authentication has been implemented but requires configuration in your Supabase dashboard.

## Why OAuth Isn't Working Yet

OAuth providers (Google, Apple, Microsoft) need to be:
1. **Enabled** in your Supabase project
2. **Configured** with valid credentials from each provider
3. **Set up** with correct redirect URLs

## Quick Fix Steps

### Option 1: Use Email/Password Authentication (Works Now)

The email/password login works immediately without any additional configuration. Users can:
- Click "Continue with Email" button
- Enter their email and password
- Sign up or log in successfully

### Option 2: Enable OAuth (Requires Configuration)

To enable social login, you need to configure each provider in Supabase:

#### 1. Open Supabase Dashboard
Visit: `https://supabase.com/dashboard/project/hunrzxpemygzbgqqcakh/auth/providers`

#### 2. Set Redirect URLs
Go to **Authentication** > **URL Configuration** and add:
```
http://localhost:5173/auth/callback
```

#### 3. Configure Each Provider

**For Google:**
- Enable Google provider in Supabase
- Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
- Add Client ID and Client Secret to Supabase

**For Apple:**
- Enable Apple provider in Supabase
- Get credentials from [Apple Developer Portal](https://developer.apple.com/)
- Add Services ID, Team ID, Key ID, and Private Key to Supabase

**For Microsoft:**
- Enable Azure provider in Supabase
- Get credentials from [Azure Portal](https://portal.azure.com/)
- Add Client ID and Client Secret to Supabase

## What Happens When Users Click OAuth Buttons Now

Without configuration, users will see an error message:
> "This login method is not configured. Please use email/password or contact support."

This is the expected behavior and provides clear guidance to users.

## Implementation Details

### What We Fixed

1. **Created OAuth Callback Handler** (`/src/pages/AuthCallback.tsx`)
   - Processes OAuth returns from providers
   - Creates user profiles and workspaces automatically
   - Handles errors gracefully with user-friendly messages

2. **Updated Redirect URLs**
   - Changed from `/dashboard` to `/auth/callback`
   - This is the correct pattern for OAuth flows

3. **Added Error Handling**
   - Specific messages for different failure scenarios
   - Console logging for debugging
   - Automatic redirect on errors

4. **Enhanced AuthContext**
   - Better logging of auth state changes
   - Proper handling of OAuth sign-in events

5. **Updated App Routing**
   - Added `/auth/callback` route
   - Proper page state management

### Testing OAuth Once Configured

After you configure providers in Supabase:

1. Click a social login button (Google/Apple/Microsoft)
2. You'll be redirected to the provider's login page
3. After authentication, you'll return to `/auth/callback`
4. Your profile and workspace will be created automatically
5. You'll be redirected to `/dashboard`

### Debugging

Check browser console logs for detailed information:
- `[Login]` or `[SignupModal]` - OAuth initiation
- `[OAuth]` - Callback processing
- `[AuthContext]` - Auth state changes

## Full Setup Guide

For complete step-by-step instructions on configuring each OAuth provider, see:
**[OAUTH_SETUP.md](./OAUTH_SETUP.md)**

That guide includes:
- Detailed provider-specific setup instructions
- Screenshots and exact steps
- Troubleshooting common issues
- Security best practices

## Support

If you need help configuring OAuth:
1. Read the full [OAUTH_SETUP.md](./OAUTH_SETUP.md)
2. Check Supabase logs for errors
3. Verify redirect URLs match exactly
4. Ensure providers are enabled in Supabase dashboard
