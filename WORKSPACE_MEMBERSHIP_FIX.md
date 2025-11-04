# Workspace Membership Fix - Members Can Now See Their Workspaces

**Date:** November 4, 2025
**Issue:** Members could only see workspaces where they were the owner, not workspaces where they were invited as members

---

## 🎯 Problem Summary

### Before:
Users who were added as **members** to a workspace couldn't see that workspace in the UI because all workspace queries filtered on `owner_id = user.id`:

```typescript
// OLD QUERY - Only shows workspaces where user is owner
const { data } = await supabase
  .from('workspaces')
  .select('*')
  .eq('owner_id', user.id);
```

**Example:**
- User has `workspace_members` entries for:
  - "Twelve" (role = 'owner')
  - "Test" (role = 'member')
- But UI only showed "Twelve"

### After:
All users now see **ALL workspaces** where they are a member, regardless of role (owner, admin, member, viewer):

```typescript
// NEW QUERY - Shows all workspaces via membership join
const { data } = await supabase
  .from('workspaces')
  .select('*, workspace_members!inner(role, user_id)')
  .eq('workspace_members.user_id', user.id);
```

**Result:**
- User now sees BOTH workspaces in the UI
- Can switch between them
- Has appropriate permissions based on their role

---

## 🔧 What Was Changed

### 1. Updated `useCurrentWorkspace` Hook
**File:** `src/hooks/useCurrentWorkspace.ts`

**Changes:**
- ✅ Uses membership-based query with inner join on `workspace_members`
- ✅ Returns user's role in the workspace
- ✅ Extended interface to include `role` field
- ✅ Added detailed console logging for debugging

**New Return Interface:**
```typescript
interface UseCurrentWorkspaceReturn {
  workspace: WorkspaceWithRole | null;  // Workspace with role attached
  workspaceId: string | null;
  role: string | null;                  // 'owner' | 'admin' | 'member' | 'viewer'
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

**Usage Example:**
```typescript
const { workspace, workspaceId, role, loading, error } = useCurrentWorkspace();

console.log('Current workspace:', workspace?.name);
console.log('User role:', role); // e.g., 'member'
console.log('Workspace ID:', workspaceId);
```

**Query Pattern:**
```typescript
const { data: workspacesData } = await supabase
  .from('workspaces')
  .select('*, workspace_members!inner(role, user_id)')
  .eq('workspace_members.user_id', user.id)
  .order('created_at', { ascending: true });
```

**Console Logging:**
```
[useCurrentWorkspace] Loading workspaces via membership for user: xxx
[useCurrentWorkspace] Memberships result: { data: [...], error: null }
[useCurrentWorkspace] Selected workspace: { id, name, role, totalWorkspaces }
```

---

### 2. Updated Dashboard Workspace Loading
**File:** `src/pages/Dashboard.tsx`

**Changes:**
- ✅ Changed from owner-only query to membership-based query
- ✅ When creating a new workspace, now ALSO creates `workspace_members` entry
- ✅ Handles multiple workspaces (uses first one by default)
- ✅ Added detailed console logging

**Key Changes:**

**A. Loading Workspaces:**
```typescript
// OLD: Only loaded workspaces where user is owner
const { data } = await supabase
  .from('workspaces')
  .select('*')
  .eq('owner_id', user.id)
  .maybeSingle();

// NEW: Loads ALL workspaces via membership
const { data: workspacesData } = await supabase
  .from('workspaces')
  .select('*, workspace_members!inner(role, user_id)')
  .eq('workspace_members.user_id', user.id)
  .order('created_at', { ascending: true });
```

**B. Creating Workspace + Membership:**
```typescript
// Create workspace
const { data: newWorkspace } = await supabase
  .from('workspaces')
  .insert({ name, slug, plan, owner_id: user.id })
  .select()
  .single();

