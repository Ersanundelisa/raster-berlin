# Deployment: GitHub Pages + rasterberlin.com

**Date:** 2026-04-13  
**Project:** ART THIS (raster-berlin)  
**Goal:** Deploy the static site live on `rasterberlin.com` via GitHub Pages

---

## Overview

A static HTML/CSS/JS site currently living at `/Desktop/blueprint` gets pushed to GitHub and served via GitHub Pages with a custom domain.

## Stack

- **Hosting:** GitHub Pages (free, static)
- **Domain:** `rasterberlin.com` (Namecheap, DNS records — NOT nameservers)
- **CI/CD:** Auto-deploy on every `git push` to `main`
- **No build step** required — GitHub Pages serves the root directly

---

## Steps

### 1. Install GitHub CLI
```
brew install gh
gh auth login
```

### 2. Initialize Git repo
```
cd /Users/jakobfleig/Desktop/blueprint
git init
git add .
git commit -m "Initial commit"
```
Include a `.gitignore` to exclude `serve.py` and system files.

### 3. Create GitHub repo & push
```
gh repo create raster-berlin --public --source=. --remote=origin --push
```

### 4. Enable GitHub Pages
In repo Settings → Pages → Source: `main` branch, folder `/` (root).  
GitHub Pages URL will be `https://<username>.github.io/raster-berlin` initially.

### 5. Add Custom Domain in GitHub Pages
Enter `rasterberlin.com` in the Custom Domain field.  
GitHub will create a `CNAME` file in the repo automatically.

### 6. Update DNS at Namecheap
Replace existing Netlify DNS entries with GitHub Pages entries:

**Remove:** existing A-records / CNAME pointing to Netlify

**Add A records (@ / root):**
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Add CNAME (www):**
```
<username>.github.io
```

### 7. Enable HTTPS in GitHub Pages
After DNS propagation (up to 24h), enable "Enforce HTTPS" in GitHub Pages settings.

---

## Result

- `rasterberlin.com` → live site via GitHub Pages
- Every `git push` to `main` → automatic redeploy
- No Netlify needed anymore
