# DARB Cold Email & Marketing Automation Platform

A comprehensive data collection and marketing automation platform built with Next.js, featuring role-based access control, real-time analytics, and automated campaign management.

## 📖 Overview

This platform is designed for B2B marketing teams to streamline their data collection, contact management, and email campaign workflows. It integrates with external data sources (Apify and Apollo API), manages contacts and companies, and automates email campaigns with performance tracking.

## ✨ Key Features

### 🔐 Authentication & Authorization
- **Better-Auth** integration with PostgreSQL database
- **Role-Based Access Control (RBAC)** with three roles:
  - **Admin**: Full system access, user management, all permissions
  - **Editor**: Content and campaign management, script execution
  - **Viewer**: Read-only access to data and analytics
- Secure password hashing with bcrypt
- Session management with configurable expiration

### 📊 Dashboard & Analytics
- Real-time statistics overview
- Activity feed and recent changes
- Performance metrics visualization with Recharts
- Quick action panels for common tasks
- Responsive design for mobile and desktop

### 💾 Data Management
- **Companies**: Store and manage company information
- **Contacts**: Organize and track contact details
- **Industries**: Categorize businesses by industry
- Advanced table views with sorting, filtering, and search
- Bulk import/export capabilities
- Duplicate prevention logic

### 🤖 Script Management
- Apify integration for web scraping
- Apollo API integration for B2B data
- Script switching mechanism
- Run logging and execution history
- Dashboard-based script controls (Start/Stop)
- Scheduled execution support

### 📧 Campaign Management
- Email template builder
- Contact segmentation
- Campaign scheduling
- Performance tracking
- Engagement analytics

### 👥 User Management (Admin Only)
- Create and manage user accounts
- Assign roles and permissions
- User activity monitoring
- Password management utilities

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Tables**: TanStack Table

### Backend & Database
- **Authentication**: Better-Auth
- **Database**: PostgreSQL with Drizzle ORM
- **ORM**: Drizzle ORM
- **API Client**: Axios with interceptors
- **Password Hashing**: bcrypt

### Developer Tools
- **Package Manager**: npm
- **TypeScript**: Type safety throughout
- **ESLint**: Code linting
- **Path Aliases**: `@/*` for clean imports

## 📦 Installation

### Prerequisites
- Node.js 20+
- npm or yarn
- PostgreSQL 14+ (running locally or remotely)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd darb_cold_email_nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL**
   Create a PostgreSQL database:
   ```sql
   CREATE DATABASE darb_cold_email;
   ```

4. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:3000/api

   # Database (PostgreSQL)
   DATABASE_URL=postgresql://username:password@localhost:5432/darb_cold_email

   # Better Auth
   BETTER_AUTH_SECRET=your-secret-key-here-change-in-production
   BETTER_AUTH_URL=http://localhost:3000

   # API Keys (optional)
   APIFY_API_KEY=your-apify-key
   APOLLO_API_KEY=your-apollo-key
   ```

5. **Run database migrations**
   ```bash
   # Run Better Auth migrations
   npm run migrate-auth

   # Run Drizzle migrations for companies/contacts
   npm run db:push
   ```

6. **Create an admin user**
   ```bash
   npm run create-admin
   ```
   Follow the prompts to create your admin account.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Getting Started

### First Login
1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Use the admin credentials you created during setup
4. Access the dashboard and start exploring

### Creating Users
Admins can create additional users:
- Go to **Dashboard** → **Settings** → **User Management**
- Click "Add User" and fill in the details
- Assign appropriate role (Admin/Editor/Viewer)

### Running Scripts
To collect data from external sources:
1. Navigate to **Scripts** page
2. Configure your Apify or Apollo script
3. Click "Run Script" to start collection
4. Monitor progress in real-time
5. View collected data in the **Data** section

### Creating Campaigns
To launch an email campaign:
1. Go to **Campaigns** page
2. Click "New Campaign"
3. Select contacts or create segments
4. Design your email template
5. Schedule or send immediately
6. Track performance in **Analytics**

## 📁 Project Structure

```
darb_cold_email_nextjs/
├── app/                        # Next.js app directory
│   ├── (auth)/                # Authentication routes
│   │   ├── login/            # Login page
│   │   └── register/         # Registration page
│   ├── dashboard/            # Dashboard routes
│   │   ├── account/         # User account page
│   │   ├── analytics/       # Analytics page
│   │   ├── campaigns/       # Campaign management
│   │   ├── data/            # Data management
│   │   ├── profile/         # User profile
│   │   ├── scripts/         # Script management
│   │   └── settings/        # Application settings
│   ├── api/                  # API routes
│   │   ├── auth/            # Auth endpoints
│   │   ├── profile/         # Profile endpoints
│   │   └── users/           # User management endpoints
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/               # React components
│   ├── campaigns/           # Campaign components
│   ├── data/                # Data management components
│   ├── layout/              # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── providers/           # Context providers
│   │   ├── AuthProvider.tsx
│   │   └── ThemeProvider.tsx
│   ├── scripts/             # Script components
│   ├── shared/              # Shared components
│   │   ├── PermissionGuard.tsx
│   │   └── RoleBadge.tsx
│   └── ui/                  # Shadcn UI components
├── docs/                     # Documentation
│   ├── Modular Data Collection & Marketing Automation System.md
│   ├── Profile_and_Settings.md
│   ├── PROJECT_STATUS.md
│   ├── RBAC_Guide.md
│   └── User Guide.md
├── hooks/                    # Custom React hooks
│   └── usePermissions.ts    # RBAC permissions hook
├── lib/                      # Utility libraries
│   ├── api-auth.ts          # Auth API helpers
│   ├── api.ts               # API client
│   ├── auth-client.ts       # Better-Auth client
│   ├── auth.ts              # Better-Auth server
│   ├── constants.ts         # App constants
│   ├── roles.ts             # RBAC definitions
│   └── utils.ts             # Utility functions
├── public/                   # Static assets
├── scripts/                  # CLI scripts
│   ├── create-admin.ts      # Create admin user
│   └── change-password.ts   # Change user password
├── store/                    # Zustand stores
│   ├── authStore.ts         # Auth state
│   └── uiStore.ts           # UI state
├── types/                    # TypeScript types
│   ├── auth.ts              # Auth types
│   ├── better-auth.d.ts     # Better-Auth types
│   ├── global.d.ts          # Global types
│   └── index.ts             # Main types
└── better-auth_migrations/   # Database migrations
```

## 🔑 Authentication

The application uses **Better-Auth** for authentication with the following features:

- Email/Password authentication
- Session management with cookie cache
- SQLite database storage
- Role-based user fields
- 7-day session expiration (configurable)
- Secure password hashing with bcrypt

### Creating Admin User

```bash
npm run create-admin
```

### Changing User Password

```bash
npm run change-password
```

## 🛡️ Role-Based Access Control

### Permission System

The app implements a comprehensive RBAC system. See [RBAC_Guide.md](docs/RBAC_Guide.md) for detailed documentation.

### Using Permissions in Code

```tsx
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/shared/PermissionGuard';

function MyComponent() {
  const { can, isAdmin } = usePermissions();

  return (
    <div>
      {/* Permission-based rendering */}
      <PermissionGuard permission="campaign:create">
        <Button>Create Campaign</Button>
      </PermissionGuard>

      {/* Programmatic check */}
      {can('data:edit') && <EditButton />}
    </div>
  );
}
```

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run create-admin` | Create admin user |
| `npm run change-password` | Change user password |

## 🔌 API Integration

### Apify Integration
Configure Apify actors for web scraping:
- Actor ID configuration
- Input schema setup
- Result processing
- Error handling

### Apollo API Integration
B2B data enrichment with:
- Industry filtering
- Location-based queries
- Company size filtering
- Job title targeting

## 🎨 UI Components

The project uses **Shadcn/UI** components built on Radix UI primitives:

- Accordion, Alert, Avatar
- Badge, Button, Card
- Dialog, Dropdown Menu
- Input, Label, Select
- Table, Tabs
- Toast notifications (Sonner)

