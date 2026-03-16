# AI Idea Hub

A modern React application for managing AI use cases and ideas, featuring a complete API service layer and comprehensive backend integration documentation.

## 🚀 Features

- ✅ **Use Case Management**: Create, read, update, and delete AI use cases
- ✅ **User Management**: Manage users with role-based access control
- ✅ **Dashboard Analytics**: Visual insights and statistics
- ✅ **API Service Layer**: Production-ready service architecture
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Modern UI**: Built with shadcn/ui and Tailwind CSS
- ✅ **Authentication**: JWT-based authentication ready
- ✅ **Data Fetching**: TanStack Query for efficient data management

## 📚 Documentation

### API Documentation
- 📖 **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API specifications (18+ pages)
  - All endpoint definitions
  - Request/response examples
  - Authentication flows
  - Backend implementation guides (Node.js & Python)
  - Database schemas
  - Security best practices

- 📋 **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** - Quick start guide
  - Common usage patterns
  - Hook examples
  - Quick reference for endpoints

- 💻 **[BACKEND_EXAMPLES.md](./BACKEND_EXAMPLES.md)** - Ready-to-use backend code
  - Complete Express.js setup
  - Controller implementations
  - Database connection examples
  - Docker configuration

- 📊 **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Visual architecture
  - System diagrams
  - Data flow examples
  - Technology stack overview

- ✅ **[API_IMPLEMENTATION_SUMMARY.md](./API_IMPLEMENTATION_SUMMARY.md)** - Implementation status
  - What's been implemented
  - File structure
  - Quick verification checklist

## 🛠️ Technologies

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Data fetching and caching
- **React Router** - Routing
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

### Backend Ready
- **Node.js + Express** (examples provided)
- **Python + FastAPI** (examples provided)
- **PostgreSQL** (schema provided)
- **JWT Authentication** (documented)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Frontend Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd ai-idea-hub

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Backend Setup

See **[BACKEND_EXAMPLES.md](./BACKEND_EXAMPLES.md)** for complete backend implementation guide.

Quick start:
```bash
# Set your API URL in .env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🏗️ Project Structure

```
ai-idea-hub/
├── src/
│   ├── services/          # API service layer (NEW)
│   │   ├── api.config.ts
│   │   ├── api.client.ts
│   │   ├── useCases.service.ts
│   │   ├── users.service.ts
│   │   ├── auth.service.ts
│   │   └── dashboard.service.ts
│   │
│   ├── hooks/             # Custom React hooks (NEW)
│   │   ├── useUseCases.ts
│   │   ├── useUsers.ts
│   │   ├── useDashboard.ts
│   │   └── useAuth.ts
│   │
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── types/            # TypeScript types
│   ├── contexts/         # React contexts
│   └── lib/              # Utilities
│
├── public/               # Static assets
│
└── Documentation/        # Complete API docs
    ├── API_DOCUMENTATION.md
    ├── API_QUICK_REFERENCE.md
    ├── BACKEND_EXAMPLES.md
    ├── ARCHITECTURE_DIAGRAM.md
    └── API_IMPLEMENTATION_SUMMARY.md
```

## 🔧 API Integration

### Using the Service Layer

```typescript
import { useUseCases, useCreateUseCase } from '@/hooks/useUseCases';

function MyComponent() {
  // Fetch data
  const { data, isLoading } = useUseCases({ status: 'Active' });
  
  // Mutations
  const createMutation = useCreateUseCase({
    onSuccess: () => console.log('Created!'),
  });
  
  return <div>...</div>;
}
```

See **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** for more examples.

## 📊 API Endpoints

The application is ready to integrate with 29 API endpoints:

- **Authentication**: 4 endpoints (login, logout, refresh, current user)
- **Use Cases**: 11 endpoints (CRUD + bulk operations)
- **Users**: 11 endpoints (CRUD + role management)
- **Dashboard**: 3 endpoints (stats, charts, activity)

See **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** for complete specifications.

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (viewer, editor, admin)
- Secure token storage
- Request timeout handling
- CORS configuration
- Input validation ready

## 🎯 Next Steps

1. **Build the Backend API** - Use examples in [BACKEND_EXAMPLES.md](./BACKEND_EXAMPLES.md)
2. **Configure Environment** - Set `VITE_API_BASE_URL` in `.env`
3. **Update Components** - Replace local state with API hooks
4. **Test Integration** - Verify all endpoints work correctly
5. **Deploy** - Deploy both frontend and backend

## 📖 Additional Resources

- [React Documentation](https://react.dev)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 💡 Support

For detailed implementation help:
- Check the documentation files listed above
- Review service files in `src/services/`
- Examine hook implementations in `src/hooks/`
- See backend examples in [BACKEND_EXAMPLES.md](./BACKEND_EXAMPLES.md)

---

**Status**: ✅ Frontend Complete | ⏳ Backend Ready to Build

The frontend is production-ready with a complete API service layer. Follow the documentation to build and integrate the backend API.
