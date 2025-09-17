# Vercel Deployment Guide for Trending Songs Feature

## 🚀 Deployment Checklist

### 1. Environment Variables Setup

Before deploying to Vercel, you need to set up the following environment variables in your Vercel project:

#### Required Environment Variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cron Job Security
CRON_SECRET=your_secure_random_string_here
```

#### Setting Environment Variables in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development** environments
4. Make sure to use a strong, random string for `CRON_SECRET`

### 2. Database Migration

Before deploying, ensure you've run the database migration:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the migration from `supabase/migrations/002_trending_songs_fixed.sql`
4. Verify that the following tables and functions are created:
   - `play_tracking` table
   - `trending_songs` table
   - `update_trending_songs()` function
   - `track_song_play()` function

### 3. Vercel Cron Job Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-trending",
      "schedule": "30 18 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `30 18 * * *` = Daily at 18:30 UTC
- This translates to **12:00 AM GST+5:30** (India Standard Time)
- The cron job will run every day at midnight Indian time

### 4. Deployment Steps

#### Using Vercel CLI:
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Using Git Integration:
1. Push your code to your connected Git repository
2. Vercel will automatically deploy on push to main branch
3. Monitor the deployment in the Vercel dashboard

### 5. Post-Deployment Verification

#### Check Cron Job Status:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. Verify that your cron job is listed and active
4. You can manually trigger it for testing

#### Test API Endpoints:
```bash
# Test trending API
curl https://your-app.vercel.app/api/trending

# Test cron health check
curl https://your-app.vercel.app/api/cron/update-trending

# Test manual cron trigger (for testing)
curl -X POST https://your-app.vercel.app/api/cron/update-trending \
  -H "Authorization: Bearer your_cron_secret"
```

### 6. Monitoring and Logs

#### View Cron Job Logs:
1. Go to **Functions** tab in Vercel dashboard
2. Click on your cron job function
3. View execution logs and any errors

#### Monitor API Performance:
1. Check **Analytics** tab for API usage
2. Monitor **Functions** tab for execution times
3. Set up alerts for failed executions

### 7. Troubleshooting

#### Common Issues:

**1. Cron Job Not Running:**
- Check if `CRON_SECRET` is set correctly
- Verify the schedule format in `vercel.json`
- Check Vercel plan limits (Hobby plan: 2 cron jobs max)

**2. Database Connection Issues:**
- Verify Supabase environment variables
- Check if database migration was run
- Ensure RLS policies are set correctly

**3. API Endpoints Returning 500:**
- Check function logs in Vercel dashboard
- Verify database functions exist
- Check environment variable configuration

#### Debug Commands:
```bash
# Check environment variables
vercel env ls

# View function logs
vercel logs --follow

# Test locally with production environment
vercel dev
```

### 8. Security Considerations

#### Cron Job Security:
- Always use a strong `CRON_SECRET`
- Never commit secrets to version control
- Use Vercel's built-in cron authentication

#### Database Security:
- Use Row Level Security (RLS) policies
- Limit API access with proper authentication
- Regularly rotate service role keys

### 9. Performance Optimization

#### Database Indexes:
The migration includes optimized indexes for:
- `play_tracking` table queries
- `trending_songs` table lookups
- Date-based filtering

#### API Optimization:
- Trending API uses efficient joins
- Play tracking is batched for performance
- Cron job runs during low-traffic hours

### 10. Maintenance

#### Regular Tasks:
- Monitor cron job execution logs
- Check trending data accuracy
- Review API performance metrics
- Update dependencies regularly

#### Backup Strategy:
- Supabase provides automatic backups
- Export trending data periodically
- Keep migration scripts versioned

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database migration executed
- [ ] `vercel.json` cron configuration verified
- [ ] API endpoints tested locally
- [ ] Security secrets generated and set
- [ ] Git repository up to date
- [ ] Vercel project linked to repository

## 🎯 Post-Deployment Checklist

- [ ] Cron job appears in Vercel dashboard
- [ ] API endpoints respond correctly
- [ ] Database functions work as expected
- [ ] Trending data updates properly
- [ ] Error monitoring set up
- [ ] Performance metrics baseline established

---

**Note:** This deployment guide ensures your trending songs feature works correctly on Vercel with proper cron job scheduling, security, and monitoring.
