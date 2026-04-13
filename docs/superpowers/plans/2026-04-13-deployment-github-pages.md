# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the static ART THIS site live on `rasterberlin.com` via GitHub Pages with automatic redeploy on every git push.

**Architecture:** Local files → Git repo → GitHub (public) → GitHub Pages serves root of `main` branch → Custom domain `rasterberlin.com` via Namecheap DNS A-records.

**Tech Stack:** git, GitHub CLI (`gh`), GitHub Pages, Namecheap DNS

---

> **Note:** Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username throughout this plan.

---

### Task 1: Install GitHub CLI and authenticate

**Files:**
- No files changed

- [ ] **Step 1: Install gh via Homebrew**

```bash
brew install gh
```

Expected output: `gh` gets installed (takes ~1 minute).

- [ ] **Step 2: Verify installation**

```bash
gh --version
```

Expected: `gh version 2.x.x`

- [ ] **Step 3: Authenticate with GitHub**

```bash
gh auth login
```

Follow the prompts:
- Select `GitHub.com`
- Select `HTTPS`
- Select `Login with a web browser`
- Copy the one-time code shown, press Enter — browser opens
- Paste the code on github.com and authorize

Expected: `Logged in as YOUR_GITHUB_USERNAME`

---

### Task 2: Create .gitignore and initialize git repo

**Files:**
- Create: `/Users/jakobfleig/Desktop/blueprint/.gitignore`

- [ ] **Step 1: Create .gitignore**

```bash
cat > /Users/jakobfleig/Desktop/blueprint/.gitignore << 'EOF'
.DS_Store
serve.py
*.py
__pycache__/
EOF
```

- [ ] **Step 2: Initialize git repo**

```bash
cd /Users/jakobfleig/Desktop/blueprint
git init
git branch -M main
```

Expected: `Initialized empty Git repository in .../blueprint/.git/`

- [ ] **Step 3: Stage all files**

```bash
git add .
```

- [ ] **Step 4: Verify what will be committed (check .gitignore works)**

```bash
git status
```

Expected: `serve.py` and `.DS_Store` should NOT appear in the list. You should see `index.html`, files in `css/`, `js/`, `pics*/`, `Logo/`, `docs/`, `Galeriverzeichnis.csv`.

- [ ] **Step 5: Create initial commit**

```bash
git commit -m "Initial commit: ART THIS static site"
```

Expected: `main (root-commit) ...`

---

### Task 3: Create GitHub repo and push

**Files:**
- No local files changed

- [ ] **Step 1: Create public GitHub repo and push**

```bash
gh repo create raster-berlin --public --source=. --remote=origin --push
```

Expected output:
```
✓ Created repository YOUR_GITHUB_USERNAME/raster-berlin on GitHub
✓ Added remote origin
✓ Pushed commits to github.com/YOUR_GITHUB_USERNAME/raster-berlin
```

- [ ] **Step 2: Verify repo is live**

```bash
gh repo view --web
```

Expected: Browser opens to `https://github.com/YOUR_GITHUB_USERNAME/raster-berlin` showing your files.

---

### Task 4: Enable GitHub Pages

**Files:**
- No local files changed (configured via GitHub website)

- [ ] **Step 1: Open repo settings**

Go to: `https://github.com/YOUR_GITHUB_USERNAME/raster-berlin/settings/pages`

- [ ] **Step 2: Enable Pages**

Under **"Build and deployment"**:
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

Click **Save**.

- [ ] **Step 3: Wait for deployment**

After ~1 minute, the page will show:
> "Your site is live at `https://YOUR_GITHUB_USERNAME.github.io/raster-berlin/`"

- [ ] **Step 4: Verify the site loads**

Open `https://YOUR_GITHUB_USERNAME.github.io/raster-berlin/` in the browser. The ART THIS site should appear.

---

### Task 5: Add custom domain in GitHub Pages

**Files:**
- Auto-created by GitHub: `CNAME` file in repo root

- [ ] **Step 1: Enter custom domain**

On the same Settings → Pages page, under **"Custom domain"**, enter:
```
rasterberlin.com
```

Click **Save**.

- [ ] **Step 2: Pull the CNAME file GitHub created**

```bash
cd /Users/jakobfleig/Desktop/blueprint
git pull origin main
```

Expected: Git pulls a new `CNAME` file containing `rasterberlin.com`.

---

### Task 6: Update DNS at Namecheap

**Files:**
- No local files (done on Namecheap website)

- [ ] **Step 1: Open Namecheap DNS settings**

Go to namecheap.com → Domain List → `rasterberlin.com` → Manage → Advanced DNS

- [ ] **Step 2: Delete existing Netlify DNS entries**

Remove any A-records or CNAMEs that point to Netlify (they likely point to `*.netlify.app` or Netlify IPs).

- [ ] **Step 3: Add GitHub Pages A-records**

Add 4 A-records, all with Host `@`, TTL `Automatic`:

| Type | Host | Value |
|------|------|-------|
| A Record | @ | 185.199.108.153 |
| A Record | @ | 185.199.109.153 |
| A Record | @ | 185.199.110.153 |
| A Record | @ | 185.199.111.153 |

- [ ] **Step 4: Add CNAME for www**

| Type | Host | Value |
|------|------|-------|
| CNAME | www | YOUR_GITHUB_USERNAME.github.io |

- [ ] **Step 5: Save all changes**

Click Save on Namecheap.

---

### Task 7: Enable HTTPS and verify live domain

**Files:**
- No files changed

- [ ] **Step 1: Wait for DNS propagation**

DNS can take 5 minutes to 24 hours. Check propagation at:
```
https://dnschecker.org/#A/rasterberlin.com
```

Wait until the A-records show the 4 GitHub Pages IPs globally.

- [ ] **Step 2: Enable HTTPS in GitHub Pages**

Go back to `https://github.com/YOUR_GITHUB_USERNAME/raster-berlin/settings/pages`

Once DNS is verified, the **"Enforce HTTPS"** checkbox will become available. Enable it.

- [ ] **Step 3: Verify the live site**

Open `https://rasterberlin.com` in the browser.

Expected: ART THIS site loads with a valid HTTPS certificate.

- [ ] **Step 4: Test www redirect**

Open `https://www.rasterberlin.com` — should redirect to `rasterberlin.com`.

---

### Task 8: Update canonical URLs in index.html

**Files:**
- Modify: `/Users/jakobfleig/Desktop/blueprint/index.html`

Currently `index.html` has canonical URLs pointing to `artthis.com`. These need to reflect the real domain.

- [ ] **Step 1: Update canonical and OG URLs**

In `index.html`, replace all occurrences of `https://www.artthis.com` with `https://rasterberlin.com`:

```bash
cd /Users/jakobfleig/Desktop/blueprint
sed -i '' 's|https://www.artthis.com|https://rasterberlin.com|g' index.html
```

- [ ] **Step 2: Verify changes**

```bash
grep -n "artthis\|rasterberlin" index.html
```

Expected: All URLs now show `rasterberlin.com`, no remaining `artthis.com` references.

- [ ] **Step 3: Commit and push**

```bash
git add index.html
git commit -m "fix: update canonical URLs to rasterberlin.com"
git push origin main
```

Expected: GitHub Pages auto-deploys within ~1 minute.

---

**Done.** The site is live at `https://rasterberlin.com`, deploys automatically on every `git push`, and has correct SEO metadata.
