const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'InternTrack_Project_Guide.pdf');
const doc = new PDFDocument({
  size: 'A4',
  bufferPages: true,
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  info: {
    Title: 'InternTrack - Project Overview & Architecture Guide',
    Author: 'InternTrack Development Team',
    Subject: 'Smart Internship Application Tracker Documentation',
    Keywords: 'InternTrack, LocalStorage, Internship Tracker, Single Page Application'
  }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Colors
const PRIMARY = '#2563EB';     // Indigo
const SECONDARY = '#0284C7';   // Purple
const DARK = '#0F172A';        // Slate 900
const TEXT = '#334155';        // Slate 700
const MUTED = '#64748B';       // Slate 500
const LIGHT_BG = '#F8FAFC';    // Slate 50
const BORDER = '#E2E8F0';      // Slate 200
const SUCCESS = '#16A34A';     // Green
const WARNING = '#D97706';     // Amber
const DANGER = '#DC2626';      // Red
const INFO = '#0284C7';        // Sky

const pageWidth = 595.28;
const contentWidth = pageWidth - 90; // 505.28

// Helper Functions
function drawHeader(title, subtitle) {
  // Brand Header
  doc.rect(45, 40, contentWidth, 68).fillAndStroke(LIGHT_BG, BORDER);
  
  doc.rect(45, 40, 6, 68).fill(PRIMARY);

  doc.fillColor(PRIMARY).fontSize(20).font('Helvetica-Bold')
     .text('InternTrack', 60, 48);

  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
     .text('Smart Internship Application Tracker  |  100% Client-Side  |  Zero Database', 60, 72);

  doc.fillColor(TEXT).fontSize(9.5).font('Helvetica-Oblique')
     .text('"Track applications. Prepare smarter. Land your internship."', 60, 86);

  doc.y = 120;
}

function drawSectionHeading(title) {
  const currentY = doc.y;
  if (currentY > 730) {
    doc.addPage();
  }
  
  const y = doc.y;
  doc.rect(45, y, contentWidth, 24).fill('#EFF6FF');
  doc.rect(45, y, 4, 24).fill(PRIMARY);
  
  doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold')
     .text(`${title.toUpperCase()}`, 55, y + 6);
  
  doc.y = y + 32;
}

function drawSubheading(title) {
  if (doc.y > 750) doc.addPage();
  doc.fillColor(DARK).fontSize(10.5).font('Helvetica-Bold')
     .text(title, 45, doc.y);
  doc.y += 3;
}

function drawParagraph(text) {
  if (doc.y > 750) doc.addPage();
  doc.fillColor(TEXT).fontSize(9).font('Helvetica')
     .text(text, 45, doc.y, { width: contentWidth, lineGap: 2.5 });
  doc.y += 6;
}

function drawBullet(title, desc) {
  if (doc.y > 755) doc.addPage();
  const y = doc.y;
  doc.circle(52, y + 5, 2.5).fill(PRIMARY);
  
  doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
     .text(title + ': ', 62, y, { continued: true });
  
  doc.fillColor(TEXT).font('Helvetica')
     .text(desc, { width: contentWidth - 17, lineGap: 2 });
  doc.y += 4;
}

function drawCard(title, items, accentColor = PRIMARY) {
  if (doc.y > 720) doc.addPage();
  const startY = doc.y;
  const padding = 10;
  
  doc.fontSize(9.5).font('Helvetica-Bold');
  let estimatedHeight = 24 + (items.length * 15) + 8;
  
  doc.rect(45, startY, contentWidth, estimatedHeight).fillAndStroke(LIGHT_BG, BORDER);
  doc.rect(45, startY, contentWidth, 20).fill(accentColor);
  
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
     .text(title, 55, startY + 5);
  
  let itemY = startY + 28;
  items.forEach(item => {
    doc.fillColor(DARK).fontSize(8.5).font('Helvetica-Bold')
       .text(item.label + ': ', 55, itemY, { continued: true });
    doc.fillColor(TEXT).font('Helvetica')
       .text(item.val, { width: contentWidth - 20 });
    itemY += 15;
  });
  
  doc.y = startY + estimatedHeight + 10;
}

// =========================================================================
// PAGE 1: EXECUTIVE SUMMARY & ARCHITECTURE & PAGE 1 SEARCH
// =========================================================================

drawHeader();

drawSectionHeading('1. Project Overview & Problem Statement', '');
drawParagraph('InternTrack is a modern, responsive web application engineered for college students and freshers to discover live internships across the web and manage their entire application lifecycle from a single, high-performance dashboard. Applying to dozens of internships across LinkedIn, company career portals, and job boards often leads to missed deadlines, lost links, and forgotten interview schedules. InternTrack centralizes the entire journey without requiring sign-up friction or external databases.');

drawSectionHeading('2. Core Philosophy: Zero Database & Instant Local Storage');
drawParagraph('Unlike traditional web apps that rely on slow cloud databases (MongoDB, MySQL, PostgreSQL, Firebase, Supabase), InternTrack is built on 100% Client-Side LocalStorage:');

drawBullet('Zero Server Setup', 'Runs instantly in any modern browser without configuring database credentials or cloud servers.');
drawBullet('Total Student Privacy', 'Application links, resumes, stipends, and notes are stored strictly in the user browser LocalStorage and never transmitted to external third parties.');
drawBullet('Full Offline Capability', 'Students can view, edit, organize, and prepare for interviews even without an active internet connection.');
drawBullet('Instant Performance', 'Zero network latency; instant search filtering, sorting, and status updates within milliseconds.');

drawSectionHeading('3. The 3-Page Focused Web Application Architecture', '');
drawParagraph('To maintain a clean, uncluttered user experience, the entire application is organized into exactly three dedicated pages:');

drawCard('Page 1: Search Internships Across The Web', [
  { label: 'Internet Aggregator', val: 'Curated live openings collected from Google Careers, Microsoft, Amazon, LinkedIn, Wellfound, Unstop, and Internshala.' },
  { label: 'Region & State Search', val: 'Search and filter openings by territory (India, United States, Worldwide Remote, Europe) and specific states/cities (Karnataka, Maharashtra, Telangana, Delhi NCR, California, etc.).' },
  { label: 'Role Categories', val: 'Quick filters for Software/SDE, AI/ML, Frontend/Fullstack, Cloud/DevOps, UI/UX Design, and Remote.' },
  { label: 'Actionable Links', val: 'Direct "Apply on Official Site" link + 1-Click "+ Track in App" to import into the user private tracker.' }
], PRIMARY);

drawCard('Page 2: My Application Tracker', [
  { label: 'Lifecycle Workspace', val: 'Complete CRUD management (Add, View Details, Edit, Delete, Bookmark Favorites).' },
  { label: 'Interactive KPI Cards', val: 'Top summary cards (Total Applications, In Review, Interviews, Offers) with click-to-filter capability.' },
  { label: '7 Status Badges', val: 'Distinct color badges: Saved (Orange), Applied (Yellow), Under Review (Blue), Interview (Purple), Selected / Offer (Green), Rejected (Red), Withdrawn (Gray).' },
  { label: 'View Modes', val: 'Switch seamlessly between responsive Multi-Column Grid Cards and Compact Table List View.' }
], SECONDARY);

// =========================================================================
// PAGE 2: PAGE 3 SCHEDULE & ADVANCED CAPABILITIES
// =========================================================================
doc.addPage();

drawCard('Page 3: ⏰ Deadlines & Interviews Hub', [
  { label: 'Automated Deadlines', val: 'Dynamic countdown calculations categorizing deadlines as Urgent (Due Today/Tomorrow), Warning (3-7 days), Normal, or Expired.' },
  { label: 'Interview Scheduler', val: 'Attach round type (HR, Technical, Coding, Managerial, Final), date, time, interviewer name, and meeting URL.' },
  { label: '1-Click Meeting Join', val: 'Direct launcher buttons for Google Meet, Zoom, and Microsoft Teams interview links.' },
  { label: 'Hiring Conversion Funnel', val: 'Visual progress bar tracking the student success pipeline: Saved -> Applied -> Review -> Interview -> Offers.' }
], INFO);

drawSectionHeading('4. Key Features & Functional Modules', '');

drawSubheading('A. Hierarchical Region & State Filtering');
drawParagraph('Students can filter opportunities by country/region and drill down into specific technology hubs:');
drawBullet('India', 'Karnataka (Bengaluru), Maharashtra (Mumbai/Pune), Telangana (Hyderabad), Delhi NCR (Noida/Gurugram), Tamil Nadu (Chennai), Uttar Pradesh, Gujarat, Kerala, West Bengal.');
drawBullet('United States', 'California (Silicon Valley), Washington (Seattle), New York (NYC), Texas (Austin), Massachusetts (Boston).');
drawBullet('Worldwide Remote', 'Global (Work from Anywhere), Remote Americas, Remote Europe, Remote APAC.');
drawBullet('Europe & UK', 'United Kingdom (London), Germany (Berlin/Munich), Netherlands (Amsterdam).');

drawSubheading('B. Comprehensive Application Metadata');
drawParagraph('Every application tracks rich details tailored for college placement preparation:');
drawBullet('Core Details', 'Company Name, Job Title/Role, Location, Region, State, Work Mode (Remote, Hybrid, On-site).');
drawBullet('Compensation & Timing', 'Stipend (e.g. Rs 40,000/mo), Duration (e.g. 6 months), Application Date, and Application Deadline.');
drawBullet('Skills & Notes', 'Interactive taggable skill chips (e.g. Python, React, DSA), referral details, recruiter contacts, and portal login notes.');
drawBullet('Interview Stage', 'Scheduled date, time, round type, interviewer name, Google Meet/Zoom link, and prep notes.');
drawBullet('Follow-Up Reminders', 'Configurable follow-up alert date to remind students when to follow up with recruiters.');

drawSubheading('C. Data Management & Backup Protection');
drawParagraph('Because data is stored in the browser, InternTrack includes enterprise-grade client-side backup tools:');
drawBullet('JSON Backup Export', '1-Click download of the complete application history as "interntrack-backup.json".');
drawBullet('JSON Backup Import', 'Upload a previously saved backup file with options to Replace or Merge records safely.');
drawBullet('Load Realistic Demo Data', 'Instantly populates 10 realistic demo records (Google, Microsoft, TCS, Infosys, Amazon, etc.) with active deadlines for testing and demonstration.');
drawBullet('Reset & Clear Data', 'Secure two-step confirmation dialog to safely wipe data if starting a new placement cycle.');

// =========================================================================
// PAGE 3: TECHNICAL STACK, PROJECT STRUCTURE & VIVA/FAQ
// =========================================================================
doc.addPage();

drawSectionHeading('5. Technical Stack & Architecture Diagram', '');

drawParagraph('InternTrack is built strictly with modern web standards without heavy frameworks or build toolchains:');

// Table of files
const tableTop = doc.y + 4;
const colWidths = [120, 95, 290];

doc.rect(45, tableTop, contentWidth, 18).fill(PRIMARY);
doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
doc.text('File Name', 52, tableTop + 5);
doc.text('Module / Layer', 172, tableTop + 5);
doc.text('Role & Functionality', 267, tableTop + 5);

const files = [
  { name: 'index.html', layer: 'Presentation', desc: 'Semantic 3-page Single Page Application layout, modals & navbars.' },
  { name: 'css/style.css', layer: 'Styling & Design', desc: 'Glassmorphism UI, Aurora mesh gradients, responsive CSS Grid/Flexbox.' },
  { name: 'css/responsive.css', layer: 'Mobile UX', desc: 'Mobile bottom navigation bar, card stacking, and adaptive typography.' },
  { name: 'js/storage.js', layer: 'Data Engine', desc: 'Zero-DB LocalStorage engine with validation, import/export & demo data.' },
  { name: 'js/opportunities.js', layer: 'Aggregator (P1)', desc: 'Web internship search, hierarchical Region & State filter dropdowns.' },
  { name: 'js/applications.js', layer: 'Tracker (P2)', desc: 'CRUD operations, multi-filter engine, interactive KPI cards, grid/list view.' },
  { name: 'js/deadlines-interviews.js', layer: 'Schedule (P3)', desc: 'Automated deadline countdowns, interview scheduler, conversion funnel.' },
  { name: 'js/utils.js', layer: 'Helpers', desc: 'XSS escaping, date math, urgency badges, toast alerts, modals.' },
  { name: 'js/app.js', layer: 'Orchestrator', desc: '3-Page router, URL hash sync (#tracker), theme toggler, global shortcuts.' },
  { name: 'server.js', layer: 'Local Host', desc: 'Lightweight, zero-dependency Node.js HTTP static server on port 3000.' }
];

let rowY = tableTop + 18;
files.forEach((f, idx) => {
  const bg = idx % 2 === 0 ? LIGHT_BG : '#FFFFFF';
  doc.rect(45, rowY, contentWidth, 17).fillAndStroke(bg, BORDER);
  
  doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text(f.name, 52, rowY + 4);
  doc.fillColor(PRIMARY).fontSize(7.5).font('Helvetica').text(f.layer, 172, rowY + 4);
  doc.fillColor(TEXT).fontSize(7.5).font('Helvetica').text(f.desc, 267, rowY + 4, { width: 280 });
  rowY += 17;
});

doc.y = rowY + 12;

drawSectionHeading('6. How to Run Locally', '️');
drawBullet('Method 1 (Local Node Server)', 'Open terminal in the project directory and run: "node server.js". Then open "http://localhost:3000" in any browser.');
drawBullet('Method 2 (Direct File Open)', 'InternTrack is 100% client-side; double-clicking "index.html" in Chrome, Edge, Safari, or Firefox opens the app immediately with zero installations.');

drawSectionHeading('7. Key Viva / Presentation Highlights', '');
drawBullet('Why No Database?', 'Eliminates server hosting costs, eliminates downtime, prevents sensitive student resume/job data from leaking to third-party databases, and guarantees sub-millisecond response times.');
drawBullet('Why Vanilla JS?', 'Zero framework bloat (no React/Angular overhead), instant initial load time (<100ms), easy code maintainability, and full portability across all browsers.');
drawBullet('Real-world Utility', 'Directly solves student placement stress by combining external internship discovery with personal application tracking, automated deadline alerts, and 1-click meeting join links.');

// Footer on all pages
const totalPages = doc.bufferedPageRange().count;
console.log('Total pages in document:', totalPages);
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  doc.rect(45, 800, contentWidth, 0.5).fill(BORDER);
  doc.fillColor(MUTED).fontSize(7.5).font('Helvetica')
     .text('InternTrack - Smart Internship Application Tracker | Project Documentation', 45, 806);
  doc.text(`Page ${i + 1} of ${totalPages}`, 45, 806, { align: 'right', width: contentWidth });
}

doc.end();

writeStream.on('finish', () => {
  console.log('PDF Generated Successfully at:', outputPath);
});
writeStream.on('error', (err) => {
  console.error('Error generating PDF:', err);
});
