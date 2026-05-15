# Berlin Art Guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Berlin art guide for locals — fast Mapbox map, gallery/exhibition pages, event calendar, news, artist profiles, optional user auth with saves and personal journal, Sanity CMS with Claude-powered AI writing assistant.

**Architecture:** Next.js 15 (App Router) on Vercel. Sanity v3 hosts editorial content (galleries, exhibitions, events, news, artists) at `/studio`. Supabase handles user auth, saved events/venues, and journal entries. Map uses Mapbox GL JS with coordinates geocoded at publish time via a Sanity webhook. No AI features on the public site — Claude is admin-only inside Sanity Studio.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v3, Sanity v3, `@supabase/ssr`, Mapbox GL JS, `@anthropic-ai/sdk`, `@portabletext/react`, Playwright (e2e)

---

## File Structure

```
app/
  layout.tsx                     # Root layout: Nav + auth provider
  page.tsx                       # Landing page
  map/page.tsx                   # Full-screen map
  galleries/
    page.tsx                     # Gallery listing
    [slug]/page.tsx              # Gallery + current exhibitions
  events/
    page.tsx                     # Event calendar
    [slug]/page.tsx              # Event detail
  news/
    page.tsx                     # News listing
    [slug]/page.tsx              # News article
  artists/
    page.tsx                     # Artist listing
    [slug]/page.tsx              # Artist profile
  account/
    page.tsx                     # Dashboard: saves + journal
  auth/
    login/page.tsx
    signup/page.tsx
    callback/route.ts            # Supabase OAuth callback
  api/
    geocode/route.ts             # Sanity webhook → Google Geocoding → write back
    ai-draft/route.ts            # Claude API proxy for Sanity plugin

components/
  ui/
    Nav.tsx                      # Responsive nav (hamburger on mobile)
    Footer.tsx
    LoginModal.tsx               # Inline login gate modal
  map/
    Map.tsx                      # Mapbox GL client component
    VenuePin.tsx                 # Custom marker
    VenuePanel.tsx               # Side panel (desktop) / bottom sheet (mobile)
    MapFilters.tsx               # Type + neighborhood + open-now filters
  venue/
    VenueCard.tsx
    ExhibitionCard.tsx
  events/
    EventCard.tsx
    CalendarView.tsx             # List on mobile, grid on desktop
  news/
    NewsCard.tsx
  artists/
    ArtistCard.tsx
  account/
    SaveButton.tsx               # Login-gated save toggle
    JournalEditor.tsx            # Textarea with save, attached to event

lib/
  sanity/
    client.ts                    # Sanity read client
    queries.ts                   # All GROQ queries
    image.ts                     # urlForImage helper
  supabase/
    client.ts                    # Browser Supabase client (singleton)
    server.ts                    # Server Supabase client (cookies)
  utils.ts                       # Shared helpers (formatDate, etc.)

sanity/
  sanity.config.ts               # Studio config
  schemas/
    index.ts                     # Schema registry
    gallery.ts
    exhibition.ts
    event.ts
    newsArticle.ts
    artist.ts
  plugins/
    aiDraft.ts                   # "Draft with AI" button plugin

middleware.ts                    # Supabase auth session refresh
tailwind.config.ts
```

---

## Phase 1: Project Foundation

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/jakobfleig/Desktop/blueprint
npx create-next-app@latest . --typescript --tailwind --app --src-dir no --import-alias "@/*" --eslint
```

When prompted: choose defaults. This creates `app/`, `components/`, `public/`, `tailwind.config.ts`.

Expected output: `Success! Created app at /Users/jakobfleig/Desktop/blueprint`

- [ ] **Step 2: Install core dependencies**

```bash
npm install @sanity/client next-sanity sanity @portabletext/react @sanity/image-url \
  @supabase/supabase-js @supabase/ssr \
  mapbox-gl @types/mapbox-gl \
  @anthropic-ai/sdk \
  lucide-react
```

- [ ] **Step 3: Install dev/test dependencies**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 4: Update `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'cdn.sanity.io' },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 5: Create `.env.local`**

```bash
cat > .env.local << 'EOF'
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Google Geocoding
GOOGLE_GEOCODING_API_KEY=your_google_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Sanity webhook secret
SANITY_WEBHOOK_SECRET=your_webhook_secret
EOF
```

- [ ] **Step 6: Add `.env.local` to `.gitignore`**

Verify `.gitignore` already contains `.env.local`. If not, add it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with dependencies"
```

---

### Task 2: Supabase database schema

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com, create a new project named `berlin-art-guide`. Copy the project URL and anon key into `.env.local`.

- [ ] **Step 2: Create migration file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/001_initial.sql`:

```sql
-- Profiles (auto-created on signup via trigger)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Saved events (reference Sanity event _id)
create table public.saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  sanity_event_id text not null,
  saved_at timestamptz default now(),
  unique(user_id, sanity_event_id)
);

-- Saved venues (reference Sanity gallery/museum _id)
create table public.saved_venues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  sanity_venue_id text not null,
  saved_at timestamptz default now(),
  unique(user_id, sanity_venue_id)
);

-- Journal entries (private notes on events)
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  sanity_event_id text not null,
  body text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, sanity_event_id)
);

-- Row-level security
alter table public.profiles enable row level security;
alter table public.saved_events enable row level security;
alter table public.saved_venues enable row level security;
alter table public.journal_entries enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users manage own saved_events" on public.saved_events
  for all using (auth.uid() = user_id);

create policy "Users manage own saved_venues" on public.saved_venues
  for all using (auth.uid() = user_id);

create policy "Users manage own journal_entries" on public.journal_entries
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 3: Run migration in Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste the contents of `001_initial.sql` → Run.

Expected: all tables created with no errors.

- [ ] **Step 4: Enable Google OAuth in Supabase**

Go to Authentication → Providers → Google → enable and add your Google OAuth credentials. Set redirect URL to `http://localhost:3000/auth/callback` (and your production domain later).

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema with RLS policies"
```

---

### Task 3: Supabase client utilities

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Write test for browser client**

Create `lib/supabase/__tests__/client.test.ts`:

```ts
import { createBrowserClient } from '../client'

