# Brand Portal - High-Level Architecture Document

## Overview
The Brand Portal is a comprehensive digital asset management system designed to centralize brand resources and facilitate controlled distribution of brand assets across organizations.

## Core Architecture Components

### 1. Frontend Layer
- **Technology**: React with TypeScript
- **UI Framework**: DaisyUI 5 with Tailwind CSS 4
- **State Management**: TanStack Query for server state
- **Routing**: React Router
- **Build Tool**: Vite
- **Responsive Design**: 360px to 3840px viewport support

### 2. Backend Layer
- **Framework**: Next.js API Routes
- **Language**: TypeScript
- **Authentication**: Auth.js with SSO providers
- **API Design**: Dual API architecture (tRPC + REST)

### 3. Data Layer
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM (code-only, no migrations)
- **File Storage**: Object storage for assets (S3-compatible)
- **Caching**: Redis for session management and frequently accessed data

### 4. Infrastructure
- **Hosting**: Vercel (optimized for Next.js)
- **CDN**: For asset delivery
- **Security**: HTTPS, CORS, rate limiting

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                           │
│  ┌─────────────┬──────────────┬──────────────┬────────────────┐ │
│  │   Asset     │    User      │   Sharing    │  Organization  │ │
│  │  Browser    │  Dashboard   │   Portal     │     Admin      │ │
│  └─────────────┴──────────────┴──────────────┴────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Super Admin Panel                          │ │
│  │           (Platform Management Interface)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS/API
┌───────────────────────────┴─────────────────────────────────────┐
│                    API Layer (Next.js)                           │
│  ┌─────────────┬──────────────┬──────────────┬────────────────┐ │
│  │    Auth     │    Asset     │    Group     │  Organization  │ │
│  │  Service    │  Management  │  Management  │     Admin      │ │
│  └─────────────┴──────────────┴──────────────┴────────────────┘ │
│  ┌─────────────┬──────────────┬──────────────┬────────────────┐ │
│  │    Tier     │    Usage     │   Storage    │  Super Admin   │ │
│  │  Service    │   Tracking   │   Manager    │    Service     │ │
│  └─────────────┴──────────────┴──────────────┴────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │ Object Store │  │       Redis          │  │
│  │   (Neon)     │  │  (Multi-S3)  │  │  (Sessions/Cache)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## API Architecture

### Dual API Design
The Brand Portal implements a dual API architecture to serve different use cases:

#### Internal Communication (tRPC)
- **Purpose**: Type-safe communication between Next.js frontend and backend
- **Technology**: tRPC with TypeScript end-to-end type safety
- **Authentication**: Auth.js session-based authentication
- **Use Cases**: 
  - All user interface operations
  - Asset management workflows
  - Organization and user management
  - Real-time features and subscriptions

#### External API (REST)
- **Purpose**: Third-party integrations and external developer access
- **Technology**: RESTful endpoints with JSON responses
- **Authentication**: API key-based authentication
- **Use Cases**:
  - Third-party application integrations
  - Webhook deliveries
  - Mobile app backends
  - Partner platform connections

### API Layer Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Application                          │
│  ┌────────────────┐              ┌─────────────────────────────┐ │
│  │  React Client  │─────tRPC────▶│     tRPC Procedures         │ │
│  └────────────────┘              └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                           │
│  ┌─────────────────────────────┬─────────────────────────────────┐ │
│  │       tRPC Router          │        REST Endpoints           │ │
│  │  (Internal Operations)     │    (External Integrations)     │ │
│  └─────────────────────────────┴─────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 Shared Business Logic                        │ │
│  │        (Services, Validation, Database Operations)          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Key Modules

### 1. Authentication & Authorization Module
- SSO integration (Google/Office 365)
- Role-based access control (RBAC)
- Session management
- Token-based authentication

### 2. Asset Management Module
- File upload/download with progress tracking
- Metadata management (title, description, tags)
- Version control and history
- Search and filtering capabilities
- Support for multiple file types (images, videos, documents, design files)

### 3. Organization & User Management Module
- Multi-tenancy support
- User roles and permissions (Admin, User, Content Manager)
- Organization hierarchy
- User invitation system

### 4. Asset Grouping Module
- Dynamic asset collections
- Group metadata and descriptions
- Access control per group
- Nested group support

