/**
 * InternTrack - Interviews Module
 * Dedicated interview timeline, upcoming rounds, past interview notes,
 * and interview quick actions.
 */

const Interviews = {
  filter: 'all', // 'all' | 'upcoming' | 'completed'

  render() {
    const apps = Storage.getAll();
    const container = document.getElementById('interviews-list-container');
    const countBadge = document.getElementById('interviews-count-badge');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter applications with interview information
    const interviewItems = apps
      .filter(a => a.interview && a.interview.date)
      .map(a => {
        const isUpcoming = a.interview.date >= todayStr;
        return {
          app: a,
          interview: a.interview,
          isUpcoming: isUpcoming,
          isToday: a.interview.date === todayStr
        };
      })
      .sort((a, b) => {
        const dateTimeA = a.interview.date + (a.interview.time || '');
        const dateTimeB = b.interview.date + (b.interview.time || '');
        return dateTimeA.localeCompare(dateTimeB);
      });

    if (countBadge) {
      const upcomingCount = interviewItems.filter(i => i.isUpcoming).length;
      countBadge.textContent = `${upcomingCount} Upcoming`;
    }

    if (interviewItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon-wrapper"><i data-lucide="video"></i></div>
          <h3 class="empty-title">No scheduled interviews</h3>
          <p class="empty-subtitle">When recruiters schedule HR, technical, or coding rounds, attach them to your applications to keep your interview timeline sharp.</p>
          <button class="btn btn-primary" onclick="Interviews.openQuickScheduleModal()">
            <i data-lucide="calendar-plus"></i> Schedule Interview
          </button>
        </div>
      `;
      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
      }
      return;
    }

    const upcoming = interviewItems.filter(i => i.isUpcoming);
    const past = interviewItems.filter(i => !i.isUpcoming).reverse(); // Most recent completed first

    let html = '';

    // 1. Upcoming section
    if (upcoming.length > 0) {
      html += `
        <div class="interviews-section-header">
          <h3><i data-lucide="clock" class="text-primary"></i> Upcoming Rounds (${upcoming.length})</h3>
        </div>
        <div class="interview-cards-grid">
      `;

      upcoming.forEach(item => {
        html += this.renderInterviewCard(item);
      });

      html += '</div>';
    }

    // 2. Past Interviews section
    if (past.length > 0) {
      html += `
        <div class="interviews-section-header mt-5">
          <h3><i data-lucide="check-circle" class="text-muted"></i> Past Interviews (${past.length})</h3>
        </div>
        <div class="interview-cards-grid">
      `;

      past.forEach(item => {
        html += this.renderInterviewCard(item, true);
      });

      html += '</div>';
    }

    container.innerHTML = html;

    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  },

  /**
   * Render individual interview card
   * @param {object} item 
   * @param {boolean} isPast 
   * @returns {string} HTML string
   */
  renderInterviewCard(item, isPast = false) {
    const { app, interview, isToday } = item;
    const parts = interview.date.split('-');
    const day = parts[2] || '--';
    const month = interview.date ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() : 'DATE';
    const year = parts[0] || '';

    const roundColors = {
      'HR': 'badge-warning',
      'Technical': 'badge-purple',
      'Coding': 'badge-normal',
      'Managerial': 'badge-urgent',
      'Final': 'badge-success'
    };
    const roundBadge = roundColors[interview.round] || 'badge-purple';

    const joinBtn = interview.meetingLink ? `
      <a href="${Utils.sanitizeUrl(interview.meetingLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
        <i data-lucide="video"></i> Join Interview
      </a>
    ` : '';

    return `
      <div class="interview-card ${isToday ? 'interview-card-today' : ''} ${isPast ? 'interview-card-past' : ''}">
        <div class="interview-card-header">
          <div class="interview-calendar-badge">
            <span class="badge-day">${day}</span>
            <span class="badge-month">${month} ${year}</span>
          </div>
          <div class="interview-card-title-box">
            <div class="d-flex align-items-center justify-between">
              <h3 class="interview-company-title">${Utils.escapeHtml(app.company)}</h3>
              ${isToday ? '<span class="badge badge-urgent animate-pulse">TODAY</span>' : ''}
            </div>
            <p class="interview-role-subtitle">${Utils.escapeHtml(app.role)}</p>
          </div>
        </div>

        <div class="interview-card-meta-chips">
          <span class="badge ${roundBadge}"><i data-lucide="layers"></i> ${Utils.escapeHtml(interview.round || 'Technical')} Round</span>
          <span class="meta-chip"><i data-lucide="clock"></i> ${Utils.formatTime(interview.time) || 'Time TBD'}</span>
          ${interview.interviewer ? `<span class="meta-chip"><i data-lucide="user"></i> ${Utils.escapeHtml(interview.interviewer)}</span>` : ''}
          <span class="meta-chip"><i data-lucide="map-pin"></i> ${Utils.escapeHtml(app.location || 'Remote')}</span>
        </div>

        ${interview.notes ? `
          <div class="interview-card-notes">
            <strong>Notes & Prep:</strong>
            <p>${Utils.escapeHtml(interview.notes)}</p>
          </div>
        ` : ''}

        <div class="interview-card-footer">
          <div class="interview-action-left">
            ${joinBtn}
          </div>
          <div class="interview-action-right">
            <button class="btn btn-sm btn-outline" onclick="Applications.openInterviewModal('${app.id}')">
              <i data-lucide="edit-3"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline" onclick="Applications.viewDetails('${app.id}')">
              <i data-lucide="eye"></i> View App
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Quick schedule modal where user can pick an application from a select dropdown
   */
  openQuickScheduleModal() {
    const apps = Storage.getAll().filter(a => !['Rejected', 'Withdrawn'].includes(a.status));
    if (apps.length === 0) {
      Utils.showToast('Please add an internship application first before scheduling an interview.', 'warning');
      Applications.openAddModal();
      return;
    }

    const selectGroup = document.getElementById('modal-interview-select-group');
    const select = document.getElementById('quick-schedule-app-select');
    if (selectGroup && select) {
      selectGroup.style.display = 'block';
      select.innerHTML = apps.map(a => 
        `<option value="${a.id}">${Utils.escapeHtml(a.company)} - ${Utils.escapeHtml(a.role)} (${a.status})</option>`
      ).join('');
      select.onchange = (e) => {
        const pickedId = e.target.value;
        Applications.activeModalAppId = pickedId;
        const app = Storage.getById(pickedId);
        if (app) {
          document.getElementById('modal-interview-app-name').textContent = `${app.company} - ${app.role}`;
          document.getElementById('modal-interview-date').value = app.interview?.date || new Date().toISOString().split('T')[0];
          document.getElementById('modal-interview-time').value = app.interview?.time || '11:00';
          document.getElementById('modal-interview-round').value = app.interview?.round || 'Technical';
          document.getElementById('modal-interview-meeting').value = app.interview?.meetingLink || '';
          document.getElementById('modal-interview-interviewer').value = app.interview?.interviewer || '';
          document.getElementById('modal-interview-notes').value = app.interview?.notes || '';
        }
      };
    }

    // Default to first application
    if (apps[0]) {
      Applications.openInterviewModal(apps[0].id);
      if (selectGroup) selectGroup.style.display = 'block';
      if (select) select.value = apps[0].id;
    }
  }
};

window.Interviews = Interviews;
