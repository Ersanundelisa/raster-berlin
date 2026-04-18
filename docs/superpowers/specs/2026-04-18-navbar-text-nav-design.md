# Spec: Replace Footer Icon Nav with Navbar Text Links

**Date:** 2026-04-18  
**Status:** Approved

## Summary

Remove the bottom footer navigation (icon + label tabs) and replace it with centered text links — "Galleries" and "Artists" — placed between the logo and the action icons in the existing navbar.

## Changes

### HTML (`index.html`)

1. **Delete** the entire `<nav class="app-footer" id="appFooter">` block (lines 430–450).
2. **Add** a `<div class="navbar-nav">` inside `<nav class="navbar">`, between `.navbar-brand` and `.navbar-actions`:

```html
<div class="navbar-nav">
  <a href="#" class="navbar-nav-link active" data-target="musts">Galleries</a>
  <a href="#" class="navbar-nav-link" data-target="artists">Artists</a>
</div>
```

### CSS (`css/style.css`)

1. **Add** styles for `.navbar-nav` and `.navbar-nav-link`:
   - Flex row, centered, gap between links
   - Uppercase, letter-spaced, small font-size matching site's editorial type style
   - `.active` state: underline or font-weight boost
   - Position: `position: absolute; left: 50%; transform: translateX(-50%)` inside the relative-positioned navbar so it sits truly centered regardless of logo/action widths

2. **Remove or zero out** bottom padding/safe-area offsets applied to `.app-pages` or content sections that compensated for the footer bar height.

### JS (`js/app.js`)

1. **Extend** the active-state selector from `.app-footer-item[data-target]` to also include `.navbar-nav-link[data-target]`, so the new links get `.active` toggled on page switch.
2. **Add** click event listeners on `.navbar-nav-link[data-target]` that call the existing `navigateTo(target)` function.
3. Remove any logic that references `appFooter` show/hide if it exists (check for display toggling on scroll or page change).

## Active State Behavior

On load, the `musts` page is active → "Galleries" link has `.active` class.  
Clicking "Artists" → navigates to artists page, "Artists" gets `.active`, "Galleries" loses it.

## Typography

Match existing navbar link style: uppercase, `font-size: 12px`, `letter-spacing: 0.08em`, `font-weight: 600`. Active state: `border-bottom: 1.5px solid currentColor`.

## Out of Scope

- Burger menu contents are unchanged
- Map page (`data-target="map"`) is not added to the navbar nav (not currently in the footer either)
- No changes to search, Instagram, or burger button
