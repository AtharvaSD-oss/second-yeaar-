/**
 * InternTrack - LocalStorage Engine
 * Handles all client-side data persistence, validation, import/export, and demo dataset loading.
 * ZERO DATABASE - 100% Client-Side LocalStorage.
 */

const Storage = {
  STORAGE_KEY: 'interntrack_applications_v1',
  SETTINGS_KEY: 'interntrack_settings_v1',

  /**
   * Safe getter for LocalStorage applications
   * @returns {Array} Array of application objects
   */
  getAll() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn('LocalStorage data was not an array. Resetting corrupted storage.');
        return [];
      }
      return parsed;
    } catch (err) {
      console.error('Error reading from LocalStorage:', err);
      return [];
    }
  },

  /**
   * Save raw array into LocalStorage with error handling
   * @param {Array} list 
   * @returns {boolean}
   */
  _saveAll(list) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      // Dispatch custom event for reactive dashboard updates
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('interntrack:data-updated', { detail: { count: list.length } }));
      }
      return true;
    } catch (err) {
      console.error('LocalStorage write failed:', err);
      if (err.name === 'QuotaExceededError') {
        alert('Browser storage quota exceeded! Please export backup and delete old records.');
      }
      return false;
    }
  },

  /**
   * Retrieve single application by ID
   * @param {string} id 
   * @returns {object|null}
   */
  getById(id) {
    const apps = this.getAll();
    return apps.find(app => String(app.id) === String(id)) || null;
  },

  /**
   * Validate application payload
   * @param {object} app 
   * @returns {{isValid: boolean, error?: string}}
   */
  validate(app) {
    if (!app || typeof app !== 'object') {
      return { isValid: false, error: 'Invalid application object.' };
    }
    if (!app.company || String(app.company).trim().length === 0) {
      return { isValid: false, error: 'Company Name is required.' };
    }
    if (!app.role || String(app.role).trim().length === 0) {
      return { isValid: false, error: 'Job Role is required.' };
    }
    if (app.applicationUrl && app.applicationUrl.trim() !== '') {
      const cleanUrl = Utils.sanitizeUrl(app.applicationUrl);
      if (!Utils.isValidUrl(cleanUrl)) {
        return { isValid: false, error: 'Application URL is invalid.' };
      }
    }
    if (app.applicationDate && app.deadline) {
      if (app.deadline < app.applicationDate) {
        // Warning: deadline before applied date
        return { isValid: true, warning: 'Deadline date is earlier than application date.' };
      }
    }
    return { isValid: true };
  },

  /**
   * Create or update an application
   * @param {object} data 
   * @returns {{success: boolean, id: string, error?: string, warning?: string}}
   */
  save(data) {
    const val = this.validate(data);
    if (!val.isValid) {
      return { success: false, error: val.error };
    }

    const apps = this.getAll();
    const isNew = !data.id;
    const id = isNew ? Utils.generateId() : data.id;

    // Normalize skills into array
    let skills = [];
    if (Array.isArray(data.skills)) {
      skills = data.skills.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof data.skills === 'string') {
      skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const record = {
      id: id,
      company: String(data.company).trim(),
      role: String(data.role).trim(),
      location: String(data.location || '').trim() || 'Remote',
      region: String(data.region || '').trim() || 'India',
      state: String(data.state || '').trim(),
      workMode: data.workMode || 'Remote',
      applicationDate: data.applicationDate || new Date().toISOString().split('T')[0],
      deadline: data.deadline || '',
      applicationUrl: data.applicationUrl ? Utils.sanitizeUrl(data.applicationUrl) : '',
      stipend: String(data.stipend || '').trim(),
      duration: String(data.duration || '').trim(),
      skills: skills,
      status: data.status || 'Applied',
      priority: data.priority || 'Medium',
      favorite: Boolean(data.favorite),
      notes: String(data.notes || '').trim(),
      interview: {
        date: data.interview?.date || '',
        time: data.interview?.time || '',
        round: data.interview?.round || '',
        meetingLink: data.interview?.meetingLink ? Utils.sanitizeUrl(data.interview.meetingLink) : '',
        interviewer: String(data.interview?.interviewer || '').trim(),
        notes: String(data.interview?.notes || '').trim()
      },
      followUpDate: data.followUpDate || '',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const index = apps.findIndex(a => a.id === id);
    if (index !== -1) {
      apps[index] = record;
    } else {
      apps.unshift(record); // Add to beginning
    }

    const saved = this._saveAll(apps);
    if (saved && typeof window !== 'undefined' && window.Auth && window.Auth.user && typeof window.Auth.saveCloudApplication === 'function') {
      window.Auth.saveCloudApplication(record);
    }
    return { success: saved, id, warning: val.warning };
  },

  /**
   * Delete an application by ID
   * @param {string} id 
   * @returns {boolean}
   */
  delete(id) {
    const apps = this.getAll();
    const filtered = apps.filter(a => a.id !== id);
    if (filtered.length === apps.length) return false;
    const res = this._saveAll(filtered);
    if (res && typeof window !== 'undefined' && window.Auth && window.Auth.user && typeof window.Auth.deleteCloudApplication === 'function') {
      window.Auth.deleteCloudApplication(id);
    }
    return res;
  },

  /**
   * Toggle favorite state for an application
   * @param {string} id 
   * @returns {boolean} new favorite state
   */
  toggleFavorite(id) {
    const apps = this.getAll();
    const target = apps.find(a => a.id === id);
    if (!target) return false;
    target.favorite = !target.favorite;
    target.updatedAt = new Date().toISOString();
    const res = this._saveAll(apps);
    if (res && typeof window !== 'undefined' && window.Auth && window.Auth.user && typeof window.Auth.saveCloudApplication === 'function') {
      window.Auth.saveCloudApplication(target);
    }
    return target.favorite;
  },

  /**
   * Update application status directly
   * @param {string} id 
   * @param {string} newStatus 
   * @returns {boolean}
   */
  updateStatus(id, newStatus) {
    const apps = this.getAll();
    const target = apps.find(a => a.id === id);
    if (!target) return false;
    target.status = newStatus;
    target.updatedAt = new Date().toISOString();
    const res = this._saveAll(apps);
    if (res && typeof window !== 'undefined' && window.Auth && window.Auth.user && typeof window.Auth.saveCloudApplication === 'function') {
      window.Auth.saveCloudApplication(target);
    }
    return res;
  },

  /**
   * Update interview information for an application
   * @param {string} id 
   * @param {object} interviewData 
   * @returns {boolean}
   */
  updateInterview(id, interviewData) {
    const apps = this.getAll();
    const target = apps.find(a => a.id === id);
    if (!target) return false;
    target.interview = {
      date: interviewData.date || '',
      time: interviewData.time || '',
      round: interviewData.round || 'Technical',
      meetingLink: interviewData.meetingLink ? Utils.sanitizeUrl(interviewData.meetingLink) : '',
      interviewer: String(interviewData.interviewer || '').trim(),
      notes: String(interviewData.notes || '').trim()
    };
    if (interviewData.date && target.status !== 'Selected' && target.status !== 'Rejected') {
      target.status = 'Interview'; // Automatically promote status if interview added
    }
    target.updatedAt = new Date().toISOString();
    const res = this._saveAll(apps);
    if (res && typeof window !== 'undefined' && window.Auth && window.Auth.user && typeof window.Auth.saveCloudApplication === 'function') {
      window.Auth.saveCloudApplication(target);
    }
    return res;
  },

  /**
   * Export all applications as a downloadable JSON file
   */
  exportJSON() {
    const apps = this.getAll();
    const payload = {
      app: 'InternTrack',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      count: apps.length,
      applications: apps
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interntrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },

  /**
   * Import data from JSON string with strict validation
   * @param {string} jsonString 
   * @param {boolean} overwrite - True to replace, False to merge
   * @returns {{success: boolean, count: number, message: string}}
   */
  importJSON(jsonString, overwrite = false) {
    try {
      const data = JSON.parse(jsonString);
      let incomingList = [];
      if (Array.isArray(data)) {
        incomingList = data;
      } else if (data && Array.isArray(data.applications)) {
        incomingList = data.applications;
      } else {
        return { success: false, count: 0, message: 'Invalid backup format. Expected an array or applications list.' };
      }

      const validList = [];
      for (const item of incomingList) {
        if (item && item.company && item.role) {
          validList.push({
            id: item.id || Utils.generateId(),
            company: String(item.company).trim(),
            role: String(item.role).trim(),
            location: item.location || 'Remote',
            workMode: item.workMode || 'Remote',
            applicationDate: item.applicationDate || new Date().toISOString().split('T')[0],
            deadline: item.deadline || '',
            applicationUrl: item.applicationUrl || '',
            stipend: item.stipend || '',
            duration: item.duration || '',
            skills: Array.isArray(item.skills) ? item.skills : (item.skills ? String(item.skills).split(',') : []),
            status: item.status || 'Applied',
            priority: item.priority || 'Medium',
            favorite: Boolean(item.favorite),
            notes: item.notes || '',
            interview: {
              date: item.interview?.date || '',
              time: item.interview?.time || '',
              round: item.interview?.round || '',
              meetingLink: item.interview?.meetingLink || '',
              interviewer: item.interview?.interviewer || '',
              notes: item.interview?.notes || ''
            },
            followUpDate: item.followUpDate || '',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      if (validList.length === 0) {
        return { success: false, count: 0, message: 'No valid internship records found in file.' };
      }

      let finalList;
      if (overwrite) {
        finalList = validList;
      } else {
        const existing = this.getAll();
        const map = new Map();
        existing.forEach(a => map.set(a.id, a));
        validList.forEach(a => {
          // If ID collision, assign fresh ID
          if (map.has(a.id) && !overwrite) {
            a.id = Utils.generateId();
          }
          map.set(a.id, a);
        });
        finalList = Array.from(map.values());
      }

      this._saveAll(finalList);
      return {
        success: true,
        count: validList.length,
        message: `Successfully imported ${validList.length} applications!`
      };
    } catch (err) {
      console.error('Import parse error:', err);
      return { success: false, count: 0, message: 'JSON syntax error: File is corrupted or invalid.' };
    }
  },

  /**
   * Delete all application records from LocalStorage
   * @returns {boolean}
   */
  clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('interntrack:data-updated', { detail: { count: 0 } }));
      }
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Settings management (Student name, theme, AI API key)
   */
  getSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      const defaults = {
        studentName: 'Student',
        theme: 'light',
        emailReminders: false,
        notificationsEnabled: false
      };
      if (!raw) return defaults;
      return Object.assign(defaults, JSON.parse(raw));
    } catch (e) {
      return { studentName: 'Student', theme: 'light', notificationsEnabled: false };
    }
  },

  saveSettings(newSettings) {
    try {
      const current = this.getSettings();
      const updated = Object.assign(current, newSettings);
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('interntrack:settings-updated', { detail: updated }));
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Realistic Demo Data Generator
   * Dynamically aligns dates with current local month for maximum realism during college review!
   */
  loadDemoData(overwrite = false) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = today.getDate();

    const fmt = (offsetDays) => {
      const target = new Date(today);
      target.setDate(today.getDate() + offsetDays);
      return target.toISOString().split('T')[0];
    };

    const demoRecords = [
      {
        id: 'demo_google_1',
        company: 'Google',
        role: 'Software Engineering Intern',
        location: 'Bengaluru / Hyderabad',
        region: 'India',
        state: 'Karnataka',
        workMode: 'Hybrid',
        applicationDate: fmt(-14),
        deadline: fmt(2), // 2 days left (Urgent)
        applicationUrl: 'https://careers.google.com/jobs/results/swe-intern',
        stipend: '₹85,000/month',
        duration: '6 months (Summer 2027)',
        skills: ['Python', 'Data Structures', 'Algorithms', 'C++', 'Git'],
        status: 'Interview',
        priority: 'High',
        favorite: true,
        notes: 'Cleared initial screening and OA round on HackerRank. Prep for Graph and Dynamic Programming algorithms.',
        interview: {
          date: fmt(4),
          time: '14:30',
          round: 'Technical',
          meetingLink: 'https://meet.google.com/abc-demo-swe',
          interviewer: 'Rohit Sharma (Staff SWE)',
          notes: 'Focus on Distributed Systems, Trees & Graphs, and LeetCode Medium/Hard problems.'
        },
        followUpDate: fmt(6)
      },
      {
        id: 'demo_msft_2',
        company: 'Microsoft',
        role: 'Frontend Developer Intern',
        location: 'Noida / Hyderabad',
        region: 'India',
        state: 'Uttar Pradesh',
        workMode: 'Hybrid',
        applicationDate: fmt(-20),
        deadline: fmt(-2), // Expired
        applicationUrl: 'https://careers.microsoft.com/us/en/job/1523',
        stipend: '₹60,000/month',
        duration: '3 months',
        skills: ['JavaScript', 'TypeScript', 'React', 'CSS3', 'Web Accessibility'],
        status: 'Selected',
        priority: 'High',
        favorite: true,
        notes: 'Final Offer Letter Received! HR discussion completed. Awaiting background verification check.',
        interview: {
          date: fmt(-5),
          time: '11:00',
          round: 'Final',
          meetingLink: 'https://teams.microsoft.com/l/meetup-join/demo',
          interviewer: 'Ananya Verma (Engineering Lead)',
          notes: 'Discussed past projects, state management with Redux, and team fit.'
        },
        followUpDate: fmt(10)
      },
      {
        id: 'demo_tcs_3',
        company: 'TCS',
        role: 'Python Developer Intern',
        location: 'Pune',
        region: 'India',
        state: 'Maharashtra',
        workMode: 'On-site',
        applicationDate: fmt(-5),
        deadline: fmt(5), // 5 days left (Warning)
        applicationUrl: 'https://www.tcs.com/careers/digital-internship',
        stipend: '₹25,000/month',
        duration: '6 months',
        skills: ['Python', 'Django', 'SQL', 'REST APIs'],
        status: 'Applied',
        priority: 'Medium',
        favorite: false,
        notes: 'Applied via college placement cell. Portal shows "Application Received".',
        interview: { date: '', time: '', round: '', meetingLink: '', interviewer: '', notes: '' },
        followUpDate: fmt(1) // Follow-up due tomorrow!
      },
      {
        id: 'demo_infosys_4',
        company: 'Infosys',
        role: 'Full Stack Web Intern',
        location: 'Remote',
        region: 'Remote',
        state: 'Global (Anywhere)',
        workMode: 'Remote',
        applicationDate: fmt(-8),
        deadline: fmt(12), // 12 days left (Normal)
        applicationUrl: 'https://careers.infosys.com/internships',
        stipend: '₹30,000/month',
        duration: '4 months',
        skills: ['JavaScript', 'Node.js', 'Express', 'MongoDB', 'HTML5'],
        status: 'Under Review',
        priority: 'Medium',
        favorite: true,
        notes: 'Recruiter viewed LinkedIn profile. Follow up next week on status of shortlist.',
        interview: { date: '', time: '', round: '', meetingLink: '', interviewer: '', notes: '' },
        followUpDate: fmt(0) // Due today!
      },
      {
        id: 'demo_wipro_5',
        company: 'Wipro',
        role: 'Cloud & DevOps Intern',
        location: 'Bengaluru',
        region: 'India',
        state: 'Karnataka',
        workMode: 'Hybrid',
        applicationDate: fmt(-25),
        deadline: fmt(-10),
        applicationUrl: 'https://careers.wipro.com/intern-cloud',
        stipend: '₹28,000/month',
        duration: '3 months',
        skills: ['Linux', 'Docker', 'AWS', 'Bash', 'Git'],
        status: 'Rejected',
        priority: 'Low',
        favorite: false,
        notes: 'Received automated rejection email after 3 weeks. Feedback: Needed hands-on Kubernetes experience.',
        interview: { date: '', time: '', round: '', meetingLink: '', interviewer: '', notes: '' },
        followUpDate: ''
      },
      {
        id: 'demo_accenture_6',
        company: 'Accenture',
        role: 'Data Analyst Intern',
        location: 'Gurugram',
        region: 'India',
        state: 'Delhi NCR',
        workMode: 'On-site',
        applicationDate: fmt(-12),
        deadline: fmt(15),
        applicationUrl: 'https://accenture.com/in-en/careers/entry-level',
        stipend: '₹35,000/month',
        duration: '6 months',
        skills: ['SQL', 'Power BI', 'Excel', 'Python', 'Statistics'],
        status: 'Interview',
        priority: 'High',
        favorite: false,
        notes: 'Coding assessment cleared (scored 95%). HR round scheduled.',
        interview: {
          date: fmt(1), // Tomorrow!
          time: '10:00',
          round: 'HR',
          meetingLink: 'https://teams.microsoft.com/demo-accenture',
          interviewer: 'Pooja Nair (Talent Acquisition)',
          notes: 'Prepare behavioral stories: conflict resolution, college capstone project challenges.'
        },
        followUpDate: fmt(3)
      },
      {
        id: 'demo_amazon_7',
        company: 'Amazon',
        role: 'SDE Intern',
        location: 'Hyderabad',
        region: 'India',
        state: 'Telangana',
        workMode: 'On-site',
        applicationDate: fmt(-3),
        deadline: fmt(1), // Tomorrow!
        applicationUrl: 'https://amazon.jobs/en/jobs/sde-intern-2026',
        stipend: '₹80,000/month',
        duration: '6 months',
        skills: ['Java', 'Object Oriented Programming', 'DSA', 'AWS', 'System Design'],
        status: 'Applied',
        priority: 'High',
        favorite: true,
        notes: 'Referral provided by college senior working as SDE-2. OA link expected within 48 hours.',
        interview: { date: '', time: '', round: '', meetingLink: '', interviewer: '', notes: '' },
        followUpDate: fmt(7)
      },
      {
        id: 'demo_swiggy_8',
        company: 'Swiggy',
        role: 'Backend Engineering Intern',
        location: 'Bengaluru',
        region: 'India',
        state: 'Karnataka',
        workMode: 'Remote',
        applicationDate: fmt(-2),
        deadline: fmt(18),
        applicationUrl: 'https://swiggy.careers/jobs/backend-intern',
        stipend: '₹50,000/month',
        duration: '6 months',
        skills: ['Go', 'PostgreSQL', 'Redis', 'Microservices', 'Kafka'],
        status: 'Saved',
        priority: 'Medium',
        favorite: true,
        notes: 'Need to tailor resume emphasizing Golang side project before submitting.',
        interview: { date: '', time: '', round: '', meetingLink: '', interviewer: '', notes: '' },
        followUpDate: fmt(4)
      },
      {
        id: 'demo_razorpay_9',
        company: 'Razorpay',
        role: 'Security Analyst Intern',
        location: 'Bengaluru',
        region: 'India',
        state: 'Karnataka',
        workMode: 'Remote',
        applicationDate: fmt(-18),
        deadline: fmt(-5),
        applicationUrl: 'https://razorpay.com/jobs/sec-intern',
        stipend: '₹45,000/month',
        duration: '3 months',
        skills: ['Cybersecurity', 'OWASP Top 10', 'Python', 'Networking'],
        status: 'Selected',
        priority: 'High',
        favorite: true,
        notes: 'Selected after 2 technical rounds and live CTF challenge! Offer letter received. Joining in December.',
        interview: {
          date: fmt(-8),
          time: '15:00',
          round: 'Managerial',
          meetingLink: 'https://meet.google.com/razorpay-demo',
          interviewer: 'Vikram Seth (Security Architect)',
          notes: 'Reviewed secure API gateway architecture and token authentication.'
        },
        followUpDate: ''
      },
      {
        id: 'demo_uber_10',
        company: 'Uber',
        role: 'Product Operations Intern',
        location: 'Bengaluru',
        region: 'India',
        state: 'Karnataka',
        workMode: 'Hybrid',
        applicationDate: fmt(-30),
        deadline: fmt(-15),
        applicationUrl: 'https://uber.com/careers/ops-intern',
        stipend: '₹40,000/month',
        duration: '3 months',
        skills: ['SQL', 'Data Analytics', 'Excel', 'Problem Solving'],
        status: 'Withdrawn',
        priority: 'Low',
        favorite: false,
        notes: 'Withdrew after accepting the Microsoft offer.',
        interview: { date: '', time: '', round: '', meetingLink: '', interviewer: '', notes: '' },
        followUpDate: ''
      }
    ];

    if (overwrite) {
      this._saveAll(demoRecords);
    } else {
      const current = this.getAll();
      const ids = new Set(current.map(c => c.id));
      demoRecords.forEach(d => {
        if (ids.has(d.id)) {
          d.id = Utils.generateId();
        }
        current.push(d);
      });
      this._saveAll(current);
    }

    return demoRecords.length;
  }
};

window.Storage = Storage;
