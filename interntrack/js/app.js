/**
 * InternTrack - Core Application Orchestrator
 * Controls the 3-Page Single Page Application:
 *   Page 1: Search Internships (collected from across the web)
 *   Page 2: My Application Tracker (CRUD, statuses, notes, filter)
 *   Page 3: Deadlines & Interviews (schedule, countdowns, join links, funnel)
 * 
 * 100% Client-Side LocalStorage Persistence - ZERO DATABASE.
 */

const App = {
  activeSection: 'search',

  init() {
    this.initCustomDomain();
    this.initMobileMenu();
    this.initCopyrightYear();
    this.applySavedTheme();
    this.initNavigation();
    this.initThemeToggle();
    this.initModals();
    this.initShortcuts();
    this.initNotifications();
    this.initDataManagement();

    // Initialize submodules
    if (window.Auth && typeof window.Auth.init === 'function') {
      window.Auth.init();
    }
    Opportunities.init();
    Applications.init();

    // Auto-update views when LocalStorage data updates
    window.addEventListener('interntrack:data-updated', () => {
      this.refreshCurrentView();
      this.updateNavBadges();
      this.updateNotificationBadge();
    });

    // Check if initial storage is empty; if so, populate demo data so the app isn't blank
    // Clean zero-database start without fake records. Users can load sample data in Settings.

    // Check initial URL hash or default to Page 1: Search Internships
    const initHash = (window.location.hash || '').replace('#', '');
    if (initHash === 'tracker' || initHash === 'schedule' || initHash === 'search') {
      this.navigateTo(initHash);
    } else {
      this.navigateTo('search');
    }
    this.updateNavBadges();
    this.updateNotificationBadge();
    this.checkTodayAlerts();
  },

  /**
   * Seamless 3-Page Router
   * @param {'search' | 'tracker' | 'schedule'} sectionId 
   */
  navigateTo(sectionId) {
    // Backward compatibility normalization
    if (sectionId === 'dashboard' || sectionId === 'explore' || sectionId === 'discover') sectionId = 'search';
    if (sectionId === 'applications') sectionId = 'tracker';
    if (sectionId === 'interviews' || sectionId === 'deadlines' || sectionId === 'calendar' || sectionId === 'analytics') sectionId = 'schedule';

    this.activeSection = sectionId;

    // Update Top Navigation Tabs & Mobile Bottom Bar
    document.querySelectorAll('.nav-tab-btn, .mobile-tab-btn, .nav-item').forEach(btn => {
      const targetSec = btn.getAttribute('data-section');
      if (targetSec === sectionId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle 3 View Sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeEl = document.getElementById(`view-${sectionId}`);
    if (activeEl) {
      activeEl.classList.add('active');
    }

    // Render active view
    this.refreshCurrentView();
    this.updateNavBadges();
    try {
      if (window.location.hash !== `#${sectionId}`) {
        history.replaceState(null, '', `#${sectionId}`);
      }
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Re-render active view content
   */
  refreshCurrentView() {
    switch (this.activeSection) {
      case 'search':
        Opportunities.render();
        break;
      case 'tracker':
        Applications.render();
        break;
      case 'schedule':
        DeadlinesInterviews.render();
        break;
    }

    this.updateGreeting();

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  /**
   * Update student greeting based on current time
   */
  updateGreeting() {
    const greetingEl = document.getElementById('tracker-greeting');
    if (greetingEl) {
      const hour = new Date().getHours();
      let greeting = 'Good morning';
      if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
      else if (hour >= 17 || hour < 5) greeting = 'Good evening';
      greetingEl.textContent = greeting;
    }
  },

  /**
   * Update count badges on tracker & schedule tabs
   */
  updateNavBadges() {
    const apps = Storage.getAll();

    // Tracker count
    const trackerBadge = document.getElementById('nav-tracker-badge');
    const mobileTrackerBadge = document.getElementById('mobile-tracker-badge');
    if (trackerBadge) {
      trackerBadge.textContent = apps.length;
      trackerBadge.style.display = apps.length > 0 ? 'inline-flex' : 'none';
    }
    if (mobileTrackerBadge) {
      mobileTrackerBadge.textContent = apps.length;
      mobileTrackerBadge.style.display = apps.length > 0 ? 'inline-flex' : 'none';
    }

    // Schedule count (upcoming deadlines <= 7 days + interviews)
    DeadlinesInterviews.updateScheduleBadge();
  },

  /**
   * Navigation Listeners
   */
  
  initCustomDomain() {
    const savedDomain = localStorage.getItem('interntrack_custom_domain') || '';
    const input = document.getElementById('custom-domain-input');
    const statusBadge = document.getElementById('custom-domain-status');
    const footerText = document.getElementById('footer-domain-text');

    if (input) input.value = savedDomain;
    this.updateDomainDisplay(savedDomain);

    const saveBtn = document.getElementById('save-domain-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const domain = (document.getElementById('custom-domain-input')?.value || '').trim();
        this.saveCustomDomain(domain);
      });
    }
  },

  saveCustomDomain(domain) {
    if (!domain) {
      localStorage.removeItem('interntrack_custom_domain');
      Utils.showToast('Custom domain removed. Using default host.', 'info');
      this.updateDomainDisplay('');
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!domainRegex.test(domain) && domain !== 'localhost' && !domain.startsWith('localhost:')) {
      Utils.showToast('Please enter a valid domain format (e.g., tracker.domain.com)', 'warning');
      return;
    }

    localStorage.setItem('interntrack_custom_domain', domain);
    this.updateDomainDisplay(domain);
    Utils.showToast('Custom domain connected: ' + domain, 'success');
  },

  updateDomainDisplay(domain) {
    const statusBadge = document.getElementById('custom-domain-status');
    const footerText = document.getElementById('footer-domain-text');

    if (domain) {
      if (statusBadge) {
        statusBadge.textContent = 'Connected: ' + domain;
        statusBadge.className = 'badge badge-status-selected';
      }
      if (footerText) {
        footerText.textContent = 'Domain: ' + domain + ' (Connected)';
      }
    } else {
      if (statusBadge) {
        statusBadge.textContent = 'Not Configured';
        statusBadge.className = 'badge badge-status-saved';
      }
      if (footerText) {
        footerText.textContent = 'Domain: ' + (window.location.host || 'localhost:3000');
      }
    }
  },

  
  initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle-btn');
    const closeBtn = document.getElementById('mobile-drawer-close-btn');
    const overlay = document.getElementById('mobile-drawer-overlay');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openMobileMenu();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeMobileMenu();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeMobileMenu();
        }
      });
    }
  },

  openMobileMenu() {
    const drawer = document.getElementById('mobile-drawer-overlay');
    if (drawer) {
      drawer.classList.add('active');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  },

  closeMobileMenu() {
    const drawer = document.getElementById('mobile-drawer-overlay');
    if (drawer) {
      drawer.classList.remove('active');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  },

  initCopyrightYear() {
    const year = new Date().getFullYear();
    document.querySelectorAll('.copyright-year').forEach(el => {
      el.textContent = year;
    });
  },

  initNavigation() {
    // Click bindings for navigation tab buttons
    document.querySelectorAll('.nav-tab-btn, .mobile-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sec = btn.getAttribute('data-section');
        if (sec) {
          e.preventDefault();
          this.navigateTo(sec);
        }
      });
    });

    window.addEventListener('hashchange', () => {
      const hash = (window.location.hash || '').replace('#', '');
      if (hash && (hash === 'tracker' || hash === 'schedule' || hash === 'search')) {
        if (this.activeSection !== hash) {
          this.navigateTo(hash);
        }
      }
    });
  },

  /**
   * Theme Toggling (Light / Dark Mode persisted in LocalStorage)
   */
  initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
    });
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Storage.saveSettings({ theme: theme });
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  applySavedTheme() {
    const settings = Storage.getSettings();
    const theme = settings.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    }
  },

  /**
   * Modal Management
   */
  initModals() {
    // Click outside to dismiss modal
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    // Close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    // Form submit bindings
    const appForm = document.getElementById('app-form');
    if (appForm) {
      appForm.addEventListener('submit', (e) => Applications.handleFormSubmit(e));
    }

    const interviewForm = document.getElementById('interview-schedule-form');
    if (interviewForm) {
      interviewForm.addEventListener('submit', (e) => DeadlinesInterviews.saveScheduleModal(e));
    }

    const customLinkForm = document.getElementById('custom-link-track-form');
    if (customLinkForm) {
      customLinkForm.addEventListener('submit', (e) => this.saveTrackCustomLink(e));
    }
  },

  /**
   * Open / Close Settings Modal
   */
  openSettingsModal() {
    Utils.openModal('settings-modal');
  },

  closeSettingsModal() {
    Utils.closeModal('settings-modal');
  },

  /**
   * Load Realistic Demo Data
   */
  loadDemoData() {
    Storage.loadDemoData(false);
    Utils.showToast('Sample demo internships loaded.', 'success');
    this.refreshCurrentView();
    this.updateNavBadges();
  },

  /**
   * Open / Close Track Custom Web Link Modal
   */
  openTrackCustomLinkModal() {
    const form = document.getElementById('custom-link-track-form');
    if (form) form.reset();
    Utils.openModal('track-custom-link-modal');
  },

  saveTrackCustomLink(e) {
    if (e) e.preventDefault();
    const company = document.getElementById('custom-link-company')?.value.trim();
    const role = document.getElementById('custom-link-role')?.value.trim();
    const url = document.getElementById('custom-link-url')?.value.trim();
    const stipend = document.getElementById('custom-link-stipend')?.value.trim();
    const region = document.getElementById('custom-link-region')?.value || 'India';
    const state = document.getElementById('custom-link-state')?.value.trim() || '';
    const deadline = document.getElementById('custom-link-deadline')?.value || '';

    if (!company || !role) {
      Utils.showToast('Company Name and Job Role are required.', 'error');
      return;
    }

    const newApp = {
      id: Utils.generateId(),
      company: company,
      role: role,
      applicationUrl: url,
      location: state ? `${state}` : (region === 'Remote' ? 'Worldwide Remote' : region),
      region: region,
      state: state,
      workMode: region === 'Remote' ? 'Remote' : 'Hybrid',
      stipend: stipend || '',
      duration: '3-6 Months',
      applicationDate: new Date().toISOString().split('T')[0],
      deadline: deadline || '',
      skills: ['Web', 'Tech'],
      status: 'Applied',
      priority: 'High',
      favorite: false,
      notes: `Added from custom web link. Region: ${region}${state ? `, State: ${state}` : ''}`,
      interview: { date: '', time: '', round: '', meetingLink: '', interviewer: '', notes: '' },
      followUpDate: ''
    };

    const res = Storage.save(newApp);
    if (res.success) {
      Utils.closeModal('track-custom-link-modal');
      Utils.showToast(`Saved "${company} - ${role}" to your Tracker!`, 'success');
      this.navigateTo('tracker');
    } else {
      Utils.showToast(res.error || 'Failed to save application.', 'error');
    }
  },

  /**
   * Global Keyboard Shortcuts
   */
  initShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape closes modal
      if (e.key === 'Escape') {
        this.closeMobileMenu();
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          activeModal.classList.remove('active');
          document.body.style.overflow = '';
        }
      }

      // '/' focuses search
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        if (this.activeSection === 'search') {
          const s = document.getElementById('opps-search-input');
          if (s) s.focus();
        } else if (this.activeSection === 'tracker') {
          const s = document.getElementById('apps-search-input');
          if (s) s.focus();
        }
      }
    });
  },

  /**
   * Web Notifications
   */
  initNotifications() {
    const reqBtn = document.getElementById('enable-browser-notifs-btn');
    if (reqBtn) {
      reqBtn.addEventListener('click', () => this.requestNotificationPermission());
    }
  },

  requestNotificationPermission() {
    if (!('Notification' in window)) {
      Utils.showToast('Browser notifications not supported.', 'warning');
      return;
    }

    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        Storage.saveSettings({ notificationsEnabled: true });
        Utils.showToast('Notifications enabled for upcoming deadlines!', 'success');
      } else {
        Utils.showToast('Notifications not granted.', 'info');
      }
    });
  },

  updateNotificationBadge() {
    // Kept for reactive listeners
  },

  checkTodayAlerts() {
    const settings = Storage.getSettings();
    if (!settings.notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const apps = Storage.getAll();
    const todayStr = new Date().toISOString().split('T')[0];

    apps.forEach(app => {
      if (app.interview && app.interview.date === todayStr) {
        new Notification(`Interview Today: ${app.company}`, {
          body: `${app.interview.round} round scheduled for today.`
        });
      }
      if (app.deadline === todayStr) {
        new Notification(`Application Deadline Today!`, {
          body: `Deadline for ${app.company} (${app.role}) is today.`
        });
      }
    });
  },

  /**
   * Data Management: Export JSON, Import JSON, Load Demo, Clear Data
   */
  initDataManagement() {
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        Storage.exportJSON();
        Utils.showToast('Backup JSON downloaded.', 'success');
      });
    }

    const importInput = document.getElementById('import-file-input');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          const overwrite = confirm('Do you want to REPLACE existing applications?\nClick "OK" to replace, or "Cancel" to MERGE.');
          const res = Storage.importJSON(content, overwrite);
          if (res.success) {
            Utils.showToast(res.message, 'success');
            this.refreshCurrentView();
            this.closeSettingsModal();
          } else {
            Utils.showToast(res.message, 'error');
          }
          importInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    const demoBtn = document.getElementById('load-demo-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        if (confirm('Load realistic sample internships (Google, Microsoft, TCS, etc.)?')) {
          Storage.loadDemoData(false);
          Utils.showToast('Sample internships loaded.', 'success');
          this.refreshCurrentView();
          this.closeSettingsModal();
        }
      });
    }

    const clearBtn = document.getElementById('clear-all-data-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const conf = prompt('Type "DELETE" to clear all saved applications:');
        if (conf === 'DELETE') {
          Storage.clearAll();
          Utils.showToast('All internship records cleared.', 'info');
          this.refreshCurrentView();
          this.closeSettingsModal();
        } else if (conf !== null) {
          Utils.showToast('Action cancelled.', 'warning');
        }
      });
    }
  }
};

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
