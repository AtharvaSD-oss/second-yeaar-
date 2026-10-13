/**
 * InternTrack - Dashboard Module
 * Handles dynamic KPI computation, upcoming deadline alerts, interview widgets,
 * follow-up tracking, and quick overview rendering.
 */

const Dashboard = {
  /**
   * Initialize or re-render Dashboard
   */
  render() {
    const apps = Storage.getAll();
    const settings = Storage.getSettings();

    this.renderGreeting(settings.studentName);
    this.renderStats(apps);
    this.renderUpcomingDeadlines(apps);
    this.renderUpcomingInterviews(apps);
    this.renderFollowUps(apps);
    this.renderRecentApplications(apps);
    this.renderCareerInsights(apps);

    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  },

  /**
   * Render dynamic greeting based on time of day
   * @param {string} name 
   */
  renderGreeting(name = 'Student') {
    const greetingEl = document.getElementById('dashboard-greeting');
    if (greetingEl) {
      greetingEl.textContent = Utils.getGreeting(name);
    }
  },

  /**
   * Calculate and render summary stats cards
   * @param {Array} apps 
   */
  renderStats(apps) {
    const totalCount = apps.length;
    
    // Interviews: count where status is Interview OR has scheduled interview date
    const interviewCount = apps.filter(a => 
      a.status === 'Interview' || (a.interview && a.interview.date)
    ).length;

    // Offers: count where status is Selected
    const offerCount = apps.filter(a => a.status === 'Selected').length;

    // Follow-ups: count where followUpDate is set
    const followUpCount = apps.filter(a => a.followUpDate && a.followUpDate.trim() !== '').length;

    // Update DOM numbers
    const totalEl = document.getElementById('stat-total-apps');
    const interviewEl = document.getElementById('stat-interviews');
    const offersEl = document.getElementById('stat-offers');
    const followUpsEl = document.getElementById('stat-followups');

    if (totalEl) totalEl.textContent = totalCount;
    if (interviewEl) interviewEl.textContent = interviewCount;
    if (offersEl) offersEl.textContent = offerCount;
    if (followUpsEl) followUpsEl.textContent = followUpCount;

    // Subtitle pills / trends
    const activePipeline = apps.filter(a => ['Applied', 'Under Review', 'Interview'].includes(a.status)).length;
    const activePipelineEl = document.getElementById('stat-pipeline-hint');
    if (activePipelineEl) {
      activePipelineEl.textContent = `${activePipeline} active in pipeline`;
    }

    const offerRate = totalCount > 0 ? ((offerCount / totalCount) * 100).toFixed(1) : '0';
    const offerRateEl = document.getElementById('stat-offers-hint');
    if (offerRateEl) {
      offerRateEl.textContent = `${offerRate}% conversion rate`;
    }
  },

  /**
   * Render urgent deadlines widget (next 7 days, today, or tomorrow)
   * @param {Array} apps 
   */
  renderUpcomingDeadlines(apps) {
    const container = document.getElementById('dashboard-deadlines-list');
    if (!container) return;

    // Applications with deadlines, not yet selected/rejected/withdrawn
    const activeWithDeadlines = apps.filter(a => 
      a.deadline && 
      !['Selected', 'Rejected', 'Withdrawn'].includes(a.status)
    ).map(a => {
      const dInfo = Utils.calculateDeadline(a.deadline);
      return { app: a, deadlineInfo: dInfo };
    }).sort((a, b) => {
      // Sort by daysLeft ascending
      return (a.deadlineInfo.daysLeft || 999) - (b.deadlineInfo.daysLeft || 999);
    });

    if (activeWithDeadlines.length === 0) {
      container.innerHTML = `
        <div class="empty-widget">
          <i data-lucide="check-circle" class="empty-icon text-success"></i>
          <p class="empty-title">All caught up!</p>
          <span class="empty-desc">No urgent application deadlines this week.</span>
        </div>
      `;
      return;
    }

    // Show top 4 upcoming deadlines
    const displayList = activeWithDeadlines.slice(0, 4);
    let html = '<div class="dashboard-deadline-cards">';
    displayList.forEach(({ app, deadlineInfo }) => {
      const badgeStyle = deadlineInfo.status === 'urgent' 
        ? 'badge-urgent' 
        : (deadlineInfo.status === 'warning' ? 'badge-warning' : 'badge-normal');

      html += `
        <div class="deadline-item-card ${deadlineInfo.status}" onclick="Applications.viewDetails('${app.id}')">
          <div class="deadline-item-header">
            <div class="deadline-company-badge" style="background-color: ${Utils.getCompanyColor(app.company)}">
              ${Utils.escapeHtml(app.company.charAt(0).toUpperCase())}
            </div>
            <div class="deadline-item-info">
              <h4 class="deadline-company-name">${Utils.escapeHtml(app.company)}</h4>
              <p class="deadline-role-title">${Utils.escapeHtml(app.role)}</p>
            </div>
          </div>
          <div class="deadline-item-meta">
            <div class="deadline-date-info">
              <span class="meta-label">Deadline:</span>
              <span class="meta-value">${Utils.formatDate(app.deadline)}</span>
            </div>
            <span class="badge ${badgeStyle}">
              <i data-lucide="${deadlineInfo.icon}"></i>
              ${Utils.escapeHtml(deadlineInfo.label)}
            </span>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  },

  /**
   * Render upcoming interviews widget
   * @param {Array} apps 
   */
  renderUpcomingInterviews(apps) {
    const container = document.getElementById('dashboard-interviews-list');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const interviews = apps.filter(a => a.interview && a.interview.date)
      .map(a => ({
        app: a,
        interview: a.interview,
        isUpcoming: a.interview.date >= todayStr
      }))
      .filter(item => item.isUpcoming)
      .sort((a, b) => {
        const dateA = a.interview.date + (a.interview.time || '');
        const dateB = b.interview.date + (b.interview.time || '');
        return dateA.localeCompare(dateB);
      });

    if (interviews.length === 0) {
      container.innerHTML = `
        <div class="empty-widget">
          <i data-lucide="video" class="empty-icon text-muted"></i>
          <p class="empty-title">No upcoming interviews</p>
          <span class="empty-desc">Interviews you schedule will appear right here.</span>
        </div>
      `;
      return;
    }

    const displayList = interviews.slice(0, 3);
    let html = '<div class="dashboard-interview-cards">';
    displayList.forEach(({ app, interview }) => {
      const joinBtn = interview.meetingLink ? `
        <a href="${Utils.sanitizeUrl(interview.meetingLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary" onclick="event.stopPropagation()">
          <i data-lucide="video"></i> Join Interview
        </a>
      ` : `
        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); Applications.openInterviewModal('${app.id}')">
          <i data-lucide="calendar"></i> View Details
        </button>
      `;

      html += `
        <div class="interview-item-card" onclick="Applications.viewDetails('${app.id}')">
          <div class="interview-date-badge">
            <span class="interview-badge-day">${interview.date ? new Date(interview.date).getDate() : '--'}</span>
            <span class="interview-badge-month">${interview.date ? new Date(interview.date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() : 'DATE'}</span>
          </div>
          <div class="interview-details">
            <div class="interview-header-row">
              <h4 class="interview-company">${Utils.escapeHtml(app.company)}</h4>
              <span class="badge badge-purple">${Utils.escapeHtml(interview.round || 'Technical')} Round</span>
            </div>
            <p class="interview-role">${Utils.escapeHtml(app.role)}</p>
            <div class="interview-meta-row">
              <span class="meta-chip"><i data-lucide="clock"></i> ${Utils.formatTime(interview.time) || 'Time TBD'}</span>
              ${interview.interviewer ? `<span class="meta-chip"><i data-lucide="user"></i> ${Utils.escapeHtml(interview.interviewer)}</span>` : ''}
            </div>
          </div>
          <div class="interview-action">
            ${joinBtn}
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  },

  /**
   * Render Follow-ups Due Widget
   * @param {Array} apps 
   */
  renderFollowUps(apps) {
    const container = document.getElementById('dashboard-followups-list');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const followUps = apps.filter(a => a.followUpDate && a.followUpDate.trim() !== '')
      .map(a => {
        let status = 'upcoming';
        let label = Utils.formatDate(a.followUpDate);
        if (a.followUpDate === todayStr) {
          status = 'today';
          label = 'Due Today!';
        } else if (a.followUpDate < todayStr) {
          status = 'overdue';
          label = 'Overdue';
        }
        return { app: a, status, label };
      })
      .sort((a, b) => a.app.followUpDate.localeCompare(b.app.followUpDate));

    if (followUps.length === 0) {
      container.innerHTML = `
        <div class="empty-widget">
          <i data-lucide="bell" class="empty-icon text-muted"></i>
          <p class="empty-title">No pending follow-ups</p>
          <span class="empty-desc">Set follow-up dates when applying to stay on recruiters' radar.</span>
        </div>
      `;
      return;
    }

    let html = '<div class="followup-list">';
    followUps.slice(0, 4).forEach(({ app, status, label }) => {
      const tagClass = status === 'today' ? 'badge-urgent' : (status === 'overdue' ? 'badge-expired' : 'badge-normal');
      html += `
        <div class="followup-item-row" onclick="Applications.viewDetails('${app.id}')">
          <div class="followup-left">
            <span class="badge ${tagClass}">${label}</span>
            <span class="followup-company"><strong>${Utils.escapeHtml(app.company)}</strong> - ${Utils.escapeHtml(app.role)}</span>
          </div>
          <button class="btn btn-xs btn-outline" title="Mark Done" onclick="event.stopPropagation(); Dashboard.clearFollowUp('${app.id}')">
            <i data-lucide="check"></i> Done
          </button>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  /**
   * Clear follow-up from an application
   * @param {string} id 
   */
  clearFollowUp(id) {
    const app = Storage.getById(id);
    if (app) {
      app.followUpDate = '';
      Storage.save(app);
      Utils.showToast(`Follow-up completed for ${app.company}!`, 'success');
    }
  },

  /**
   * Render Recent Applications list on dashboard
   * @param {Array} apps 
   */
  renderRecentApplications(apps) {
    const tbody = document.getElementById('dashboard-recent-apps-body');
    if (!tbody) return;

    if (apps.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <div class="empty-state-small">
              <p>No internship applications recorded yet.</p>
              <button class="btn btn-sm btn-primary mt-2" onclick="Applications.openAddModal()">
                <i data-lucide="plus"></i> Add Your First Internship
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const recents = apps.slice(0, 5);
    let html = '';
    recents.forEach(app => {
      const dInfo = Utils.calculateDeadline(app.deadline);
      html += `
        <tr>
          <td>
            <div class="company-cell">
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
          <td>${Utils.renderWorkModeBadge(app.workMode)}</td>
          <td><span class="text-sm">${Utils.formatDate(app.applicationDate)}</span></td>
          <td>
            ${app.deadline ? `<span class="badge ${dInfo.badgeClass} text-xs">${Utils.escapeHtml(dInfo.label)}</span>` : '<span class="text-muted text-xs">No deadline</span>'}
          </td>
          <td class="text-right">
            <button class="btn btn-icon btn-sm" title="View Details" onclick="Applications.viewDetails('${app.id}')">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn btn-icon btn-sm" title="Edit" onclick="Applications.openEditModal('${app.id}')">
              <i data-lucide="edit-3"></i>
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  },

  /**
   * Render dynamic Career Insights based on real application history
   * @param {Array} apps 
   */
  renderCareerInsights(apps) {
    const container = document.getElementById('dashboard-career-insights');
    if (!container) return;

    if (apps.length === 0) {
      container.innerHTML = `
        <div class="card p-4 insight-card-banner">
          <div class="insight-banner-content">
            <div class="insight-icon-box"><i data-lucide="info"></i></div>
            <div>
              <h4 class="font-bold">Welcome to InternTrack!</h4>
              <p class="text-sm text-muted">Add your applications or load demo data to unlock personalized skill analytics, response rate benchmarks, and AI recommendations.</p>
            </div>
          </div>
          <button class="btn btn-sm btn-outline mt-3" onclick="App.loadDemoData()">
            <i data-lucide="sparkles"></i> Load Demo Data
          </button>
        </div>
      `;
      return;
    }

    // Compute top skills across all applications
    const skillCounts = {};
    apps.forEach(a => {
      if (Array.isArray(a.skills)) {
        a.skills.forEach(s => {
          const norm = s.trim();
          if (norm) {
            skillCounts[norm] = (skillCounts[norm] || 0) + 1;
          }
        });
      }
    });

    const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
    const topSkill = sortedSkills[0] ? sortedSkills[0][0] : 'Programming';
    const topSkillPct = sortedSkills[0] ? Math.round((sortedSkills[0][1] / apps.length) * 100) : 0;

    // Conversion rates
    const interviewCount = apps.filter(a => a.status === 'Interview' || (a.interview && a.interview.date)).length;
    const interviewRate = ((interviewCount / apps.length) * 100).toFixed(0);

    // Most targeted work mode
    const modeCounts = { Remote: 0, Hybrid: 0, 'On-site': 0 };
    apps.forEach(a => { if (modeCounts[a.workMode] !== undefined) modeCounts[a.workMode]++; });
    const topMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0][0];

    container.innerHTML = `
      <div class="insights-grid">
        <div class="insight-pill-card">
          <div class="insight-header">
            
            <span class="insight-title">Your Strongest Skill</span>
          </div>
          <p class="insight-body">
            <strong>${Utils.escapeHtml(topSkill)}</strong> appears in <strong>${topSkillPct}%</strong> of your applications.
          </p>
        </div>

        <div class="insight-pill-card">
          <div class="insight-header">
            
            <span class="insight-title">Interview Rate</span>
          </div>
          <p class="insight-body">
            You convert <strong>${interviewRate}%</strong> of applications into interview rounds.
          </p>
        </div>

        <div class="insight-pill-card">
          <div class="insight-header">
            
            <span class="insight-title">Preferred Work Mode</span>
          </div>
          <p class="insight-body">
            <strong>${topMode}</strong> is your most frequent choice (${modeCounts[topMode]} roles).
          </p>
        </div>

        <div class="insight-pill-card">
          <div class="insight-header">
            
            <span class="insight-title">Recommendation</span>
          </div>
          <p class="insight-body">
            ${interviewRate > 20 ? 'Strong traction! Focus on mock technical coding interviews.' : 'Boost callbacks: Tailor resume keywords and follow up 7 days post-submission.'}
          </p>
        </div>
      </div>
    `;
  }
};

window.Dashboard = Dashboard;
