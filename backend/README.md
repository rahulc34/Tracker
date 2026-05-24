# Tracker Backend

Personal learning tracker API — years, skills, months, assignments, and progress analytics.

## Stack

- Express 5 + TypeScript
- Prisma + PostgreSQL
- Zod validation

## Setup

```bash
# From Tracker root
cp backend/.env.example backend/.env
# Edit DATABASE_URL

npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:backend
```

Default port: **4001**

## API Endpoints

### Users
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users` | Create user |
| GET | `/api/users/:userId` | Get user |
| GET | `/api/users/:userId/root-overview` | Root dashboard analytics |

### Years
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/:userId/years` | List years |
| POST | `/api/users/:userId/years` | Create year (+ optional 12 months) |
| GET | `/api/years/:yearId` | Get year |
| GET | `/api/years/:yearId/overview` | Year dashboard (plans, pool, month tracks) |
| GET | `/api/years/:yearId/progress` | Year progress % |
| DELETE | `/api/years/:yearId` | Delete year |

### Months
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/years/:yearId/months` | List months |
| POST | `/api/years/:yearId/months` | Add month |
| GET | `/api/months/:monthId/overview` | Month dashboard |
| GET | `/api/months/:monthId/progress` | Month progress % |
| POST | `/api/months/:monthId/assignments` | Assign skill from pool to month |

### Skills
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/years/:yearId/skills?scope=yearly&pool=available` | List skills |
| POST | `/api/years/:yearId/skills` | Create yearly/monthly skill |
| GET | `/api/skills/:skillId` | Skill detail + resource tree + assignments |
| PATCH | `/api/skills/:skillId` | Update (progress, isCompleted, etc.) |
| POST | `/api/skills/:skillId/sub-skills` | Add sub-skill |
| POST | `/api/skills/:skillId/resources` | Add link/note/folder/file |

### Assignments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/assignments/:id/reassign` | Roll skill forward to new date/month |
| POST | `/api/assignments/:id/complete` | Mark assignment + skill complete |
| GET | `/api/assignments/:id/events` | Date tracker timeline |

## Progress rollups

- **Skill** — `progress` (0–100) + `isCompleted`
- **Month** — average of assigned skills' progress
- **Year** — average of all top-level skills
- **Root** — average across all years
