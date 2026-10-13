/**
 * InternTrack - Deadlines & Interviews Management Module (Page 3)
 * Unified scheduling hub for application deadlines, upcoming interviews,
 * and hiring conversion analytics.
 */

const DeadlinesInterviews = {
  render() {
    this.renderDeadlines();
    this.renderInterviews();
    this.renderConversionStats();
    this.updateScheduleBadge();

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  /**
   * Update nav badge with total upcoming deadlines + interviews
   */
  updateScheduleBadge() {
    const apps = Storage.getAll();
    const todayStr = new Date().toISOString().split('T')[0];

    // Upcoming deadlines within 7 days
    const urgentDeadlines = apps.filter(a => {
      if (!a.deadline) return false;
      const dInfo = Utils.calculateDeadline(a.deadline);
      return !dInfo.isExpired && dInfo.daysLeft <= 7;
    }).length;

    // Upcoming interviews
    const upcomingInterviews = apps.filter(a => {
      return a.interview && a.interview.date && a.interview.date >= todayStr;
    }).length;

    const totalUpcoming = urgentDeadlines + upcomingInterviews;
    const badge = document.getElementById('nav-schedule-badge');
    if (badge) {
      badge.textContent = totalUpcoming;
      badge.style.display = totalUpcoming > 0 ? 'inline-flex' : 'none';
    }
  },

  /**
   * Render upcoming deadlines section
   */
  renderDeadlines() {
    const container = document.getElementById('schedule-deadlines-container');
    if (!container) return;

    const apps = Storage.getAll();
    const withDeadlines = apps
      .filter(a => a.deadline)
      .map(a => ({
        app: a,
        dInfo: Utils.calculateDeadline(a.deadline)
      }))
      .sort((a, b) => (a.dInfo.daysLeft ?? 999) - (b.dInfo.daysLeft ?? 999));

    if (withDeadlines.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="padding: 2.5rem 1.5rem;">
          <div class="empty-icon-wrapper" style="font-size: 2.2rem;">⏰</div>
          <h4 class="empty-title">No Application Deadlines Tracked</h4>
          <p class="empty-subtitle">Set deadlines when saving or tracking internships to see automated countdowns here.</p>
          <button class="btn btn-primary btn-sm" onclick="App.navigateTo('tracker'); Applications.openAddModal();">
            <i data-lucide="plus"></i> Add Internship
          </button>
        </div>
      `;
      return;
    }

    const urgent = withDeadlines.filter(item => !item.dInfo.isExpired && item.dInfo.daysLeft <= 2);
    const warning = withDeadlines.filter(item => !item.dInfo.isExpired && item.dInfo.daysLeft > 2 && item.dInfo.daysLeft <= 7);
    const upcoming = withDeadlines.filter(item => !item.dInfo.isExpired && item.dInfo.daysLeft > 7);
    const expired = withDeadlines.filter(item => item.dInfo.isExpired);

    let html = '<div class="deadlines-list-grid">';

    withDeadlines.forEach(item => {
      const { app, dInfo } = item;
      let badgeClass = 'badge-normal';
      let urgencyText = `${dInfo.daysLeft} days remaining`;

      if (dInfo.isExpired) {
        badgeClass = 'badge-expired';
        urgencyText = 'Deadline Passed';
      } else if (dInfo.daysLeft === 0) {
        badgeClass = 'badge-urgent';
        urgencyText = 'Due Today';
      } else if (dInfo.daysLeft === 1) {
        badgeClass = 'badge-urgent';
        urgencyText = 'Due Tomorrow';
      } else if (dInfo.daysLeft <= 2) {
        badgeClass = 'badge-urgent';
        urgencyText = `${dInfo.daysLeft} days remaining`;
      } else if (dInfo.daysLeft <= 7) {
        badgeClass = 'badge-warning';
        urgencyText = `⏰ ${dInfo.daysLeft} days remaining`;
      }

      html += `
        <div class="deadline-schedule-card ${dInfo.daysLeft <= 2 && !dInfo.isExpired ? 'card-urgent' : ''}">
          <div class="deadline-card-header">
            <div>
              <span class="deadline-company-name">${Utils.escapeHtml(app.company)}</span>
              <h4 class="deadline-role-name">${Utils.escapeHtml(app.role)}</h4>
            </div>
            <span class="deadline-badge-pill ${badgeClass}">
              ${urgencyText}
            </span>
          </div>

          <div class="deadline-card-meta">
            <span><i data-lucide="calendar"></i> Target: ${Utils.formatDate(app.deadline)}</span>
            <span><i data-lucide="tag"></i> Status: <strong>${Utils.escapeHtml(app.status)}</strong></span>
            <span><i data-lucide="map-pin"></i> ${Utils.escapeHtml(app.location || 'Remote')}</span>
          </div>

          <div class="deadline-card-actions">
            ${app.applicationUrl ? `
              <a href="${Utils.sanitizeUrl(app.applicationUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline">
                <i data-lucide="external-link"></i> Portal
              </a>
            ` : ''}

            ${app.status === 'Saved' ? `
              <button class="btn btn-xs btn-primary" onclick="Applications.quickUpdateStatus('${app.id}', 'Applied')">
                <i data-lucide="check"></i> Mark Applied
              </button>
            ` : ''}

            <button class="btn btn-xs btn-secondary" onclick="Applications.openDetailsModal('${app.id}')">
              View
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  /**
   * Render upcoming scheduled interview rounds
   */
  renderInterviews() {
    const container = document.getElementById('schedule-interviews-container');
    if (!container) return;

    const apps = Storage.getAll();
    const todayStr = new Date().toISOString().split('T')[0];

    const interviewList = apps
      .filter(a => a.interview && a.interview.date)
      .map(a => ({
        app: a,
        interview: a.interview,
        isUpcoming: a.interview.date >= todayStr,
        isToday: a.interview.date === todayStr
      }))
      .sort((a, b) => {
        const strA = a.interview.date + (a.interview.time || '');
        const strB = b.interview.date + (b.interview.time || '');
        return strA.localeCompare(strB);
      });

    if (interviewList.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="padding: 2.5rem 1.5rem;">
          <div class="empty-icon-wrapper" style="font-size: 2.2rem;"><i data-lucide="calendar"></i></div>
          <h4 class="empty-title">No Interviews Scheduled Yet</h4>
          <p class="empty-subtitle">When recruiters send test or interview invitations, schedule them here to keep meeting links and times handy.</p>
          <button class="btn btn-primary btn-sm" onclick="DeadlinesInterviews.openScheduleModal()">
            <i data-lucide="calendar-plus"></i> + Schedule Interview
          </button>
        </div>
      `;
      return;
    }

    const upcoming = interviewList.filter(i => i.isUpcoming);
    const past = interviewList.filter(i => !i.isUpcoming).reverse();

    let html = '<div class="interview-schedule-grid">';

    interviewList.forEach(item => {
      const { app, interview, isUpcoming, isToday } = item;
      const roundName = interview.round || 'Technical';
      const roundIcon = roundName.toLowerCase().includes('hr') ? 'users' :
                        (roundName.toLowerCase().includes('coding') ? 'code' : 'video');

      html += `
        <div class="interview-schedule-card ${isToday ? 'interview-card-today' : (!isUpcoming ? 'interview-card-past' : '')}">
          <div class="interview-date-badge ${isToday ? 'date-today' : ''}">
            <span class="interview-date-day">${new Date(interview.date + 'T00:00:00').getDate() || ''}</span>
            <span class="interview-date-month">${new Date(interview.date + 'T00:00:00').toLocaleString('en-US', { month: 'short' }).toUpperCase()}</span>
          </div>

          <div class="interview-details-box">
            <div class="interview-card-top-row">
              <span class="interview-company-title">${Utils.escapeHtml(app.company)}</span>
              <span class="interview-round-tag">
                <i data-lucide="${roundIcon}"></i>
                ${Utils.escapeHtml(roundName)} Round
              </span>
            </div>

            <h4 class="interview-role-name">${Utils.escapeHtml(app.role)}</h4>

            <div class="interview-meta-items">
              <span><i data-lucide="clock"></i> ${interview.time ? Utils.formatTime(interview.time) : 'Time TBD'}</span>
              ${interview.interviewer ? `<span><i data-lucide="user"></i> ${Utils.escapeHtml(interview.interviewer)}</span>` : ''}
              ${isToday ? '<span class="badge-urgent">Happening Today!</span>' : ''}
              ${!isUpcoming ? '<span class="badge-completed">Completed</span>' : ''}
            </div>

            ${interview.notes ? `
              <p class="interview-notes-snippet">
                <strong>Prep Notes:</strong> ${Utils.escapeHtml(interview.notes)}
              </p>
            ` : ''}

            <div class="interview-actions-bar">
              ${interview.meetingLink ? `
                <a href="${Utils.sanitizeUrl(interview.meetingLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-primary">
                  <i data-lucide="video"></i> Join Interview
                </a>
              ` : `
                <button class="btn btn-xs btn-outline" onclick="DeadlinesInterviews.openScheduleModal('${app.id}')">
                  + Add Link
                </button>
              `}

              <button class="btn btn-xs btn-secondary" onclick="DeadlinesInterviews.openScheduleModal('${app.id}')">
                <i data-lucide="edit-2"></i> Edit
              </button>

              <button class="btn btn-xs btn-outline" onclick="Applications.openDetailsModal('${app.id}')">
                View Job
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  /**
   * Render conversion funnel & quick rates
   */
  renderConversionStats() {
    const apps = Storage.getAll();
    const total = apps.length;

    const saved = apps.filter(a => a.status === 'Saved').length;
    const applied = apps.filter(a => a.status === 'Applied').length;
    const review = apps.filter(a => a.status === 'Under Review').length;
    const interview = apps.filter(a => a.status === 'Interview').length;
    const selected = apps.filter(a => a.status === 'Selected').length;
    const rejected = apps.filter(a => a.status === 'Rejected').length;

    const interviewRate = total > 0 ? ((interview + selected) / total * 100).toFixed(1) : '0.0';
    const selectionRate = total > 0 ? (selected / total * 100).toFixed(1) : '0.0';

    const statInterviewEl = document.getElementById('stat-interview-rate');
    const statSelectionEl = document.getElementById('stat-selection-rate');
    const funnelContainer = document.getElementById('funnel-bars-container');

    if (statInterviewEl) statInterviewEl.textContent = `${interviewRate}%`;
    if (statSelectionEl) statSelectionEl.textContent = `${selectionRate}%`;

    if (funnelContainer) {
      funnelContainer.innerHTML = `
        <div class="funnel-row">
          <div class="funnel-label"><span>Saved</span> <strong>${saved}</strong></div>
          <div class="funnel-bar-track">
            <div class="funnel-bar-fill" style="width: ${total > 0 ? (saved / total * 100) : 0}%; background-color: var(--text-subtle);"></div>
          </div>
        </div>

        <div class="funnel-row">
          <div class="funnel-label"><span>Applied</span> <strong>${applied}</strong></div>
          <div class="funnel-bar-track">
            <div class="funnel-bar-fill" style="width: ${total > 0 ? (applied / total * 100) : 0}%; background-color: #EAB308;"></div>
          </div>
        </div>

        <div class="funnel-row">
          <div class="funnel-label"><span>Under Review</span> <strong>${review}</strong></div>
          <div class="funnel-bar-track">
            <div class="funnel-bar-fill" style="width: ${total > 0 ? (review / total * 100) : 0}%; background-color: #3B82F6;"></div>
          </div>
        </div>

        <div class="funnel-row">
          <div class="funnel-label"><span>Interview</span> <strong>${interview}</strong></div>
          <div class="funnel-bar-track">
            <div class="funnel-bar-fill" style="width: ${total > 0 ? (interview / total * 100) : 0}%; background-color: #8B5CF6;"></div>
          </div>
        </div>

        <div class="funnel-row">
          <div class="funnel-label"><span>Offer / Selected</span> <strong>${selected}</strong></div>
          <div class="funnel-bar-track">
            <div class="funnel-bar-fill" style="width: ${total > 0 ? (selected / total * 100) : 0}%; background-color: #16A34A;"></div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Modal to attach/schedule interview for any application
   */
  openScheduleModal(appId = null) {
    const apps = Storage.getAll();
    if (apps.length === 0) {
      Utils.showToast('Please add an application first before scheduling an interview.', 'warning');
      return;
    }

    const select = document.getElementById('schedule-app-select');
    if (select) {
      select.innerHTML = apps.map(a => `
        <option value="${a.id}" ${appId && a.id === appId ? 'selected' : ''}>
          ${Utils.escapeHtml(a.company)} - ${Utils.escapeHtml(a.role)} (${a.status})
        </option>
      `).join('');
    }

    // Prefill if appId provided
    const app = appId ? Storage.getById(appId) : (apps[0] || null);
    if (app && app.interview) {
      const dateEl = document.getElementById('sched-interview-date');
      const timeEl = document.getElementById('sched-interview-time');
      const roundEl = document.getElementById('sched-interview-round');
      const linkEl = document.getElementById('sched-interview-link');
      const interviewerEl = document.getElementById('sched-interview-interviewer');
      const notesEl = document.getElementById('sched-interview-notes');

      if (dateEl) dateEl.value = app.interview.date || '';
      if (timeEl) timeEl.value = app.interview.time || '';
      if (roundEl) roundEl.value = app.interview.round || 'Technical';
      if (linkEl) linkEl.value = app.interview.meetingLink || '';
      if (interviewerEl) interviewerEl.value = app.interview.interviewer || '';
      if (notesEl) notesEl.value = app.interview.notes || '';
    }

    Utils.openModal('interview-schedule-modal');
  },

  /**
   * Save scheduled interview from modal form
   */
  saveScheduleModal(e) {
    if (e) e.preventDefault();
    const appId = document.getElementById('schedule-app-select')?.value;
    if (!appId) return;

    const app = Storage.getById(appId);
    if (!app) return;

    const dateVal = document.getElementById('sched-interview-date')?.value;
    if (!dateVal) {
      Utils.showToast('Please specify the interview date.', 'error');
      return;
    }

    app.interview = {
      date: dateVal,
      time: document.getElementById('sched-interview-time')?.value || '',
      round: document.getElementById('sched-interview-round')?.value || 'Technical',
      meetingLink: document.getElementById('sched-interview-link')?.value || '',
      interviewer: document.getElementById('sched-interview-interviewer')?.value || '',
      notes: document.getElementById('sched-interview-notes')?.value || ''
    };

    // Promote status to Interview if currently Saved or Applied
    if (app.status === 'Saved' || app.status === 'Applied' || app.status === 'Under Review') {
      app.status = 'Interview';
    }

    const res = Storage.save(app);
    if (res.success) {
      Utils.closeModal('interview-schedule-modal');
      Utils.showToast(`Interview scheduled for ${app.company}!`, 'success');
      this.render();
      if (Applications && typeof Applications.render === 'function') {
        Applications.render();
      }
    } else {
      Utils.showToast(res.error || 'Failed to save interview.', 'error');
    }
  }
};
