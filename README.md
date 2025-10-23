# Dynamic Data Challenge - Real Estate Agency

This is a challenge from the company [Zentio](https://www.zentio.io/), which I received as part of my application for the Founding Engineer position. All further information regarding the challenge can be found in [DYNAMIC_DATA_CHALLENGE.md](https://github.com/necm1/dynamic-data-challenge/blob/main/DYNAMIC_DATA_CHALLENGE.md)

## Tech Stack

- Backend: NestJS + TypeORM + Postgres, Redis
- Frontend: Next.js v15 + React Query + Tailwind v4 + shadcn/ui
- Monorepo: Turborepo with shared packages

## Features

### Entity Management (CRUD)

- Properties: Real estate listings with `title`, `address`, `price`, `year built`
- Clients: Customer management with `name`, `email`, `phone`
- Listings: Property listings with status (Active/Pending/Sold), price, property link

### Dynamic Custom Fields

- 7 Field Types: `STRING`, `TEXT`, `NUMBER`, `DATE`, `BOOLEAN`, `SELECT`, `ARRAY`
- No Code Changes: Add/edit/delete fields without database migrations
- Type-Safe: Full TypeScript validation with Zod schemas
- Validation Rules: Required, min/max, options, patterns, descriptions
- Display Order: Control field rendering order in forms

### Advanced Filtering & Search

- Static Field Filters: Price range, title search, status, name, email
- JSONB Custom Field Filters: Filter by any custom field (string, number, boolean)
- Combined Queries: Mix static + custom field filters in one uery

### Performance & Caching

- 100ms Queries: Even with 26K records (10K properties, 10K clients, 6K listings)
- Redis Query Cache: 30s TTL for repeated queries
- GIN Indexes: PostgreSQL JSONB indexes
- Pagination: Efficient deep pagination (tested up to page 500)

## Quick Start

### Prerequisites

- Docker (& Docker Compose)
- NodeJS v24.0.1
- Yarn 4

### Installation

```bash
# Install
yarn install

# Setup Environment
cp .env.api.example .env.api
cp .env.example .env

# Start Database
./docker.sh api api -d zentio-backend

# Build API
yarn api:build

# Run Migrations
yarn orm:run

# Seed Data (10K properties, 10K clients, 6K listings)
yarn workspace api seed

# Start API (port 3000)
yarn api:start

# Build Frontend
yarn web:build

# Start Web (port 3001)
yarn web:start
```

- Web: http://localhost:3001
- API: http://localhost:3000/api

## Why This Approach?

I focused on delivering a **working demo** without overengineering. My goal was to choose proven, straightforward solutions over complex architectures.

### Decision Process

**Avoided Overengineering:**

- GraphQL: Too much complexity for a simple CRUD use case
- Pure EAV: Multiple JOINs would take longer to implement and debug
- Hybrid JSONB: Simple, fast to build, leverages existing technology

Why JSONB Specifically:

Zentio already uses PostgreSQL. From the job posting, I saw PostgreSQL is listed in the tech stack. Instead of adding MongoDB or another database, I used PostgreSQL's native JSONB feature.

### The Hybrid Model

Static fields for core data (always needed):

```ts
@Entity('properties')
class Property {
  @Column() title: string;
  @Column() price: number;
  @Column() year_built: number;
}
```

JSONB fields for custom data (user-defined, flexible):

```ts
@Entity('entity_metadata')
class MetadataEntry {
  @Column({ type: 'jsonb' })
  fields: {
    square_footage?: number;
    energy_rating?: string;
    has_pool?: boolean;
    // ... any custom field
  };
}
```

Why Hybrid > Pure JSONB:

- Static fields get proper indexes
- JSONB provides flexibility

### Current State

- Working demo
- Core features implemented
- Clean, maintainable codebase

## Performance Testing

### Running Tests (E2E)

```bash
yarn workspace api test:e2e

Performance Benchmarks (e2e)
  API Response Times
    ✓ GET /properties should respond in <100ms (p95) (159 ms)
    ✓ GET /properties with JSONB filter should respond in <100ms (p95) (112 ms)
    ✓ GET /properties with boolean JSONB filter should respond in <100ms (109 ms)
    ✓ GET /properties with multiple JSONB filters should respond in <150ms (106 ms)
    ✓ GET /properties with price range should respond in <100ms (93 ms)
    ✓ GET /properties with text search should respond in <150ms (112 ms)
    ✓ GET /properties with combined filters should respond in <200ms (135 ms)
    ✓ GET /clients should respond in <100ms (p95) (117 ms)
    ✓ GET /clients with custom fields filter should respond in <100ms (73 ms)
    ✓ GET /clients with name search should respond in <100ms (96 ms)
    ✓ GET /clients with email search should respond in <100ms (66 ms)
    ✓ GET /listings should respond in <100ms (p95) (112 ms)
    ✓ GET /listings with status filter should respond in <100ms (104 ms)
    ✓ GET /listings with price range should respond in <100ms (104 ms)
    ✓ GET /listings with custom fields should respond in <100ms (63 ms)
    ✓ GET /listings with combined filters should respond in <150ms (66 ms)
  Pagination Performance
    ✓ should maintain performance across deep pagination (80 ms)
    ✓ should handle different page sizes efficiently (66 ms)
  JSONB Query Performance
    ✓ should efficiently query single JSONB field (6 ms)
    ✓ should efficiently query JSONB string field (7 ms)
    ✓ should efficiently query JSONB number field (29 ms)
    ✓ should efficiently combine multiple JSONB conditions (25 ms)
  Cache Performance
    ✓ should show cache speedup for repeated queries (26 ms)
  Bulk Operations
    ✓ should handle large result sets efficiently (12 ms)
    ✓ should count total records efficiently (15 ms)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.808 s
```

## Structure

```
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── api-client/   # Client module (controller, DTOs)
│   ├── api-listings/ # Listing module (controller, DTOs)
│   ├── api-orm/      # TypeORM entities & services
│   ├── api-property/ # Property module (controller, DTOs)
│   ├── api-metadata/ # Metadata module (controller, DTOs)
│   ├── api-utils/    # Base repositories, filters
│   ├── shared/       # Enums (EntityType, FieldType)
│   ├── web-utils/    # Server actions, API client
│   └── ui/           # Shadcn UI components
```
## Screenshots
Listings Preview:
<img width="1972" height="1095" alt="image" src="https://github.com/user-attachments/assets/a3f1798e-021a-42d7-a60e-13e90a09d6c7" />

Table Filter:
<img width="1659" height="968" alt="image" src="https://github.com/user-attachments/assets/e4ce427d-3b5c-49e6-a98c-e8218667f1bc" />

Field Schema Management (& Validation):
<img width="1973" height="1096" alt="image" src="https://github.com/user-attachments/assets/8772109a-1aea-4fa6-bee9-dd3ae4449af5" />



