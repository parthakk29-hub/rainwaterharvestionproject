# Boondh - Rainwater Harvesting Calculator

## Overview

Boondh is a full-stack web application designed to help users calculate the potential water collection and cost savings from rainwater harvesting systems. The application guides users through a multi-step onboarding process to collect their location and rooftop specifications, then provides personalized calculations and a comprehensive dashboard with water collection insights.

The application features a modern React frontend with TypeScript, a Node.js/Express backend, PostgreSQL database with Drizzle ORM, and integrates with Replit's authentication system for user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

The frontend follows a page-based architecture with protected routes that redirect unauthenticated users. The application implements a multi-step onboarding flow (Registration → Location → Rooftop → Dashboard) that guides users through data collection.

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Authentication**: Replit OpenID Connect (OIDC) integration with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **Error Handling**: Centralized error middleware with structured error responses
- **Development**: Custom Vite integration for full-stack development with HMR

The backend implements a layered architecture with separate concerns for authentication, routing, and data access through a storage abstraction layer.

### Database Architecture
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Design**: 
  - Users table for authentication data
  - User profiles for personal and location information  
  - Water calculations for storing computed results
  - Sessions table for authentication state
- **Data Validation**: Zod schemas shared between frontend and backend for consistent validation

The database schema separates user authentication data from profile information, allowing for flexible user onboarding and data collection workflows.

### Authentication & Authorization
- **Provider**: Replit OAuth2/OIDC for seamless integration with Replit environment
- **Flow**: Server-side authentication with session-based state management
- **Security**: HTTP-only cookies, secure session storage, and CSRF protection
- **User Management**: Automatic user creation/updates on successful authentication

Authentication is handled entirely server-side with session-based state management, eliminating the need for client-side token handling while maintaining security.

## External Dependencies

### Third-Party Services
- **Replit Authentication**: OAuth2/OIDC provider for user authentication and authorization
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Weather/Climate APIs**: Integrated for rainfall data and climate zone information (implementation pending)

### Development Dependencies
- **Vite**: Fast build tool and development server with React plugin
- **Replit Development Tools**: Runtime error overlay and cartographer for enhanced development experience
- **ESBuild**: Fast TypeScript/JavaScript bundling for production builds

### UI/UX Libraries
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Modern icon library for consistent iconography
- **date-fns**: Lightweight date utility library for formatting and calculations

The application is designed to run seamlessly in the Replit environment while maintaining portability to other hosting platforms through environment variable configuration and standard web technologies.