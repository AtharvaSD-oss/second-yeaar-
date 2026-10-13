/**
 * InternTrack - Supabase Authentication & Cloud Database Sync
 * Project URL: https://lwurvwrhgkxucfiuuumf.supabase.co
 */

const SUPABASE_URL = 'https://lwurvwrhgkxucfiuuumf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4b5evr6CH51vOjJouXyUaw_wHlwGRPe';

const Auth = {
  client: null,
  user: null,
  session: null,
  activeMode: 'login', // 'login' or 'signup'

  init() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (err) {
        console.warn('Supabase client initialization notice:', err);
      }
    }

    if (!this.client) {
      console.warn('Supabase SDK not loaded or failed to initialize.');
      return;
    }

    this.checkSession();
    this.bindEvents();

    // Listen for auth state changes
    this.client.auth.onAuthStateChange((event, session) => {
      this.session = session;
      this.user = session ? session.user : null;
      this.updateAuthUI();
      if (event === 'SIGNED_IN' && this.user) {
        this.onUserSignedIn();
      }
    });
  },

  async checkSession() {
    if (!this.client) return;
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (!error && session) {
        this.session = session;
        this.user = session.user;
      }
      this.updateAuthUI();
    } catch (e) {
      console.warn('Failed to retrieve Supabase session:', e);
    }
  },

  async onUserSignedIn() {
    Utils.showToast(`Signed in as ${this.user.email}`, 'success');
    this.closeModal();

    // Attempt to pull cloud records
    await this.fetchCloudApplications();
  },

  async login(email, password) {
    if (!this.client) return { success: false, error: 'Supabase client not initialized.' };

    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    this.session = data.session;
    this.user = data.user;
    this.updateAuthUI();
    return { success: true, user: data.user };
  },

  async signup(name, email, password) {
    if (!this.client) return { success: false, error: 'Supabase client not initialized.' };

    const { data, error } = await this.client.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: name.trim()
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.session) {
      this.session = data.session;
      this.user = data.user;
      this.updateAuthUI();
      return { success: true, user: data.user, autoLoggedIn: true };
    } else {
      return {
        success: true,
        user: data.user,
        autoLoggedIn: false,
        message: 'Account created. Please check your email for the verification link if confirmation is enabled.'
      };
    }
  },

  async logout() {
    if (!this.client) return;
    try {
      await this.client.auth.signOut();
      this.session = null;
      this.user = null;
      this.updateAuthUI();
      Utils.showToast('You have been signed out.', 'info');
      if (typeof App !== 'undefined' && App.refreshCurrentView) {
        App.refreshCurrentView();
      }
    } catch (e) {
      Utils.showToast('Error signing out: ' + e.message, 'error');
    }
  },

  /**
   * Fetch applications from Supabase database table
   */
  async fetchCloudApplications() {
    if (!this.client || !this.user) return [];

    try {
      const { data, error } = await this.client
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Table may not be created yet in user's Supabase project
        console.warn('Notice when querying Supabase applications table:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        // Map database columns to app schema
        const mapped = data.map(item => ({
          id: item.id,
          company: item.company,
          role: item.role,
          location: item.location || '',
          region: item.region || 'India',
          state: item.state || 'Karnataka',
          workMode: item.work_mode || 'Hybrid',
          applicationDate: item.application_date || '',
          deadline: item.deadline || '',
          applicationUrl: item.application_url || '',
          stipend: item.stipend || '',
          duration: item.duration || '',
          skills: item.skills || [],
          status: item.status || 'Saved',
          priority: item.priority || 'Medium',
          favorite: Boolean(item.favorite),
          notes: item.notes || '',
          interview: item.interview || { date: '', time: '', round: '', meetingLink: '', interviewer: '', notes: '' },
          followUpDate: item.follow_up_date || ''
        }));

        // Merge into local storage so offline access still works
        mapped.forEach(app => Storage.save(app));
        if (typeof App !== 'undefined' && App.refreshCurrentView) {
          App.refreshCurrentView();
        }
        Utils.showToast(`Synchronized ${mapped.length} applications from Supabase Cloud.`, 'info');
        return mapped;
      }
    } catch (err) {
      console.warn('Cloud sync query failed:', err);
    }
    return [];
  },

  /**
   * Push an application to Supabase database
   */
  async saveCloudApplication(app) {
    if (!this.client || !this.user) return false;

    const row = {
      id: app.id,
      user_id: this.user.id,
      company: app.company,
      role: app.role,
      location: app.location,
      region: app.region,
      state: app.state,
      work_mode: app.workMode,
      application_date: app.applicationDate,
      deadline: app.deadline,
      application_url: app.applicationUrl,
      stipend: app.stipend,
      duration: app.duration,
      skills: app.skills,
      status: app.status,
      priority: app.priority,
      favorite: app.favorite,
      notes: app.notes,
      interview: app.interview,
      follow_up_date: app.followUpDate
    };

    try {
      const { error } = await this.client
        .from('applications')
        .upsert(row);

      if (error) {
        console.warn('Could not save to Supabase cloud table:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase upsert failed:', err);
      return false;
    }
  },

  /**
   * Delete an application from Supabase database
   */
  async deleteCloudApplication(id) {
    if (!this.client || !this.user) return false;

    try {
      const { error } = await this.client
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Could not delete from Supabase cloud table:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase delete failed:', err);
      return false;
    }
  },

  /**
   * Sync all existing local applications into Supabase
   */
  async syncLocalToCloud() {
    if (!this.client || !this.user) {
      Utils.showToast('Please sign in first to sync applications.', 'warning');
      return;
    }

    const localApps = Storage.getAll();
    if (localApps.length === 0) {
      Utils.showToast('No local applications to sync.', 'info');
      return;
    }

    let successCount = 0;
    for (const app of localApps) {
      const saved = await this.saveCloudApplication(app);
      if (saved) successCount++;
    }

    if (successCount > 0) {
      Utils.showToast(`Successfully uploaded ${successCount} applications to your Supabase database.`, 'success');
    } else {
      Utils.showToast('Cloud sync requires creating the "applications" table in your Supabase SQL editor.', 'warning');
    }
  },

  /**
   * Update header and settings UI according to current auth state
   */
  updateAuthUI() {
    const headerContainer = document.getElementById('auth-header-container');
    const settingsUserDisplay = document.getElementById('settings-auth-status');
    const greetingName = document.getElementById('tracker-user-name');

    if (this.user) {
      const displayName = this.user.user_metadata?.full_name || this.user.email.split('@')[0];
      if (greetingName) greetingName.textContent = displayName;

      if (headerContainer) {
        headerContainer.innerHTML = `
          <div class="user-auth-pill">
            <span class="user-avatar-initial">${displayName.charAt(0).toUpperCase()}</span>
            <span class="user-email-text" title="${Utils.escapeHtml(this.user.email)}">${Utils.escapeHtml(displayName)}</span>
            <button class="btn btn-secondary btn-xs" onclick="Auth.logout()" title="Sign Out">
              <i data-lucide="log-out" style="width: 13px; height: 13px;"></i>
              <span>Sign Out</span>
            </button>
          </div>
        `;
      }

      if (settingsUserDisplay) {
        settingsUserDisplay.innerHTML = `
          <span class="badge badge-status-selected">Connected: ${Utils.escapeHtml(this.user.email)}</span>
          <p class="text-xs text-muted mt-1">Supabase Cloud Database Sync is active.</p>
          <button class="btn btn-primary btn-xs mt-2" onclick="Auth.syncLocalToCloud()">
            <i data-lucide="cloud-upload" style="width: 13px; height: 13px;"></i> Sync Local Applications to Cloud
          </button>
        `;
      }
    } else {
      if (greetingName) greetingName.textContent = 'Student';

      if (headerContainer) {
        headerContainer.innerHTML = `
          <button class="btn btn-secondary btn-sm" onclick="Auth.openModal('login')">
            <i data-lucide="log-in" style="width: 14px; height: 14px;"></i>
            <span>Sign In</span>
          </button>
        `;
      }

      if (settingsUserDisplay) {
        settingsUserDisplay.innerHTML = `
          <span class="badge badge-status-saved">Guest Mode (Local Storage Only)</span>
          <p class="text-xs text-muted mt-1">Sign in with Supabase to enable cloud database sync.</p>
          <button class="btn btn-primary btn-xs mt-2" onclick="Auth.openModal('login')">
            <i data-lucide="log-in" style="width: 13px; height: 13px;"></i> Sign In / Create Account
          </button>
        `;
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  openModal(mode = 'login') {
    this.activeMode = mode;
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    this.switchTab(mode);
    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
    const errBox = document.getElementById('auth-error-box');
    if (errBox) {
      errBox.style.display = 'none';
      errBox.textContent = '';
    }
  },

  switchTab(mode) {
    this.activeMode = mode;
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const nameGroup = document.getElementById('auth-name-group');
    const submitBtn = document.getElementById('auth-submit-btn');
    const titleEl = document.getElementById('auth-modal-title');

    if (mode === 'login') {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabSignup) tabSignup.classList.remove('active');
      if (nameGroup) nameGroup.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Sign In to InternTrack';
      if (titleEl) titleEl.textContent = 'Sign In to Your Account';
    } else {
      if (tabSignup) tabSignup.classList.add('active');
      if (tabLogin) tabLogin.classList.remove('active');
      if (nameGroup) nameGroup.style.display = 'block';
      if (submitBtn) submitBtn.textContent = 'Create Supabase Account';
      if (titleEl) titleEl.textContent = 'Create New Account';
    }
  },

  bindEvents() {
    // Form submit
    const form = document.getElementById('auth-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('auth-email-input')?.value || '').trim();
        const password = (document.getElementById('auth-password-input')?.value || '');
        const name = (document.getElementById('auth-name-input')?.value || '').trim();
        const errBox = document.getElementById('auth-error-box');
        const submitBtn = document.getElementById('auth-submit-btn');

        if (errBox) errBox.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Processing...';
        }

        try {
          if (this.activeMode === 'login') {
            const res = await this.login(email, password);
            if (!res.success) {
              if (errBox) {
                errBox.textContent = res.error || 'Failed to sign in. Check email and password.';
                errBox.style.display = 'block';
              }
            } else {
              this.closeModal();
            }
          } else {
            const res = await this.signup(name, email, password);
            if (!res.success) {
              if (errBox) {
                errBox.textContent = res.error || 'Failed to create account.';
                errBox.style.display = 'block';
              }
            } else if (res.autoLoggedIn) {
              this.closeModal();
            } else {
              if (errBox) {
                errBox.className = 'card p-2 mb-3 text-xs';
                errBox.style.backgroundColor = 'var(--primary-light)';
                errBox.style.color = 'var(--primary)';
                errBox.style.borderColor = 'var(--primary)';
                errBox.textContent = res.message;
                errBox.style.display = 'block';
              }
            }
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = this.activeMode === 'login' ? 'Sign In to InternTrack' : 'Create Supabase Account';
          }
        }
      });
    }

    // Modal close buttons
    document.querySelectorAll('#auth-modal .modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });
  }
};

window.Auth = Auth;
