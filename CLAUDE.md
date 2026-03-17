# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BirdSounds is a TypeScript/Express API that combines two external bird APIs:
- **Nuthatch API** (nuthatch.lastelm.software) — provides bird metadata and images
- **Xeno-canto API** (xeno-canto.org) — provides bird sound recordings

The single main endpoint `GET /random-bird` fetches a random bird from Nuthatch, then looks up a matching audio recording from Xeno-canto, returning both in one response.

## Commands

- `npm run dev` — Start dev server with ts-node-dev (auto-restarts on changes), runs on port 3002
- `npm run build` — Compile TypeScript to `dist/`
- `npm start` — Run compiled JS from `dist/index.js`
- No test suite is configured

## Architecture

Single-file Express server at `src/index.ts`. All logic (types, helpers, routes, server startup) lives in this one file. The app uses ES modules (`"type": "module"` in package.json) with `NodeNext` module resolution.

## Environment Variables

Requires a `.env` file with:
- `NUTHATCH_API_KEY` — Required for bird data (endpoint will 500 without it)
- `XENOCANTO_API_KEY` — Optional; if missing, sound data is omitted gracefully (returns `null`)
- `PORT` — Optional, defaults to 3002

## API Endpoints

- `GET /health` — Returns `{ status: "ok" }`
- `GET /random-bird` — Returns random bird info + optional sound recording
