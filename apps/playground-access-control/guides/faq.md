---
title: FAQ
description: Frequently asked questions about access control
---

# Frequently Asked Questions

This page is **public**.

## Is the content of protected pages visible in HTML source?

No. Protected pages are rendered as empty shells during build (SSR exclusion). The content is compiled into separate JS chunks that are loaded only after authentication succeeds. If you "View Source" on a protected page, you'll see the layout but no documentation content.

## What happens if I disable JavaScript?

You will see the page shell with a message saying "Authentication required to view this content." The actual content is never in the HTML.

## Can I use this with any hosting platform?

Yes. Layer 1 (SSR exclusion + client-side auth) works on any static hosting platform. For stronger security, enable Layer 2 edge middleware with Netlify, Vercel, or Cloudflare.

## How do groups work?

Users can belong to groups (e.g., "admin", "premium"). Pages can require specific groups via frontmatter (`accessGroups: ["admin"]`) or via rules in docs.json. A user needs at least one matching group to access the page.
