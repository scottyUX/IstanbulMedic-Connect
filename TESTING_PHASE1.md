# Testing Phase 1: Google OAuth Login

## Prerequisites

1. **Supabase Project Setup**
   - You need a Supabase project
   - Get your Supabase Project URL and Anon Key from Supabase Dashboard

2. **Google OAuth Credentials**
   - Google Cloud Console project
   - OAuth 2.0 Client ID and Secret
   - Authorized redirect URIs configured

## Step-by-Step Testing Guide

### 1. Configure Environment Variables

Create or update `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Other existing variables...
OPENAI_API_KEY=your_openai_api_key_here
CAL_COM_API_KEY=your_cal_com_api_key_here
CAL_COM_EVENT_TYPE_ID=4097546
```

**To get your Supabase credentials:**
1. Go to https://app.supabase.com/project/YOUR_PROJECT_REF/settings/api
2. Copy the "Project URL" and "anon public" key
3. Paste them in `.env.local`

### 2. Configure Google OAuth in Supabase

1. Go to Supabase Dashboard: https://app.supabase.com/project/YOUR_PROJECT_REF/auth/providers
2. Find "Google" provider and click "Enable"
3. Add your Google OAuth credentials:
   - **Client ID (for OAuth)**: From Google Cloud Console
   - **Client Secret (for OAuth)**: From Google Cloud Console
4. **Important**: Add redirect URL:
   - For local development: `http://localhost:3000/auth/callback`
   - For production: `https://your-domain.com/auth/callback`

### 3. Set Up Google OAuth in Google Cloud Console

If you don't have Google OAuth credentials yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API" or "Google Identity Services"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen (if not done)
6. Create OAuth client:
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for local dev)
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (Supabase callback)
7. Copy Client ID and Client Secret
8. Add them to Supabase Dashboard (step 2 above)

### 4. Start the Development Server

```bash
cd /Users/scottdavis/GenUI/gen-ui-playground
npm run dev
```

The server should start on `http://localhost:3000`

### 5. Test the Login Flow

#### Test 1: Access Login Page
1. Open browser: `http://localhost:3000/auth/login`
2. You should see:
   - "Welcome to Leila" heading
   - "Sign in with Google" button with Google logo
   - Clean, styled login page

#### Test 2: Google OAuth Flow
1. Click "Sign in with Google" button
2. You should be redirected to Google sign-in page
3. Sign in with your Google account
4. Grant permissions if prompted
5. You should be redirected back to: `http://localhost:3000/leila`
6. Check browser console for any errors

#### Test 3: Session Persistence
1. After logging in, refresh the page (`Cmd+R` or `F5`)
2. You should remain logged in (not redirected to login)
3. Check browser DevTools → Application → Cookies
4. You should see Supabase session cookies

#### Test 4: Logout (if implemented in UI)
- If you add a logout button, test that it clears the session
- After logout, visiting `/leila` should redirect to `/auth/login`

### 6. Verify Authentication State

#### Check Browser Console
Open DevTools Console and check for:
- No Supabase configuration warnings
- No authentication errors
- Session refresh messages (from middleware)

#### Check Network Tab
1. Open DevTools → Network tab
2. Look for requests to:
   - `/auth/callback` - Should return 302 redirect
   - Supabase auth endpoints - Should return 200 OK
   - `/api/user` (if Phase 2 is implemented) - Should return user data

### 7. Test Error Handling

#### Test 1: Missing Supabase Config
1. Temporarily remove Supabase env vars from `.env.local`
2. Restart dev server
3. Visit `/auth/login`
4. Should show warning in console (but not crash)
5. Button should be disabled or show error

#### Test 2: Invalid OAuth Config
1. Use wrong Google OAuth credentials in Supabase
2. Try to log in
3. Should show error message on login page

#### Test 3: OAuth Callback Error
1. Manually visit: `http://localhost:3000/auth/callback?error=auth_callback_error`
2. Should redirect to login page with error message

## Expected Behavior

✅ **Success Indicators:**
- Login page loads without errors
- Google OAuth button is clickable
- Redirects to Google sign-in page
- After sign-in, redirects to `/leila`
- Session persists across page refreshes
- No console errors

❌ **Failure Indicators:**
- Login page shows "Supabase not configured" warning
- Button doesn't trigger OAuth flow
- Stuck on redirect loop
- Session doesn't persist
- Console shows authentication errors

## Troubleshooting

### Issue: "Supabase environment variables are missing"
**Solution:** Check `.env.local` file exists and has correct variable names (must start with `NEXT_PUBLIC_`)

### Issue: OAuth redirect doesn't work
**Solution:** 
- Verify redirect URL in Supabase matches exactly: `http://localhost:3000/auth/callback`
- Check Google Cloud Console authorized redirect URIs
- Ensure Supabase callback URL is also added: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### Issue: Session doesn't persist
**Solution:**
- Check middleware.ts is in root directory
- Verify cookies are being set (check DevTools → Application → Cookies)
- Check middleware matcher pattern includes your routes

### Issue: Redirects to wrong page
**Solution:**
- Check `app/auth/callback/route.ts` - default redirect is `/leila`
- Verify `/leila` page exists
- Check for any route protection logic

## Next Steps After Testing

Once Phase 1 is verified working:
1. ✅ Users can log in with Google
2. ✅ Sessions persist
3. Ready for Phase 2: Fetch user data from database
4. Ready for Phase 3: Expose user context to CopilotKit agent

## Quick Test Script

You can also test programmatically:

```bash
# Check if server is running
curl http://localhost:3000/auth/login

# Should return HTML with login page
```
