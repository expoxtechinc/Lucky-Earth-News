# Deployment Guide — Lucky Earth News (LEN)

Complete step-by-step guide to deploy your news platform.

---

## Step 1: Fix MongoDB Atlas Connection

Your app uses MongoDB Atlas. You must allow connections from anywhere:

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Select your cluster → **Network Access** (left sidebar)
3. Click **+ Add IP Address** → **Allow Access from Anywhere** → type `0.0.0.0/0` → **Confirm**
4. Go to **Database Access** → find your user → click **Edit** → copy or reset the password
5. Your connection string format: `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/lucky-earth-news`

**Update your `MONGO_URI` secret in Replit:**
- Click the lock icon (Secrets) in the left sidebar
- Find `MONGO_URI` → update with real password

---

## Step 2: Seed the Database (First Time Only)

After fixing MongoDB, run this once to create the admin user and sample articles:

```bash
curl -X POST https://your-app-url/api/seed
```

Default admin credentials:
- **Username**: `admin`
- **Password**: `admin123`

> Change your password immediately after first login via Admin → Users → Create Account.

---

## Step 3: GitHub Push

Your repo is already set up at: `https://github.com/expoxtechinc/Lucky-Earth-News`

```bash
git add .
git commit -m "feat: complete Lucky Earth News platform"
git push origin main
```

---

## Step 4: Deploy Backend on Render

Render is the recommended platform for the Node.js/Express API.

1. Go to [render.com](https://render.com) → sign up / log in with GitHub
2. Click **New** → **Web Service**
3. Connect your GitHub → select `Lucky-Earth-News`
4. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `lucky-earth-news-api` |
| **Root Directory** | `artifacts/api-server` |
| **Environment** | `Node` |
| **Build Command** | `npm install -g pnpm && pnpm install && pnpm run build` |
| **Start Command** | `node --enable-source-maps ./dist/index.mjs` |

5. Under **Environment Variables**, add all of these:

| Key | Value |
|---|---|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/lucky-earth-news` |
| `JWT_SECRET` | Any long random string (min 32 chars) |
| `PORT` | `10000` |
| `NODE_ENV` | `production` |

6. Click **Create Web Service** — Render will build and deploy automatically (takes ~3 minutes)

Your API will be live at: `https://lucky-earth-news-api.onrender.com`

> The backend also serves the static frontend, so the full site (homepage + admin) is accessible at the same URL.

---

## Step 5: Deploy Frontend on Vercel (Optional)

If you want to host the React frontend separately for better performance:

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **Add New Project** → import `Lucky-Earth-News`
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `artifacts/len-web` |
| **Framework Preset** | `Vite` |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist` |

4. Add environment variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://lucky-earth-news-api.onrender.com` |

5. Click **Deploy**

---

## Step 6: Seed Production Database

After your Render deployment is live:

```bash
curl -X POST https://lucky-earth-news-api.onrender.com/api/seed
```

Then visit `https://lucky-earth-news-api.onrender.com/admin` and log in with `admin` / `admin123`.

---

## Step 7: Secure Your Platform

After your first login:

1. Go to **Admin → Users → Create Account**
2. Create a new admin with a strong password
3. Log out, log in with the new account
4. Delete the default `admin` account

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string (with real password) |
| `JWT_SECRET` | **Yes** | Random secret for JWT tokens — use 32+ random chars |
| `PORT` | **Yes** | Port to listen on (Render sets this automatically) |
| `NODE_ENV` | Recommended | Set to `production` |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Health check |
| POST | `/api/auth/login` | None | Admin login |
| POST | `/api/auth/register` | Admin JWT | Create new admin user |
| GET | `/api/auth/users` | Admin JWT | List all users |
| DELETE | `/api/auth/users/:id` | Admin JWT | Delete a user |
| GET | `/api/news` | None | List articles (paginated) |
| GET | `/api/news/:id` | None | Get single article |
| POST | `/api/news` | Admin JWT | Create article |
| PUT | `/api/news/:id` | Admin JWT | Update article |
| DELETE | `/api/news/:id` | Admin JWT | Delete article |
| GET | `/api/news/categories` | None | List categories |
| POST | `/api/seed` | None | Seed DB (run once) |

---

## Auto-Deploy on Push

After setup, every `git push origin main` will trigger an automatic Render redeploy.

```bash
# Make changes locally, then:
git add .
git commit -m "feat: your change description"
git push origin main
```

---

## Health Check

```bash
curl https://lucky-earth-news-api.onrender.com/api/health
# Expected: {"status":"ok"}
```
