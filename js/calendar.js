/**
 * InternTrack - Interactive Calendar Module
 * Generates interactive monthly calendar, maps deadlines, interviews,
 * and follow-up events, and provides day-inspection event details.
 */

const Calendar = {
  currentDate: new Date(),
  selectedDayEvents: [],

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const prevBtn = document.getElementById('cal-prev-month');
    const nextBtn = document.getElementById('cal-next-month');
    const todayBtn = document.getElementById('cal-today-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.currentDate = new Date();
        this.render();
      });
    }
  },

  render() {
    const apps = Storage.getAll();
    const container = document.getElementById('calendar-grid-body');
    const titleEl = document.getElementById('calendar-month-year');
    if (!container) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth(); // 0-indexed

    // Format header title (e.g., October 2026)
    if (titleEl) {
      titleEl.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(this.currentDate);
    }

    // Map all application events by Date string (YYYY-MM-DD)
    const eventMap = new Map();

    const addEvent = (dateStr, eventObj) => {
      if (!dateStr) return;
      if (!eventMap.has(dateStr)) {
        eventMap.set(dateStr, []);
      }
      eventMap.get(dateStr).push(eventObj);
    };

    apps.forEach(app => {
      // 1. Deadlines
      if (app.deadline) {
        addEvent(app.deadline, {
          type: 'deadline',
          title: `Deadline: ${app.company}`,
          subtitle: app.role,
          appId: app.id,
          time: '',
          color: '#DC2626' // Red
        });
      }
      // 2. Interviews
      if (app.interview && app.interview.date) {
        addEvent(app.interview.date, {
          type: 'interview',
          title: `Interview: ${app.company}`,
          subtitle: `${app.interview.round || 'Technical'} Round (${app.interview.time || 'TBD'})`,
          appId: app.id,
          time: app.interview.time,
          color: '#8B5CF6' // Purple
        });
      }
      // 3. Follow-ups
      if (app.followUpDate) {
        addEvent(app.followUpDate, {
          type: 'followup',
          title: `Follow-up: ${app.company}`,
          subtitle: app.role,
          appId: app.id,
          time: '',
          color: '#F59E0B' // Amber
        });
      }
    });

    // Calendar grid calculations
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Monday as first day of week: (Sunday is 0, so convert 0 -> 6, 1 -> 0, etc.)
    let startingDay = firstDayOfMonth.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let html = '';

    // Previous month padding days
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDateNum = prevMonthLastDay - i;
      html += `
        <div class="calendar-day-cell other-month">
          <span class="day-number">${prevDateNum}</span>
        </div>
      `;
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const dayFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dayFormatted === todayStr;
      const dayEvents = eventMap.get(dayFormatted) || [];

      let eventsPills = '';
      if (dayEvents.length > 0) {
        eventsPills = '<div class="calendar-day-events">';
        dayEvents.slice(0, 3).forEach(ev => {
          const badgeClass = ev.type === 'deadline' ? 'cal-pill-deadline' : (ev.type === 'interview' ? 'cal-pill-interview' : 'cal-pill-followup');
          eventsPills += `
            <div class="cal-event-pill ${badgeClass}" title="${Utils.escapeHtml(ev.title)}">
              <span class="cal-dot"></span>
              <span class="cal-event-text">${Utils.escapeHtml(ev.title)}</span>
            </div>
          `;
        });
        if (dayEvents.length > 3) {
          eventsPills += `<span class="cal-more-pill">+${dayEvents.length - 3} more</span>`;
        }
        eventsPills += '</div>';
      }

      html += `
        <div class="calendar-day-cell ${isToday ? 'current-day' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}" 
             onclick="Calendar.showDayEvents('${dayFormatted}')">
          <div class="day-cell-top">
            <span class="day-number ${isToday ? 'today-badge' : ''}">${day}</span>
            ${dayEvents.length > 0 ? `<span class="event-indicator-count">${dayEvents.length}</span>` : ''}
          </div>
          ${eventsPills}
        </div>
      `;
    }

    // Next month padding days to complete 35 or 42 grid cells
    const totalRenderedCells = startingDay + totalDays;
    const remainingCells = (7 - (totalRenderedCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      html += `
        <div class="calendar-day-cell other-month">
          <span class="day-number">${i}</span>
        </div>
      `;
    }

    container.innerHTML = html;

    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  },

  /**
   * Show events modal for a clicked day
   * @param {string} dateStr 
   */
  showDayEvents(dateStr) {
    const apps = Storage.getAll();
    const dayEvents = [];

    apps.forEach(app => {
      if (app.deadline === dateStr) {
        dayEvents.push({
          type: 'Deadline',
          title: `Application Deadline – ${app.company}`,
          role: app.role,
          app: app,
          badgeClass: 'badge-urgent',
          icon: 'clock'
        });
      }
      if (app.interview && app.interview.date === dateStr) {
        dayEvents.push({
          type: 'Interview',
          title: `${app.interview.round || 'Technical'} Interview – ${app.company}`,
          role: app.role,
          time: app.interview.time,
          meetingLink: app.interview.meetingLink,
          app: app,
          badgeClass: 'badge-purple',
          icon: 'video'
        });
      }
      if (app.followUpDate === dateStr) {
        dayEvents.push({
          type: 'Follow-up',
          title: `Follow-up Due – ${app.company}`,
          role: app.role,
          app: app,
          badgeClass: 'badge-warning',
          icon: 'bell'
        });
      }
    });

    const modal = document.getElementById('calendar-day-modal');
    if (!modal) return;

    document.getElementById('cal-modal-date-title').textContent = Utils.formatDate(dateStr);
    const listContainer = document.getElementById('cal-modal-events-list');

    if (dayEvents.length === 0) {
      listContainer.innerHTML = `
        <div class="p-4 text-center text-muted">
          <p>No deadlines, interviews, or follow-ups scheduled for this day.</p>
        </div>
      `;
    } else {
      let html = '<div class="day-events-list">';
      dayEvents.forEach(item => {
        html += `
          <div class="day-event-card">
            <div class="day-event-card-header">
              <span class="badge ${item.badgeClass}"><i data-lucide="${item.icon}"></i> ${item.type}</span>
              ${item.time ? `<span class="text-sm font-semibold"><i data-lucide="clock"></i> ${Utils.formatTime(item.time)}</span>` : ''}
            </div>
            <h4 class="day-event-title">${Utils.escapeHtml(item.title)}</h4>
            <p class="day-event-role">${Utils.escapeHtml(item.role)}</p>
            <div class="day-event-actions mt-3">
              <button class="btn btn-sm btn-outline" onclick="Applications.hideModal('calendar-day-modal'); Applications.viewDetails('${item.app.id}')">
                <i data-lucide="eye"></i> View Application
              </button>
              ${item.meetingLink ? `
                <a href="${Utils.sanitizeUrl(item.meetingLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                  <i data-lucide="video"></i> Join Meeting
                </a>
              ` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
      listContainer.innerHTML = html;
    }

    Applications.showModal('calendar-day-modal');
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  }
};

window.Calendar = Calendar;
