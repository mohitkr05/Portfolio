# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint (configured with Next.js TypeScript rules)

## Project Architecture

This is a Local AI Portfolio application built with Next.js 15 (App Router) that stores all data client-side using IndexedDB via Dexie.js. The application features a portfolio dashboard for content management and a public portfolio view for showcasing work.

### Key Architecture Points

- **Client-side only**: All data is stored locally in the browser using IndexedDB
- **AI Integration**: Uses OpenAI API for content generation (API key stored locally)
- **Import/Export**: Portfolio data can be backed up/restored via JSON files
- **Component Structure**: Uses ShadCN UI components with TailwindCSS styling

### Directory Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable React components
  - `src/components/layout/` - Layout components (MainLayout)
  - `src/components/ui/` - ShadCN UI components (configured via components.json)
- `src/lib/` - Utility functions and shared logic
- `src/hooks/` - Custom React hooks (alias configured)

### Key Dependencies

- **UI**: ShadCN UI (New York style), TailwindCSS v4, Lucide React icons, Framer Motion
- **Data**: Dexie.js for IndexedDB operations
- **AI**: OpenAI API client
- **Styling**: class-variance-authority, clsx, tailwind-merge (via cn utility)

### Configuration

- **TypeScript**: Path mapping configured (`@/*` → `./src/*`)
- **ShadCN**: New York style, CSS variables enabled, components aliased to `@/components`
- **ESLint**: Uses Next.js core-web-vitals and TypeScript configs
- **Fonts**: Geist Sans and Geist Mono via next/font/google

### Environment Setup

Optional `.env.local` for OpenAI API key:
```
OPENAI_API_KEY=your-api-key
```