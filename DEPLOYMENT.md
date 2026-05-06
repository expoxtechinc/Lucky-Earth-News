# Lucky Earth News — Complete Deployment Guide (Vercel)

> Follow these steps in order. Everything is designed to work first try.

---

## STEP 1 — Fix Your MongoDB Password (Required First)

Your `MONGO_URI` secret has a placeholder password. Fix it before anything else.

**A. Get your real MongoDB password:**
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and log in
2. Click **Database Access** in the left sidebar
3. Find `len_admin` → click **Edit** → under **Password Authentication**, click **Edit Password** → copy or generate a new password

**B. Allow connections from anywhere:**
1. Click **Network Access** in the left sidebar
2. Click **+ Add IP Address** → click **Allow Access from Anywhere** → Confirm

**C. Update your Replit secret:**
1. In Replit, click the **lock icon** (Secrets) in the left sidebar
2. Find `MONGO_URI` → click Edit → replace `YOUR_PASSWORD` with your real password:
   ```
   mongodb+srv://len_admin:YOURPASSWORD@cluster0.uovzmre.mongodb.net/lucky-earth-news
   ```
3. Save, then tell the agent to restart the server

---

## STEP 2 — Deploy the Backend API to Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign in with GitHub**
2. Click **Add New Project**
3. Find and import **`Lucky-Earth-News`** from your GitHub
4. Configure the project settings:

   | Setting | Value |
   |---|---|
   | **Project Name** | `lucky-earth-news-api` |
   | **Root Directory** | `artifacts/api-server` |
   | **Framework Preset** | **Other** |
   | **Build Command** | _(leave blank)_ |
   | **Output Directory** | _(leave blank)_ |
   | **Install Command** | _(leave blank)_ |

5. Expand **Environment Variables** and add these three:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | Your full MongoDB connection string (from Step 1) |
   | `JWT_SECRET` | Any long random text, e.g. `len-super-secret-jwt-2026-xK9mN3pQ` |
   | `NODE_ENV` | `production` |

6. Click **Deploy** — wait about 60 seconds

7. When done, copy your backend URL. It will look like:
   ```
   https://lucky-earth-news-api.vercel.app
   ```
   > Keep this URL — you need it in Step 3.

---

## STEP 3 — Deploy the Frontend to Vercel

1. On Vercel, click **Add New Project** again
2. Import **`Lucky-Earth-News`** again (same repo, different project)
3. Configure:

   | Setting | Value |
   |---|---|
   | **Project Name** | `lucky-earth-news` |
   | **Root Directory** | `artifacts/len-web` |
   | **Framework Preset** | **Vite** |
   | **Build Command** | `npm install -g pnpm && pnpm install --frozen-lockfile=false && pnpm run build` |
   | **Output Directory** | `dist/public` |

4. Add these environment variables:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | Your backend URL from Step 2 (e.g. `https://lucky-earth-news-api.vercel.app`) |
   | `BASE_PATH` | `/` |

5. Click **Deploy** — wait about 90 seconds

6. Your public site is now live at something like:
   ```
   https://lucky-earth-news.vercel.app
   ```

---

## STEP 4 — Seed the Database (Run Once)

After both deployments are live, run this to create your admin account and 6 sample articles:

```bash
curl -X POST https://lucky-earth-news-api.vercel.app/api/seed
```

Expected response:
```json
{"message": "Database seeded successfully. Admin credentials: username=admin, password=admin123"}
```

---

## STEP 5 — Log In and Secure Your Account

1. Visit `https://lucky-earth-news.vercel.app/admin`
2. Log in with: **Username:** `admin` / **Password:** `admin123`
3. Go to **Users** tab → Create a new admin account with a strong password
4. Log out → log in with your new account
5. Delete the default `admin` account

---

## Your Live Platform

| Page | URL |
|---|---|
| Public News Site | `https://lucky-earth-news.vercel.app` |
| Admin Dashboard | `https://lucky-earth-news.vercel.app/admin` |
| Article Pages | `https://lucky-earth-news.vercel.app/news/:id` |
| Backend API | `https://lucky-earth-news-api.vercel.app` |
| Health Check | `https://lucky-earth-news-api.vercel.app/api/health` |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Health check |
| POST | `/api/auth/login` | None | Admin login, returns JWT |
| POST | `/api/auth/register` | Admin JWT | Create new admin user |
| GET | `/api/auth/users` | Admin JWT | List all users |
| DELETE | `/api/auth/users/:id` | Admin JWT | Delete a user |
| GET | `/api/news` | None | List articles (paginated, searchable) |
| GET | `/api/news/:id` | None | Get single article |
| POST | `/api/news` | Admin JWT | Create article |
| PUT | `/api/news/:id` | Admin JWT | Update article |
| DELETE | `/api/news/:id` | Admin JWT | Delete article |
| GET | `/api/news/categories` | None | List all categories |
| POST | `/api/seed` | None | Seed DB with admin + sample articles |

---

## Auto-Deploy on Push

After setup, every time you push to `main` on GitHub, both Vercel projects automatically redeploy:

```bash
git add .
git commit -m "feat: update"
git push origin main
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `bad auth: authentication failed` | MongoDB password is wrong — re-check Step 1C |
| `MongoServerSelectionError` | Atlas IP not whitelisted — re-check Step 1B |
| Articles not loading on frontend | `VITE_API_URL` is wrong — re-check Step 3 env var |
| Login fails | Database not seeded — run Step 4 |
| Build fails on Vercel frontend | Make sure Root Directory is `artifacts/len-web` |
| Build fails on Vercel backend | Make sure Root Directory is `artifacts/api-server` |
