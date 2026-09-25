# UDDESHO - Study Navigator

*A Gift from Faijul Haque*

A private study-abroad research workspace for students. Roll a country, research it, collect
universities in your own database, and track your applications.

**Stack:** Next.js 14 (App Router) + React + Tailwind CSS, Firebase Authentication, Firestore and
Storage, deployable on Netlify.

## The student journey

| Step | Route | What happens |
|------|-------|--------------|
| 1 | `/` | Landing page: logo, headline, **Start Your Journey** / **Login** |
| 2 | `/login` | Create an account or log in (email + password, or Google) |
| 3 | `/profile` | 4-step profile: About you, Academics, Study plan, Your future, then **Continue** |
| 4 | `/roll` | A 3D dice. Press **Roll**, it tumbles away, and a random country appears |
| 5 | `/research/[country]` | Country Research Hub: info, checklist progress (0-100%), personal notes, **+ Add University** |
| 6 | `/research/[country]/universities` | University Database (card view or spreadsheet view) |
|   | `/research/[country]/universities/new` | Add University form, with unlimited custom fields |
| 7 | `/tracker` | Application Tracker: board, document checklists, deadlines |
|   | `/research` | "My Research": all countries you've started |

## 1. Set up Firebase (about 10 minutes)

1. Go to <https://console.firebase.google.com> and create a project.
2. **Authentication** -> Get started -> enable **Email/Password** and **Google**.
3. **Firestore Database** -> Create database (production mode).
4. **Storage** -> Get started. (For profile pictures. Firebase now asks new projects to be on the
   Blaze pay-as-you-go plan for Storage. If you skip Storage, everything still works, only the
   profile picture upload will be unavailable.)
5. **Project settings -> General -> Your apps -> Web (`</>`)** -> register an app and copy the config.
6. Publish the security rules so each student can only read and write their own data:
   - **Firestore -> Rules**: paste the contents of `firestore.rules` and Publish.
   - **Storage -> Rules**: paste the contents of `storage.rules` and Publish.

   Or with the Firebase CLI: `npm i -g firebase-tools && firebase login && firebase use <project-id> && firebase deploy --only firestore:rules,storage`

## 2. Run it locally

```bash
npm install
cp .env.example .env.local     # then paste your Firebase web config into .env.local
npm run dev                    # http://localhost:3000
```

## 3. Deploy on Netlify

1. Push this folder to a GitHub repository.
2. In Netlify: **Add new site -> Import an existing project** and pick the repo.
   Netlify detects Next.js automatically (`netlify.toml` is included: build command `npm run build`).
3. **Site configuration -> Environment variables**: add the six `NEXT_PUBLIC_FIREBASE_*` values from `.env.example`.
   These must be set **before** the build, because Next.js bakes them in at build time.
4. Deploy.
5. Copy your Netlify address (for example `your-site.netlify.app`) into
   **Firebase -> Authentication -> Settings -> Authorized domains**. Without this, login will be refused.

## How the private workspace is stored

```
users/{uid}                     profile: name, photo, academic, study, future
  countries/{countryId}         notes + research checklist
  universities/{id}             all university fields + customFields: [{id, label, value}]
  scholarships/{id}             created automatically from a university's scholarship section
  applications/{id}             tracker entry (same id as its university): stage, deadline, checklist, notes
```

`firestore.rules` allows a signed-in user to read and write **only** `users/{their own uid}/...`. All other paths are closed.

## Customising

- **Countries**: edit `src/data/countries.js`. Add a block with a unique `id`, a 2-letter `code`, and the six info fields.
  The dice picks randomly from this list. The facts are a general starting guide; students are reminded to verify them on official sites.
- **Colours**: brand colours (taken from the logo) live in `tailwind.config.js` (`blue`, `orange`, `red`, `mint`).
- **Logo**: `public/logo.png` (transparent). The favicon is `src/app/icon.png`.
- **Decision statuses / tracker stages / document checklist**: `src/lib/db.js`.

## Project structure

```
src/
  app/            pages (landing, login, profile, roll, research, tracker)
  components/     Logo, Dice, Flag, PageShell, UniversityForm, shared UI ...
  lib/            firebase.js, auth-context.jsx, db.js, hooks.js
  data/           countries.js
public/           logo.png
firestore.rules   storage.rules   netlify.toml   .env.example
```
