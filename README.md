# URL Shortener

A React + Vite URL shortener application with authentication, link management, analytics, and QR code support.

## Features

- User authentication with Supabase
- Create and manage shortened links
- Dashboard with link statistics
- Redirect page for shortened URLs
- QR code generation for easy sharing
- Tailwind CSS styling and Radix UI components

## Tech Stack

- React
- Vite
- Tailwind CSS
- Supabase
- React Router DOM
- Radix UI
- Recharts

## Project Structure

- `src/App.jsx` — main app entry and router setup
- `src/context.jsx` — global URL/auth context provider
- `src/pages/` — pages for landing, auth, dashboard, link details, and redirect handling
- `src/components/` — UI components and auth helpers
- `src/db/` — Supabase client and API modules
- `src/lib/` — utility helpers

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root with your Supabase values:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-key
```

3. Run the development server:

```bash
npm run dev
```

4. Open the local URL shown in the terminal (usually `http://localhost:5173`).

## Scripts

- `npm run dev` — start development server
- `npm run build` — build production bundle
- `npm run preview` — preview production build
- `npm run lint` — run ESLint checks

## Notes

This project uses Supabase for backend data storage and authentication. Make sure your Supabase project is configured with the appropriate tables or authentication settings before using the app.


