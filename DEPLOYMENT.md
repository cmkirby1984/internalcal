# Deployment Guide

This guide covers deploying the Motel Management System with the recommended architecture:
- **Frontend (Next.js)**: Deployed on Vercel
- **Backend (NestJS)**: Deployed on Railway
- **Databases**: PostgreSQL + Redis on Railway

## Architecture Overview

```
┌─────────────────┐
│  Vercel (CDN)   │  ← Next.js Frontend (Global Edge)
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  Railway        │
│  ┌───────────┐  │
│  │  Backend  │  │  ← NestJS API
│  │  (Node)   │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────┴─────┐  │
│  │ Postgres  │  │  ← Database
│  └───────────┘  │
│  ┌───────────┐  │
│  │   Redis   │  │  ← Cache/Queues
│  └───────────┘  │
└─────────────────┘
```

## Why This Architecture?

### Vercel for Frontend ✅
- **Performance**: Global CDN, edge functions, optimal Next.js deployment
- **Cost**: Generous free tier (100GB bandwidth/month)
- **DX**: Zero-config, automatic preview deployments
- **Speed**: Edge rendering, image optimization, smart caching

### Railway for Backend ✅
- **Database Proximity**: Backend + DB in same region = low latency
- **Long-Running**: WebSockets, background jobs, cron tasks
- **Simplicity**: Built-in PostgreSQL + Redis, easy networking

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select this repository

### Step 2: Add PostgreSQL Database
1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway auto-generates `DATABASE_URL`

### Step 3: Add Redis Database
1. Click **"New"** → **"Database"** → **"Add Redis"**
2. Railway auto-generates `REDIS_URL`

### Step 4: Configure Backend Service
1. Click **"New"** → **"GitHub Repo"** (select this repo again)
2. **Important**: Click settings and set **Root Directory** to `backend`
3. Railway will detect the `Dockerfile` and `railway.json`

### Step 5: Add Backend Environment Variables
Go to Backend service → **Variables** tab → **Raw Editor**, paste:

```env
# Database connections (auto-injected by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Node configuration
NODE_ENV=production
PORT=3001

# JWT Authentication (generate your own secret!)
JWT_SECRET=REPLACE_WITH_GENERATED_SECRET_FROM_BELOW
JWT_EXPIRES_IN=1d

# CORS - ADD YOUR VERCEL DOMAIN AFTER DEPLOYMENT
CORS_ORIGIN=http://localhost:3000,https://your-app.vercel.app,https://your-app-*.vercel.app
```

### Step 6: Generate JWT Secret
Run this locally to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and replace `REPLACE_WITH_GENERATED_SECRET_FROM_BELOW` above.

### Step 7: Deploy Backend
1. Click **"Deploy"** in Railway
2. Wait for build to complete
3. Copy your backend URL (e.g., `https://your-backend.up.railway.app`)
4. Test health endpoint: `https://your-backend.up.railway.app/health/live`
5. View API docs: `https://your-backend.up.railway.app/api/docs`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### Step 2: Deploy to Vercel
Two options:

#### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. **Important**: Set **Root Directory** to `frontend`
5. Vercel auto-detects Next.js configuration

#### Option B: Vercel CLI
```bash
cd frontend
vercel
# Follow prompts, it will auto-detect Next.js
```

### Step 3: Configure Frontend Environment Variables
In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**:

```env
# Backend API URL (use your Railway backend URL)
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
NEXT_PUBLIC_WS_URL=https://your-backend.up.railway.app
```

**Replace** `your-backend.up.railway.app` with your actual Railway backend domain.

### Step 4: Redeploy Frontend
After adding environment variables:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment → **"Redeploy"**
3. Or push a new commit to trigger auto-deployment

### Step 5: Update Backend CORS
Now that you have your Vercel URL:
1. Go back to **Railway** → **Backend** → **Variables**
2. Update `CORS_ORIGIN` to include your Vercel domains:
```env
CORS_ORIGIN=http://localhost:3000,https://your-app.vercel.app,https://your-app-*.vercel.app
```
3. The `*` wildcard allows Vercel preview deployments to work

