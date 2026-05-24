# Pulse Tracker Frontend

Next.js UI for the personal learning tracker, based on mockups in `../web-page-images/`.

## Setup

```bash
cp .env.example .env.local
npm install   # from repo root
npm run dev:tracker-frontend
```

Runs on **http://localhost:3001**

Requires Tracker backend on **http://localhost:4001** with seeded data:

```bash
npm run dev:tracker-backend
npm run tracker:prisma:seed
```

## Routes

| Route | Screen |
|-------|--------|
| `/` | Root — all years overview |
| `/year/[yearId]` | Year — months, yearly plans, monthly pool |
| `/month/[monthId]` | Month — calendar, assigned skills |
| `/skill/[skillId]` | Skill detail — sub-skills, resources, date tracker |
