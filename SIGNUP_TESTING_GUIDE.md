# Signup Testing & Diagnostic Guide
**Date:** 2025-10-31
**Status:** Enhanced Diagnostics Ready for Testing

---

## 🔧 Changes Made

### Enhanced Error Capture & Logging

**SignupModal.tsx:**
1. ✅ Full workspace creation payload logged
2. ✅ Complete workspace creation response logged
3. ✅ Replaced 100ms wait with **5 attempts × 300ms polling** (1.5 seconds total)
4. ✅ Each polling attempt logs full response
5. ✅ Comprehensive error object capture with JSON.stringify
6. ✅ SQL diagnostic query on failure (attempts to query workspace_members)
7. ✅ All error properties logged (code, message, details, hint, stack)

**AuthCallback.tsx:**
1. ✅ Full workspace creation payload logged
2. ✅ Complete workspace creation response logged
3. ✅ Same 5-attempt polling mechanism
4. ✅ Each attempt result logged in detail

---

## 🧪 Testing Instructions

### Step 1: Open Browser Console

1. Open your browser
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Clear any existing logs (click 🚫 clear button)
5. **Keep DevTools open** throughout the entire signup process

### Step 2: Attempt Signup

1. Navigate to the signup form
2. Fill in the form:
   - **Email:** `test-$(date +%s)@example.com` (or any unique email)
   - **Password:** `TestPassword123`
   - **Company Name:** `Test Company`
   - **Use Case:** Select any option
   - **Privacy Policy:** Check the box
3. Click **"Start Free Trial"**
4. **Watch the console** - logs will appear in real-time

### Step 3: Capture All Console Output

When the error occurs, **DO NOT CLOSE THE BROWSER** or refresh the page.

Look for these specific log entries in the console:

#### 1. Workspace Creation Payload
```
[SIGNUP] Workspace insert payload: {
  "name": "Test Company",
  "slug": "test-company-a1b2c3d4",
  "plan": "standard",
  "owner_id": "uuid-here",
  "trial_ends_at": "2025-11-14T...",
  "trial_started_at": "2025-10-31T...",
  "subscription_status": "trialing"
}
```

#### 2. Workspace Creation Response
```
[SIGNUP] Workspace creation response: {
  data: { ... },
  error: null or { code: "...", message: "...", ... },
  fullResponse: "{ ... }"
}
```

#### 3. Polling Attempts
```
[SIGNUP] Starting polling for workspace membership (5 attempts × 300ms)...
[SIGNUP] Polling attempt 1/5 for workspace_members...
[SIGNUP] Attempt 1 result: {
  found: false,
  data: null,
  error: null or { ... },
  fullResponse: "{ ... }"
}
```

#### 4. Error Object (if signup fails)
```
[SIGNUP] ❌❌❌ SIGNUP FAILED ❌❌❌
[SIGNUP] Full signup error: Error: ...
[SIGNUP] Error type: object
[SIGNUP] Error name: Error
[SIGNUP] Error message: "..."
[SIGNUP] Error stack: "Error: ...\n  at ..."
[SIGNUP] Error stringified: {
  "message": "...",
  "stack": "...",
  ...all other properties...
}
[SIGNUP] PostgreSQL Error Code: "23505" or "42501" (if present)
```

#### 5. SQL Diagnostic Query (if membership not found)
```
[SIGNUP] Running SQL diagnostic query...
[SIGNUP] SQL diagnostic result: {
  data: [ ... ],
  error: null or { ... },
  fullResult: "{ ... }"
}
```

---

## 📋 Information to Capture

### Required Information

Please copy **ALL** of the following from the browser console and provide it:

#### A. Workspace Creation Section
```
Find and copy everything from:
[SIGNUP] Creating workspace with slug: ...
...through...
[SIGNUP] Workspace creation response: ...
```

#### B. Polling Section
```
Find and copy everything from:
[SIGNUP] Starting polling for workspace membership...
...through...
[SIGNUP] Attempt 5 result: ...
```

#### C. Error Section (if present)
```
Find and copy everything from:
[SIGNUP] ❌❌❌ SIGNUP FAILED ❌❌❌
...through...
[SIGNUP] Error hint: ... (or last error-related line)
```

#### D. SQL Diagnostic (if present)
```
Find and copy:
[SIGNUP] SQL diagnostic result: { ... }
```

### How to Copy Console Output

**Option 1: Right-click → Save As**
1. Right-click anywhere in the Console
2. Select "Save as..."
3. Save the log file
4. Send the entire file

**Option 2: Select and Copy**
1. Click at the top of the console output
2. Scroll to bottom while holding Shift
3. Press Ctrl+C (Cmd+C on Mac)
4. Paste into a text file or message

**Option 3: Screenshot**
1. Take multiple screenshots covering all the console output
2. Make sure text is readable

---

## 🔍 What We're Looking For

### Scenario A: Workspace Creation Fails

**Indicators:**
```
[SIGNUP] Workspace creation response: {
  data: null,
  error: { code: "...", message: "..." }
}
```

**This means:**
- The workspace INSERT itself is failing
- Database trigger never fires because workspace wasn't created
- Check error code for reason (23505 = duplicate, 42501 = RLS denial, etc.)

### Scenario B: Workspace Created But Membership Not Found

