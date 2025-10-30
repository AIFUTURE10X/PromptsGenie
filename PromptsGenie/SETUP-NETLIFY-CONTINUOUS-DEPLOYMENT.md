# Setting Up Netlify Continuous Deployment for PromptsGenie

## Your Repository
- **GitHub**: https://github.com/AIFUTURE10X/PromptsGenie
- **Main Branch**: `main`
- **Netlify Config**: ✅ `netlify.toml` is configured

## Step-by-Step Setup Instructions

### STEP 1: Verify Current Status

Go to your Netlify site: https://app.netlify.com

#### Check if Site is Linked:
1. Log in to Netlify
2. Go to your site dashboard
3. Click **Site settings**
4. Click **Build & deploy**
5. Click **Continuous deployment**
6. Look for the section "Linked repository"
7. **Check if it shows**: `AIFUTURE10X/PromptsGenie`

---

### STEP 2: Connect Repository (If Not Already Connected)

If the repository is NOT linked:

#### Option A: Create Site from Existing Repo
1. Go to https://app.netlify.com
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** as your Git provider
4. Select the **AIFUTURE10X** organization
5. Select the **PromptsGenie** repository
6. Review build settings (should auto-detect from `netlify.toml`):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
7. Click **Deploy site**

#### Option B: Link Repository to Existing Site
1. Go to your existing Netlify site dashboard
2. Click **Site settings** → **Build & deploy** → **Continuous deployment**
3. Click **Link repository** or **Change site**
4. Choose **GitHub**
5. Select **AIFUTURE10X/PromptsGenie**
6. Review branch settings
7. Click **Save**

---

### STEP 3: Verify Production Branch

1. Go to **Site settings** → **Build & deploy** → **Continuous deployment**
2. Look for **Production branch**
3. **Must be set to**: `main` (not `master`)
4. If it's set to something else:
   - Click **Edit settings**
   - Change to `main`
   - Click **Save**

---

### STEP 4: Enable Auto-Deploy

1. In **Continuous deployment** settings
2. Look for **Automatic deploys**
3. Click **Start auto publishing** or **Enable automatic deploys**
4. You should see: ✅ **"Automatic deploys are enabled"**

---

### STEP 5: Verify Deploy Settings

Check that these settings match your `netlify.toml`:

#### Build settings:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`
- **Node version**: `18`

#### Environment variables:
Verify these are set in **Site settings** → **Environment variables**:
- `GOOGLE_API_KEY`
- `GOOGLE_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- `VITE_GEMINI_API_KEY`
- `VITE_GEMINI_MODEL_TEXT`
- `VITE_GEMINI_MODEL_IMAGES`
- `VITE_GEMINI_MODEL_IMAGE`

---

## How to TEST Continuous Deployment

Once configured, you can test it:

### Method 1: Make a Small Change and Push
```bash
# Make a small change
echo "\n## Last updated: $(date)" >> README.md
git add README.md
git commit -m "test: trigger Netlify CD"
git push origin main
```

Then check Netlify dashboard → **Deploys** tab to see deployment trigger.

### Method 2: Check Deployment History
1. Go to Netlify dashboard
2. Click **Deploys** tab
3. Look for recent deployments
4. Check if they show **"Triggered by: Push to main"**

---

## Troubleshooting

### Issue: "Site not linked to repository"
**Solution**: Follow STEP 2 above to link your repository

### Issue: "Auto-deploy not working"
**Solution**: 
1. Verify **Production branch** is set to `main`
2. Enable **Automatic deploys** in settings
3. Check GitHub integration permissions in Netlify

### Issue: "Build failing"
**Solution**:
1. Check **Deploys** → Click failed deployment → View logs
2. Verify environment variables are set
3. Check that `netlify.toml` matches site settings

### Issue: "Functions not working"
**Solution**:
1. Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set
2. Check function logs in **Functions** tab
3. Verify JSON credentials are minified (single line)

---

## Success Indicators

You'll know it's working when:
- ✅ **Linked repository** shows: `AIFUTURE10X/PromptsGenie`
- ✅ **Production branch** is set to: `main`
- ✅ **Automatic deploys** shows: "Enabled"
- ✅ Pushing to main triggers a new deployment automatically
- ✅ Deployments show "Triggered by: Push to main"

---

## What Happens When You Push to Main

1. **You push** code to `github.com/AIFUTURE10X/PromptsGenie` main branch
2. **Netlify detects** the push via webhook
3. **Build starts** automatically with settings from `netlify.toml`
4. **Functions deploy** from `netlify/functions` directory
5. **Site updates** with your changes
6. **You receive** email notification (if enabled)

---

## Need Help?

If you encounter issues:
1. Check Netlify status: https://www.netlifystatus.com
2. View Netlify docs: https://docs.netlify.com/configure-builds/get-started/
3. Check build logs in Netlify dashboard

---

## Next Steps After Setup

1. ✅ Test auto-deploy with a small change
2. ✅ Set up custom domain (see separate guide)
3. ✅ Configure deploy notifications
4. ✅ Set up branch previews for PRs
5. ✅ Monitor function usage and performance

---

**Created**: October 30, 2025
**Repository**: AIFUTURE10X/PromptsGenie
**Status**: Ready for auto-deploy setup

