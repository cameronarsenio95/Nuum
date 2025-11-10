# 🔒 SUPABASE CONFIGURATION - FIXED CREDENTIALS

## ⚠️ CRITICAL: DO NOT CHANGE THESE CREDENTIALS

This project uses **FIXED** Supabase credentials that must **NEVER** be changed or overwritten.

---

## ✅ Correct Configuration

### URL:
```
https://hunrzxpemygzbgqqcakh.supabase.co
```

### ANON KEY:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bnJ6eHBlbXlnemJncXFjYWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzE3OTgsImV4cCI6MjA3NTk0Nzc5OH0.2BSzFlIHjhAcjPj9opc7Pf_4nnrz9Na5aUoVLSkQsh4
```

### Supabase Dashboard:
```
https://supabase.com/dashboard/project/hunrzxpemygzbgqqcakh
```

---

## 📂 Configuration Files

### 1. `.env`
```env
VITE_SUPABASE_URL=https://hunrzxpemygzbgqqcakh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bnJ6eHBlbXlnemJncXFjYWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzE3OTgsImV4cCI6MjA3NTk0Nzc5OH0.2BSzFlIHjhAcjPj9opc7Pf_4nnrz9Na5aUoVLSkQsh4
```

### 2. `.env.example`
Same values as `.env` - marked as "DO NOT CHANGE"

### 3. `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

---

## 🚫 Never Do This

❌ Create a new Supabase project
❌ Change the URL or ANON KEY
❌ Use "auto-generated" or "Bolt Database" credentials
❌ Override environment variables during build/deploy

---

## ✅ Always Do This

✅ Use `import { supabase } from '../lib/supabase'` in all files
✅ Verify `.env` has correct credentials before building
✅ Check console for connection errors if issues arise
✅ Use the diagnostic logging to debug Supabase queries

---

## 🔍 Verification

To verify you're connected to the correct Supabase:

### In Browser Console:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
// Expected: https://hunrzxpemygzbgqqcakh.supabase.co
```

### Test Query:
```typescript
const { data, error } = await supabase
  .from('creators')
  .select('id, name')
  .limit(1);

console.log('Connected to:', data, error);
```

---

## 📊 Current Database State

As of last verification:
- **4 content items** (Cameron Cornelia)
- **13 creators** total
- **9 campaigns** total
- **11 ad sets** total

---

## 🆘 Troubleshooting

### If you see "Failed to load content":

1. **Check `.env` file:**
   ```bash
   cat .env | grep VITE_SUPABASE
   ```
   Should show `hunrzxpemygzbgqqcakh`

2. **Hard refresh browser:**
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

3. **Check console logs:**
   Look for `[LinkContentModal]` or `[CampaignDetail]` logs

4. **Verify Supabase connection:**
   Open Network tab and look for requests to `hunrzxpemygzbgqqcakh.supabase.co`

---

## 📝 Notes

- This configuration was set on **2025-11-10**
- Token expiry: **2075-09-47** (far future)
- Project ref: `hunrzxpemygzbgqqcakh`
- All MCP Supabase tools use these credentials automatically

---

**Last Updated:** 2025-11-10
**Status:** ✅ Active and Working