**Indicators:**
```
[SIGNUP] Workspace creation response: {
  data: { id: "uuid", ... },
  error: null
}
[SIGNUP] Polling attempt 1/5: { found: false, data: null }
[SIGNUP] Polling attempt 2/5: { found: false, data: null }
...
[SIGNUP] ❌ Membership not found after all polling attempts
```

**This means:**
- Workspace created successfully
- Database trigger either:
  - Didn't fire at all
  - Fired but failed silently
  - Taking longer than 1.5 seconds (unlikely)
- SQL diagnostic query will show if membership exists but query can't see it

### Scenario C: RLS Policy Blocking Verification

**Indicators:**
```
[SIGNUP] Attempt 1 result: {
  found: false,
  data: null,
  error: { code: "42501", message: "permission denied" }
}
```

**This means:**
- Membership might exist but user can't SELECT it
- RLS policy issue on workspace_members SELECT

### Scenario D: Trigger Creates Membership, But After Polling

**Indicators:**
```
[SIGNUP] All 5 polling attempts: found: false
[SIGNUP] SQL diagnostic result: {
  data: [ { id: "uuid", role: "owner", ... } ]
}
```

**This means:**
- Trigger IS working but takes >1.5 seconds
- We need to increase polling attempts or delay

---

## 🎯 Expected Success Output

If signup works correctly, you should see:

```
[SIGNUP] Starting signup process for: test@example.com
[SIGNUP] Auth signup result: { authData: {...}, signupError: null }
[SIGNUP] User created: <uuid>
[SIGNUP] Session established and verified
[SIGNUP] Creating profile...
[SIGNUP] Profile created successfully
[SIGNUP] Creating workspace with slug: test-company-<uuid>
[SIGNUP] Workspace insert payload: { ... }
[SIGNUP] Workspace creation response: {
  data: { id: "<workspace-uuid>", ... },
  error: null
}
[SIGNUP] Workspace created: <workspace-uuid>
[SIGNUP] Starting polling for workspace membership (5 attempts × 300ms)...
[SIGNUP] Polling attempt 1/5 for workspace_members...
[SIGNUP] Attempt 1 result: {
  found: true,
  data: {
    id: "<membership-uuid>",
    role: "owner",
    workspace_id: "<workspace-uuid>",
    user_id: "<user-uuid>",
    created_at: "2025-10-31T..."
  }
}
[SIGNUP] ✅ Membership found on attempt 1!
[SIGNUP] ✅ Workspace membership verified successfully
[SIGNUP] Signup completed successfully!
```

---

## 📊 Manual SQL Verification

If you have access to the Supabase dashboard, run this query to check workspace_members:

```sql
-- Replace <user-uuid> with the actual user ID from console logs
SELECT
  wm.id as membership_id,
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.created_at,
  w.name as workspace_name,
  w.slug,
  w.owner_id
FROM public.workspace_members wm
JOIN public.workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = '<user-uuid>'
ORDER BY wm.created_at DESC
LIMIT 3;
```

**Expected result:**
- If trigger works: 1 row with role='owner', created_at immediately after workspace creation
- If trigger fails: 0 rows
- If timing issue: Row exists but created_at is after polling finished

---

## 🛠️ Troubleshooting Based on Results

### If Error Code 23505 (Duplicate Key)

**Likely cause:** Workspace slug already exists or somehow duplicate insert attempt still happening

**Debug:**
1. Check workspace creation response for error
2. If no error there, check polling attempts for error code
3. Look for any sign of duplicate INSERT

### If Error Code 42501 (Permission Denied)

**Likely cause:** RLS policy blocking operation

**Debug:**
1. Check which operation failed (workspace INSERT or membership SELECT)
2. Verify auth.uid() is available (should be in session establishment logs)
3. Check if user_id matches auth.uid()

### If "Membership not found after all attempts"

**Likely cause:** Trigger not firing or taking too long

**Debug:**
1. Check SQL diagnostic result - does membership exist in database?
2. If exists: Timing issue, increase polling attempts
3. If not exists: Trigger not working, need to investigate database

### If Membership Found But Wrong Role

**Likely cause:** Trigger logic error

**Debug:**
1. Check membership data logged
2. Should be role='owner', if different, trigger may have bug

---

## 🚀 Next Steps After Testing

Once you provide the console output, I will:

1. **Analyze the exact error** from the stringified error object
2. **Check workspace creation response** to see if workspace was created
3. **Review polling attempts** to understand timing
4. **Examine SQL diagnostic** to see database state
5. **Identify root cause** based on all the data
6. **Implement targeted fix** for the specific issue found

---

## 💡 Pro Tips

1. **Use Incognito/Private Window** for testing to avoid cache issues
2. **Use a unique email** each time you test (add timestamp)
3. **Don't refresh** the page until you've captured all console logs
4. **Copy everything** - more data is better than not enough
5. **Test both flows:**
   - Email/password signup (SignupModal)
   - OAuth signup if possible (Google/Apple/Microsoft)

---

## 📞 What to Send Me

Please provide:

✅ **Full console output** (text or screenshots)
✅ **Exact error message** shown to the user
✅ **Browser and version** (Chrome 120, Firefox 121, etc.)
✅ **Operating system** (Windows, Mac, Linux)
✅ **Any SQL query results** if you have database access

The more information you provide, the faster I can identify and fix the issue!

---

**Ready to test!** 🎯

Follow the steps above and send me the console output when the error occurs.