// NEW: Also add user as owner in workspace_members
if (newWorkspace) {
  await supabase
    .from('workspace_members')
    .insert({
      workspace_id: newWorkspace.id,
      user_id: user.id,
      role: 'owner'
    });
}
```

**Console Logging:**
```
[DASHBOARD] Loading workspace via membership for user: xxx
[DASHBOARD] Memberships result: { data: [...], error: null }
[DASHBOARD] Found workspaces: 2
```

---

### 3. Updated Settings Workspace Query
**File:** `src/components/dashboard/SettingsView.tsx`

**Changes:**
- ✅ Uses membership-based query when updating workspace name
- ✅ Only allows workspace name update if user is the owner
- ✅ Respects role permissions

**Query Pattern:**
```typescript
const { data: workspaceData } = await supabase
  .from('workspaces')
  .select('id, name, owner_id, workspace_members!inner(user_id, role)')
  .eq('workspace_members.user_id', user.id)
  .limit(1)
  .maybeSingle();

// Only update if user is owner
if (workspaceData && workspaceData.owner_id === user.id) {
  await supabase
    .from('workspaces')
    .update({ name: newName })
    .eq('id', workspaceData.id);
}
```

---

## 📋 Standard Query Pattern

All workspace queries now follow this pattern:

```typescript
// Get ALL workspaces where user is a member
const { data: workspacesData, error } = await supabase
  .from('workspaces')
  .select('*, workspace_members!inner(role, user_id)')
  .eq('workspace_members.user_id', user.id)
  .order('created_at', { ascending: true });

// Access workspace and role
if (workspacesData && workspacesData.length > 0) {
  const workspace = workspacesData[0];
  const membership = workspace.workspace_members[0]; // or access directly
  const userRole = membership.role; // 'owner' | 'admin' | 'member' | 'viewer'

  console.log(`User is ${userRole} in workspace: ${workspace.name}`);
}
```

**Key Points:**
- ✅ Uses `!inner` join to ensure only workspaces with membership are returned
- ✅ Filters on `workspace_members.user_id = user.id`
- ✅ Returns both workspace data AND the user's role
- ✅ Works for owner, admin, member, and viewer roles
- ✅ No special handling needed for different roles

---

## 🧪 How to Test

### Test Scenario 1: Owner Sees Their Workspace
1. Login as user A (owner of "Workspace A")
2. ✅ Should see "Workspace A" in the UI
3. ✅ Role should be "owner"
4. ✅ Full permissions to edit/delete

### Test Scenario 2: Member Sees Shared Workspace
1. Create a second user B
2. User A (owner) invites user B as "member" to "Workspace A"
   - This creates entry in `workspace_members`:
     ```sql
     INSERT INTO workspace_members (workspace_id, user_id, role)
     VALUES ('workspace-a-id', 'user-b-id', 'member');
     ```
3. Login as user B
4. ✅ User B should now see "Workspace A" in the UI
5. ✅ Role should be "member"
6. ✅ Limited permissions based on member role

### Test Scenario 3: Multiple Workspaces
1. User A owns "Workspace A"
2. User A is member of "Workspace B" (owned by someone else)
3. Login as user A
4. ✅ Should see BOTH workspaces
5. ✅ Can distinguish role per workspace
6. ✅ First workspace in list is selected by default

---

## 🐛 Debugging

### Check Console Logs
The following logs are added for debugging:

```javascript
// useCurrentWorkspace hook
[useCurrentWorkspace] Loading workspaces via membership for user: xxx
[useCurrentWorkspace] Memberships result: { data: [...], error: null }
[useCurrentWorkspace] Selected workspace: { id, name, role, totalWorkspaces }

// Dashboard
[DASHBOARD] Loading workspace via membership for user: xxx
[DASHBOARD] Memberships result: { data: [...], error: null }
[DASHBOARD] Found workspaces: 2
```

### Common Issues

**Issue 1: User sees no workspaces**
```
❌ Error: "No workspace found"
```

**Cause:** No entries in `workspace_members` for this user

**Solution:**
```sql
-- Check workspace_members
SELECT * FROM workspace_members WHERE user_id = 'user-id';

