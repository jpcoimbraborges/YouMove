# YOUMOVE - Data Contracts & Versioning

## Overview

This document defines the data contracts and versioning patterns used across the YOUMOVE platform.

## Type System Architecture

```
shared/
├── types/
│   ├── database.types.ts   # Core database entities
│   ├── api.types.ts        # API request/response DTOs
│   ├── ai.types.ts         # AI/ChatGPT integration types
│   └── index.ts            # Central exports
└── schemas/
    ├── user.schema.ts      # Zod validation schemas
    ├── workout.schema.ts   # Workout validation
    ├── analytics.schema.ts # Analytics validation
    └── index.ts
```

## Versioning Strategy

### API Versioning

```
/api/v1/workouts
/api/v2/workouts
```

- Major version in URL path
- Minor/patch versions are backward compatible
- Deprecated endpoints maintained for 6 months

### Type Versioning

Each type file includes a version header:

```typescript
/**
 * Version: 1.0.0
 * Breaking changes require major version bump
 */
```

### Database Migrations

Sequential numbered migrations:

```
001_initial_schema.sql
002_rls_policies.sql
003_seed_exercises.sql
004_add_new_feature.sql
```

## Contract Rules

### 1. Nullability

- Optional fields use `| null` (database) or `?` (API)
- Arrays default to empty `[]`, never null
- Required fields must always have values

### 2. Timestamps

All entities include:
```typescript
interface Timestamps {
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
}
```

### 3. IDs

- All IDs are UUIDs (string format)
- Foreign keys reference parent IDs
- Soft deletes use `is_active: boolean`

### 4. Enums

Database enums mirror TypeScript types:

```sql
CREATE TYPE fitness_level_type AS ENUM ('beginner', 'intermediate', 'advanced', 'elite');
```

```typescript
type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';
```

### 5. JSONB Fields

Complex nested data uses JSONB with typed interfaces:

```typescript
interface WorkoutExercise {
  exercise_id: string;
  order: number;
  sets: WorkoutSet[];
  superset_group: number | null;
  notes: string | null;
}
```

## API Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: ApiMeta;
}
```

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { "field": "email" }
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5
    }
  },
  "error": null
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `AUTH_INVALID` | Invalid credentials |
| `AUTH_EXPIRED` | Token expired |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Request validation failed |
| `CONFLICT` | Resource conflict (duplicate) |
| `RATE_LIMITED` | Too many requests |
| `SERVER_ERROR` | Internal server error |

## Breaking Changes Policy

### What constitutes a breaking change:

1. Removing a field
2. Changing a field's type
3. Making an optional field required
4. Changing enum values
5. Changing endpoint URLs

### How to handle:

1. Increment major version
2. Maintain old version for 6 months
3. Document migration path
4. Notify consumers via changelog

## Changelog

### v1.0.0 (2024-12-20)
- Initial release
- Core entities: UserProfile, Exercise, Workout, WorkoutSession, WorkoutLog, ProgressMetric
- AI types: Recommendations, Coach, Insights
- API DTOs: Auth, CRUD operations, Filters