Add new components with:
```bash
npx shadcn@latest add <component-name>
```

## 📖 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[RBAC_Guide.md](docs/RBAC_Guide.md)** - Role-based access control implementation
- **[PROJECT_STATUS.md](docs/PROJECT_STATUS.md)** - Current project status and roadmap
- **[User Guide.md](docs/User Guide.md)** - End-user documentation
- **[Profile_and_Settings.md](docs/Profile_and_Settings.md)** - Profile and settings features
- **[Modular Data Collection & Marketing Automation System.md](docs/Modular Data Collection & Marketing Automation System.md)** - System architecture

## 🔄 Development Workflow

### Making Changes
1. Create a feature branch
2. Make your changes
3. Test locally
4. Run linting: `npm run lint`
5. Commit and push
6. Create pull request

### Database Migrations
Database schema is managed through Better-Auth migrations:
- Migration files are in `better-auth_migrations/`
- Schema updates are applied automatically on app start
- Manual migrations can be added as needed

### Adding New Features
1. **Define types** in `/types`
2. **Create API routes** in `/app/api`
3. **Build components** in `/components`
4. **Add pages** in `/app/dashboard`
5. **Update permissions** in `/lib/roles.ts` (if needed)
6. **Document** in `/docs`

## 🚦 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes | `http://localhost:3000` |
| `DATABASE_URL` | SQLite database path | Yes | `./db.sqlite` |
| `BETTER_AUTH_SECRET` | Auth secret key | Yes | - |
| `BETTER_AUTH_URL` | Auth callback URL | Yes | - |
| `APIFY_API_KEY` | Apify API key | No | - |
| `APOLLO_API_KEY` | Apollo API key | No | - |

## 🐛 Troubleshooting

### Database Issues
If you encounter database errors:
```bash
# Delete the database and restart
rm db.sqlite
npm run dev
npm run create-admin
```

### Authentication Issues
- Clear browser cookies
- Check `BETTER_AUTH_SECRET` is set
- Verify session hasn't expired

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Login/Logout functionality
- [ ] Role-based access control
- [ ] Data CRUD operations
- [ ] Script execution
- [ ] Campaign creation
- [ ] Analytics display
- [ ] User management (admin)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add comments for complex logic
- Keep components small and focused

## 📝 License

This project is proprietary and confidential.

## 👥 Team & Support

For questions or support, contact the development team.

## 🗺️ Roadmap

### Phase 1: Core Features (Completed)
- ✅ Authentication system
- ✅ Role-based access control
- ✅ Dashboard layout
- ✅ Basic data management
- ✅ User management

### Phase 2: Data Collection (In Progress)
- 🔄 Apify integration
- 🔄 Apollo API integration
- 🔄 Script management UI
- 🔄 Run logging system

### Phase 3: Campaigns
- ⏳ Email template builder
- ⏳ Contact segmentation
- ⏳ Campaign scheduler
- ⏳ Sending infrastructure

### Phase 4: Analytics
- ⏳ Performance dashboards
- ⏳ Engagement tracking
- ⏳ Report generation
- ⏳ Export functionality

### Phase 5: Advanced Features
- ⏳ WebSocket real-time updates
- ⏳ Advanced filtering
- ⏳ Bulk operations
- ⏳ API documentation
- ⏳ Webhook integrations

## 📞 Contact

For technical support or inquiries, please contact the project maintainers.

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**

### First Time Setup
1. The database will be automatically initialized when you start the development server
2. Register a new account at `/register`
3. Login with your credentials at `/login`

### Features
- Email/Password authentication
- Session management (7 days)
- Protected routes with middleware
- Role-based access control (admin, editor, viewer)

## 📱 Available Pages

### Authentication
- `/login` - User login
- `/register` - User registration (to be implemented)

### Dashboard
- `/dashboard` - Main dashboard overview
- `/dashboard/data` - Data management (Companies, Contacts, Industries)
- `/dashboard/scripts` - Script configuration and execution
- `/dashboard/campaigns` - Campaign creation and management
- `/dashboard/analytics` - Performance analytics
- `/dashboard/settings` - Application settings

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
