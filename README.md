# 🌍 Lucky Earth News (LEN)

A production-ready full-stack news publishing platform. Admins can publish, edit, and delete news articles. Readers enjoy a mobile-first, fast-loading public website with search and category filtering.

## Tech Stack

- **Backend**: Node.js + Express 5 + TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: Vanilla HTML, CSS, JavaScript (mobile-first)
- **Build**: esbuild (ESM bundle)

## Project Structure

```
artifacts/api-server/
├── src/
│   ├── config/db.ts          # MongoDB connection
│   ├── models/
│   │   ├── User.ts           # User schema (username, password, role)
│   │   └── News.ts           # News schema (title, content, image, video, category)
│   ├── middleware/auth.ts     # JWT protect + adminOnly middleware
│   ├── routes/
│   │   ├── auth.ts           # POST /api/auth/login, /api/auth/register
│   │   ├── news.ts           # GET/POST/PUT/DELETE /api/news
│   │   └── seed.ts           # POST /api/seed (initial data)
│   ├── app.ts                # Express app setup + static file serving
│   └── index.ts              # Server entry point + DB connection
└── public/
    ├── index.html            # Public news website
    ├── admin.html            # Admin dashboard
    ├── style.css             # Shared styles
    ├── app.js                # Public site JavaScript
    └── admin.js              # Admin dashboard JavaScript
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | — | Login and get JWT token |
| POST | `/api/auth/register` | Admin JWT | Create a new user |
| GET | `/api/news` | — | List news (supports `?category=`, `?search=`, `?page=`, `?limit=`) |
| GET | `/api/news/categories` | — | List all distinct categories |
| GET | `/api/news/:id` | — | Get single news article |
| POST | `/api/news` | Admin JWT | Create news article |
| PUT | `/api/news/:id` | Admin JWT | Update news article |
| DELETE | `/api/news/:id` | Admin JWT | Delete news article |
| POST | `/api/seed` | — | Seed database with sample data + default admin |

## Environment Variables

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/len
JWT_SECRET=your-super-secret-key-here
PORT=8080
```

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/expoxtechinc/Lucky-Earth-News.git
cd Lucky-Earth-News

# 2. Install dependencies
npm install -g pnpm
pnpm install

# 3. Set environment variables
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET

# 4. Start the server
pnpm --filter @workspace/api-server run dev
```

## First-Time Setup

After starting the server, seed the database:

```bash
curl -X POST http://localhost:8080/api/seed
```

Then log in at `/admin` with:
- **Username**: `admin`
- **Password**: `admin123`

> Change the admin password after first login!

## Pages

- `/` — Public news homepage with search + category filter
- `/admin` — Admin dashboard (requires login)

---

See `DEPLOYMENT.md` for full deployment instructions.
