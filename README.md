# Cancer Center Management System

A production-ready management system for cancer centers built with React, TypeScript, and Vite.

## 🚀 Tech Stack

- **Framework:** React 18+ (with Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Lucide Icons
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form & Zod
- **i18n:** i18next (English & Arabic with RTL support)
- **Charts:** Recharts

## 🛠️ Features

- **Multi-role Authentication:** Admin and Doctor roles supported.
- **Dynamic Dashboard:** Real-time stats and treatment distribution charts.
- **Patient Management:** Comprehensive records including vitals, lab results, and imaging reports.
- **Interactive UI:** Smooth transitions, glassmorphism design, and dark/light mode.
- **Multi-language:** Full support for Arabic (RTL) and English.

## 📦 Deployment on Vercel

1. **Push to GitHub/GitLab/Bitbucket.**
2. **Import project on Vercel.**
3. **Environment Variables:**
   - Make sure to add any required `.env` variables in the Vercel dashboard if you move away from mock data.
4. **Build Settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

The project includes a `vercel.json` file to handle Client-Side Routing (SPA) automatically.

## 🚦 Getting Started

### Installation

```bash
npm install
# or
yarn install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## 🔐 Mock Credentials

- **Admin:** `admin` / `admin123`
- **Doctor:** `dr.ahmed` / `doctor123`