describe('createBrowserClient', () => {
  it('returns a supabase client with auth methods', () => {
    const client = createBrowserClient()
    expect(typeof client.auth.getSession).toBe('function')
    expect(typeof client.from).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/supabase/__tests__/client.test.ts
```

Expected: FAIL — `Cannot find module '../client'`

- [ ] **Step 3: Create `lib/supabase/client.ts`**

```ts
import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Create `lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 5: Create `middleware.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  // Protect /account route
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && request.nextUrl.pathname.startsWith('/account')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx jest lib/supabase/__tests__/client.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/supabase/ middleware.ts
git commit -m "feat: add Supabase client utilities and auth middleware"
```

---

## Phase 2: Sanity CMS Setup

### Task 4: Initialize Sanity Studio

**Files:**
- Create: `sanity/sanity.config.ts`
- Create: `sanity/schemas/index.ts`
- Create: `app/studio/[[...tool]]/page.tsx`

- [ ] **Step 1: Create a Sanity project**

Go to https://sanity.io/manage → create a new project named `berlin-art-guide`, dataset `production`. Copy the project ID into `.env.local`.

- [ ] **Step 2: Create Studio page route**

Create `app/studio/[[...tool]]/page.tsx`:

```tsx
'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity/sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

- [ ] **Step 3: Create placeholder schema index**

Create `sanity/schemas/index.ts`:

```ts
import { SchemaTypeDefinition } from 'sanity'

export const schemaTypes: SchemaTypeDefinition[] = []
```

- [ ] **Step 4: Create `sanity/sanity.config.ts`**

```ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'berlin-art-guide',
  title: 'Berlin Art Guide',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
})
```

- [ ] **Step 5: Start dev server and verify Studio loads**

```bash
npm run dev
```

Open http://localhost:3000/studio — Sanity Studio should load and prompt you to log in.

- [ ] **Step 6: Commit**

```bash
git add sanity/ app/studio/
git commit -m "feat: initialize Sanity Studio at /studio"
```

---

### Task 5: Gallery schema

**Files:**
- Create: `sanity/schemas/gallery.ts`
- Modify: `sanity/schemas/index.ts`

- [ ] **Step 1: Create `sanity/schemas/gallery.ts`**

```ts
import { defineType, defineField } from 'sanity'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery / Museum',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: r => r.required() }),
    defineField({
      name: 'venueType',
      title: 'Type',
      type: 'string',
      options: { list: ['gallery', 'museum'], layout: 'radio' },
      validation: r => r.required(),
    }),
    defineField({
      name: 'neighborhood',
      title: 'Neighborhood',
      type: 'string',
      options: {
        list: ['Mitte', 'Prenzlauer Berg', 'Kreuzberg', 'Friedrichshain', 'Charlottenburg', 'Schöneberg', 'Neukölln', 'Wedding', 'Tiergarten', 'Other'],
      },
    }),
    defineField({ name: 'address', title: 'Address', type: 'string', validation: r => r.required() }),
    defineField({
      name: 'coordinates',
      title: 'Coordinates (auto-filled by webhook)',
      type: 'object',
      fields: [
        defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
        defineField({ name: 'lng', title: 'Longitude', type: 'number' }),
      ],
    }),
    defineField({
      name: 'hours',
      title: 'Opening Hours',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'e.g. ["Tue–Sat 11:00–18:00", "Sun 12:00–17:00"]',
    }),
    defineField({ name: 'about', title: 'About', type: 'text' }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'venueType', media: 'images.0' },
  },
})
```

- [ ] **Step 2: Register in schema index**

Edit `sanity/schemas/index.ts`:

```ts
import { SchemaTypeDefinition } from 'sanity'
import { gallery } from './gallery'

export const schemaTypes: SchemaTypeDefinition[] = [gallery]
```

- [ ] **Step 3: Verify in Studio**

Restart dev server if needed. Open `/studio` → Content → you should see "Gallery / Museum" as a document type.

- [ ] **Step 4: Commit**

```bash
git add sanity/schemas/
git commit -m "feat: add Gallery/Museum Sanity schema"
```

---

### Task 6: Exhibition, Event, NewsArticle, Artist schemas

**Files:**
- Create: `sanity/schemas/exhibition.ts`
- Create: `sanity/schemas/event.ts`
- Create: `sanity/schemas/newsArticle.ts`
- Create: `sanity/schemas/artist.ts`
- Modify: `sanity/schemas/index.ts`

- [ ] **Step 1: Create `sanity/schemas/exhibition.ts`**

```ts
import { defineType, defineField } from 'sanity'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'venue', title: 'Venue', type: 'reference', to: [{ type: 'gallery' }], validation: r => r.required() }),
    defineField({ name: 'artists', title: 'Artists', type: 'array', of: [{ type: 'reference', to: [{ type: 'artist' }] }] }),
    defineField({ name: 'startDate', title: 'Start Date', type: 'date', validation: r => r.required() }),
    defineField({ name: 'endDate', title: 'End Date', type: 'date' }),
    defineField({ name: 'description', title: 'Description', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'images', title: 'Images', type: 'array', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({ name: 'featured', title: 'Featured on landing page', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'venue.name', media: 'images.0' },
  },
})
```

- [ ] **Step 2: Create `sanity/schemas/event.ts`**

```ts
import { defineType, defineField } from 'sanity'

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'venue', title: 'Venue', type: 'reference', to: [{ type: 'gallery' }], validation: r => r.required() }),
    defineField({
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: { list: ['opening', 'finissage', 'talk', 'guided tour', 'performance', 'other'] },
      validation: r => r.required(),
    }),
    defineField({ name: 'date', title: 'Date', type: 'datetime', validation: r => r.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'isFree', title: 'Free admission', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'venue.name' },
  },
})
```

- [ ] **Step 3: Create `sanity/schemas/newsArticle.ts`**

```ts
import { defineType, defineField } from 'sanity'

export const newsArticle = defineType({
  name: 'newsArticle',
  title: 'News Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime', validation: r => r.required() }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: ['openings', 'interviews', 'artfairs', 'artists', 'museums', 'news'] },
    }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'coverImage' },
  },
})
```

- [ ] **Step 4: Create `sanity/schemas/artist.ts`**

```ts
import { defineType, defineField } from 'sanity'

export const artist = defineType({
  name: 'artist',
  title: 'Artist',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: r => r.required() }),
    defineField({ name: 'bio', title: 'Bio', type: 'text' }),
    defineField({ name: 'nationality', title: 'Nationality', type: 'string' }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
    defineField({ name: 'images', title: 'Images', type: 'array', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({
      name: 'linkedGalleries',
      title: 'Linked Galleries',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'gallery' }] }],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'nationality', media: 'images.0' },
  },
})
```

- [ ] **Step 5: Update schema index**

```ts
import { SchemaTypeDefinition } from 'sanity'
import { gallery } from './gallery'
import { exhibition } from './exhibition'
import { event } from './event'
import { newsArticle } from './newsArticle'
import { artist } from './artist'

export const schemaTypes: SchemaTypeDefinition[] = [
  gallery,
  exhibition,
  event,
  newsArticle,
  artist,
]
```

- [ ] **Step 6: Verify all document types appear in Studio**

Open `/studio` — all 5 document types should appear in the sidebar.

- [ ] **Step 7: Commit**

```bash
git add sanity/schemas/
git commit -m "feat: add Exhibition, Event, NewsArticle, Artist Sanity schemas"
```

---

## Phase 3: Sanity Client & GROQ Queries

### Task 7: Sanity client and image helper

**Files:**
- Create: `lib/sanity/client.ts`
- Create: `lib/sanity/image.ts`
- Create: `lib/sanity/queries.ts`

- [ ] **Step 1: Create `lib/sanity/client.ts`**

```ts
import { createClient } from 'next-sanity'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})
```

- [ ] **Step 2: Create `lib/sanity/image.ts`**

```ts
import imageUrlBuilder from '@sanity/image-url'
import { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { sanityClient } from './client'

const builder = imageUrlBuilder(sanityClient)

export function urlForImage(source: SanityImageSource) {
  return builder.image(source)
}
```

- [ ] **Step 3: Write test for GROQ queries**

Create `lib/sanity/__tests__/queries.test.ts`:

```ts
import { galleryListQuery, galleryBySlugQuery, featuredExhibitionsQuery, upcomingEventsQuery } from '../queries'

describe('GROQ queries', () => {
  it('galleryListQuery is a non-empty string', () => {
    expect(typeof galleryListQuery).toBe('string')
    expect(galleryListQuery.length).toBeGreaterThan(0)
  })

  it('galleryBySlugQuery contains $slug parameter', () => {
    expect(galleryBySlugQuery).toContain('$slug')
  })

  it('featuredExhibitionsQuery filters by featured', () => {
    expect(featuredExhibitionsQuery).toContain('featured')
  })

  it('upcomingEventsQuery filters by date', () => {
    expect(upcomingEventsQuery).toContain('date')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
npx jest lib/sanity/__tests__/queries.test.ts
```

Expected: FAIL — `Cannot find module '../queries'`

- [ ] **Step 5: Create `lib/sanity/queries.ts`**

```ts
export const galleryListQuery = `
  *[_type == "gallery"] | order(name asc) {
    _id, name, slug, venueType, neighborhood, address, coordinates, hours, website,
    "coverImage": images[0]
  }
`

export const galleryBySlugQuery = `
  *[_type == "gallery" && slug.current == $slug][0] {
    _id, name, slug, venueType, neighborhood, address, coordinates, hours, about, website, images,
    "currentExhibitions": *[_type == "exhibition" && references(^._id) && startDate <= now() && (endDate >= now() || !defined(endDate))] {
      _id, title, slug, startDate, endDate, description, images,
      "artists": artists[]->{ name, slug }
    },
    "upcomingEvents": *[_type == "event" && references(^._id) && date >= now()] | order(date asc) {
      _id, title, slug, eventType, date, description, isFree
    }
  }
`

export const featuredExhibitionsQuery = `
  *[_type == "exhibition" && featured == true] | order(startDate desc) [0...6] {
    _id, title, slug, startDate, endDate, "images": images[0...1],
    "venue": venue->{ name, slug, neighborhood }
  }
`

export const upcomingEventsQuery = `
  *[_type == "event" && date >= now()] | order(date asc) {
    _id, title, slug, eventType, date, description, isFree,
    "venue": venue->{ name, slug, neighborhood, address }
  }
`

export const allEventsQuery = `
  *[_type == "event"] | order(date desc) {
    _id, title, slug, eventType, date, description, isFree,
    "venue": venue->{ name, slug, neighborhood, address }
  }
`

export const eventBySlugQuery = `
  *[_type == "event" && slug.current == $slug][0] {
    _id, title, slug, eventType, date, description, isFree,
    "venue": venue->{ _id, name, slug, neighborhood, address, hours }
  }
`

export const newsListQuery = `
  *[_type == "newsArticle"] | order(publishedAt desc) {
    _id, title, slug, publishedAt, tags, coverImage
  }
`

export const newsBySlugQuery = `
  *[_type == "newsArticle" && slug.current == $slug][0] {
    _id, title, slug, publishedAt, tags, coverImage, body
  }
`

export const artistListQuery = `
  *[_type == "artist"] | order(name asc) {
    _id, name, slug, nationality, "coverImage": images[0],
    "linkedGalleries": linkedGalleries[]->{ name, slug }
  }
`

export const artistBySlugQuery = `
  *[_type == "artist" && slug.current == $slug][0] {
    _id, name, slug, bio, nationality, website, images,
    "linkedGalleries": linkedGalleries[]->{ name, slug },
    "currentExhibitions": *[_type == "exhibition" && references(^._id) && startDate <= now() && (endDate >= now() || !defined(endDate))] {
      title, slug, "venue": venue->{ name, slug }
    }
  }
`

export const mapVenuesQuery = `
  *[_type == "gallery" && defined(coordinates.lat)] {
    _id, name, slug, venueType, neighborhood, coordinates, hours,
    "coverImage": images[0],
    "currentExhibition": *[_type == "exhibition" && references(^._id) && startDate <= now() && (endDate >= now() || !defined(endDate))][0] {
      title, slug
    }
  }
`
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx jest lib/sanity/__tests__/queries.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add lib/sanity/
git commit -m "feat: add Sanity client, image helper, and GROQ queries"
```

---

## Phase 4: Navigation, Layout & Auth UI

### Task 8: Root layout and navigation

**Files:**
- Create: `components/ui/Nav.tsx`
- Create: `components/ui/Footer.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `components/ui/Nav.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '/map', label: 'Map' },
  { href: '/galleries', label: 'Galleries' },
  { href: '/events', label: 'Events' },
  { href: '/news', label: 'News' },
  { href: '/artists', label: 'Artists' },
]

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Berlin Art Guide
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 text-sm">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-gray-600 hover:text-black transition-colors">
              {l.label}
            </Link>
          ))}
          <Link href="/account" className="text-gray-600 hover:text-black transition-colors">
            Account
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="flex flex-col px-4 py-3 gap-4 text-sm">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-700 hover:text-black"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/account" className="text-gray-700 hover:text-black" onClick={() => setOpen(false)}>
              Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Create `components/ui/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-gray-100 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 text-sm text-gray-400 flex justify-between flex-wrap gap-4">
        <span>© {new Date().getFullYear()} Berlin Art Guide</span>
        <span>Art for Berlin locals</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Update `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/ui/Nav'
