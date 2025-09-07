**Title:** Open Source Next.js Portfolio Manager (Local + OpenAI API)

**Description:**
Create a fully client-side Next.js application that lets users manage and showcase their portfolio online. The application should not require authentication or a backend — all data should be stored locally in the browser (IndexedDB or localStorage). Users can configure their own OpenAI API key via environment variables for AI-powered text generation.

**Requirements:**

### Tech Stack

- Next.js (latest, App Router)
- TypeScript
- TailwindCSS for styling
- ShadCN UI for forms, modals, buttons, inputs, and cards
- IndexedDB (via Dexie.js) or localStorage for persistence
- OpenAI API integration for AI-generated portfolio content

### Core Features

1. **Portfolio Dashboard**

- Read the data from a csv, the csv file should be provided as a template
- The template should have the country, security type(stock/realestate/mutual fund/etf etc), security name
- There should be an investment date
- Fetch the current value based on the security type and security name
- Calculate the profit/loss
- Provide a suggestion based on the diversification and risk tolerance of the user

2. **Public Portfolio View**

   - Modern landing page with sections:

     - Hero (profile picture, tagline, CTA)
     - About Me
     - Skills (list/grid with icons)
     - Projects (cards with images, descriptions, external links)
     - Blog section (if enabled)
     - Contact info (static links to email/socials)

3. **AI Integration (OpenAI)**

   - Button inside project/blog editor: "Generate with AI"
   - Generate portfolio content:

     - Descriptions of projects
     - Blog post drafts
     - Resume-style skill summaries

   - Allow users to select from multiple AI-generated suggestions

4. **Settings Page**

   - Edit profile info (name, tagline, profile picture, social links)
   - Theme toggle (light/dark)
   - Option to import/export JSON portfolio data
   - Show instructions on how to set `OPENAI_API_KEY` in `.env.local` for local development

### UI/UX

- Desktop-focused layout (sidebar + content area)
- Responsive enough to work on mobile, but optimized for large screens
- Clean, minimalist portfolio style (rounded cards, glassmorphism, soft shadows)
- Smooth transitions with Framer Motion

### Project Setup

- Store everything client-side (no backend or auth)
- `.env.local` to configure `OPENAI_API_KEY`
- Include a sample `.env.example`
- Provide README with:

  - Setup instructions
  - How to add an OpenAI API key
  - How to run locally and deploy to Vercel

### Open Source & Community

- Add MIT License
- Add CONTRIBUTING.md for community improvements
- Project name: **"Local AI Portfolio"**
