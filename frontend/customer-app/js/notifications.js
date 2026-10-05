/**
 * ORDEXA Customer Notifications Controller
 */

const OrdexaCustomerNotifications = {
  async render(container) {
    const user = OrdexaAPI.auth.getCurrentUser();
    if (!user) {
      OrdexaNav.navigate('login', { returnTo: 'notifications' });
      return;
    }

    const notifs = await OrdexaAPI.notifications.getByUser(user.id);

    let notifsHtml = '';
    if (notifs.length === 0) {
      notifsHtml = `
        <div class="empty-state">
          <div class="empty-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h3 class="empty-title">No notifications</h3>
          <p class="empty-description">You will receive live alerts here when you join a queue or when your turn is called.</p>
        </div>
      `;
    } else {
      notifsHtml = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
          <button class="btn btn-secondary btn-sm" style="width:auto;" onclick="OrdexaCustomerNotifications.clearAll()">
            Clear All
          </button>
        </div>
        <div class="notif-list">
          ${notifs
            .map(
              (n) => `
              <div class="notif-card ${!n.isRead ? 'unread' : ''}">
                <div class="notif-icon-circle">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div class="notif-content">
                  <h4 class="notif-title">${OrdexaUtils.escapeHtml(n.title)}</h4>
                  <p class="notif-body">${OrdexaUtils.escapeHtml(n.message)}</p>
                  <span class="notif-time">${OrdexaUtils.timeAgo(n.createdAt)}</span>
                </div>
              </div>
            `
            )
            .join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <h1 style="font-size:22px;font-weight:800;color:#0B132B;margin-bottom:16px;">Notifications</h1>
        ${notifsHtml}
      </div>
    `;
  },

  async clearAll() {
    const user = OrdexaAPI.auth.getCurrentUser();
    if (!user) return;
    await OrdexaAPI.notifications.clear(user.id);
    this.render(document.getElementById('app-main-content'));
  }
};
