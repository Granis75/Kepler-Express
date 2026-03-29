# Kepler Express Ops

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase-ready domain model and schema docs

## Included

- Dashboard with operational KPIs
- Mission control view with search
- Expense tracking with reimbursement status
- Fleet health / maintenance visibility
- Invoice follow-up
- Settings and entity management pages

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Deploy on GitHub + Vercel

1. Create a new GitHub repository.
2. Upload all files from this folder.
3. Import the repository into Vercel.
4. In Vercel:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy.

## Notes

- `supabase/schema.sql` and `supabase/SCHEMA.md` describe the target backend schema.
- `src/lib/mockData.ts` powers the current UI until the real backend is connected.
