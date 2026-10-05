/**
 * InternTrack - Utility Functions
 * Helper methods for date calculations, string sanitization, UI helpers, and toast notifications.
 */

const Utils = {
  /**
   * Escape HTML to safely render user-supplied strings and prevent XSS.
   * @param {string} str - Raw text
   * @returns {string} Escaped HTML string
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Generate a unique ID for records
   * @returns {string} Unique UUID or random timestamp ID
   */
  generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'app_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Format a date string (YYYY-MM-DD) into human readable format (e.g., 05 Oct 2026)
   * @param {string} dateStr 
   * @returns {string} Formatted date string
   */
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // Parse explicitly to avoid timezone off-by-one errors
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        }
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Format a time string (HH:mm) into 12-hour format with AM/PM
   * @param {string} timeStr 
   * @returns {string} e.g. "11:00 AM"
   */
  formatTime(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    return `${hours}:${minutes} ${ampm}`;
  },

  /**
   * Calculate deadline remaining days and urgency status
   * @param {string} deadlineStr - "YYYY-MM-DD"
   * @returns {object} { daysLeft, status, label, badgeClass, icon }
   */
  calculateDeadline(deadlineStr) {
    if (!deadlineStr) {
      return {
        daysLeft: null,
        status: 'none',
        label: 'No deadline set',
        badgeClass: 'badge-muted',
        icon: 'calendar'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = deadlineStr.split('-');
    let deadline;
    if (parts.length === 3) {
      deadline = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      deadline = new Date(deadlineStr);
    }
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        daysLeft: diffDays,
        status: 'expired',
        label: absDays === 1 ? 'Expired yesterday' : `Expired ${absDays} days ago`,
        badgeClass: 'badge-expired',
        icon: 'alert-circle'
      };
    } else if (diffDays === 0) {
      return {
        daysLeft: 0,
        status: 'urgent',
        label: '⚠️ Due Today!',
        badgeClass: 'badge-urgent',
        icon: 'alert-triangle'
      };
    } else if (diffDays === 1) {
      return {
        daysLeft: 1,
        status: 'urgent',
        label: '⚠️ Tomorrow (1 day remaining)',
        badgeClass: 'badge-urgent',
        icon: 'alert-triangle'
      };
    } else if (diffDays === 2) {
      return {
        daysLeft: 2,
        status: 'urgent',
        label: '⚠️ 2 days remaining',
        badgeClass: 'badge-urgent',
        icon: 'clock'
      };
    } else if (diffDays <= 7) {
      return {
        daysLeft: diffDays,
        status: 'warning',
        label: `${diffDays} days remaining`,
        badgeClass: 'badge-warning',
        icon: 'clock'
      };
    } else {
      return {
        daysLeft: diffDays,
        status: 'normal',
        label: `${diffDays} days remaining`,
        badgeClass: 'badge-normal',
        icon: 'calendar-check'
      };
    }
  },

  /**
   * Get Greeting based on current hour
   * @param {string} name 
   * @returns {string} e.g. "Good evening, Student 👋"
   */
  getGreeting(name = 'Student') {
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour >= 17 || hour < 5) {
      timeGreeting = 'Good evening';
    }
    return `${timeGreeting}, ${name} 👋`;
  },

  /**
   * Format stipend string cleanly
   * @param {string} stipend 
   * @returns {string}
   */
  formatStipend(stipend) {
    if (!stipend || String(stipend).trim() === '') return 'Not specified';
    const s = String(stipend).trim();
    // If numeric only, prefix with currency
    if (/^\d+$/.test(s)) {
      const num = parseInt(s, 10);
      return `₹${num.toLocaleString('en-IN')}/mo`;
    }
    return s;
  },

  /**
   * Validate URL format
   * @param {string} urlStr 
   * @returns {boolean}
   */
  isValidUrl(urlStr) {
    if (!urlStr) return false;
    try {
      const parsed = new URL(urlStr);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  },

  /**
   * Ensure URL has a protocol when clicked
   * @param {string} urlStr 
   * @returns {string}
   */
  sanitizeUrl(urlStr) {
    if (!urlStr) return '#';
    let clean = urlStr.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    return clean;
  },

  /**
   * Status visual metadata dictionary
   */
  statusConfig: {
    'Saved': { color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: '#FDBA74', icon: 'bookmark', dot: '🟠', class: 'status-saved' },
    'Applied': { color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)', border: '#FDE047', icon: 'send', dot: '🟡', class: 'status-applied' },
    'Under Review': { color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)', border: '#7DD3FC', icon: 'file-search', dot: '🔵', class: 'status-review' },
    'Interview': { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', border: '#C4B5FD', icon: 'video', dot: '🟣', class: 'status-interview' },
    'Selected': { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.14)', border: '#86EFAC', icon: 'check-circle-2', dot: '🟢', class: 'status-selected' },
    'Rejected': { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)', border: '#FCA5A5', icon: 'x-circle', dot: '🔴', class: 'status-rejected' },
    'Withdrawn': { color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', border: '#CBD5E1', icon: 'slash', dot: '⚪', class: 'status-withdrawn' }
  },

  /**
   * Priority configuration
   */
  priorityConfig: {
    'High': { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)', class: 'priority-high', label: 'High Priority' },
    'Medium': { color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)', class: 'priority-medium', label: 'Medium Priority' },
    'Low': { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)', class: 'priority-low', label: 'Low Priority' }
  },

  /**
   * Render a status badge HTML
   * @param {string} status 
   * @returns {string} HTML string
   */
  renderStatusBadge(status) {
    const config = this.statusConfig[status] || { dot: '⚪', class: 'status-withdrawn' };
    return `<span class="badge ${config.class}"><span class="badge-dot"></span>${this.escapeHtml(status || 'Saved')}</span>`;
  },

  /**
   * Render a priority badge HTML
   * @param {string} priority 
   * @returns {string} HTML string
   */
  renderPriorityBadge(priority) {
    const p = priority || 'Medium';
    const config = this.priorityConfig[p] || this.priorityConfig['Medium'];
    return `<span class="badge ${config.class}">${this.escapeHtml(p)}</span>`;
  },

  /**
   * Render a work mode badge HTML
   * @param {string} workMode 
   * @returns {string}
   */
  renderWorkModeBadge(workMode) {
    const mode = workMode || 'Remote';
    let icon = 'globe';
    if (mode === 'Hybrid') icon = 'shuffle';
    if (mode === 'On-site') icon = 'building';
    return `<span class="badge badge-workmode"><i data-lucide="${icon}"></i>${this.escapeHtml(mode)}</span>`;
  },

  /**
   * Get brand color / initial monogram background for company
   * @param {string} companyName 
   * @returns {string} hex color
   */
  getCompanyColor(companyName) {
    if (!companyName) return '#4F46E5';
    const colors = [
      '#4F46E5', '#2563EB', '#0891B2', '#0D9488',
      '#16A34A', '#D97706', '#EA580C', '#E11D48',
      '#9333EA', '#475569'
    ];
    let hash = 0;
    for (let i = 0; i < companyName.length; i++) {
      hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  },

  /**
   * Debounce helper
   * @param {Function} func 
   * @param {number} wait 
   * @returns {Function}
   */
  debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Toast notification display
   * @param {string} message 
   * @param {'success'|'error'|'info'|'warning'} type 
   * @param {number} duration 
   */
  showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-up`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = `
      <div class="toast-content">
        <i data-lucide="${iconName}" class="toast-icon"></i>
        <span class="toast-message">${this.escapeHtml(message)}</span>
      </div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    container.appendChild(toast);
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons({ root: toast });
    }

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  },

  /**
   * Smart Lexical Parser for Real Job Postings
   * Automatically extracts Company, Role, Location, Work Mode, Skills, and Stipend from pasted text
   * @param {string} rawText
   * @returns {object} { company, role, location, workMode, skills, stipend }
   */
  parseJobPosting(rawText) {
    if (!rawText || !rawText.trim()) return {};
    const text = rawText.trim();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let company = '';
    let role = '';
    let location = '';
    let workMode = 'Remote';
    let stipend = '';
    const skills = [];

    // Common skill lexicon
    const dictionary = [
      'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Kotlin', 'Swift',
      'React', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Next.js', 'Angular', 'Vue',
      'HTML', 'CSS', 'Tailwind', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
      'Data Structures', 'Algorithms', 'DSA', 'OOP', 'Git', 'GitHub', 'Linux', 'Docker', 'Kubernetes',
      'AWS', 'GCP', 'Azure', 'REST APIs', 'GraphQL', 'Machine Learning', 'Deep Learning', 'PyTorch',
      'TensorFlow', 'Pandas', 'NumPy', 'Power BI', 'Excel', 'Cybersecurity'
    ];

    dictionary.forEach(sk => {
      const reg = new RegExp(`\\b${sk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (reg.test(text) && !skills.includes(sk)) {
        skills.push(sk);
      }
    });

    // Detect Work Mode
    if (/\b(remote|work from home|wfh)\b/i.test(text)) {
      workMode = 'Remote';
    } else if (/\b(hybrid)\b/i.test(text)) {
      workMode = 'Hybrid';
    } else if (/\b(on-site|onsite|in-office|office)\b/i.test(text)) {
      workMode = 'On-site';
    }

    // Detect Stipend / Salary
    const stipendMatch = text.match(/(?:₹|INR|Rs\.?|\$)\s*[\d,]+(?:\s*(?:k|thousand|lpa|pm|\/mo|\/month|\/hr|per month))?/i);
    if (stipendMatch) {
      stipend = stipendMatch[0].trim();
    }

    // Detect Locations
    const cities = ['Bengaluru', 'Bangalore', 'Hyderabad', 'Pune', 'Noida', 'Gurugram', 'Gurgaon', 'Mumbai', 'Chennai', 'Delhi', 'Kolkata', 'Ahmedabad', 'Remote', 'San Francisco', 'New York'];
    for (const city of cities) {
      if (new RegExp(`\\b${city}\\b`, 'i').test(text)) {
        location = city;
        break;
      }
    }

    // Common Role Patterns
    const roleMatch = text.match(/(?:(?:Software|Frontend|Backend|Full\s*Stack|Web|Data|Machine\s*Learning|DevOps|Cloud|Android|iOS|Mobile|Security|Product)\s*(?:Engineer(?:ing)?|Developer|Analyst|Intern(?:ship)?))/i);
    if (roleMatch) {
      role = roleMatch[0].trim();
    } else if (lines.length > 0) {
      role = lines[0].replace(/^(?:Job Title|Role|Position)[:\s-]*/i, '').trim();
    }

    // Common Company Patterns
    const companyMatch = text.match(/(?:Company|Organization|At|About)\s*[:–-]?\s*([A-Z][A-Za-z0-9&.\s]{2,30})/);
    if (companyMatch && companyMatch[1]) {
      company = companyMatch[1].trim();
    }

    return { company, role, location, workMode, skills, stipend };
  },

  /**
   * Generic modal open helper
   * @param {string} modalId 
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  },

  /**
   * Generic modal close helper
   * @param {string} modalId 
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
};

// Export to global window scope for modular browser execution
window.Utils = Utils;
