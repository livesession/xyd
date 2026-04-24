---
title: Internal Guide
description: Internal development guide - requires authentication
public: false
---

# Internal Development Guide

This page is **protected** - only authenticated users can see this content.

## Development Setup

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Set up your `.env.local` file
4. Run `pnpm dev`

## Architecture Overview

Our system consists of three main services:

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 3000 | Request routing |
| Auth Service | 3001 | Authentication |
| Content API | 3002 | Content delivery |

## Deployment

Deployments are automated via CI/CD. Push to `master` to deploy to production.
