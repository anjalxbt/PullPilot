# AI-Powered GitHub Review Assistant

**Automated PR Analysis with AI-driven Feedback**

A modern MVP web application built with Next.js 14, Tailwind CSS, and shadcn/ui components that demonstrates an AI-powered GitHub pull request review assistant.

---

## 🚀 Features

- **Landing Page** with hero section, features, how-it-works, and CTA
- **Mock Dashboard** with:
  - Pull Requests table with AI review summaries
  - Analytics charts using Recharts
  - Custom rule configuration settings
- **Responsive Design** with Tailwind CSS
- **Modern UI Components** inspired by shadcn/ui
- **Static MVP** - No backend required

---

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** for data visualization
- **shadcn/ui-inspired** components

---

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
/app
  /page.tsx              → Landing page
  /dashboard/page.tsx    → Dashboard page
  /layout.tsx            → Root layout with Navbar & Footer
  /globals.css           → Global styles

/components
  /ui/                   → Reusable UI components (Button, Card, Tabs, etc.)
  Navbar.tsx             → Navigation bar
  Footer.tsx             → Footer component
  FeatureCard.tsx        → Feature card component
  AnalyticsChart.tsx     → Recharts analytics component

/lib
  utils.ts               → Utility functions (cn helper)
```

---

## 🎨 Pages

### `/` - Landing Page
- Hero section with CTA
- 4 feature cards
- How it works (3 steps)
- Join the beta CTA

### `/dashboard` - Dashboard
- Mock user profile
- Tabs for:
  - **Pull Requests:** Table with AI summaries
  - **Analytics:** Charts and metrics
  - **Settings:** Custom rule configuration form

---

## 🎯 Future Enhancements

- GitHub OAuth integration
- Real API endpoints for PR analysis
- Webhook integration for automatic reviews
- AI model integration (OpenAI, Anthropic, etc.)
- Database for storing review history

---

## 👥 Built By

**Group 7, Government Engineering College Wayanad**

© 2025

---

## 📝 License

This is an MVP project for demonstration purposes.
