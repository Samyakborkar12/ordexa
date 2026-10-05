/**
 * ORDEXA Customer Profile Controller
 */

const OrdexaCustomerProfile = {
  render(container) {
    const user = OrdexaAPI.auth.getCurrentUser();
    if (!user) {
      OrdexaNav.navigate('login', { returnTo: 'profile' });
      return;
    }

    const initials = `${(user.firstName || 'C')[0]}${(user.lastName || 'U')[0]}`.toUpperCase();

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <h1 style="font-size:22px;font-weight:800;color:#0B132B;margin-bottom:16px;">My Account</h1>

        <div class="profile-card-header">
          <div class="profile-avatar">${initials}</div>
          <div class="profile-info-main">
            <h2 class="profile-name">${OrdexaUtils.escapeHtml(user.firstName)} ${OrdexaUtils.escapeHtml(user.lastName)}</h2>
            <div class="profile-email">${OrdexaUtils.escapeHtml(user.email)}</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px;">${OrdexaUtils.escapeHtml(user.mobile || 'No mobile linked')}</div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-item" onclick="OrdexaNav.navigate('queue-history')">
            <div class="settings-item-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-icon">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
              <span>Queue History</span>
            </div>
            <span>&rarr;</span>
          </div>

          <div class="settings-item" onclick="OrdexaNav.navigate('notifications')">
            <div class="settings-item-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-icon">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Notifications & Alerts</span>
            </div>
            <span>&rarr;</span>
          </div>

          <div class="settings-item" onclick="OrdexaNav.navigate('settings')">
            <div class="settings-item-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-icon">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Preferences</span>
            </div>
            <span>&rarr;</span>
          </div>

          <div class="settings-item" onclick="OrdexaNav.navigate('help')">
            <div class="settings-item-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-icon">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Help & FAQs</span>
            </div>
            <span>&rarr;</span>
          </div>
        </div>

        <button class="btn btn-secondary" onclick="OrdexaCustomerProfile.logout()" style="color:#EF4444;border-color:#FECACA;">
          Sign Out
        </button>
      </div>
    `;
  },

  async logout() {
    await OrdexaAPI.auth.logout();
    OrdexaUtils.showToast('Signed out');
    OrdexaNav.navigate('home');
  }
};

const OrdexaCustomerSettings = {
  render(container) {
    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <button class="btn btn-secondary btn-sm" style="width:auto;margin-bottom:16px;" onclick="OrdexaNav.navigate('profile')">
          &larr; Back to Profile
        </button>
        <h1 style="font-size:22px;font-weight:800;color:#0B132B;margin-bottom:16px;">Preferences</h1>
        
        <div class="card">
          <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;">Push Notifications</h3>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:13px;color:#475569;">Sound on Turn Call</span>
            <input type="checkbox" checked />
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;color:#475569;">Approaching Reminder (3 spots ahead)</span>
            <input type="checkbox" checked />
          </div>
        </div>

        <div class="card">
          <h3 style="font-size:14px;font-weight:700;margin-bottom:6px;">Data Synchronization</h3>
          <p style="font-size:12px;color:#64748B;">Cross-window real-time queue bus is active.</p>
        </div>
      </div>
    `;
  }
};

const OrdexaCustomerHelp = {
  render(container) {
    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <button class="btn btn-secondary btn-sm" style="width:auto;margin-bottom:16px;" onclick="OrdexaNav.navigate('profile')">
          &larr; Back to Profile
        </button>
        <h1 style="font-size:22px;font-weight:800;color:#0B132B;margin-bottom:16px;">Help & FAQs</h1>
        
        <div class="card">
          <h4 style="font-size:14px;font-weight:700;margin-bottom:4px;">How does remote queueing work?</h4>
          <p style="font-size:12px;color:#475569;line-height:1.4;">
            You can search for any organization, select their active service, and join the queue from your device. You receive a dynamic digital token and can track your position in line in real time.
          </p>
        </div>

        <div class="card">
          <h4 style="font-size:14px;font-weight:700;margin-bottom:4px;">What if I cannot arrive immediately?</h4>
          <p style="font-size:12px;color:#475569;line-height:1.4;">
            Tap "Put Spot On Hold". Your token will be paused without losing your spot permanently. You can tap "Rejoin Queue" once you arrive at the counter.
          </p>
        </div>
      </div>
    `;
  }
};