### 5. Sharing Module
- Password-protected links
- Time-limited access
- Analytics and tracking
- Public/private sharing options

### 6. Font & Color Management Module
- Font family management with previews
- Color palette tools with multiple format support (HEX, RGB, HSL)
- Export utilities
- Brand guideline integration

### 7. Tier Management Module
- Flexible tier configuration system
- System-level limits (user count, assets, storage)
- Feature-level restrictions (color palettes, password protection)
- Dynamic tier assignment and upgrades
- Usage monitoring and enforcement

### 8. Super Admin Module
- Platform-wide organization management
- Tier assignment and modification
- Cross-organization asset viewing
- Usage analytics and reporting
- System configuration management

### 9. Storage Configuration Module
- Dynamic S3 bucket configuration per organization
- Support for customer-provided S3 buckets
- Storage usage tracking and billing
- Multi-region support

## Data Model Overview

```
Tiers (1) ──> (N) Organizations
Organizations (1) ──> (N) Users
Organizations (1) ──> (1) StorageConfig
Users (N) ──> (N) Roles
Assets (N) ──> (1) Organization
Assets (N) ──> (N) AssetGroups
AssetGroups (N) ──> (N) SharedLinks
Assets (1) ──> (N) AssetVersions
Organizations (1) ──> (N) ColorPalettes
Organizations (1) ──> (N) FontFamilies
Organizations (1) ──> (1) UsageMetrics
SuperAdmins (N) ──> (N) Organizations (manage)
```

## Security Architecture

- **Authentication**: OAuth 2.0 with SSO providers
- **Authorization**: RBAC with granular permissions
- **Data Protection**: Encryption at rest and in transit
- **Access Control**: Organization-based isolation
- **Audit Trail**: Comprehensive logging of all actions
- **CORS**: Configured for specific domains
- **Rate Limiting**: API endpoint protection

## Performance Considerations

- **Lazy Loading**: For large asset libraries
- **CDN Integration**: For global asset delivery
- **Database Indexing**: Optimized queries for search and filtering
- **Caching Strategy**: Redis for frequently accessed data
- **Image Optimization**: Multiple resolutions and formats (WebP, AVIF)
- **Pagination**: For large datasets
- **Background Jobs**: For heavy processing tasks

## Scalability Strategy

- **Horizontal Scaling**: Stateless API design
- **Database Connection Pooling**: Efficient resource usage
- **Asset Storage**: S3-compatible object storage
- **Queue System**: For asynchronous tasks
- **Monitoring**: Performance metrics and alerting

## DaisyUI 5 Component Architecture

### Form Patterns and Structure
DaisyUI 5 emphasizes semantic HTML patterns and accessibility-first design:

#### Fieldset Pattern
```html
<fieldset class="fieldset">
  <legend class="fieldset-legend">Form Section Title</legend>
  <input type="text" class="input" placeholder="Input field" />
  <p class="label">Helper text or description</p>
</fieldset>
```

#### Component Structure
- **Component Classes**: Single class names that apply all necessary styling (e.g., `btn`, `card`, `modal`)
- **Part Classes**: Specific parts of components (e.g., `fieldset-legend`, `modal-header`)
- **Modifier Classes**: Variations and states (e.g., `btn-primary`, `input-bordered`)

#### Theme Integration
- Built-in theme controller with CSS custom properties
- Automatic dark/light mode support
- Consistent color semantics across all components

### Benefits over Previous HeroUI Implementation
1. **Semantic HTML**: Better accessibility with proper fieldset and legend usage
2. **Smaller Bundle**: Component-specific CSS inclusion with Tailwind CSS 4
3. **Better Performance**: Pure CSS implementation without JavaScript overhead
4. **Improved Theming**: Native CSS custom properties for theme switching
5. **Enhanced Accessibility**: Built-in ARIA patterns and keyboard navigation

## Development Principles

- **DRY (Don't Repeat Yourself)**: Reusable components and services
- **Atomic Design**: Component hierarchy and reusability with DaisyUI semantic patterns
- **Type Safety**: Full TypeScript coverage
- **Testing**: Unit, integration, and E2E tests
- **Documentation**: Inline and external documentation
- **Code Quality**: ESLint, Prettier, and pre-commit hooks
- **Accessibility First**: Semantic HTML with fieldset patterns and ARIA compliance