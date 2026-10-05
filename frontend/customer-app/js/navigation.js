/**
 * ORDEXA Customer App Navigation & Router
 */

const OrdexaNav = {
  currentRoute: 'home',
  routeParams: {},

  init() {
    window.addEventListener('hashchange', () => this.handleHash());
    this.handleHash();
  },

  navigate(route, params = {}) {
    this.routeParams = params;
    let hash = `#${route}`;
    const query = new URLSearchParams(params).toString();
    if (query) hash += `?${query}`;
    window.location.hash = hash;
  },

  handleHash() {
    const rawHash = window.location.hash.slice(1) || 'home';
    const [path, queryString] = rawHash.split('?');
    this.currentRoute = path || 'home';

    this.routeParams = {};
    if (queryString) {
      const sp = new URLSearchParams(queryString);
      for (const [key, val] of sp.entries()) {
        this.routeParams[key] = val;
      }
    }

    this.updateBottomNav();
    this.renderCurrentView();
  },

  updateBottomNav() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach((btn) => {
      const target = btn.getAttribute('data-target');
      if (
        target === this.currentRoute ||
        (target === 'home' && ['welcome'].includes(this.currentRoute)) ||
        (target === 'explore' && ['organization', 'service', 'join-queue', 'live-queue'].includes(this.currentRoute)) ||
        (target === 'alerts' && ['notifications'].includes(this.currentRoute)) ||
        (target === 'profile' && ['settings', 'queue-history', 'help', 'login', 'register'].includes(this.currentRoute))
      ) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  renderCurrentView() {
    const container = document.getElementById('app-main-content');
    if (!container) return;

    // Check protected routes
    const isAuthed = OrdexaAPI.auth.isAuthenticated();
    if (['join-queue', 'live-queue', 'queue-history', 'profile', 'notifications'].includes(this.currentRoute) && !isAuthed) {
      OrdexaCustomerAuth.renderLogin(container, { returnTo: this.currentRoute, ...this.routeParams });
      return;
    }

    switch (this.currentRoute) {
      case 'home':
        OrdexaCustomerHome.render(container);
        break;
      case 'explore':
        OrdexaCustomerExplore.render(container, this.routeParams);
        break;
      case 'organization':
        OrdexaCustomerOrg.render(container, this.routeParams.id);
        break;
      case 'service':
        OrdexaCustomerService.render(container, this.routeParams.id);
        break;
      case 'join-queue':
        OrdexaCustomerQueue.renderJoin(container, this.routeParams.serviceId);
        break;
      case 'live-queue':
        OrdexaCustomerQueue.renderLive(container, this.routeParams.entryId);
        break;
      case 'queue-history':
        OrdexaCustomerQueue.renderHistory(container);
        break;
      case 'notifications':
      case 'alerts':
        OrdexaCustomerNotifications.render(container);
        break;
      case 'qr-scanner':
        OrdexaCustomerQR.render(container);
        break;
      case 'profile':
        OrdexaCustomerProfile.render(container);
        break;
      case 'settings':
        OrdexaCustomerSettings.render(container);
        break;
      case 'help':
        OrdexaCustomerHelp.render(container);
        break;
      case 'login':
        OrdexaCustomerAuth.renderLogin(container, this.routeParams);
        break;
      case 'register':
        OrdexaCustomerAuth.renderRegister(container);
        break;
      case 'forgot-password':
        OrdexaCustomerAuth.renderForgotPassword(container);
        break;
      default:
        OrdexaCustomerHome.render(container);
    }
  }
};