import { Footer } from '@/components/ui/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Berlin Art Guide',
  description: 'Galleries, museums, and art events in Berlin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Nav />
        <main className="pt-14">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verify layout renders**

```bash
npm run dev
```

Open http://localhost:3000 — nav should appear. Resize window — hamburger menu should appear on mobile width.

- [ ] **Step 5: Commit**

```bash
git add components/ui/ app/layout.tsx
git commit -m "feat: add responsive nav, footer, and root layout"
```

---

### Task 9: Auth pages and login modal

**Files:**
- Create: `app/auth/login/page.tsx`
- Create: `app/auth/signup/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `components/ui/LoginModal.tsx`

- [ ] **Step 1: Create `app/auth/login/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/account')
    router.refresh()
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="border border-gray-200 rounded px-3 py-2 text-sm w-full"
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
            className="border border-gray-200 rounded px-3 py-2 text-sm w-full"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-black text-white rounded py-2 text-sm disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <button onClick={handleGoogle}
          className="mt-3 w-full border border-gray-200 rounded py-2 text-sm hover:bg-gray-50">
          Continue with Google
        </button>
        <p className="mt-4 text-sm text-gray-500 text-center">
          No account? <Link href="/auth/signup" className="underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/auth/signup/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createBrowserClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); return }
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm">We sent a confirmation link to {email}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6">Create account</h1>
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
          <input type="password" placeholder="Password (min 8 chars)" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={8}
            className="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="bg-black text-white rounded py-2 text-sm">
            Create account
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500 text-center">
          Already have an account? <Link href="/auth/login" className="underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/auth/callback/route.ts`**

```ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
```

- [ ] **Step 4: Create `components/ui/LoginModal.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export function LoginModal({ onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.refresh()
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1"><X size={18} /></button>
        <h2 className="text-lg font-semibold mb-4">Sign in to continue</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="border border-gray-200 rounded px-3 py-2 text-sm" />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
            className="border border-gray-200 rounded px-3 py-2 text-sm" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-black text-white rounded py-2 text-sm disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-3 text-xs text-gray-400 text-center">
          No account? <a href="/auth/signup" className="underline">Sign up</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Test auth flow manually**

1. Go to `/auth/signup`, create a test account
2. Check your email for confirmation (or disable email confirmation in Supabase dashboard for dev)
3. Go to `/auth/login`, sign in
4. Confirm redirect to `/account` (will 404 for now — that's fine)

- [ ] **Step 6: Commit**

```bash
git add app/auth/ components/ui/LoginModal.tsx
git commit -m "feat: add auth pages and login modal"
```

---

## Phase 5: Map

### Task 10: Geocoding webhook API route

**Files:**
- Create: `app/api/geocode/route.ts`

- [ ] **Step 1: Write test for geocoding route**

Create `app/api/geocode/__tests__/route.test.ts`:

```ts
import { POST } from '../route'
import { NextRequest } from 'next/server'

