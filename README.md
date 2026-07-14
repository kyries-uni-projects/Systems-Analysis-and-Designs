# HomeStay Dorm

HomeStay Dorm is a role-based dormitory management demo built with Next.js, React, Prisma, and SQLite. It covers rental registration, deposits and payment confirmation, check-in, and room-return/refund workflows.

## Prerequisites

- Node.js `>= 20.9.0`
- Corepack, included with standard Node.js installations
- Git

The repository pins Yarn `4.17.1` through the `packageManager` field in `package.json`.

## Setup

1. Clone the repository and enter its directory.

   ```bash
   git clone <repository-url>
   cd Systems-Analysis-and-Designs
   ```

2. Enable Corepack and install dependencies.

   ```bash
   corepack enable
   yarn install
   ```

   `yarn install` also generates the Prisma Client through the `postinstall` script.

3. Create the local environment file.

   ```bash
   cp .env.example .env
   ```

   The required variables are:

   ```dotenv
   DATABASE_URL=file:./dev.db
   AUTH_SECRET=replace-with-a-long-random-secret
   ```

   Generate a secret with `openssl rand -hex 32` and place the result in `AUTH_SECRET`. A unique `AUTH_SECRET` is required for production and prevents users from modifying signed demo sessions.

4. Apply the database migrations.

   ```bash
   yarn prisma:migrate
   ```

5. Seed the complete demo dataset.

   ```bash
   yarn db:seed
   ```

   Warning: the full seed clears and recreates the application demo data. Use it for a fresh local database or when intentionally resetting all demo scenarios.

   To create or repair only the four preset accounts without deleting operational data, run:

   ```bash
   yarn db:seed:accounts
   ```

6. Start the development server.

   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

The login screen includes preset buttons for all four accounts.

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `admin123` |
| Sale employee | `nhanvien01` | `nv123` |
| Manager | `quanly01` | `ql123` |
| Accountant | `ketoan01` | `kt123` |

The credentials are intentionally part of the demo. Authentication still uses signed, expiring HTTP-only session cookies, and all API mutations enforce their server-side role rules.

## Common commands

| Command | Purpose |
| --- | --- |
| `yarn dev` | Start the local Next.js development server |
| `yarn build` | Compile an optimized production build and type-check the app |
| `yarn start` | Run the previously compiled production build |
| `yarn test` | Run the authentication and navigation regression tests |
| `yarn lint` | Run ESLint across the repository |
| `yarn prisma:generate` | Regenerate the Prisma Client |
| `yarn prisma:migrate` | Apply existing migrations and create a migration for schema changes |
| `yarn prisma:studio` | Open Prisma Studio for the configured database |
| `yarn db:seed` | Reset and seed the complete demo dataset |
| `yarn db:seed:accounts` | Non-destructively upsert only the preset demo accounts |
| `yarn db:reset` | Force-reset the database through Prisma; all data is deleted |

## Database

The project uses SQLite through Prisma ORM and the `better-sqlite3` adapter.

- Schema: [`prisma/schema.prisma`](prisma/schema.prisma)
- Migrations: [`prisma/migrations`](prisma/migrations)
- Prisma CLI configuration: [`prisma.config.ts`](prisma.config.ts)
- Runtime Prisma client: [`src/lib/prisma.ts`](src/lib/prisma.ts)
- Full demo fixtures: [`prisma/seed.ts`](prisma/seed.ts)
- Account-only seed: [`prisma/seed-demo-accounts.ts`](prisma/seed-demo-accounts.ts)

Both the Prisma CLI and application runtime use `DATABASE_URL`. To use an isolated database for an experiment, point it to another SQLite file before running migrations or seeds.

## Verification

Before opening a pull request, run:

```bash
yarn test
yarn lint
yarn build
```

## Production

Set `DATABASE_URL` and a strong, private `AUTH_SECRET` in the deployment environment, then run:

```bash
yarn build
yarn start
```

Do not deploy the development `.env` file or reuse its `AUTH_SECRET` in another environment.
