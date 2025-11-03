# Fixed Base Schema - Ready to Apply

## ✅ Issue Fixed

**Problem:** The original `00_COMPLETE_BASE_SCHEMA.sql` failed with:
```
ERROR: 42P01: relation "workspace_members" does not exist
```

**Root Cause:** RLS policies on the `workspaces` table referenced `workspace_members` before it was created.

**Solution:** Reorganized SQL into 3 parts:
1. Create ALL tables first (no policies)
2. Enable RLS on all tables
3. Create ALL policies (now all tables exist)

---

## 📁 Files

### ✅ Use This File (FIXED)
**File:** `supabase/migrations/00_COMPLETE_BASE_SCHEMA_FIXED.sql`

**Structure:**
```sql
-- PART 1: CREATE ALL TABLES
--   - profiles
--   - workspaces
--   - workspace_members
--   - creators
--   - campaigns
--   - campaign_creators
--   - deliverables
--   - tasks
--   - comments
--   - notifications
--   - activity_log

-- PART 2: ENABLE RLS ON ALL TABLES

-- PART 3: CREATE RLS POLICIES
--   (All tables now exist, so policies can reference them safely)
```

### ❌ Don't Use (Has Bug)
**File:** `supabase/migrations/00_COMPLETE_BASE_SCHEMA.sql`

This file has the table ordering issue and will fail.

---

## 🚀 How to Apply

### Step 1: Copy the FIXED File
1. Open `supabase/migrations/00_COMPLETE_BASE_SCHEMA_FIXED.sql`
2. Copy the ENTIRE contents (all ~700 lines)

### Step 2: Run in Supabase
1. Go to Supabase Dashboard
2. Navigate to: **SQL Editor**
3. Paste the SQL
4. Click **RUN**

### Step 3: Verify Success
You should see:
```
============================================
BASE SCHEMA SETUP COMPLETE
============================================
Tables created: 11
RLS policies created: 50+

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

Next Steps:
  1. Apply migration: 20251103153228_fix_signup_500_error_security_definer.sql
  2. Test user signup flow
============================================
```

---

## ✅ What Gets Created

### 11 Tables
1. **profiles** - User profile information
2. **workspaces** - Team workspaces with trial/subscription tracking
3. **workspace_members** - Workspace membership and roles
4. **creators** - Creator database
5. **campaigns** - Campaign management
6. **campaign_creators** - Campaign-creator assignments
7. **deliverables** - Content deliverables tracking
8. **tasks** - Task management
9. **comments** - Comments on entities
10. **notifications** - User notifications
11. **activity_log** - Activity tracking

### Security
- ✅ RLS enabled on ALL tables
- ✅ 50+ RLS policies enforcing workspace isolation
- ✅ Role-based access control (owner, admin, member, viewer)
- ✅ Signup policies for profiles, workspaces, workspace_members

### Indexes
- ✅ Foreign key indexes for performance
- ✅ Composite indexes for common queries
- ✅ Status indexes for filtering
- ✅ Unique constraints where needed

---

## 🔄 After Base Schema

Once this succeeds, apply the signup fix:
```
supabase/migrations/20251103153228_fix_signup_500_error_security_definer.sql
```

This adds:
- ✅ SECURITY DEFINER trigger function
- ✅ SECURITY DEFINER RPC function
- ✅ Automatic workspace member creation
- ✅ Slug collision handling

---

## ✅ Build Status

```bash
✓ 1610 modules transformed
✓ built in 11.16s
✅ No TypeScript errors
✅ No build errors
```

---

## 🎯 Summary

The FIXED base schema is ready to apply to your empty Supabase database:

1. **Use:** `00_COMPLETE_BASE_SCHEMA_FIXED.sql` ✅
2. **Avoid:** `00_COMPLETE_BASE_SCHEMA.sql` ❌
3. **Then Apply:** `20251103153228_fix_signup_500_error_security_definer.sql`

The fixed version creates tables in the correct order so all references work properly!
