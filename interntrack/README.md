# InternTrack - Smart Internship Application Tracker

> **“Search opportunities across the internet. Apply on official platforms. Track everything in one simple 3-page webapp.”**

A modern, fast, uncluttered 3-page productivity web application designed for college students, freshers, and job seekers to discover internship opportunities from across the web, apply directly on official portals, and track their entire application lifecycle with **zero database** (100% persistent via browser LocalStorage).

---

## Zero-Database Architecture: 100% Client-Side Persistent Storage

**InternTrack strictly requires NO DATABASE.**
- No MongoDB
- No MySQL
- No PostgreSQL
- No Firebase
- No Supabase
- No SQLite

Instead, InternTrack leverages **HTML5 Browser LocalStorage** along with the **Web Notifications API**, **File API**, and **Blob Download API**. The application runs completely in the browser with **zero backend dependencies**, **zero server hosting costs**, and **instant load times**.

---

## The 3-Page Architecture (Clean, Focused & Simple)

### Page 1: Search Internships (Aggregated From Across The Web)
- **Live Internet Opportunities**: Aggregates curated internship openings across:
 - Tech Giants: **Google Careers**, **Microsoft Careers**, **Amazon Jobs**, **Meta Careers**, **Apple**, **Netflix**, **Uber**, **Atlassian**, **Adobe**
 - Startups & Y Combinator: **Stripe**, **Supabase**, **Vercel**, **Postman**, **Linear**, **Figma**
 - Leading Indian Tech & Portals: **Zomato**, **Swiggy**, **Razorpay**, **Zepto**, **Flipkart**, **Infosys**, **TCS**, **LinkedIn**, **Unstop**, **Internshala**
 - Global Remote: **GitLab**, **Automattic**, **Canonical**
- **Real-Time Keyword Search**: Instantly searches by job title, company name, skills (e.g. *Python*, *React*, *FastAPI*), and location.
- **Category Filter Pills**: Quick filter by ` All Roles`, ` Software & SDE`, ` AI & Data Science`, ` Frontend & Fullstack`, `️ Backend & Cloud`, ` UI/UX & Design`, and ` Remote Only`.
- **Platform & Work Mode Filters**: Filter by Remote/Hybrid/On-site and specific portal.
- **Direct Official Portal Application**: Click **"Apply on Official Site ↗"** to immediately jump to the company's real application form and apply from their platform.
- **1-Click "+ Track"**: Saves the opportunity instantly to your LocalStorage tracker (Page 2) with status *Saved* or *Applied*.
- **Track Any Custom Web Link**: Paste any internship URL found on LinkedIn, Reddit, WhatsApp, or Telegram to immediately add it to your tracker.

---

### Page 2: My Application Tracker
- **Dynamic KPI Summary**: Real-time counter cards for **Total Applications**, **In Review / Applied**, **Interviews**, and **Offers Received **.
- **Hiring Stages & Visual Badges**:
 - **Saved**
 - **Applied**
 - **Under Review**
 - **Interview**
 - **Selected (Offer)**
 - **Rejected**
 - **Withdrawn**
- **Full CRUD Management**: Add custom internships, edit details, delete, and view comprehensive information.
- **Instant Search & Multi-Filters**: Filter simultaneously by Status, Work Mode, Priority, and Starred Favorites ⭐.
- **Dual Layout Switching**: Toggle between responsive **Grid Cards** and compact **List View**.
- **Quick Status Changer**: Change hiring stages right from the card or view modal.

---

### Page 3: ⏰ Deadlines & Interviews Schedule
- **Upcoming Application Deadlines**:
 - Automated remaining days calculation relative to today's date.
 - Urgency indicators:
 - **Urgent**: 0-2 days remaining (*Due Today / Tomorrow*).
 - ️ **Warning**: 3-7 days remaining.
 - **Normal**: > 7 days remaining.
 - **Expired**: Past application cutoff.
 - Quick action to open portal link or mark as applied.
- **Scheduled Interview Rounds Hub**:
 - Chronological schedule for **HR**, **Technical**, **Coding**, **Managerial**, and **Final** rounds.
 - Direct 1-click **"Join Interview ↗"** buttons for Google Meet, Zoom, or Microsoft Teams.
 - Displays interviewer name and preparation notes.
- **Pipeline Funnel & Conversion Rates**:
 - Real-time **Interview Callback Rate %** ($\frac{\text{Interviews}}{\text{Total}} \times 100$).
 - Real-time **Offer Selection Rate %** ($\frac{\text{Offers}}{\text{Total}} \times 100$).
 - Visual conversion funnel bars showing drop-off stages.

---

## Data Management & Backup

- **Export JSON**: Download your entire tracker as a clean backup (`interntrack-backup-YYYY-MM-DD.json`).
- **Import JSON**: Upload previously exported backups with merge or overwrite options.
- **Load Realistic Demo Data**: 1-click load realistic sample internships (Google, Microsoft, TCS, Infosys, etc.) with live dates aligned to the current month.
- **Reset & Delete All**: Safe deletion requiring the user to type `"DELETE"`.
- **️ / Dark Mode**: Clean SaaS aesthetic with persistent theme selection.
- ** Responsive Mobile Navigation**: Sticky bottom tab bar on mobile screens for effortless one-thumb switching.

---

## ️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Markup & Semantics** | HTML5 Semantic Elements (`<main>`, `<header>`, `<nav>`, `<dialog>`) |
| **Styling & Design** | Pure Modern CSS3, CSS Custom Properties, Flexbox, CSS Grid, Glassmorphism |
| **Client Logic** | Vanilla JavaScript (ES6+ Modules, Closures, DOM APIs, Event Listeners) |
| **Storage Engine** | Browser `window.localStorage` (100% Client-Side, Zero Database) |
| **Iconography** | [Lucide Icons](https://lucide.dev/) via CDN |
| **Typography** | Plus Jakarta Sans & Inter via Google Fonts |

---

## Project Directory Structure

```text
interntrack/
│
├── index.html # 3-Page Application Entry Point
│
├── css/
│ ├── style.css # Design system, 3-page navigation, opportunity cards, modals
│ └── responsive.css # Responsive styling & mobile bottom tab bar
│
├── js/
│ ├── utils.js # Helpers: Date/time math, XSS sanitization, toast alerts
│ ├── storage.js # LocalStorage CRUD engine, JSON backup/restore, demo generator
│ ├── opportunities.js # Internet opportunities aggregator, search & filter engine
│ ├── applications.js # Page 2: Tracker CRUD, filters, grid/list rendering
│ ├── deadlines-interviews.js # Page 3: Deadlines countdown, interview rounds, funnel stats
│ └── app.js # 3-Page router, theme toggle, modals, notification alerts
│
├── assets/
│ └── icons/favicon.svg # Application SVG Favicon
│
├── server.js # Lightweight local static development server
└── README.md # Project documentation
```

---

## Running Locally

To run the application locally on your machine:

```powershell
node server.js
```

Then open your browser at:
 **[http://localhost:3000](http://localhost:3000)**
