# NUUM - Creator Management Platform

> All your creator data. One system.

NUUM is a modern creator management platform that helps brands and agencies centralize creator data, manage campaigns, and organize UGC content in one powerful system.

## Features

- **Unified Creator Profiles** - Every creator's stats, content, and contacts in one place
- **Campaign Analytics** - Track engagement, reach, and ROI across all collaborations
- **UGC Library & Rights** - Auto-collect, tag, and reuse UGC with built-in rights tracking
- **Team Collaboration** - Work together with your team in shared workspaces
- **Revenue Tracking** - Monitor campaign performance and creator revenue
- **Task Management** - Assign and track tasks across campaigns and team members
- **Ad Set Management** - Organize and track advertising campaigns
- **Dark/Light Mode** - Beautiful interface that adapts to your preference

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/nuum.git
   cd nuum
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Add your Supabase credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Run database migrations in Supabase SQL Editor (from `supabase/migrations/`)

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:5173](http://localhost:5173) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
nuum/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   ├── modals/       # Modal components
│   │   └── support/      # Support dashboard components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Library configurations
│   ├── pages/            # Page components
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles
├── supabase/
│   └── migrations/       # Database migrations
├── public/               # Static assets
└── ...config files
```

## Database Schema

The application uses a comprehensive PostgreSQL schema with:

- **Workspaces** - Multi-tenant workspace system
- **Creators** - Creator profiles with social media data
- **Campaigns** - Marketing campaigns with tracking
- **Campaign Creators** - Many-to-many relationships
- **Tasks** - Task management system
- **Content Media** - UGC content library
- **Notes** - Contextual notes system
- **Ad Sets** - Advertising campaign organization
- **Profiles** - User profiles
- **Support System** - Customer support infrastructure

All tables include Row Level Security (RLS) policies for data protection.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for various platforms.

### Quick Deploy

**Vercel** (Recommended):
```bash
npm i -g vercel
vercel
```

**Netlify**:
```bash
npm i -g netlify-cli
netlify deploy --prod
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Security

- All user inputs are sanitized
- Row Level Security (RLS) enabled on all database tables
- Authentication handled by Supabase Auth
- Data encrypted in transit and at rest
- GDPR compliant

## Performance

- Code splitting and lazy loading
- Optimized bundle size with tree shaking
- Image lazy loading
- Database query optimization with indexes
- Gzip/Brotli compression

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Email: support@nuum.app
- Documentation: https://docs.nuum.app
- Issues: https://github.com/your-org/nuum/issues

## Acknowledgments

- Design inspired by Linear and Vercel
- Built with amazing open-source tools
- Community feedback and contributions

---

Made with ❤️ by the NUUM team