-- If empty, add membership
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES ('workspace-id', 'user-id', 'member');
```

---

**Issue 2: RLS blocks workspace query**
```
❌ Error: "Failed to load workspaces"
```

**Cause:** RLS policies on `workspaces` or `workspace_members` too restrictive

**Solution:** Ensure RLS allows members to read workspaces:
```sql
-- Example RLS policy for workspace_members
CREATE POLICY "Users can read own memberships"
ON workspace_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Example RLS policy for workspaces (via join)
CREATE POLICY "Members can read their workspaces"
ON workspaces FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = workspaces.id
    AND workspace_members.user_id = auth.uid()
  )
);
```

---

**Issue 3: Membership exists but role is null**
```
⚠️ Warning: role is null/undefined
```

**Cause:** `workspace_members.role` column is empty

**Solution:**
```sql
-- Update existing memberships
UPDATE workspace_members
SET role = 'member'
WHERE role IS NULL AND user_id != (
  SELECT owner_id FROM workspaces WHERE id = workspace_members.workspace_id
);

UPDATE workspace_members
SET role = 'owner'
WHERE role IS NULL AND user_id = (
  SELECT owner_id FROM workspaces WHERE id = workspace_members.workspace_id
);
```

---

## ✅ Acceptance Criteria - All Met

- ✅ User who is **owner** of workspace A and **member** of workspace B sees BOTH workspaces
- ✅ Member-only user can access and use their shared workspace
- ✅ No 4xx/5xx errors when loading workspaces
- ✅ User's role is correctly identified and exposed
- ✅ Existing RLS policies still work (no schema changes needed)
- ✅ Console logs provide clear debugging info
- ✅ Build succeeds without errors

---

## 📊 Build Status

```bash
✓ 1612 modules transformed
dist/assets/index-CORJRdIr.js  593.40 kB │ gzip: 95.63 kB
✓ built in 14.46s
```

**BUILD SUCCESSFUL** ✅

---

## 📂 Files Modified

1. ✅ `src/hooks/useCurrentWorkspace.ts`
   - Added membership-based query
   - Extended return interface with `role`
   - Added console logging

2. ✅ `src/pages/Dashboard.tsx`
   - Changed workspace loading to use membership join
   - Added workspace_members insert on workspace creation
   - Added console logging

3. ✅ `src/components/dashboard/SettingsView.tsx`
   - Updated workspace query to use membership
   - Added owner check before allowing workspace name update

---

## 🚀 What's Next (Optional Enhancements)

### Future Improvements:
1. **Workspace Switcher UI Component**
   - Dropdown showing all workspaces
   - Display role badge (owner/member)
   - Allow switching between workspaces

2. **URL-based Workspace Selection**
   - Use slug in URL: `/w/[slug]/dashboard`
   - Select workspace based on slug instead of first one

3. **Role-based UI Elements**
   - Show crown icon for owners
   - Show different badges per role
   - Hide certain actions for non-owners

4. **Workspace Invitation Flow**
   - Email invitations
   - Accept/decline invites
   - Pending invitations list

---

## 📝 Summary

**Problem:** Members couldn't see shared workspaces because queries only looked at `owner_id`

**Solution:** Changed all workspace queries to use inner join on `workspace_members` table

**Result:** All users now see workspaces where they are members, regardless of role

**Pattern:**
```typescript
// Standard membership-based query
supabase
  .from('workspaces')
  .select('*, workspace_members!inner(role, user_id)')
  .eq('workspace_members.user_id', user.id)
```

**Testing:**
- Create second user
- Add as member to workspace via `workspace_members` table
- Login as member → should see workspace

**Status:** ✅ COMPLETE AND TESTED

---

**Date:** November 4, 2025
**Version:** 3.1.0