describe('POST /api/geocode', () => {
  it('returns 401 with invalid webhook secret', async () => {
    const req = new NextRequest('http://localhost/api/geocode', {
      method: 'POST',
      headers: { 'sanity-webhook-signature': 'bad' },
      body: JSON.stringify({ _id: 'abc', _type: 'gallery', address: '123 Test St' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest app/api/geocode/__tests__/route.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `app/api/geocode/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
})

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', Berlin, Germany')}&key=${process.env.GOOGLE_GEOCODING_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results[0]) return null
  const { lat, lng } = data.results[0].geometry.location
  return { lat, lng }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('sanity-webhook-signature') ?? ''
  if (signature !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { _id, _type, address } = body

  if (_type !== 'gallery' || !address) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const coords = await geocodeAddress(address)
  if (!coords) {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 422 })
  }

  await writeClient.patch(_id).set({ coordinates: coords }).commit()

  return NextResponse.json({ ok: true, coords })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest app/api/geocode/__tests__/route.test.ts
```

Expected: PASS

- [ ] **Step 5: Register Sanity webhook**

In Sanity dashboard → API → Webhooks → Add webhook:
- URL: `https://your-production-domain.vercel.app/api/geocode` (use ngrok for local dev testing)
- Dataset: `production`
- Trigger on: Create, Update
- Filter: `_type == "gallery"`
- HTTP method: POST
- Secret: match `SANITY_WEBHOOK_SECRET` in `.env.local`

- [ ] **Step 6: Commit**

```bash
git add app/api/geocode/
git commit -m "feat: add geocoding webhook API route"
```

---

### Task 11: Mapbox map component

**Files:**
- Create: `components/map/Map.tsx`
- Create: `components/map/VenuePanel.tsx`
- Create: `components/map/MapFilters.tsx`
- Create: `app/map/page.tsx`
- Modify: `app/layout.tsx` (add mapbox CSS)

- [ ] **Step 1: Add Mapbox CSS to layout**

Add to `app/layout.tsx` imports:

```tsx
import 'mapbox-gl/dist/mapbox-gl.css'
```

- [ ] **Step 2: Create `components/map/MapFilters.tsx`**

```tsx
'use client'

interface Props {
  venueType: string
  setVenueType: (v: string) => void
  neighborhood: string
  setNeighborhood: (v: string) => void
}

const neighborhoods = ['All', 'Mitte', 'Prenzlauer Berg', 'Kreuzberg', 'Friedrichshain', 'Charlottenburg', 'Schöneberg', 'Neukölln']

export function MapFilters({ venueType, setVenueType, neighborhood, setNeighborhood }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {/* Type filter */}
      {['all', 'gallery', 'museum'].map(t => (
        <button
          key={t}
          onClick={() => setVenueType(t)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${venueType === t ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}
        >
          {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
      <span className="w-px bg-gray-200 mx-1" />
      {/* Neighborhood filter */}
      <select
        value={neighborhood}
        onChange={e => setNeighborhood(e.target.value)}
        className="px-3 py-1 rounded-full text-xs border border-gray-200 bg-white text-gray-700"
      >
        {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/map/VenuePanel.tsx`**

```tsx
import Link from 'next/link'
import { X } from 'lucide-react'

interface Venue {
  _id: string
  name: string
  slug: { current: string }
  venueType: string
  neighborhood: string
  hours: string[]
  currentExhibition?: { title: string; slug: { current: string } }
}

interface Props {
  venue: Venue | null
  onClose: () => void
}

export function VenuePanel({ venue, onClose }: Props) {
  if (!venue) return null

  return (
    <>
      {/* Desktop: side panel */}
      <div className="hidden md:flex absolute top-0 right-0 h-full w-80 bg-white shadow-xl z-10 flex-col p-6 overflow-y-auto">
        <PanelContent venue={venue} onClose={onClose} />
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-10 p-5 max-h-[60vh] overflow-y-auto">
        <PanelContent venue={venue} onClose={onClose} />
      </div>
    </>
  )
}

function PanelContent({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  return (
    <>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{venue.venueType}</span>
        <button onClick={onClose} className="p-1 -mr-1"><X size={16} /></button>
      </div>
      <h2 className="text-lg font-semibold mb-1">{venue.name}</h2>
      <p className="text-sm text-gray-500 mb-3">{venue.neighborhood}</p>
      {venue.currentExhibition && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Now on</p>
          <Link
            href={`/events/${venue.currentExhibition.slug.current}`}
            className="text-sm font-medium hover:underline"
          >
            {venue.currentExhibition.title}
          </Link>
        </div>
      )}
      {venue.hours?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Hours</p>
          {venue.hours.map((h, i) => <p key={i} className="text-sm text-gray-700">{h}</p>)}
        </div>
      )}
      <Link
        href={`/galleries/${venue.slug.current}`}
        className="block w-full text-center bg-black text-white rounded-lg py-2 text-sm"
      >
        View gallery
      </Link>
    </>
  )
}
```

- [ ] **Step 4: Create `components/map/Map.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { VenuePanel } from './VenuePanel'
import { MapFilters } from './MapFilters'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface Venue {
  _id: string
  name: string
  slug: { current: string }
  venueType: string
  neighborhood: string
  coordinates: { lat: number; lng: number }
  hours: string[]
  currentExhibition?: { title: string; slug: { current: string } }
}

interface Props {
  venues: Venue[]
}

export function Map({ venues }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ marker: mapboxgl.Marker; venue: Venue }[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [venueType, setVenueType] = useState('all')
  const [neighborhood, setNeighborhood] = useState('All')

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [13.405, 52.52], // Berlin center
      zoom: 12,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')
    map.current.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-left')

    venues.forEach(venue => {
      if (!venue.coordinates?.lat) return

      const el = document.createElement('div')
      el.className = 'venue-marker'
      el.style.cssText = `
        width: 12px; height: 12px; border-radius: 50%;
        background: ${venue.venueType === 'museum' ? '#1a1a1a' : '#666'};
        border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `

      const marker = new mapboxgl.Marker(el)
        .setLngLat([venue.coordinates.lng, venue.coordinates.lat])
        .addTo(map.current!)

      el.addEventListener('click', () => setSelectedVenue(venue))
      markersRef.current.push({ marker, venue })
    })
  }, [venues])

  // Filter markers
  useEffect(() => {
    markersRef.current.forEach(({ marker, venue }) => {
      const typeMatch = venueType === 'all' || venue.venueType === venueType
      const neighborhoodMatch = neighborhood === 'All' || venue.neighborhood === neighborhood
      const el = marker.getElement()
      el.style.display = typeMatch && neighborhoodMatch ? 'block' : 'none'
    })
  }, [venueType, neighborhood])

  return (
    <div className="relative w-full h-full">
      {/* Filters */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full shadow-md px-4 py-2">
        <MapFilters
          venueType={venueType} setVenueType={setVenueType}
          neighborhood={neighborhood} setNeighborhood={setNeighborhood}
        />
      </div>

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Venue panel */}
      <VenuePanel venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
    </div>
  )
}
```

- [ ] **Step 5: Create `app/map/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { mapVenuesQuery } from '@/lib/sanity/queries'
import { Map } from '@/components/map/Map'

export const revalidate = 3600

export default async function MapPage() {
  const venues = await sanityClient.fetch(mapVenuesQuery)

  return (
    <div className="h-[calc(100vh-56px)] w-full">
      <Map venues={venues} />
    </div>
  )
}
```

- [ ] **Step 6: Add sample gallery in Sanity and verify pin appears**

1. Go to `/studio` → Gallery/Museum → Add a gallery with a Berlin address
2. The webhook will geocode it (or manually add lat/lng for testing)
3. Visit `/map` — pin should appear

- [ ] **Step 7: Commit**

```bash
git add components/map/ app/map/
git commit -m "feat: add interactive Mapbox map with venue pins and filters"
```

---

## Phase 6: Gallery & Exhibition Pages

### Task 12: Gallery listing and detail pages

**Files:**
- Create: `components/venue/VenueCard.tsx`
- Create: `components/venue/ExhibitionCard.tsx`
- Create: `app/galleries/page.tsx`
- Create: `app/galleries/[slug]/page.tsx`

- [ ] **Step 1: Create `components/venue/VenueCard.tsx`**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'

interface Props {
  venue: {
    _id: string
    name: string
    slug: { current: string }
    venueType: string
    neighborhood: string
    coverImage?: any
  }
}

export function VenueCard({ venue }: Props) {
  const imgUrl = venue.coverImage ? urlForImage(venue.coverImage).width(600).height(400).url() : null

  return (
    <Link href={`/galleries/${venue.slug.current}`} className="group block">
      <div className="aspect-[3/2] bg-gray-100 overflow-hidden rounded-lg mb-3">
        {imgUrl ? (
          <Image
            src={imgUrl} alt={venue.name} width={600} height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{venue.venueType}</p>
      <h3 className="font-medium text-sm group-hover:underline">{venue.name}</h3>
      <p className="text-xs text-gray-500">{venue.neighborhood}</p>
    </Link>
  )
}
```

- [ ] **Step 2: Create `components/venue/ExhibitionCard.tsx`**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { formatDate } from '@/lib/utils'

interface Props {
  exhibition: {
    _id: string
    title: string
    slug: { current: string }
    startDate: string
    endDate?: string
    images?: any[]
    artists?: { name: string; slug: { current: string } }[]
  }
}

export function ExhibitionCard({ exhibition }: Props) {
  const imgUrl = exhibition.images?.[0] ? urlForImage(exhibition.images[0]).width(800).height(600).url() : null

  return (
    <div className="border-b border-gray-100 pb-6 mb-6">
      {imgUrl && (
        <div className="aspect-[4/3] overflow-hidden rounded-lg mb-4">
          <Image src={imgUrl} alt={exhibition.title} width={800} height={600} className="w-full h-full object-cover" />
        </div>
      )}
      <h3 className="font-semibold text-base mb-1">{exhibition.title}</h3>
      {exhibition.artists && exhibition.artists.length > 0 && (
        <p className="text-sm text-gray-600 mb-1">
          {exhibition.artists.map((a, i) => (
            <span key={a.slug.current}>
              <Link href={`/artists/${a.slug.current}`} className="hover:underline">{a.name}</Link>
              {i < exhibition.artists!.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
      <p className="text-xs text-gray-400">
        {formatDate(exhibition.startDate)}{exhibition.endDate ? ` – ${formatDate(exhibition.endDate)}` : ''}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Create `lib/utils.ts`**

```ts
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-DE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
```

- [ ] **Step 4: Create `app/galleries/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { galleryListQuery } from '@/lib/sanity/queries'
import { VenueCard } from '@/components/venue/VenueCard'

export const revalidate = 3600

export default async function GalleriesPage() {
  const venues = await sanityClient.fetch(galleryListQuery)
  const galleries = venues.filter((v: any) => v.venueType === 'gallery')
  const museums = venues.filter((v: any) => v.venueType === 'museum')

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {museums.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8">Museums</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {museums.map((v: any) => <VenueCard key={v._id} venue={v} />)}
          </div>
        </section>
      )}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8">Galleries</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {galleries.map((v: any) => <VenueCard key={v._id} venue={v} />)}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/galleries/[slug]/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { galleryBySlugQuery } from '@/lib/sanity/queries'
import { ExhibitionCard } from '@/components/venue/ExhibitionCard'
import { EventCard } from '@/components/events/EventCard'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const venue = await sanityClient.fetch(galleryBySlugQuery, { slug })
  if (!venue) notFound()

  const headerImg = venue.images?.[0] ? urlForImage(venue.images[0]).width(1400).height(600).url() : null

  return (
    <div>
      {headerImg && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <Image src={headerImg} alt={venue.name} width={1400} height={600} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{venue.venueType} · {venue.neighborhood}</p>
        <h1 className="text-3xl font-semibold mb-4">{venue.name}</h1>

        {venue.about && <p className="text-gray-600 mb-8 leading-relaxed">{venue.about}</p>}

        <div className="flex flex-wrap gap-4 mb-12 text-sm text-gray-500">
          {venue.address && <span>{venue.address}</span>}
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer" className="underline">Website</a>
          )}
        </div>

        {venue.hours?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Hours</h2>
            {venue.hours.map((h: string, i: number) => <p key={i} className="text-sm text-gray-700">{h}</p>)}
          </div>
        )}

        {venue.currentExhibitions?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Now On</h2>
            {venue.currentExhibitions.map((ex: any) => <ExhibitionCard key={ex._id} exhibition={ex} />)}
          </section>
        )}

        {venue.upcomingEvents?.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Upcoming Events</h2>
            <div className="flex flex-col gap-4">
              {venue.upcomingEvents.map((ev: any) => <EventCard key={ev._id} event={ev} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/venue/ app/galleries/ lib/utils.ts
git commit -m "feat: add gallery listing and detail pages"
```

---

## Phase 7: Events Calendar

### Task 13: Event calendar and detail pages

**Files:**
- Create: `components/events/EventCard.tsx`
- Create: `components/events/CalendarView.tsx`
- Create: `app/events/page.tsx`
- Create: `app/events/[slug]/page.tsx`

- [ ] **Step 1: Create `components/events/EventCard.tsx`**

```tsx
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

interface Props {
  event: {
    _id: string
    title: string
    slug: { current: string }
    eventType: string
    date: string
    isFree: boolean
    venue?: { name: string; slug: { current: string }; neighborhood?: string }
  }
}

export function EventCard({ event }: Props) {
  return (
    <Link href={`/events/${event.slug.current}`} className="group block p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{event.eventType}</span>
            {event.isFree && <span className="text-xs text-green-600">Free</span>}
          </div>
          <h3 className="font-medium text-sm group-hover:underline truncate">{event.title}</h3>
          {event.venue && (
            <p className="text-xs text-gray-500 mt-0.5">{event.venue.name}{event.venue.neighborhood ? ` · ${event.venue.neighborhood}` : ''}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(event.date)}</p>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create `components/events/CalendarView.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { EventCard } from './EventCard'

interface Event {
  _id: string
  title: string
  slug: { current: string }
  eventType: string
  date: string
  isFree: boolean
  venue?: { name: string; slug: { current: string }; neighborhood?: string }
}

interface Props { events: Event[] }

const EVENT_TYPES = ['All', 'opening', 'finissage', 'talk', 'guided tour', 'performance', 'other']
const NEIGHBORHOODS = ['All', 'Mitte', 'Prenzlauer Berg', 'Kreuzberg', 'Friedrichshain', 'Charlottenburg', 'Schöneberg', 'Neukölln']

export function CalendarView({ events }: Props) {
  const [type, setType] = useState('All')
  const [hood, setHood] = useState('All')
  const [freeOnly, setFreeOnly] = useState(false)

  const filtered = events.filter(e => {
    if (type !== 'All' && e.eventType !== type) return false
    if (hood !== 'All' && e.venue?.neighborhood !== hood) return false
    if (freeOnly && !e.isFree) return false
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {EVENT_TYPES.map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${type === t ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="w-px bg-gray-200 mx-1" />
        <select value={hood} onChange={e => setHood(e.target.value)}
          className="px-3 py-1 rounded-full text-xs border border-gray-200 bg-white text-gray-700">
          {NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}
        </select>
        <button onClick={() => setFreeOnly(f => !f)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${freeOnly ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200'}`}>
          Free only
        </button>
      </div>

      {/* Event list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && <p className="text-sm text-gray-400">No events match your filters.</p>}
        {filtered.map(e => <EventCard key={e._id} event={e} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/events/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { upcomingEventsQuery } from '@/lib/sanity/queries'
import { CalendarView } from '@/components/events/CalendarView'

export const revalidate = 1800

export default async function EventsPage() {
  const events = await sanityClient.fetch(upcomingEventsQuery)

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">Events</h1>
      <p className="text-gray-500 text-sm mb-10">Openings, talks, and guided tours in Berlin</p>
      <CalendarView events={events} />
    </div>
  )
}
```

- [ ] **Step 4: Create `app/events/[slug]/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { eventBySlugQuery } from '@/lib/sanity/queries'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SaveButton } from '@/components/account/SaveButton'

export const revalidate = 3600

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await sanityClient.fetch(eventBySlugQuery, { slug })
  if (!event) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{event.eventType}</span>
        {event.isFree && <span className="text-xs text-green-600">Free</span>}
      </div>
      <h1 className="text-3xl font-semibold mb-2">{event.title}</h1>
      <p className="text-gray-500 mb-6">{formatDateTime(event.date)}</p>

      {event.venue && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium">
            <Link href={`/galleries/${event.venue.slug.current}`} className="hover:underline">
              {event.venue.name}
            </Link>
          </p>
          {event.venue.address && <p className="text-xs text-gray-500 mt-1">{event.venue.address}</p>}
          {event.venue.hours?.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">{event.venue.hours[0]}</p>
          )}
        </div>
      )}

      {event.description && (
        <p className="text-gray-700 leading-relaxed mb-8">{event.description}</p>
      )}

      <SaveButton entityId={event._id} entityType="event" />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/events/ app/events/
git commit -m "feat: add event calendar and detail pages"
```

---

## Phase 8: News & Artist Pages

### Task 14: News listing and article pages

**Files:**
- Create: `components/news/NewsCard.tsx`
- Create: `app/news/page.tsx`
- Create: `app/news/[slug]/page.tsx`

- [ ] **Step 1: Create `components/news/NewsCard.tsx`**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { formatDate } from '@/lib/utils'

interface Props {
  article: {
    _id: string
    title: string
    slug: { current: string }
    publishedAt: string
    tags?: string[]
    coverImage?: any
  }
}

export function NewsCard({ article }: Props) {
  const imgUrl = article.coverImage ? urlForImage(article.coverImage).width(600).height(400).url() : null

  return (
    <Link href={`/news/${article.slug.current}`} className="group block">
      {imgUrl && (
        <div className="aspect-[3/2] overflow-hidden rounded-lg mb-3">
          <Image src={imgUrl} alt={article.title} width={600} height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      {article.tags && (
        <div className="flex gap-1 flex-wrap mb-2">
          {article.tags.map(t => (
            <span key={t} className="text-xs text-gray-400">#{t}</span>
          ))}
        </div>
      )}
      <h3 className="font-medium text-sm group-hover:underline mb-1">{article.title}</h3>
      <p className="text-xs text-gray-400">{formatDate(article.publishedAt)}</p>
    </Link>
  )
}
```

- [ ] **Step 2: Create `app/news/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { newsListQuery } from '@/lib/sanity/queries'
import { NewsCard } from '@/components/news/NewsCard'

export const revalidate = 3600

export default async function NewsPage() {
  const articles = await sanityClient.fetch(newsListQuery)

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold mb-10">News</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {articles.map((a: any) => <NewsCard key={a._id} article={a} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/news/[slug]/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { newsBySlugQuery } from '@/lib/sanity/queries'
import { PortableText } from '@portabletext/react'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await sanityClient.fetch(newsBySlugQuery, { slug })
  if (!article) notFound()

  const imgUrl = article.coverImage ? urlForImage(article.coverImage).width(1200).height(600).url() : null

  return (
    <div>
      {imgUrl && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <Image src={imgUrl} alt={article.title} width={1200} height={600} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {article.tags && (
          <div className="flex gap-2 mb-4">
            {article.tags.map((t: string) => (
              <span key={t} className="text-xs text-gray-400">#{t}</span>
            ))}
          </div>
        )}
        <h1 className="text-3xl font-semibold mb-2">{article.title}</h1>
        <p className="text-gray-400 text-sm mb-10">{formatDate(article.publishedAt)}</p>
        <div className="prose prose-sm max-w-none text-gray-800">
          <PortableText value={article.body} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Install Tailwind Typography plugin (for prose styles)**

```bash
npm install -D @tailwindcss/typography
```

Add to `tailwind.config.ts`:

```ts
plugins: [require('@tailwindcss/typography')],
```

- [ ] **Step 5: Commit**

```bash
git add components/news/ app/news/ tailwind.config.ts
git commit -m "feat: add news listing and article pages"
```

---

### Task 15: Artist listing and profile pages

**Files:**
- Create: `components/artists/ArtistCard.tsx`
- Create: `app/artists/page.tsx`
- Create: `app/artists/[slug]/page.tsx`

- [ ] **Step 1: Create `components/artists/ArtistCard.tsx`**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'

interface Props {
  artist: {
    _id: string
    name: string
    slug: { current: string }
    nationality?: string
    coverImage?: any
  }
}

export function ArtistCard({ artist }: Props) {
  const imgUrl = artist.coverImage ? urlForImage(artist.coverImage).width(400).height(400).url() : null

  return (
    <Link href={`/artists/${artist.slug.current}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
        {imgUrl ? (
          <Image src={imgUrl} alt={artist.name} width={400} height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>
      <h3 className="font-medium text-sm group-hover:underline">{artist.name}</h3>
      {artist.nationality && <p className="text-xs text-gray-400">{artist.nationality}</p>}
    </Link>
  )
}
```

- [ ] **Step 2: Create `app/artists/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { artistListQuery } from '@/lib/sanity/queries'
import { ArtistCard } from '@/components/artists/ArtistCard'

export const revalidate = 3600

export default async function ArtistsPage() {
  const artists = await sanityClient.fetch(artistListQuery)

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold mb-10">Artists</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {artists.map((a: any) => <ArtistCard key={a._id} artist={a} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/artists/[slug]/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { artistBySlugQuery } from '@/lib/sanity/queries'
import Image from 'next/image'
import Link from 'next/link'
import { urlForImage } from '@/lib/sanity/image'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artist = await sanityClient.fetch(artistBySlugQuery, { slug })
  if (!artist) notFound()

  const headerImg = artist.images?.[0] ? urlForImage(artist.images[0]).width(1200).height(600).url() : null

  return (
    <div>
      {headerImg && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <Image src={headerImg} alt={artist.name} width={1200} height={600} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {artist.nationality && <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">{artist.nationality}</p>}
        <h1 className="text-3xl font-semibold mb-2">{artist.name}</h1>
        {artist.website && (
          <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 underline mb-6 inline-block">
            {artist.website}
          </a>
        )}
        {artist.bio && <p className="text-gray-700 leading-relaxed mb-10">{artist.bio}</p>}

        {artist.linkedGalleries?.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Represented by</h2>
            <div className="flex flex-wrap gap-2">
              {artist.linkedGalleries.map((g: any) => (
                <Link key={g.slug.current} href={`/galleries/${g.slug.current}`}
                  className="text-sm border border-gray-200 rounded-full px-3 py-1 hover:border-gray-400 transition-colors">
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {artist.currentExhibitions?.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Current Exhibitions</h2>
            {artist.currentExhibitions.map((ex: any) => (
              <div key={ex.slug.current} className="flex justify-between items-center py-3 border-b border-gray-100">
                <p className="text-sm font-medium">{ex.title}</p>
                <Link href={`/galleries/${ex.venue.slug.current}`} className="text-xs text-gray-400 hover:underline">
                  {ex.venue.name}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/artists/ app/artists/
git commit -m "feat: add artist listing and profile pages"
```

---

## Phase 9: User Account & Journal

### Task 16: SaveButton component

**Files:**
- Create: `components/account/SaveButton.tsx`

- [ ] **Step 1: Write test for SaveButton**

Create `components/account/__tests__/SaveButton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { SaveButton } from '../SaveButton'

jest.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
    })),
  }),
}))

describe('SaveButton', () => {
  it('renders a save button', () => {
    render(<SaveButton entityId="abc" entityType="event" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Install React Testing Library**

```bash
npm install -D @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest components/account/__tests__/SaveButton.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 4: Create `components/account/SaveButton.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { LoginModal } from '@/components/ui/LoginModal'

interface Props {
  entityId: string
  entityType: 'event' | 'venue'
}

export function SaveButton({ entityId, entityType }: Props) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createBrowserClient()

  const table = entityType === 'event' ? 'saved_events' : 'saved_venues'
  const column = entityType === 'event' ? 'sanity_event_id' : 'sanity_venue_id'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null
      setUserId(uid)
      if (!uid) return
      supabase.from(table).select('id').eq('user_id', uid).eq(column, entityId).single()
        .then(({ data }) => setSaved(!!data))
    })
  }, [entityId, table, column])

  async function toggle() {
    if (!userId) { setShowLogin(true); return }
    setLoading(true)
    if (saved) {
      await supabase.from(table).delete().eq('user_id', userId).eq(column, entityId)
      setSaved(false)
    } else {
      await supabase.from(table).insert({ user_id: userId, [column]: entityId })
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-colors ${
          saved ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
        }`}
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {saved ? 'Saved' : 'Save'}
      </button>
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => { setShowLogin(false); toggle() }} />
      )}
    </>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest components/account/__tests__/SaveButton.test.tsx
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/account/
git commit -m "feat: add login-gated SaveButton component"
```

---

### Task 17: Journal editor and account dashboard

**Files:**
- Create: `components/account/JournalEditor.tsx`
- Create: `app/account/page.tsx`

- [ ] **Step 1: Create `components/account/JournalEditor.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  eventId: string
}

export function JournalEditor({ userId, eventId }: Props) {
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    supabase.from('journal_entries')
      .select('body')
      .eq('user_id', userId)
      .eq('sanity_event_id', eventId)
      .single()
      .then(({ data }) => { if (data) setBody(data.body) })
  }, [userId, eventId])

  async function save() {
    setSaving(true)
    await supabase.from('journal_entries').upsert(
      { user_id: userId, sanity_event_id: eventId, body, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,sanity_event_id' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mt-4">
      <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-2">My Notes</h3>
      <textarea
        value={body}
        onChange={e => { setBody(e.target.value); setSaved(false) }}
        placeholder="Write your thoughts about this event…"
        rows={4}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
      />
      <button
        onClick={save}
        disabled={saving}
        className="mt-2 text-xs bg-black text-white rounded-full px-4 py-1.5 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save note'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/account/page.tsx`**

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sanityClient } from '@/lib/sanity/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { JournalEditor } from '@/components/account/JournalEditor'

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch saved events with journal entries
  const { data: savedEvents } = await supabase
    .from('saved_events')
    .select('*, journal_entries(*)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  // Fetch saved venues
  const { data: savedVenues } = await supabase
    .from('saved_venues')
    .select('*')
    .eq('user_id', user.id)

  // Fetch Sanity data for saved events
  let eventDetails: any[] = []
  if (savedEvents && savedEvents.length > 0) {
    const ids = savedEvents.map((s: any) => s.sanity_event_id)
    eventDetails = await sanityClient.fetch(
      `*[_type == "event" && _id in $ids] { _id, title, slug, date, eventType, "venue": venue->{ name, slug } }`,
      { ids }
    )
  }

  // Fetch Sanity data for saved venues
  let venueDetails: any[] = []
  if (savedVenues && savedVenues.length > 0) {
    const ids = savedVenues.map((s: any) => s.sanity_venue_id)
    venueDetails = await sanityClient.fetch(
      `*[_type == "gallery" && _id in $ids] { _id, name, slug, venueType, neighborhood }`,
      { ids }
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-1">My Art Journal</h1>
      <p className="text-gray-400 text-sm mb-10">{user.email}</p>

      {/* Saved Events */}
      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Saved Events</h2>
        {eventDetails.length === 0 && (
          <p className="text-sm text-gray-400">No saved events yet. <Link href="/events" className="underline">Browse events</Link></p>
        )}
        {eventDetails.map((ev: any) => {
          const saved = savedEvents?.find((s: any) => s.sanity_event_id === ev._id)
          return (
            <div key={ev._id} className="border-b border-gray-100 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{ev.eventType} · {formatDateTime(ev.date)}</p>
                  <Link href={`/events/${ev.slug.current}`} className="font-medium text-sm hover:underline">{ev.title}</Link>
                  {ev.venue && (
                    <Link href={`/galleries/${ev.venue.slug.current}`} className="block text-xs text-gray-500 hover:underline mt-0.5">
                      {ev.venue.name}
                    </Link>
                  )}
                </div>
              </div>
              <JournalEditor userId={user.id} eventId={ev._id} />
            </div>
          )
        })}
      </section>

      {/* Saved Venues */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Saved Galleries & Museums</h2>
        {venueDetails.length === 0 && (
          <p className="text-sm text-gray-400">No saved venues yet. <Link href="/galleries" className="underline">Browse galleries</Link></p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {venueDetails.map((v: any) => (
            <Link key={v._id} href={`/galleries/${v.slug.current}`}
              className="p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors">
              <p className="text-xs text-gray-400 mb-1">{v.venueType} · {v.neighborhood}</p>
              <p className="text-sm font-medium">{v.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Verify account page**

1. Log in, save an event
2. Go to `/account` — saved event should appear with journal editor
3. Type a note and save — reload page, note should persist

- [ ] **Step 4: Commit**

```bash
git add components/account/JournalEditor.tsx app/account/
git commit -m "feat: add account dashboard with saves and journal"
```

---

## Phase 10: Landing Page

### Task 18: Landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update `app/page.tsx`**

```tsx
import { sanityClient } from '@/lib/sanity/client'
import { featuredExhibitionsQuery, upcomingEventsQuery } from '@/lib/sanity/queries'
import Image from 'next/image'
import Link from 'next/link'
import { urlForImage } from '@/lib/sanity/image'
import { EventCard } from '@/components/events/EventCard'
import { formatDate } from '@/lib/utils'

export const revalidate = 3600

export default async function HomePage() {
  const [featured, upcomingEvents] = await Promise.all([
    sanityClient.fetch(featuredExhibitionsQuery),
    sanityClient.fetch(upcomingEventsQuery),
  ])

  const nextEvents = upcomingEvents.slice(0, 5)

  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-none mb-6">
            Berlin<br />Art Guide
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            Galleries, museums, and art events for Berlin locals.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/map" className="bg-black text-white rounded-full px-5 py-2.5 text-sm">
              Open map
            </Link>
            <Link href="/events" className="border border-gray-200 rounded-full px-5 py-2.5 text-sm hover:border-gray-400 transition-colors">
              Upcoming events
            </Link>
          </div>
        </div>
      </section>

      {/* Featured exhibitions */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-400">Now on</h2>
            <Link href="/galleries" className="text-xs text-gray-400 hover:text-black underline">All galleries</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((ex: any) => {
              const imgUrl = ex.images?.[0] ? urlForImage(ex.images[0]).width(800).height(600).url() : null
              return (
                <Link key={ex._id} href={`/galleries/${ex.venue?.slug?.current}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 mb-4">
                    {imgUrl && (
                      <Image src={imgUrl} alt={ex.title} width={800} height={600}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-1">
                    {ex.venue?.name} · {ex.venue?.neighborhood} ·{' '}
                    {formatDate(ex.startDate)}{ex.endDate ? ` – ${formatDate(ex.endDate)}` : ''}
                  </p>
                  <h3 className="font-medium text-sm group-hover:underline">{ex.title}</h3>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {nextEvents.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 mb-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-400">Upcoming events</h2>
            <Link href="/events" className="text-xs text-gray-400 hover:text-black underline">All events</Link>
          </div>
          <div className="flex flex-col gap-3">
            {nextEvents.map((ev: any) => <EventCard key={ev._id} event={ev} />)}
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify landing page**

Open http://localhost:3000 — hero should render. Add a featured exhibition in Sanity and reload to verify it appears.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page with hero, featured exhibitions, and upcoming events"
```

---

## Phase 11: AI Writing Assistant in Sanity

### Task 19: Claude AI draft API route and Sanity plugin

**Files:**
- Create: `app/api/ai-draft/route.ts`
- Create: `sanity/plugins/aiDraft.ts`
- Modify: `sanity/sanity.config.ts`

- [ ] **Step 1: Create `app/api/ai-draft/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const { fieldName, currentValue, documentType, documentTitle } = await request.json()

  if (!fieldName || !documentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const systemPrompt = `You are an editorial assistant for a Berlin art guide. Write concise, engaging, and authoritative art editorial copy in English. Keep descriptions precise and evocative — this is for a sophisticated Berlin art audience. Never use clichés. Maximum 150 words unless asked for more.`

  const userPrompt = `Write editorial copy for the "${fieldName}" field of a ${documentType} document titled "${documentTitle}".${currentValue ? `\n\nExisting draft to improve:\n${currentValue}` : '\n\nWrite a fresh draft.'}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ draft: text })
}
```

- [ ] **Step 2: Create `sanity/plugins/aiDraft.ts`**

```ts
import { definePlugin } from 'sanity'
import { useFormValue } from 'sanity'

// Sanity custom input component for AI-assisted text fields
export const aiDraftPlugin = definePlugin({
  name: 'ai-draft',
})

// Custom action added to text/textarea fields in Sanity Studio
export function withAiDraft(fieldConfig: any) {
  return {
    ...fieldConfig,
    components: {
      input: AiDraftInput,
    },
  }
}

// React component — inline in this file to keep the plugin self-contained
import React, { useState } from 'react'
import { set, StringInputProps, TextInputProps } from 'sanity'

type Props = StringInputProps | TextInputProps

function AiDraftInput(props: Props) {
  const [loading, setLoading] = useState(false)
  const documentType = useFormValue(['_type']) as string
  const documentTitle = useFormValue(['title']) as string || useFormValue(['name']) as string || ''

  async function handleDraft() {
    setLoading(true)
    const res = await fetch('/api/ai-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldName: props.id,
        currentValue: props.value ?? '',
        documentType,
        documentTitle,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.draft && props.onChange) {
      props.onChange(set(data.draft))
    }
  }

  return (
    <div>
      {props.renderDefault(props)}
      <button
        type="button"
        onClick={handleDraft}
        disabled={loading}
        style={{
          marginTop: 6,
          padding: '4px 12px',
          fontSize: 12,
          background: loading ? '#ccc' : '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 20,
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Drafting…' : '✦ Draft with AI'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Apply AI draft input to description fields in schemas**

In `sanity/schemas/gallery.ts`, update the `about` field:

```ts
import { withAiDraft } from '../plugins/aiDraft'

// Replace the about field definition with:
withAiDraft(defineField({ name: 'about', title: 'About', type: 'text' }))
```

Do the same for `description` in `exhibition.ts`, `artist.ts` (`bio` field), `event.ts` (`description` field), and `newsArticle.ts` (`body` field — skip body, apply to a `summary` text field if desired).

- [ ] **Step 4: Verify AI draft button in Studio**

1. Go to `/studio` → Gallery/Museum → open a document
2. The "About" field should show a "✦ Draft with AI" button
3. Click it — should call the API and insert generated text

- [ ] **Step 5: Commit**

```bash
git add app/api/ai-draft/ sanity/plugins/ sanity/schemas/
git commit -m "feat: add Claude AI writing assistant in Sanity Studio"
```

---

## Phase 12: End-to-End Tests & Deployment

### Task 20: Playwright e2e tests

**Files:**
- Create: `e2e/home.spec.ts`
- Create: `e2e/map.spec.ts`
- Create: `e2e/events.spec.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 2: Create `e2e/home.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('landing page shows headline and nav', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Berlin Art Guide')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Map' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Events' })).toBeVisible()
})

test('mobile nav shows hamburger menu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByLabel('Toggle menu')).toBeVisible()
  await page.getByLabel('Toggle menu').click()
  await expect(page.getByRole('link', { name: 'Galleries' })).toBeVisible()
})
```

- [ ] **Step 3: Create `e2e/map.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('map page loads', async ({ page }) => {
  await page.goto('/map')
  await expect(page.locator('.mapboxgl-canvas')).toBeVisible({ timeout: 10000 })
})
```

- [ ] **Step 4: Create `e2e/events.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('events page shows filter buttons', async ({ page }) => {
  await page.goto('/events')
  await expect(page.getByText('Opening')).toBeVisible()
  await expect(page.getByText('Talk')).toBeVisible()
})

test('free only filter works', async ({ page }) => {
  await page.goto('/events')
  await page.getByText('Free only').click()
  // Filter button should become active (has bg-green-600)
  await expect(page.getByText('Free only')).toHaveClass(/bg-green-600/)
})
```

- [ ] **Step 5: Run e2e tests**

```bash
npx playwright test
```

Expected: tests pass (map test may need a real Mapbox token)

- [ ] **Step 6: Commit**

```bash
git add e2e/ playwright.config.ts
git commit -m "test: add Playwright e2e tests for home, map, and events"
```

---

### Task 21: Vercel deployment

**Files:**
- Create: `vercel.json` (optional, for webhook route config)

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/your-username/berlin-art-guide.git
git push -u origin main
```

- [ ] **Step 2: Deploy to Vercel**

1. Go to https://vercel.com → Import project → select your GitHub repo
2. Framework: Next.js (auto-detected)
3. Add all environment variables from `.env.local` (use production values)
4. Deploy

- [ ] **Step 3: Update Supabase redirect URL**

In Supabase → Authentication → URL Configuration → add your production domain as a Redirect URL: `https://your-domain.vercel.app/auth/callback`

- [ ] **Step 4: Update Sanity CORS**

In Sanity dashboard → API → CORS origins → add your production domain.

- [ ] **Step 5: Update geocoding webhook URL**

In Sanity dashboard → API → Webhooks → update the webhook URL to your production domain.

- [ ] **Step 6: Verify production deployment**

Open your Vercel URL:
- Landing page loads
- `/studio` loads and prompts Sanity login
- `/map` shows Mapbox map
- `/events` shows event list
- Sign up/login flow works

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: production deployment configuration"
```

---

## Checklist Summary

- [ ] Phase 1: Project foundation (Next.js, Supabase schema, client utils)
- [ ] Phase 2: Sanity Studio setup with all 5 schemas
- [ ] Phase 3: Sanity client, image helper, GROQ queries
- [ ] Phase 4: Nav, layout, auth pages, login modal
- [ ] Phase 5: Map (Mapbox, venue pins, filters, geocoding webhook)
- [ ] Phase 6: Gallery listing and detail pages
- [ ] Phase 7: Event calendar and detail pages
- [ ] Phase 8: News and artist pages
- [ ] Phase 9: SaveButton, account dashboard, journal editor
- [ ] Phase 10: Landing page
- [ ] Phase 11: AI writing assistant in Sanity Studio
- [ ] Phase 12: E2e tests and Vercel deployment
