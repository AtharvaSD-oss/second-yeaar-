/**
 * InternTrack - Applications Management Module
 * Handles grid/list rendering, multi-filtering, global search,
 * sorting, CRUD modals, favorite toggling, and detailed view modal.
 */

const Applications = {
  currentView: 'grid', // 'grid' or 'list'
  searchQuery: '',
  filters: {
    status: 'All',
    workMode: 'All',
    priority: 'All',
    favoritesOnly: false
  },
  sortBy: 'newest', // 'newest' | 'oldest' | 'deadline' | 'company' | 'status'
  activeModalAppId: null,

  /**
   * Initialize applications module listeners
   */
  init() {
    this.bindEvents();
    this.render();
  },

  /**
   * Set filter status (called from KPI summary cards)
   * @param {string} status 
   */
  setFilterStatus(status) {
    this.filters.status = status;
    const statusSelect = document.getElementById('apps-filter-status');
    if (statusSelect) {
      const match = Array.from(statusSelect.options).find(o => o.value === status);
      statusSelect.value = match ? status : 'All';
    }
    this.render();
  },

  /**
   * Bind filter and search listeners
   */
  bindEvents() {
    // Global search input with debounce
    const searchInput = document.getElementById('apps-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.render();
      }, 200));
    }

    // Status filter
    const statusFilter = document.getElementById('apps-filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.render();
      });
    }

    // Work mode filter
    const modeFilter = document.getElementById('apps-filter-workmode');
    if (modeFilter) {
      modeFilter.addEventListener('change', (e) => {
        this.filters.workMode = e.target.value;
        this.render();
      });
    }

    // Priority filter
    const priorityFilter = document.getElementById('apps-filter-priority');
    if (priorityFilter) {
      priorityFilter.addEventListener('change', (e) => {
        this.filters.priority = e.target.value;
        this.render();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('apps-sort-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    // Favorites only toggle
    const favToggle = document.getElementById('apps-filter-fav');
    if (favToggle) {
      favToggle.addEventListener('click', () => {
        this.filters.favoritesOnly = !this.filters.favoritesOnly;
        favToggle.classList.toggle('active', this.filters.favoritesOnly);
        this.render();
      });
    }

    // View switcher (grid / list)
    const gridBtn = document.getElementById('view-grid-btn');
    const listBtn = document.getElementById('view-list-btn');
    if (gridBtn && listBtn) {
      gridBtn.addEventListener('click', () => {
        this.currentView = 'grid';
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        this.render();
      });
      listBtn.addEventListener('click', () => {
        this.currentView = 'list';
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        this.render();
      });
    }

    // Reset filters button
    const resetBtn = document.getElementById('apps-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetFilters());
    }
  },

  /**
   * Reset all search and filter controls
   */
  resetFilters() {
    this.searchQuery = '';
    this.filters = {
      status: 'All',
      workMode: 'All',
      priority: 'All',
      favoritesOnly: false
    };
    this.sortBy = 'newest';

    const sInp = document.getElementById('apps-search-input');
    if (sInp) sInp.value = '';
    const sStat = document.getElementById('apps-filter-status');
    if (sStat) sStat.value = 'All';
    const sMode = document.getElementById('apps-filter-workmode');
    if (sMode) sMode.value = 'All';
    const sPrio = document.getElementById('apps-filter-priority');
    if (sPrio) sPrio.value = 'All';
    const sSort = document.getElementById('apps-sort-by');
    if (sSort) sSort.value = 'newest';
    const fToggle = document.getElementById('apps-filter-fav');
    if (fToggle) fToggle.classList.remove('active');

    this.render();
  },

  /**
   * Filter and sort applications
   * @param {Array} apps 
   * @returns {Array}
   */
  filterAndSort(apps) {
    let result = apps.slice();

    // 1. Search Query
    if (this.searchQuery) {
      const q = this.searchQuery;
      result = result.filter(a => {
        const company = (a.company || '').toLowerCase();
        const role = (a.role || '').toLowerCase();
        const location = (a.location || '').toLowerCase();
        const region = (a.region || '').toLowerCase();
        const state = (a.state || '').toLowerCase();
        const notes = (a.notes || '').toLowerCase();
        const skills = Array.isArray(a.skills) ? a.skills.join(' ').toLowerCase() : '';
        return company.includes(q) || role.includes(q) || location.includes(q) || region.includes(q) || state.includes(q) || notes.includes(q) || skills.includes(q);
      });
    }

    // 2. Status filter
    if (this.filters.status !== 'All') {
      if (this.filters.status === 'In Review' || this.filters.status === 'Under Review') {
        result = result.filter(a => a.status === 'Under Review' || a.status === 'Applied');
      } else if (this.filters.status === 'Interview') {
        result = result.filter(a => a.status === 'Interview' || (a.interview && a.interview.date));
      } else {
        result = result.filter(a => a.status === this.filters.status);
      }
    }

    // 3. Work mode filter
    if (this.filters.workMode !== 'All') {
      result = result.filter(a => a.workMode === this.filters.workMode);
    }

    // 4. Priority filter
    if (this.filters.priority !== 'All') {
      result = result.filter(a => a.priority === this.filters.priority);
    }

    // 5. Favorites only filter
    if (this.filters.favoritesOnly) {
      result = result.filter(a => Boolean(a.favorite));
    }

    // 6. Sorting
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return (b.applicationDate || '').localeCompare(a.applicationDate || '') || (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'oldest':
          return (a.applicationDate || '').localeCompare(b.applicationDate || '') || (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'deadline':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.localeCompare(b.deadline);
        case 'company':
          return (a.company || '').localeCompare(b.company || '', undefined, { sensitivity: 'base' });
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    return result;
  },

  /**
   * Render Applications view based on active filters and layout
   */
  render() {
    const allApps = Storage.getAll();
    const filteredApps = this.filterAndSort(allApps);
    const container = document.getElementById('applications-container');
    const countBadge = document.getElementById('apps-count-badge');

    if (countBadge) {
      countBadge.textContent = `${filteredApps.length} of ${allApps.length}`;
    }

    // Update Tracker KPI cards
    const totalApps = allApps.length;
    const reviewApps = allApps.filter(a => a.status === 'Under Review' || a.status === 'Applied').length;
    const interviewsApps = allApps.filter(a => a.status === 'Interview' || (a.interview && a.interview.date)).length;
    const offersApps = allApps.filter(a => a.status === 'Selected').length;

    const statTotalEl = document.getElementById('stat-total-apps');
    const statReviewEl = document.getElementById('stat-review-apps');
    const statInterviewsEl = document.getElementById('stat-interviews');
    const statOffersEl = document.getElementById('stat-offers');
    if (statTotalEl) statTotalEl.textContent = totalApps;
    if (statReviewEl) statReviewEl.textContent = reviewApps;
    if (statInterviewsEl) statInterviewsEl.textContent = interviewsApps;
    if (statOffersEl) statOffersEl.textContent = offersApps;

    if (!container) return;

    if (filteredApps.length === 0) {
      if (allApps.length === 0) {
        container.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-icon-wrapper"><i data-lucide="briefcase"></i></div>
            <h3 class="empty-title">No internships yet</h3>
            <p class="empty-subtitle">Start tracking your internship applications, interview rounds, and offers in one organized dashboard.</p>
            <div class="empty-actions">
              <button class="btn btn-primary" onclick="Applications.openAddModal()">
                <i data-lucide="plus"></i> Add Internship
              </button>
              <button class="btn btn-outline" onclick="App.loadDemoData()">
                <i data-lucide="sparkles"></i> Load Demo Data
              </button>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-icon-wrapper"><i data-lucide="search"></i></div>
            <h3 class="empty-title">No matching applications</h3>
            <p class="empty-subtitle">Try adjusting or clearing your search filters to find what you're looking for.</p>
            <button class="btn btn-secondary mt-3" onclick="Applications.resetFilters()">
              <i data-lucide="rotate-ccw"></i> Reset Filters
            </button>
          </div>
        `;
      }

      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
      }
      return;
    }

    if (this.currentView === 'grid') {
      this.renderGridView(filteredApps, container);
    } else {
      this.renderListView(filteredApps, container);
    }

    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  },

  /**
   * Render grid cards layout
   * @param {Array} apps 
   * @param {HTMLElement} container 
   */
  renderGridView(apps, container) {
    let html = '<div class="apps-grid">';
    apps.forEach(app => {
      const dInfo = Utils.calculateDeadline(app.deadline);
      const isFav = Boolean(app.favorite);
      const skills = Array.isArray(app.skills) ? app.skills : [];
      const skillsHtml = skills.slice(0, 4).map(s => 
        `<span class="skill-tag">${Utils.escapeHtml(s)}</span>`
      ).join('');
      const moreSkills = skills.length > 4 ? `<span class="skill-tag-more">+${skills.length - 4}</span>` : '';

      html += `
        <div class="app-card" data-id="${app.id}">
          <div class="app-card-header">
            <div class="app-card-company-wrapper">
              <div class="company-logo-avatar" style="background-color: ${Utils.getCompanyColor(app.company)}">
                ${Utils.escapeHtml(app.company.charAt(0).toUpperCase())}
              </div>
              <div class="app-card-title-meta">
                <h3 class="app-card-company">${Utils.escapeHtml(app.company)}</h3>
                <p class="app-card-role">${Utils.escapeHtml(app.role)}</p>
              </div>
            </div>
            <button class="btn-fav-star ${isFav ? 'active' : ''}" 
                    title="${isFav ? 'Remove from favorites' : 'Mark as favorite'}"
                    onclick="event.stopPropagation(); Applications.toggleFavorite('${app.id}')">
              <i data-lucide="star"></i>
            </button>
          </div>

          <div class="app-card-tags">
            ${Utils.renderStatusBadge(app.status)}
            ${Utils.renderPriorityBadge(app.priority)}
            ${Utils.renderWorkModeBadge(app.workMode)}
          </div>

          <div class="app-card-details">
            <div class="detail-row">
              <span class="detail-label"><i data-lucide="map-pin"></i> Location:</span>
              <span class="detail-value">${Utils.escapeHtml(app.location || 'Remote')}${app.state ? ` (${Utils.escapeHtml(app.state)})` : ''}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><i data-lucide="wallet"></i> Stipend:</span>
              <span class="detail-value font-medium">${Utils.escapeHtml(Utils.formatStipend(app.stipend))}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><i data-lucide="calendar"></i> Applied:</span>
              <span class="detail-value">${Utils.formatDate(app.applicationDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><i data-lucide="clock"></i> Deadline:</span>
              <span class="detail-value">
                ${app.deadline ? `<span class="badge ${dInfo.badgeClass} text-xs">${Utils.escapeHtml(dInfo.label)}</span>` : '<span class="text-muted">None</span>'}
              </span>
            </div>
          </div>

          ${skills.length > 0 ? `
            <div class="app-card-skills">
              <div class="skills-list">${skillsHtml}${moreSkills}</div>
            </div>
          ` : ''}

          ${app.interview && app.interview.date ? `
            <div class="app-card-interview-alert">
              <i data-lucide="video"></i>
              <span><strong>${Utils.escapeHtml(app.interview.round || 'Interview')}</strong>: ${Utils.formatDate(app.interview.date)} ${app.interview.time ? `(${Utils.formatTime(app.interview.time)})` : ''}</span>
            </div>
          ` : ''}

          <div class="app-card-actions">
            <button class="btn btn-sm btn-outline flex-1" onclick="Applications.viewDetails('${app.id}')">
              <i data-lucide="eye"></i> View
            </button>
            <button class="btn btn-sm btn-outline flex-1" onclick="Applications.openEditModal('${app.id}')">
              <i data-lucide="edit-2"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger btn-icon" title="Delete" onclick="Applications.confirmDelete('${app.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  /**
   * Render list/table layout
   * @param {Array} apps 
   * @param {HTMLElement} container 
   */
  renderListView(apps, container) {
    let html = `
      <div class="table-responsive card">
        <table class="apps-table">
          <thead>
            <tr>
              <th width="40"><i data-lucide="star"></i></th>
              <th>Company & Role</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Work Mode</th>
              <th>Applied Date</th>
              <th>Deadline</th>
              <th>Stipend</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    apps.forEach(app => {
      const dInfo = Utils.calculateDeadline(app.deadline);
      const isFav = Boolean(app.favorite);

      html += `
        <tr data-id="${app.id}">
          <td>
            <button class="btn-fav-star ${isFav ? 'active' : ''}" 
                    title="${isFav ? 'Remove Favorite' : 'Add Favorite'}"
                    onclick="event.stopPropagation(); Applications.toggleFavorite('${app.id}')">
              <i data-lucide="star"></i>
            </button>
          </td>
          <td>
            <div class="company-cell cursor-pointer" onclick="Applications.viewDetails('${app.id}')">
              <div class="company-logo-avatar" style="background-color: ${Utils.getCompanyColor(app.company)}">
                ${Utils.escapeHtml(app.company.charAt(0).toUpperCase())}
              </div>
              <div class="company-cell-meta">
                <span class="company-name font-semibold">${Utils.escapeHtml(app.company)}</span>
                <span class="company-role text-muted">${Utils.escapeHtml(app.role)}</span>
              </div>
            </div>
          </td>
          <td>${Utils.renderStatusBadge(app.status)}</td>
          <td>${Utils.renderPriorityBadge(app.priority)}</td>
          <td>${Utils.renderWorkModeBadge(app.workMode)}</td>
          <td><span class="text-sm">${Utils.formatDate(app.applicationDate)}</span></td>
          <td>
            ${app.deadline ? `<span class="badge ${dInfo.badgeClass} text-xs">${Utils.escapeHtml(dInfo.label)}</span>` : '<span class="text-muted text-xs">-</span>'}
          </td>
          <td><span class="text-sm font-medium">${Utils.escapeHtml(Utils.formatStipend(app.stipend))}</span></td>
          <td class="text-right table-actions-cell">
            <button class="btn btn-icon btn-sm" title="View Details" onclick="Applications.viewDetails('${app.id}')">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn btn-icon btn-sm" title="Edit Application" onclick="Applications.openEditModal('${app.id}')">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn btn-icon btn-sm text-danger" title="Delete" onclick="Applications.confirmDelete('${app.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  /**
   * Toggle favorite star
   * @param {string} id 
   */
  toggleFavorite(id) {
    const newState = Storage.toggleFavorite(id);
    this.render();
    if (document.getElementById('details-modal').classList.contains('active')) {
      const star = document.getElementById('details-fav-star');
      if (star) star.classList.toggle('active', newState);
    }
    Utils.showToast(newState ? 'Added to favorites.' : 'Removed from favorites', 'info');
  },

  /**
   * Open Add Internship modal
   */
  openAddModal() {
    this.activeModalAppId = null;
    const form = document.getElementById('app-form');
    if (form) form.reset();

    const titleEl = document.getElementById('app-modal-title');
    if (titleEl) titleEl.textContent = 'Add Internship Application';

    // Set default application date to today
    const appDateInput = document.getElementById('form-application-date');
    if (appDateInput) {
      appDateInput.value = new Date().toISOString().split('T')[0];
    }

    const regInp = document.getElementById('form-region');
    if (regInp) regInp.value = 'India';
    const stateInp = document.getElementById('form-state');
    if (stateInp) stateInp.value = '';

    // Reset skills chips
    this.renderSkillsChips([]);

    // Reset interview fields safely
    const iDate = document.getElementById('form-interview-date');
    if (iDate) iDate.value = '';
    const iTime = document.getElementById('form-interview-time');
    if (iTime) iTime.value = '';
    const iRound = document.getElementById('form-interview-round');
    if (iRound) iRound.value = 'Technical';
    const iMeet = document.getElementById('form-interview-meeting');
    if (iMeet) iMeet.value = '';
    const iInter = document.getElementById('form-interview-interviewer');
    if (iInter) iInter.value = '';
    const iNotes = document.getElementById('form-interview-notes');
    if (iNotes) iNotes.value = '';

    // Open modal
    this.showModal('app-edit-modal');
  },

  /**
   * Open Edit Internship modal
   * @param {string} id 
   */
  openEditModal(id) {
    const app = Storage.getById(id);
    if (!app) {
      Utils.showToast('Application not found', 'error');
      return;
    }
    this.activeModalAppId = id;

    const titleEl = document.getElementById('app-modal-title');
    if (titleEl) titleEl.textContent = `Edit - ${app.company}`;

    // Populate form fields
    document.getElementById('form-company').value = app.company || '';
    document.getElementById('form-role').value = app.role || '';
    document.getElementById('form-location').value = app.location || '';
    const formRegion = document.getElementById('form-region');
    if (formRegion) formRegion.value = app.region || 'India';
    const formState = document.getElementById('form-state');
    if (formState) formState.value = app.state || '';
    document.getElementById('form-work-mode').value = app.workMode || 'Remote';
    document.getElementById('form-application-date').value = app.applicationDate || '';
    document.getElementById('form-deadline').value = app.deadline || '';
    document.getElementById('form-url').value = app.applicationUrl || '';
    document.getElementById('form-stipend').value = app.stipend || '';
    document.getElementById('form-duration').value = app.duration || '';
    document.getElementById('form-status').value = app.status || 'Applied';
    document.getElementById('form-priority').value = app.priority || 'Medium';
    document.getElementById('form-notes').value = app.notes || '';
    document.getElementById('form-followup-date').value = app.followUpDate || '';

    // Populate interview subsection safely
    const iDate = document.getElementById('form-interview-date');
    if (iDate) iDate.value = app.interview?.date || '';
    const iTime = document.getElementById('form-interview-time');
    if (iTime) iTime.value = app.interview?.time || '';
    const iRound = document.getElementById('form-interview-round');
    if (iRound) iRound.value = app.interview?.round || 'Technical';
    const iMeet = document.getElementById('form-interview-meeting');
    if (iMeet) iMeet.value = app.interview?.meetingLink || '';
    const iInter = document.getElementById('form-interview-interviewer');
    if (iInter) iInter.value = app.interview?.interviewer || '';
    const iNotes = document.getElementById('form-interview-notes');
    if (iNotes) iNotes.value = app.interview?.notes || '';

    // Render skills
    this.renderSkillsChips(app.skills || []);

    this.showModal('app-edit-modal');
  },

  /**
   * Render and manage skills chip input
   * @param {Array} skills 
   */
  renderSkillsChips(skills) {
    const container = document.getElementById('form-skills-container');
    const hiddenInput = document.getElementById('form-skills-hidden');
    if (!container || !hiddenInput) return;

    let skillsArray = Array.isArray(skills) ? [...skills] : [];
    hiddenInput.value = JSON.stringify(skillsArray);

    const updateUI = () => {
      container.innerHTML = '';
      skillsArray.forEach((skill, idx) => {
        const chip = document.createElement('span');
        chip.className = 'skill-input-chip';
        chip.innerHTML = `
          ${Utils.escapeHtml(skill)}
          <button type="button" class="chip-remove" data-idx="${idx}">&times;</button>
        `;
        container.appendChild(chip);
      });

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'skill-chip-input';
      input.placeholder = skillsArray.length === 0 ? 'Type skill and press Enter (e.g. Python, React)' : '+ Add skill...';
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const val = input.value.trim().replace(/^,+|,+$/g, '');
          if (val && !skillsArray.includes(val)) {
            skillsArray.push(val);
            hiddenInput.value = JSON.stringify(skillsArray);
            updateUI();
            const newInput = container.querySelector('.skill-chip-input');
            if (newInput) newInput.focus();
          }
        } else if (e.key === 'Backspace' && input.value === '' && skillsArray.length > 0) {
          skillsArray.pop();
          hiddenInput.value = JSON.stringify(skillsArray);
          updateUI();
          const newInput = container.querySelector('.skill-chip-input');
          if (newInput) newInput.focus();
        }
      });

      container.appendChild(input);

      // Bind remove buttons
      container.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx, 10);
          skillsArray.splice(idx, 1);
          hiddenInput.value = JSON.stringify(skillsArray);
          updateUI();
        });
      });
    };

    updateUI();
  },

  /**
   * Save application from modal form submission
   * @param {Event} e 
   */
  handleFormSubmit(e) {
    e.preventDefault();
    const company = document.getElementById('form-company').value.trim();
    const role = document.getElementById('form-role').value.trim();

    if (!company) {
      Utils.showToast('Please enter the Company Name', 'error');
      document.getElementById('form-company').focus();
      return;
    }
    if (!role) {
      Utils.showToast('Please enter the Job Role', 'error');
      document.getElementById('form-role').focus();
      return;
    }

    let skills = [];
    try {
      const skillsRaw = document.getElementById('form-skills-hidden').value;
      skills = JSON.parse(skillsRaw || '[]');
    } catch (_) {
      skills = [];
    }

    const existing = this.activeModalAppId ? Storage.getById(this.activeModalAppId) : null;
    const interviewData = {
      date: document.getElementById('form-interview-date')?.value || existing?.interview?.date || '',
      time: document.getElementById('form-interview-time')?.value || existing?.interview?.time || '',
      round: document.getElementById('form-interview-round')?.value || existing?.interview?.round || 'Technical',
      meetingLink: (document.getElementById('form-interview-meeting')?.value || existing?.interview?.meetingLink || '').trim(),
      interviewer: (document.getElementById('form-interview-interviewer')?.value || existing?.interview?.interviewer || '').trim(),
      notes: (document.getElementById('form-interview-notes')?.value || existing?.interview?.notes || '').trim()
    };

    let statusVal = document.getElementById('form-status').value;
    if (interviewData.date && (statusVal === 'Saved' || statusVal === 'Applied')) {
      statusVal = 'Interview';
    }

    const payload = {
      id: this.activeModalAppId,
      company: company,
      role: role,
      location: document.getElementById('form-location').value.trim(),
      region: document.getElementById('form-region')?.value || 'India',
      state: document.getElementById('form-state')?.value.trim() || '',
      workMode: document.getElementById('form-work-mode').value,
      applicationDate: document.getElementById('form-application-date').value,
      deadline: document.getElementById('form-deadline').value,
      applicationUrl: document.getElementById('form-url').value.trim(),
      stipend: document.getElementById('form-stipend').value.trim(),
      duration: document.getElementById('form-duration').value.trim(),
      status: statusVal,
      priority: document.getElementById('form-priority').value,
      notes: document.getElementById('form-notes').value.trim(),
      skills: skills,
      followUpDate: document.getElementById('form-followup-date').value,
      interview: interviewData
    };

    const res = Storage.save(payload);
    if (!res.success) {
      Utils.showToast(res.error || 'Failed to save application', 'error');
      return;
    }

    this.hideModal('app-edit-modal');
    this.render();
    Utils.showToast(this.activeModalAppId ? 'Application updated successfully.' : 'Internship added to tracker.', 'success');

    if (res.warning) {
      Utils.showToast(`Notice: ${res.warning}`, 'warning');
    }
  },

  /**
   * View comprehensive details modal
   * @param {string} id 
   */
  viewDetails(id) {
    const app = Storage.getById(id);
    if (!app) {
      Utils.showToast('Application not found', 'error');
      return;
    }

    const modal = document.getElementById('details-modal');
    if (!modal) return;

    // Header info
    document.getElementById('details-company').textContent = app.company;
    document.getElementById('details-role').textContent = app.role;
    document.getElementById('details-status-badge').innerHTML = Utils.renderStatusBadge(app.status);
    document.getElementById('details-priority-badge').innerHTML = Utils.renderPriorityBadge(app.priority);
    document.getElementById('details-workmode-badge').innerHTML = Utils.renderWorkModeBadge(app.workMode);

    // Favorite star
    const star = document.getElementById('details-fav-star');
    if (star) {
      star.className = `btn-fav-star ${app.favorite ? 'active' : ''}`;
      star.onclick = () => this.toggleFavorite(app.id);
    }

    // Grid meta values
    document.getElementById('details-location').textContent = app.location || 'Remote';
    const regStateEl = document.getElementById('details-region-state');
    if (regStateEl) {
      const parts = [app.region, app.state].filter(Boolean);
      regStateEl.textContent = parts.length > 0 ? parts.join(' • ') : 'Global / Remote';
    }
    document.getElementById('details-stipend').textContent = Utils.formatStipend(app.stipend);
    document.getElementById('details-duration').textContent = app.duration || 'Not specified';
    document.getElementById('details-applied-date').textContent = Utils.formatDate(app.applicationDate);

    const dInfo = Utils.calculateDeadline(app.deadline);
    const deadlineVal = document.getElementById('details-deadline');
    if (deadlineVal) {
      deadlineVal.innerHTML = app.deadline 
        ? `${Utils.formatDate(app.deadline)} <span class="badge ${dInfo.badgeClass} text-xs ml-1">${Utils.escapeHtml(dInfo.label)}</span>`
        : 'None specified';
    }

    // Skills
    const skillsContainer = document.getElementById('details-skills');
    if (skillsContainer) {
      if (Array.isArray(app.skills) && app.skills.length > 0) {
        skillsContainer.innerHTML = app.skills.map(s => 
          `<span class="skill-tag">${Utils.escapeHtml(s)}</span>`
        ).join('');
      } else {
        skillsContainer.innerHTML = '<span class="text-muted text-sm">No specific skills tagged.</span>';
      }
    }

    // Notes
    const notesEl = document.getElementById('details-notes');
    if (notesEl) {
      notesEl.textContent = app.notes || 'No notes added yet.';
    }

    // Application Link button
    const appLinkBtn = document.getElementById('details-app-url-btn');
    if (appLinkBtn) {
      if (app.applicationUrl) {
        appLinkBtn.href = Utils.sanitizeUrl(app.applicationUrl);
        appLinkBtn.style.display = 'inline-flex';
      } else {
        appLinkBtn.style.display = 'none';
      }
    }

    // Interview details card
    const interviewBox = document.getElementById('details-interview-card');
    if (interviewBox) {
      if (app.interview && (app.interview.date || app.interview.round)) {
        interviewBox.style.display = 'block';
        document.getElementById('details-interview-round').textContent = `${app.interview.round || 'Technical'} Round`;
        document.getElementById('details-interview-time').textContent = `${Utils.formatDate(app.interview.date)} at ${Utils.formatTime(app.interview.time) || 'TBD'}`;
        document.getElementById('details-interview-interviewer').textContent = app.interview.interviewer || 'Not specified';
        document.getElementById('details-interview-notes').textContent = app.interview.notes || 'No interview notes.';

        const joinBtn = document.getElementById('details-interview-join-btn');
        if (joinBtn) {
          if (app.interview.meetingLink) {
            joinBtn.href = Utils.sanitizeUrl(app.interview.meetingLink);
            joinBtn.style.display = 'inline-flex';
          } else {
            joinBtn.style.display = 'none';
          }
        }
      } else {
        interviewBox.style.display = 'none';
      }
    }

    // Follow-up card
    const followupBox = document.getElementById('details-followup-card');
    if (followupBox) {
      if (app.followUpDate) {
        followupBox.style.display = 'block';
        document.getElementById('details-followup-date').textContent = Utils.formatDate(app.followUpDate);
      } else {
        followupBox.style.display = 'none';
      }
    }

    // Quick status dropdown inside details modal
    const statusSelect = document.getElementById('details-quick-status');
    if (statusSelect) {
      statusSelect.value = app.status;
      statusSelect.onchange = (e) => {
        Storage.updateStatus(app.id, e.target.value);
        document.getElementById('details-status-badge').innerHTML = Utils.renderStatusBadge(e.target.value);
        this.render();
        Utils.showToast(`Status updated to "${e.target.value}"`, 'success');
      };
    }

    // Modal action buttons
    const editBtn = document.getElementById('details-edit-btn');
    if (editBtn) {
      editBtn.onclick = () => {
        this.hideModal('details-modal');
        this.openEditModal(app.id);
      };
    }

    const deleteBtn = document.getElementById('details-delete-btn');
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        this.hideModal('details-modal');
        this.confirmDelete(app.id);
      };
    }

    const scheduleInterviewBtn = document.getElementById('details-schedule-interview-btn');
    if (scheduleInterviewBtn) {
      scheduleInterviewBtn.onclick = () => {
        this.hideModal('details-modal');
        this.openInterviewModal(app.id);
      };
    }

    this.showModal('details-modal');
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  },

  /**
   * Open interview scheduling modal for a specific application
   * @param {string} appId 
   */
  openInterviewModal(appId) {
    if (window.DeadlinesInterviews && typeof DeadlinesInterviews.openScheduleModal === 'function') {
      DeadlinesInterviews.openScheduleModal(appId);
    }
  },

  /**
   * Confirm deletion modal
   * @param {string} id 
   */
  confirmDelete(id) {
    const app = Storage.getById(id);
    if (!app) return;

    const confirmModal = document.getElementById('confirm-delete-modal');
    if (!confirmModal) {
      if (confirm(`Are you sure you want to delete application for "${app.company} - ${app.role}"?`)) {
        Storage.delete(id);
        this.render();
        Utils.showToast('Application deleted', 'info');
      }
      return;
    }

    document.getElementById('delete-modal-text').textContent = 
      `Are you sure you want to delete your application for ${app.company} (${app.role})? This action cannot be undone.`;

    const confirmBtn = document.getElementById('delete-modal-confirm-btn');
    confirmBtn.onclick = () => {
      Storage.delete(id);
      this.hideModal('confirm-delete-modal');
      this.render();
      Utils.showToast(`Deleted application for ${app.company}`, 'info');
    };

    this.showModal('confirm-delete-modal');
  },

  /**
   * Generic modal open
   * @param {string} modalId 
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scroll
      const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
  },

  /**
   * Generic modal close
   * @param {string} modalId 
   */
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
};

window.Applications = Applications;
