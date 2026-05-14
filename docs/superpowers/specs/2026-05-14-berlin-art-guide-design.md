# Berlin Art Guide — Design Spec
**Date:** 2026-05-14

## Overview

A Berlin art guide web platform for locals, focused on galleries and museums. The site provides a fast interactive map, current exhibition listings, an event calendar, editorial news, artist profiles, and personal user journals. All editorial content is managed through a Sanity CMS with AI writing assistance (Claude API). User accounts are optional — visitors browse freely and are prompted to log in only when using save/journal features.

---

## Architecture & Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), deployed on Vercel |
| Editorial CMS | Sanity Studio v3 at `/studio` |
| User data & auth | Supabase (Postgres + Auth + Storage) |
| Map | Mapbox GL JS |
| Geocoding | Google Maps Geocoding API (run at publish time, not runtime) |
| AI writing assistant | Claude API (claude-sonnet-4-6) via Next.js API route |
| Deployment | Vercel (frontend) + Supabase cloud + Sanity cloud |

**Key architectural decisions:**
- Server components by default; client components only for map, auth, and interactive UI
- Gallery/museum coordinates are geocoded when content is published in Sanity and stored as lat/lng — the map loads instantly with no runtime geocoding
- Supabase handles all user-generated data (saves, journal entries); Sanity handles all editorial content
- AI (Claude) is admin-only — embedded in Sanity Studio as a custom plugin for drafting/improving text fields

---

## Pages & Features

### Landing Page
- Full-width editorial hero image with headline
- Featured current exhibitions (pulled from Sanity, curated by admin)
- Map preview strip showing gallery locations
- Entry points to map, event calendar, news, and artist area
- Design aesthetic: curated magazine, not a directory

### Map
- Full-screen interactive Mapbox GL map
- Pins for every gallery and museum in the Sanity database
- Clicking a pin opens a slide-in panel: venue name, current show, hours, link to full venue page
- Filters: type (gallery / museum), neighborhood (Mitte, Prenzlauer Berg, Kreuzberg, etc.), "open now"
- Browser geolocation to center map on user
- Loads fast — all coordinates pre-stored, no runtime geocoding

### Gallery & Museum Pages
- Header image, about text
- Current exhibition(s): title, images, description, dates
- Upcoming events at the venue
- Address, opening hours, map embed
- "Save venue" button (login-gated)

### Event Calendar
- Browsable calendar of openings, finissages, talks, guided tours
- Filters: date range, venue, event type, neighborhood
- Each event links to its venue page
- "Save event" and add journal note (login-gated)

### News
- Editorial articles about the Berlin art scene
- Published via Sanity with AI drafting assistance
- Tag-based browsing: #openings, #interviews, #artfairs, #artists, etc.

### Artist Area
- Individual artist profile pages: bio, images, linked galleries, current/upcoming shows
- All managed in Sanity

### User Account Area
- Optional login via email/password or Google OAuth (Supabase Auth)
- Personal dashboard: saved events, past events with journal notes, saved venues
- Journal entries: private, rich-text, attached to specific events
- Account settings

---

## Sanity CMS Content Types

| Type | Fields |
|---|---|
| Gallery | Name, slug, type (gallery/museum), address, coordinates, neighborhood, hours, about, images, website |
| Exhibition | Title, venue (ref), artists (refs), start date, end date, description, images, featured |
| Event | Title, venue (ref), type (opening/talk/finissage/tour), date, time, description, free/ticketed |
| News Article | Title, slug, author, publish date, body (rich text), tags, cover image |
| Artist | Name, slug, bio, images, linked galleries (refs), nationality, website |

Every rich-text and description field in Sanity Studio has an "AI Draft" button that calls Claude to generate or improve copy in context.

---

## Supabase Schema

| Table | Columns |
|---|---|
| `profiles` | id (FK auth.users), display_name, avatar_url, created_at |
| `saved_events` | id, user_id, sanity_event_id, saved_at |
| `saved_venues` | id, user_id, sanity_venue_id, saved_at |
| `journal_entries` | id, user_id, sanity_event_id, body (text), created_at, updated_at |

Row-level security (RLS) enabled on all tables — users can only read and write their own data.

---

## Authentication

- Supabase Auth with email/password and Google OAuth
- Auth state managed via `@supabase/ssr` in Next.js middleware
- Protected route: `/account` (Supabase Auth)
- `/studio` is protected by Sanity's own authentication (Sanity accounts, separate from Supabase)
- Login prompt shown inline (modal) when unauthenticated user clicks Save or Journal

---

## AI Writing Assistant (CMS only)

- Custom Sanity Studio plugin
- Each text/description field has a "Draft with AI" button
- On click: sends field context + surrounding content to Claude via a Next.js API route
- Claude returns a suggested draft; admin can accept, edit, or discard
- No AI features exposed to public site visitors

---

## Map Data Strategy

1. Admin adds a gallery or museum in Sanity with a street address
2. On publish, a Sanity webhook triggers a Next.js API route
3. The API route calls Google Maps Geocoding API to resolve lat/lng
4. Coordinates are written back to the Sanity document
5. The public map reads pre-stored coordinates — zero geocoding at runtime

---

## Out of Scope

- Social/sharing features (users cannot share their journals or saved lists publicly)
- Gallery self-submission portal
- Ticketing or e-commerce
- AI chat guide for visitors
- Mobile app
