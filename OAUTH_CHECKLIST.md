# OAuth Setup Checklist

Use this checklist to configure OAuth authentication for your NUUM application.

## ✅ Code Changes (Already Complete)

- [x] Created OAuth callback handler
- [x] Updated authentication context
- [x] Fixed redirect URLs in login components
- [x] Added error handling and user feedback
- [x] Updated application routing
- [x] Created comprehensive documentation
- [x] Build verified successfully

## 📋 Supabase Configuration (You Need to Do)

### 1. URL Configuration

- [ ] Go to Supabase Dashboard: https://supabase.com/dashboard/project/hunrzxpemygzbgqqcakh
- [ ] Navigate to **Authentication** > **URL Configuration**
- [ ] Set **Site URL** to: `http://localhost:5173` (or your domain)
- [ ] Add to **Redirect URLs**:
  - [ ] `http://localhost:5173/auth/callback`
  - [ ] Add production URL when ready: `https://yourdomain.com/auth/callback`
- [ ] Click **Save**

### 2. Google OAuth (Optional)

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create or select a project
- [ ] Enable Google OAuth
- [ ] Create OAuth 2.0 credentials (Web application)
- [ ] Configure OAuth consent screen
- [ ] Add authorized redirect URIs:
  - [ ] `https://hunrzxpemygzbgqqcakh.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:5173/auth/callback`
- [ ] Copy Client ID and Client Secret
- [ ] In Supabase Dashboard > Authentication > Providers > Google:
  - [ ] Enable Google provider
  - [ ] Paste Client ID
  - [ ] Paste Client Secret
  - [ ] Click **Save**

### 3. Apple Sign In (Optional)

- [ ] Go to [Apple Developer Portal](https://developer.apple.com/)
- [ ] Create an App ID with Sign in with Apple enabled
- [ ] Create a Services ID
- [ ] Configure Services ID with domains and return URLs
- [ ] Create a private key (.p8 file)
- [ ] Note your Key ID and Team ID
- [ ] In Supabase Dashboard > Authentication > Providers > Apple:
  - [ ] Enable Apple provider
  - [ ] Enter Services ID (Client ID)
  - [ ] Enter Key ID
  - [ ] Enter Team ID
  - [ ] Paste Private Key contents
  - [ ] Click **Save**

### 4. Microsoft OAuth (Optional)

- [ ] Go to [Azure Portal](https://portal.azure.com/)
- [ ] Navigate to Azure Active Directory > App registrations
- [ ] Register a new application
- [ ] Add redirect URIs:
  - [ ] `https://hunrzxpemygzbgqqcakh.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:5173/auth/callback`
- [ ] Create a client secret
- [ ] Configure API permissions (email, openid, profile)
- [ ] Copy Application (client) ID and Client Secret
- [ ] In Supabase Dashboard > Authentication > Providers > Azure:
  - [ ] Enable Azure provider
  - [ ] Paste Client ID
  - [ ] Paste Client Secret
  - [ ] Set Azure Tenant to `common`
  - [ ] Click **Save**

## 🧪 Testing

### Before OAuth Configuration

- [ ] Start dev server: `npm run dev`
- [ ] Try clicking Google/Apple/Microsoft buttons
- [ ] Verify error message appears: "This login method is not configured..."
- [ ] Verify email/password login still works

### After OAuth Configuration

For each provider you configured:

- [ ] Click the OAuth button
- [ ] Verify redirect to provider login page
- [ ] Complete authentication on provider's page
- [ ] Verify redirect back to your app at `/auth/callback`
- [ ] Verify "Completing authentication..." message appears
- [ ] Verify redirect to dashboard
- [ ] Verify profile and workspace created
- [ ] Try logging out and logging back in

## 🔍 Troubleshooting

If OAuth doesn't work, check:

- [ ] Browser console for errors (look for `[OAuth]` and `[Login]` logs)
- [ ] Supabase logs for authentication errors
- [ ] Redirect URLs match exactly (no typos, trailing slashes)
- [ ] Provider is enabled in Supabase
- [ ] Client ID and Secret are correct
- [ ] OAuth credentials are active in provider dashboard

## 📚 Documentation References

- **Full Setup Guide**: [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- **Quick Start**: [OAUTH_QUICK_START.md](./OAUTH_QUICK_START.md)
- **Implementation Summary**: [OAUTH_IMPLEMENTATION_SUMMARY.md](./OAUTH_IMPLEMENTATION_SUMMARY.md)

## ⚡ Quick Links

- Supabase Dashboard: https://supabase.com/dashboard/project/hunrzxpemygzbgqqcakh
- Google Cloud Console: https://console.cloud.google.com/
- Apple Developer: https://developer.apple.com/account/
- Azure Portal: https://portal.azure.com/

## 🚀 Deployment

When deploying to production:

- [ ] Update Site URL in Supabase to production domain
- [ ] Add production redirect URL to Supabase
- [ ] Add production redirect URLs to each OAuth provider
- [ ] Test OAuth flow in production environment
- [ ] Monitor Supabase logs for any issues

---

**Note**: You can enable OAuth providers one at a time. Email/password authentication works immediately without any OAuth configuration.
