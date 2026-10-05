/**
 * ORDEXA Admin Navigation & Shell Controller
 */

const OrdexaAdminNav = {
  currentRoute: 'dashboard',

  init() {
    window.addEventListener('hashchange', () => this.handleHash());
    this.handleHash();
  },

  navigate(route) {
    window.location.hash = `#${route}`;
  },

  handleHash() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    this.currentRoute = hash;

    const isAuthed = OrdexaAPI.auth.isAuthenticated();
    const currentUser = OrdexaAPI.auth.getCurrentUser();

    // Check auth
    if (!isAuthed || !currentUser || currentUser.role !== 'admin') {
      if (this.currentRoute === 'register') {
        OrdexaAdminAuth.renderRegister(document.getElementById('admin-app-root'));
      } else {
        OrdexaAdminAuth.renderLogin(document.getElementById('admin-app-root'));
      }
      return;
    }

    // Render Shell if not already rendered
    this.ensureShell(currentUser);
    this.highlightSidebar();
    this.renderCurrentView(currentUser);
  },

  ensureShell(user) {
    const root = document.getElementById('admin-app-root');
    if (document.getElementById('admin-shell-layout')) return;

    const org = user.organizationId ? OrdexaStorage.Organizations.getById(user.organizationId) : null;
    const orgName = org ? org.name : 'Configuring Organization';
    const orgCategory = org ? org.category : 'General';

    root.innerHTML = `
      <div class="admin-layout" id="admin-shell-layout">
        <!-- Sidebar -->
        <aside class="admin-sidebar" id="admin-sidebar">
          <div class="sidebar-header">
            <img src="assets/logo/ordexa-logo.svg" alt="ORDEXA" style="width:32px;height:32px;" />
            <span class="sidebar-brand-name">ORDEXA</span>
          </div>

          <div class="sidebar-nav-container">
            <div class="nav-section-title">Operations</div>
            <a class="sidebar-nav-link" data-route="dashboard" onclick="OrdexaAdminNav.navigate('dashboard')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Dashboard</span>
            </a>
            <a class="sidebar-nav-link" data-route="queue" onclick="OrdexaAdminNav.navigate('queue')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
              <span>Live Queue</span>
            </a>
            <a class="sidebar-nav-link" data-route="walk-ins" onclick="OrdexaAdminNav.navigate('walk-ins')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span>Walk-ins</span>
            </a>

            <div class="nav-section-title" style="margin-top:16px;">Configuration</div>
            <a class="sidebar-nav-link" data-route="services" onclick="OrdexaAdminNav.navigate('services')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>Services</span>
            </a>
            <a class="sidebar-nav-link" data-route="counters" onclick="OrdexaAdminNav.navigate('counters')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span>Counters</span>
            </a>
            <a class="sidebar-nav-link" data-route="staff" onclick="OrdexaAdminNav.navigate('staff')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Staff / Operators</span>
            </a>
            <a class="sidebar-nav-link" data-route="qr-codes" onclick="OrdexaAdminNav.navigate('qr-codes')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>QR Codes</span>
            </a>

            <div class="nav-section-title" style="margin-top:16px;">Reports & Org</div>
            <a class="sidebar-nav-link" data-route="customers" onclick="OrdexaAdminNav.navigate('customers')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Queue Records</span>
            </a>
            <a class="sidebar-nav-link" data-route="analytics" onclick="OrdexaAdminNav.navigate('analytics')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Analytics</span>
            </a>
            <a class="sidebar-nav-link" data-route="organization" onclick="OrdexaAdminNav.navigate('organization')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v4m4-4v4m4-4v4" />
              </svg>
              <span>Organization</span>
            </a>
            <a class="sidebar-nav-link" data-route="feedback" onclick="OrdexaAdminNav.navigate('feedback')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Feedback</span>
            </a>
          </div>

          <div class="sidebar-footer">
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${OrdexaAdminUtils.escapeHtml(user.firstName + ' ' + user.lastName)}</div>
              <div class="sidebar-user-role">Administrator</div>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="OrdexaAdminNav.logout()" title="Logout" style="padding:4px 8px;font-size:11px;">
              Exit
            </button>
          </div>
        </aside>

        <!-- Main Wrapper -->
        <div class="admin-main-wrapper">
          <!-- Topbar -->
          <header class="admin-topbar">
            <div class="topbar-left">
              <div class="org-switcher-badge">
                <span class="org-status-indicator"></span>
                <span class="org-name-text">${OrdexaAdminUtils.escapeHtml(orgName)}</span>
                <span class="org-category-pill">${OrdexaAdminUtils.escapeHtml(orgCategory)}</span>
              </div>
            </div>
            <div class="topbar-right">
              <a href="../customer-app/index.html" target="_blank" class="topbar-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span>Preview Customer App</span>
              </a>
              <button class="topbar-btn" onclick="OrdexaAdminNav.logout()">
                <span>Logout</span>
              </button>
            </div>
          </header>

          <!-- Content Body -->
          <main class="admin-content-area" id="admin-main-view">
            <!-- Dynamic Admin View -->
          </main>
        </div>
      </div>
    `;
  },

  highlightSidebar() {
    const links = document.querySelectorAll('.sidebar-nav-link');
    links.forEach((l) => {
      if (l.getAttribute('data-route') === this.currentRoute) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });
  },

  renderCurrentView(user) {
    const viewContainer = document.getElementById('admin-main-view');
    if (!viewContainer) return;

    const orgId = user.organizationId;

    switch (this.currentRoute) {
      case 'dashboard':
        OrdexaAdminDashboard.render(viewContainer, orgId);
        break;
      case 'queue':
        OrdexaAdminQueue.render(viewContainer, orgId);
        break;
      case 'walk-ins':
        OrdexaAdminWalkIns.render(viewContainer, orgId);
        break;
      case 'services':
        OrdexaAdminServices.render(viewContainer, orgId);
        break;
      case 'counters':
        OrdexaAdminCounters.render(viewContainer, orgId);
        break;
      case 'staff':
        OrdexaAdminStaff.render(viewContainer, orgId);
        break;
      case 'customers':
        OrdexaAdminCustomers.render(viewContainer, orgId);
        break;
      case 'qr-codes':
        OrdexaAdminQR.render(viewContainer, orgId);
        break;
      case 'analytics':
        OrdexaAdminAnalytics.render(viewContainer, orgId);
        break;
      case 'feedback':
        OrdexaAdminFeedback.render(viewContainer, orgId);
        break;
      case 'organization':
        OrdexaAdminOrganization.render(viewContainer, orgId);
        break;
      default:
        OrdexaAdminDashboard.render(viewContainer, orgId);
    }
  },

  async logout() {
    await OrdexaAPI.auth.logout();
    OrdexaAdminUtils.showToast('Logged out of Admin Console');
    window.location.hash = '#login';
    window.location.reload();
  }
};
