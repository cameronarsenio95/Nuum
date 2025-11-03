# NUUM Database Setup Guide

## Prerequisites
- Empty Supabase database (or clean slate)
- Supabase project created
- Access to Supabase SQL Editor

---

## Step 1: Apply Base Schema

Copy and paste the **ENTIRE** contents of this file into the Supabase SQL Editor:

```
supabase/migrations/00_COMPLETE_BASE_SCHEMA.sql
```

**This will create:**
- ✓ 11 core tables (profiles, workspaces, workspace_members, creators, campaigns, etc.)
- ✓ All primary keys, foreign keys, and constraints
- ✓ All indexes for performance
- ✓ All RLS policies for security
- ✓ Proper column types and defaults

**Expected Output:**
```
============================================
BASE SCHEMA SETUP COMPLETE
============================================
Tables created: 11

Core Tables:
  ✓ profiles
  ✓ workspaces
  ✓ workspace_members
  ✓ creators
  ✓ campaigns
  ✓ campaign_creators
  ✓ deliverables
  ✓ tasks
  ✓ comments
  ✓ notifications
  ✓ activity_log
============================================
```

---

## Step 2: Apply Signup Fix Migration

After the base schema is successfully applied, run this migration:

```
supabase/migrations/20251103153228_fix_signup_500_error_security_definer.sql
```

**This will create:**
- ✓ Safe `ensure_workspace_owner_member()` trigger function with SECURITY DEFINER
- ✓ Safe `create_workspace_with_owner()` RPC function with SECURITY DEFINER
- ✓ Automatic workspace member creation
- ✓ Slug collision handling
- ✓ Comprehensive error handling

**Expected Output:**
```
============================================
SIGNUP FIX VERIFICATION
============================================
Trigger exists: true
Trigger function SECURITY DEFINER: true
RPC function SECURITY DEFINER: true

✓ SUCCESS: All components configured correctly
✓ Signup will no longer fail with 500 errors
✓ Both trigger and RPC use SECURITY DEFINER
✓ All errors are caught and logged without blocking
============================================
```

---

## Step 3: Verify Database Setup

Run these queries in Supabase SQL Editor to verify everything is working:

### Check Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected:** 11 tables listed

### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** All tables show `rowsecurity = true`

### Check Signup Policies
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE 'signup%'
ORDER BY tablename;
```

**Expected:**
- `profiles` - signup_profiles_insert
- `workspaces` - signup_workspaces_insert
- `workspace_members` - signup_workspace_members_insert

### Check Functions
```sql
SELECT
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname IN ('ensure_workspace_owner_member', 'create_workspace_with_owner')
ORDER BY proname;
```

**Expected:** Both functions show `is_security_definer = true`

---

## Step 4: Test User Signup

1. Open your application
2. Navigate to signup page
3. Fill in the form with:
   - Email: test@example.com
   - Password: TestPassword123
   - Company: Test Company
   - Use Case: Brand
4. Submit the form
5. Check browser console for success logs

**Expected Console Output:**
```
[SIGNUP] User created: <uuid>
[SIGNUP] Session established and verified
[SIGNUP] Profile created successfully
[SIGNUP] Workspace creation result: { success: true, workspace_id: "...", membership_id: "...", slug: "..." }
[SIGNUP] ✅ Workspace and membership created successfully
[SIGNUP] Signup completed successfully!
```

---

## Troubleshooting

### Issue: "relation 'profiles' does not exist"
**Solution:** Run Step 1 first (base schema)

### Issue: "function create_workspace_with_owner does not exist"
**Solution:** Run Step 2 (signup fix migration)

### Issue: Still getting 500 errors
**Solution:**
1. Check Supabase logs for detailed error
2. Verify both functions have `SECURITY DEFINER` (see Step 3)
3. Check that RLS is enabled on all tables

### Issue: "permission denied for table workspace_members"
**Solution:** RLS policies are working correctly - this means the signup flow needs to use the RPC function, not direct inserts

---

## What Each Migration Does

### Base Schema (`00_COMPLETE_BASE_SCHEMA.sql`)
Creates the foundational database structure with proper relationships, constraints, and security policies. This is everything needed for the NUUM platform to function.

### Signup Fix (`20251103153228_fix_signup_500_error_security_definer.sql`)
Fixes the HTTP 500 error during signup by:
- Making database functions run with elevated privileges (SECURITY DEFINER)
- Adding comprehensive error handling that never blocks signup
- Implementing automatic slug collision resolution
- Ensuring workspace membership is created automatically via trigger

---

## Database Architecture

```
auth.users (Supabase Auth)
    ↓
profiles (1:1 with auth.users)
    ↓
workspaces (owned by users)
    ↓
workspace_members (many-to-many: users ↔ workspaces)
    ↓
├─ creators (workspace-specific)
├─ campaigns (workspace-specific)
│   ├─ campaign_creators (links campaigns ↔ creators)
│   └─ deliverables (campaign content)
├─ tasks (workspace or campaign-specific)
├─ comments (on any entity)
├─ notifications (for users)
└─ activity_log (workspace activity)
```

---

## Security Model

All tables use Row Level Security (RLS) with these principles:

1. **Workspace Isolation**: Users can only see data from workspaces they're members of
2. **Role-Based Access**: Different actions require different roles (owner, admin, member, viewer)
3. **Self-Service**: Users can always insert their own profile and create workspaces they own
4. **Audit Trail**: All critical actions are logged in activity_log

---

## Next Steps After Setup

1. Test signup with multiple users
2. Verify workspace creation works
3. Test creating campaigns, creators, tasks
4. Verify RLS policies work (users can't see other workspaces)
5. Test OAuth flows if configured

---

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Database → Logs)
2. Review browser console for detailed error messages
3. Verify all migrations ran successfully
4. Check that environment variables are correct (.env file)
