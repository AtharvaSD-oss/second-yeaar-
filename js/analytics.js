/**
 * InternTrack - Analytics Engine
 * Powered by Chart.js.
 * Dynamically calculates conversion funnel, success rates, status distribution,
 * monthly timeline, and work mode metrics from LocalStorage.
 */

const Analytics = {
  charts: {
    statusChart: null,
    timelineChart: null,
    funnelChart: null,
    workModeChart: null
  },

  render() {
    const apps = Storage.getAll();
    this.renderMetrics(apps);
    this.renderCharts(apps);

    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  },

  /**
   * Compute and display rates and summary KPI metrics
   * @param {Array} apps 
   */
  renderMetrics(apps) {
    const total = apps.length;

    // Counts
    const savedCount = apps.filter(a => a.status === 'Saved').length;
    const appliedCount = apps.filter(a => a.status === 'Applied').length;
    const reviewCount = apps.filter(a => a.status === 'Under Review').length;
    const interviewCount = apps.filter(a => a.status === 'Interview' || (a.interview && a.interview.date)).length;
    const selectedCount = apps.filter(a => a.status === 'Selected').length;
    const rejectedCount = apps.filter(a => a.status === 'Rejected').length;
    const withdrawnCount = apps.filter(a => a.status === 'Withdrawn').length;

    // Success rates (Guarded against divide by zero)
    const interviewRate = total > 0 ? ((interviewCount / total) * 100).toFixed(1) : '0.0';
    const selectionRate = total > 0 ? ((selectedCount / total) * 100).toFixed(1) : '0.0';
    const rejectionRate = total > 0 ? ((rejectedCount / total) * 100).toFixed(1) : '0.0';
    const activeRate = total > 0 ? (((appliedCount + reviewCount + interviewCount) / total) * 100).toFixed(1) : '0.0';

    // DOM bindings
    const setSafe = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setSafe('analytics-total-count', total);
    setSafe('analytics-interview-rate', `${interviewRate}%`);
    setSafe('analytics-selection-rate', `${selectionRate}%`);
    setSafe('analytics-rejection-rate', `${rejectionRate}%`);
    setSafe('analytics-active-rate', `${activeRate}%`);

    // Funnel numbers
    setSafe('funnel-count-saved', savedCount);
    setSafe('funnel-count-applied', appliedCount);
    setSafe('funnel-count-review', reviewCount);
    setSafe('funnel-count-interview', interviewCount);
    setSafe('funnel-count-selected', selectedCount);

    // Funnel bars width percentages
    const maxFunnelVal = Math.max(total, 1);
    const setBar = (id, count) => {
      const el = document.getElementById(id);
      if (el) {
        const pct = Math.min(Math.round((count / maxFunnelVal) * 100), 100);
        el.style.width = `${Math.max(pct, 4)}%`;
      }
    };

    setBar('funnel-bar-saved', savedCount);
    setBar('funnel-bar-applied', appliedCount);
    setBar('funnel-bar-review', reviewCount);
    setBar('funnel-bar-interview', interviewCount);
    setBar('funnel-bar-selected', selectedCount);
  },

  /**
   * Build Chart.js Visualizations
   * @param {Array} apps 
   */
  renderCharts(apps) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library not loaded yet');
      return;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    // 1. Status Distribution Doughnut Chart
    this.renderStatusChart(apps, textColor);

    // 2. Monthly Timeline Bar Chart
    this.renderTimelineChart(apps, textColor, gridColor);

    // 3. Work Mode Breakdown
    this.renderWorkModeChart(apps, textColor);
  },

  /**
   * Status Distribution Chart
   */
  renderStatusChart(apps, textColor) {
    const canvas = document.getElementById('chart-status-distribution');
    if (!canvas) return;

    if (this.charts.statusChart) {
      this.charts.statusChart.destroy();
    }

    const statuses = ['Saved', 'Applied', 'Under Review', 'Interview', 'Selected', 'Rejected', 'Withdrawn'];
    const colors = ['#F97316', '#EAB308', '#0284C7', '#8B5CF6', '#16A34A', '#DC2626', '#64748B'];
    const counts = statuses.map(st => apps.filter(a => a.status === st).length);

    const hasData = counts.some(c => c > 0);

    const data = hasData ? {
      labels: statuses,
      datasets: [{
        data: counts,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1E293B' : '#FFFFFF'
      }]
    } : {
      labels: ['No Data Yet'],
      datasets: [{
        data: [1],
        backgroundColor: ['#CBD5E1'],
        borderWidth: 0
      }]
    };

    this.charts.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 12 },
              padding: 12
            }
          },
          tooltip: {
            enabled: hasData
          }
        },
        cutout: '68%'
      }
    });
  },

  /**
   * Applications Timeline / Monthly Trend Chart
   */
  renderTimelineChart(apps, textColor, gridColor) {
    const canvas = document.getElementById('chart-timeline');
    if (!canvas) return;

    if (this.charts.timelineChart) {
      this.charts.timelineChart.destroy();
    }

    // Group applications by Month (last 6 months)
    const monthCounts = {};
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      months.push({ key, label });
      monthCounts[key] = 0;
    }

    apps.forEach(app => {
      if (app.applicationDate) {
        const key = app.applicationDate.substring(0, 7);
        if (monthCounts[key] !== undefined) {
          monthCounts[key]++;
        }
      }
    });

    const labels = months.map(m => m.label);
    const dataVals = months.map(m => monthCounts[m.key]);

    this.charts.timelineChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Applications Submitted',
          data: dataVals,
          backgroundColor: '#4F46E5',
          borderRadius: 6,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: textColor, font: { family: 'Inter' } },
            grid: { display: false }
          },
          y: {
            ticks: { color: textColor, stepSize: 1, precision: 0 },
            grid: { color: gridColor },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Applications: ${context.parsed.y}`
            }
          }
        }
      }
    });
  },

  /**
   * Work Mode Breakdown Chart
   */
  renderWorkModeChart(apps, textColor) {
    const canvas = document.getElementById('chart-workmode');
    if (!canvas) return;

    if (this.charts.workModeChart) {
      this.charts.workModeChart.destroy();
    }

    const modes = ['Remote', 'Hybrid', 'On-site'];
    const colors = ['#0891B2', '#8B5CF6', '#10B981'];
    const counts = modes.map(m => apps.filter(a => a.workMode === m).length);

    this.charts.workModeChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: modes,
        datasets: [{
          data: counts.some(c => c > 0) ? counts : [1, 1, 1],
          backgroundColor: counts.some(c => c > 0) ? colors : ['#E2E8F0', '#CBD5E1', '#94A3B8'],
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1E293B' : '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, font: { family: 'Inter', size: 12 }, padding: 12 }
          }
        }
      }
    });
  }
};

window.Analytics = Analytics;
