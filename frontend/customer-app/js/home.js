/**
 * ORDEXA Customer Home Controller
 */

const OrdexaCustomerHome = {
  categories: [
    { id: 'Healthcare', name: 'Healthcare', icon: 'healthcare.svg' },
    { id: 'Diagnostic Centre', name: 'Diagnostics', icon: 'diagnostic.svg' },
    { id: 'Banking', name: 'Banking', icon: 'banking.svg' },
    { id: 'Government', name: 'Government', icon: 'government.svg' },
    { id: 'RTO', name: 'RTO', icon: 'rto.svg' },
    { id: 'Aadhaar Services', name: 'Aadhaar', icon: 'aadhaar.svg' },
    { id: 'Education', name: 'Education', icon: 'education.svg' },
    { id: 'Other', name: 'Other', icon: 'other.svg' }
  ],

  async render(container) {
    const user = OrdexaAPI.auth.getCurrentUser();
    const activeEntry = user ? await OrdexaAPI.queues.getCustomerActiveEntry(user.id) : null;
    const orgs = await OrdexaAPI.organizations.getAll();

    let activeBannerHtml = '';
    if (activeEntry) {
      activeBannerHtml = `
        <div class="active-queue-banner card-clickable" onclick="OrdexaNav.navigate('live-queue', { entryId: '${activeEntry.id}' })">
          <div class="active-queue-badge">
            <span class="pulse-dot" style="display:inline-block;width:6px;height:6px;background:#38BDF8;border-radius:50%;margin-right:4px;"></span>
            Active Queue
          </div>
          <div class="active-token-text">${OrdexaUtils.escapeHtml(activeEntry.token)}</div>
          <p style="color:#E2E8F0;font-size:12px;margin-bottom:8px;">
            ${OrdexaUtils.escapeHtml(activeEntry.serviceName)} • ${OrdexaUtils.escapeHtml(activeEntry.organizationName)}
          </p>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid rgba(255,255,255,0.15);">
            <span style="font-size:11px;color:#94A3B8;">Status: <strong>${activeEntry.status}</strong></span>
            <span style="font-size:11px;color:#38BDF8;font-weight:600;">Track Queue &rarr;</span>
          </div>
        </div>
      `;
    }

    const categoriesHtml = this.categories
      .map(
        (cat) => `
        <div class="category-chip" onclick="OrdexaNav.navigate('explore', { category: '${cat.id}' })">
          <div class="category-icon-wrapper">
            <img src="assets/icons/categories/${cat.icon}" alt="${cat.name}" />
          </div>
          <span class="category-name">${cat.name}</span>
        </div>
      `
      )
      .join('');

    let orgsHtml = '';
    if (!orgs || orgs.length === 0) {
      orgsHtml = `
        <div class="empty-state" style="padding:24px 12px;background:#FFFFFF;border-radius:12px;border:1px solid #E2E8F0;">
          <div class="empty-icon-box" style="width:48px;height:48px;margin-bottom:12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v4m4-4v4m4-4v4" />
            </svg>
          </div>
          <div class="empty-title" style="font-size:14px;">No organizations available yet</div>
          <div class="empty-description" style="font-size:12px;margin-bottom:0;">
            Organizations will appear here dynamically as admins register and configure services.
          </div>
        </div>
      `;
    } else {
      orgsHtml = orgs
        .map((org) => {
          const orgServices = OrdexaStorage.Services.getByOrg(org.id);
          const orgCounters = OrdexaStorage.Counters.getByOrg(org.id);
          return `
            <div class="card card-clickable" onclick="OrdexaNav.navigate('organization', { id: '${org.id}' })">
              <div class="card-header">
                <div>
                  <h3 class="card-title">${OrdexaUtils.escapeHtml(org.name)}</h3>
                  <p style="font-size:12px;color:#64748B;">
                    ${OrdexaUtils.escapeHtml(org.city || '')}${org.state ? ', ' + OrdexaUtils.escapeHtml(org.state) : ''}
                  </p>
                </div>
                <span class="badge badge-category">${OrdexaUtils.escapeHtml(org.category)}</span>
              </div>
              <p style="font-size:12px;color:#475569;margin-bottom:10px;line-height:1.4;">
                ${OrdexaUtils.escapeHtml(org.description || 'Configured real-time queue location.')}
              </p>
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748B;padding-top:8px;border-top:1px solid #E2E8F0;">
                <span>${orgServices.length} Services • ${orgCounters.length} Counters</span>
                <span style="color:#2563EB;font-weight:600;">View &rarr;</span>
              </div>
            </div>
          `;
        })
        .join('');
    }

    container.innerHTML = `
      <div class="hero-section">
        <h1 class="hero-title">Find your queue.<br />Skip the wait.</h1>
        <p class="hero-subtitle">Find a service, join the queue remotely and know when it's actually your turn.</p>

        ${activeBannerHtml}

        <div class="search-bar-wrapper">
          <span class="search-icon-pos">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            class="search-input"
            id="home-search-input"
            placeholder="Search organizations or services..."
            onkeydown="if(event.key === 'Enter') OrdexaNav.navigate('explore', { query: this.value })"
          />
        </div>

        <div class="quick-actions-grid">
          <div class="quick-action-card" onclick="OrdexaNav.navigate('explore')">
            <div class="quick-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
            <div>
              <div class="quick-action-label">Explore</div>
              <div class="quick-action-desc">All organizations</div>
            </div>
          </div>

          <div class="quick-action-card" onclick="OrdexaNav.navigate('qr-scanner')">
            <div class="quick-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div>
              <div class="quick-action-label">Scan QR</div>
              <div class="quick-action-desc">Direct queue join</div>
            </div>
          </div>
        </div>

        <div class="section-header">
          <h2 class="section-title">Browse by category</h2>
          <a href="#explore" class="section-link">View all</a>
        </div>
        <div class="categories-grid">
          ${categoriesHtml}
        </div>

        <div class="section-header">
          <h2 class="section-title">Organizations</h2>
        </div>
        <div id="home-orgs-list">
          ${orgsHtml}
        </div>
      </div>
    `;
  }
};
