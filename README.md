# Alpha Rental Platform

A fullstack property rental marketplace for Ethiopia — houses, apartments, villas, offices,
land and more — built with **React + Vite + Tailwind CSS** (frontend) and
**Node.js + Express + MongoDB Atlas** (backend).

## Quick start (frontend)

```bash
cd frontend
npm install
npm run dev  
    # starts dev server on http://localhost:3000
npm run build      # production build to /dist
npm run preview    # preview the production build
```

## Quick start (backend)

```bash
cd backend
npm install
cp .env.example .env        # set MONGO_URI to your Atlas connection string
npm run seed                # seed admin user, demo properties; registered users are preserved
npm run dev                 # starts API on http://localhost:5000
```

## Accounts

There are no demo tenant/owner accounts. Every user must register their own account, and that account (name, email) is what shows on the dashboard and profile after signing in.

| Role  | Email                | Password    |
| ----- | -------------------- | ----------- |
| Admin | admin@alpharent.com  |  |

## Pages

- **Home** – hero + search (location / property type / price range), featured listings, latest
  listings, category grid, popular cities, owner CTA.
- **Property listing** – responsive card grid with image, title, location, monthly price, type,
  beds/baths, owner info and favorite button; filter sidebar (city, category, price, bedrooms,
  amenities) + sorting; mobile filter drawer; state synced to URL query params.
- **Property details** – image gallery, full info, amenity list, embedded OpenStreetMap location,
  price breakdown, contact-owner modal (with reveal-phone), rental request (booking) modal, similar
  properties.
- **Auth** – role selection (tenant / property owner), register (2-step, role toggle, validation),
  login.
- **Tenant dashboard** – overview stats, saved properties, rental requests, messages, profile
  settings.
- **Owner dashboard** – overview with property statistics, manage listings (delete), rental request
  approval/decline, messages, profile settings.
- **Add / Edit property** – 5-step form: basics, location, details + amenities, photo upload
  (multiple, client-side preview), contact info.

## Tech & structure

```
frontend/
  index.html        # Vite entry point
  vite.config.js    # Vite dev/build config (port 3000)
  src/
    api/            # API integration layer (real HTTP calls to the backend)
      apiClient.js  # fetch wrapper, auth header, base URL from VITE_API_BASE_URL
      properties.js # property CRUD → GET/POST/PUT/DELETE /properties
      auth.js       # register/login/session → /auth/*
      interactions.js # rental requests + messages → /requests, /messages
    components/
      layout/       # Navbar, Footer, Layout, ScrollToTop
      ui/           # Icon, Logo, Spinner, Modal, ToastStack, Avatar, EmptyState, SectionHeader
      property/     # PropertyCard, PropertyGrid, PropertyImageGallery, FavoriteButton, BookingModal
      search/       # SearchBar (hero + inline variants)
      filter/       # FilterPanel, SortDropdown
      home/         # CategoryGrid, CityGrid
      dashboard/    # DashboardLayout, StatCard, RequestCard, MessagesPanel, ProfileSettings
      auth/         # AuthLayout, ProtectedRoute
    context/        # AuthContext, FavoritesContext, ToastContext
    data/           # static meta (categories, cities) only
    pages/          # route-level pages
    utils/          # formatting + SVG placeholder image helpers

backend/
  config/           # database connection
  controllers/      # auth, property, request, message, user, favorite
  middleware/       # auth (JWT), upload, validation, error handlers
  models/           # User, Property, RentalRequest, Message, Favorite
  routes/           # REST route definitions
  utils/            # token, asyncHandler, AppError, city normalization
  seed.js           # demo data seeder
```

## Rental availability and approvals

Submitting an application creates a pending rental request without reserving or
changing the property's availability. An administrator's approval atomically
claims an available, approved property, approves the request, and creates its
active rental agreement. A property with an active agreement is protected by a
unique partial MongoDB index, and each rental request can have only one agreement.
Replica-set deployments use transactions, with an atomic property claim and
rollback as a fallback on standalone MongoDB.

Administrators can review all agreements from the Admin > Rental Agreements
page. Tenants and owners see only agreements linked to their own account in
their dashboard, and agreement details are checked against the signed-in user
on the backend.

Cancelling, completing, or expiring an agreement returns the property to
available only when no other active agreement or approved rental reservation
exists. Expired agreements are reconciled when availability, property, or
agreement listings are read.

Run backend checks with `cd backend && npm test`. Before deploying the unique
agreement indexes, inspect existing records for duplicate active agreements per
property and duplicate agreements per rental request, and resolve any duplicates.
MongoDB builds the indexes automatically through Mongoose `autoIndex`.

## Architecture

- **Frontend** runs on port 3000 and calls the API at `http://localhost:5000/api`
  (configured via `VITE_API_BASE_URL` in `.env`).
- **Backend** runs on port 5000, serves uploaded images from `/uploads`, and stores data
  in MongoDB Atlas. Auth is JWT-based; protected routes expect a `Bearer` token that is
  stored in `localStorage` on login/register.
- All page components import from `src/api/*` — no UI changes needed to swap services.