---

## Environment Variables Summary

### Backend (Railway)
| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-injected by Railway |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Auto-injected by Railway |
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3001` | Backend port |
| `JWT_SECRET` | `<generated-secret>` | Generate with crypto |
| `JWT_EXPIRES_IN` | `1d` | Token expiration |
| `CORS_ORIGIN` | `http://localhost:3000,https://...` | Allowed frontend origins |

### Frontend (Vercel)
| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://backend.railway.app/api` | Backend API endpoint |
| `NEXT_PUBLIC_WS_URL` | `https://backend.railway.app` | WebSocket endpoint |

---

## Post-Deployment Checklist

### Backend Health Checks
- [ ] Visit `https://your-backend.railway.app/health/live` (should return 200)
- [ ] Visit `https://your-backend.railway.app/api/docs` (Swagger docs)
- [ ] Check Railway logs for database connection success
- [ ] Verify Redis connection in logs

### Frontend Health Checks
- [ ] Visit your Vercel URL (should load homepage)
- [ ] Open browser DevTools → Network tab
- [ ] Check that API calls go to Railway backend
- [ ] Verify no CORS errors in console

### Database Migrations
Migrations run automatically via the Railway start command:
```bash
npx prisma migrate deploy && node dist/src/main
```

To manually run migrations:
```bash
# In Railway backend service → Settings → Custom Start Command
npx prisma migrate deploy && node dist/src/main
```

---

## Development vs Production

### Local Development
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Files
- **Local**: Use `.env` files (gitignored)
- **Railway**: Use Railway Variables UI
- **Vercel**: Use Vercel Environment Variables UI

---

## Costs (Estimated)

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited builds/deployments
- ✅ Automatic HTTPS
- ✅ Preview deployments

### Railway Free Tier
- ✅ $5 free credit/month
- ⚠️ Estimate: ~$10-20/month for backend + databases
  - Backend: ~$5/month
  - PostgreSQL: ~$5/month
  - Redis: ~$2/month

**Total estimated cost**: $5-15/month (after free tier)

---

## Troubleshooting

### CORS Errors
**Problem**: Browser console shows CORS errors

**Solution**:
1. Check Railway backend `CORS_ORIGIN` includes your Vercel domain
2. Ensure format: `https://your-app.vercel.app` (no trailing slash)
3. Use wildcard for previews: `https://your-app-*.vercel.app`
4. Redeploy backend after changing CORS_ORIGIN

### API Connection Failed
**Problem**: Frontend can't reach backend

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` in Vercel env vars
2. Check Railway backend is deployed and running
3. Test backend health: `curl https://backend.railway.app/health/live`
4. Check Railway logs for errors

### Database Connection Failed
**Problem**: Backend logs show database connection errors

**Solution**:
1. Verify `DATABASE_URL` variable references `${{Postgres.DATABASE_URL}}`
2. Ensure PostgreSQL service is running in Railway
3. Check PostgreSQL service logs
4. Verify backend and database are in same Railway project

### Build Failures
**Problem**: Railway or Vercel build fails

**Solution**:
1. Check **Root Directory** is set correctly
   - Railway Backend: `backend`
   - Vercel Frontend: `frontend`
2. Verify `Dockerfile` exists in root directory
3. Check build logs for specific errors
4. Ensure all dependencies are in `package.json`

---

## Useful Commands

### Generate Secrets
```bash
# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# API Key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Railway CLI
```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run command in Railway environment
railway run npm run prisma:migrate
```

### Vercel CLI
```bash
# Install
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod

# View logs
vercel logs

# Pull environment variables
vercel env pull
```

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Vercel
3. ✅ Configure environment variables
4. ⬜ Set up custom domain (optional)
5. ⬜ Configure monitoring (Railway metrics, Vercel analytics)
6. ⬜ Set up CI/CD (auto-deploy on git push)
7. ⬜ Add database backups (Railway auto-backups)

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **NestJS Docs**: https://docs.nestjs.com
- **Next.js Docs**: https://nextjs.org/docs
