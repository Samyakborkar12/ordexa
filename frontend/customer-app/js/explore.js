/**
 * ORDEXA Customer Explore Controller
 */

const OrdexaCustomerExplore = {
  categories: ['All', 'Healthcare', 'Diagnostic Centre', 'Banking', 'Government', 'RTO', 'Aadhaar Services', 'Education', 'Other'],

  async render(container, params = {}) {
    const selectedCategory = params.category || 'All';
    const searchQuery = (params.query || '').trim().toLowerCase();

    let orgs = await OrdexaAPI.organizations.getAll();

    if (selectedCategory && selectedCategory !== 'All') {
      orgs = orgs.filter((o) => o.category === selectedCategory);
    }

    if (searchQuery) {
      orgs = orgs.filter(
        (o) =>
          o.name.toLowerCase().includes(searchQuery) ||
          (o.city && o.city.toLowerCase().includes(searchQuery)) ||
          (o.category && o.category.toLowerCase().includes(searchQuery))
      );
    }

    const pillsHtml = this.categories
      .map(
        (cat) => `
        <button
          class="filter-pill ${cat === selectedCategory ? 'active' : ''}"
          onclick="OrdexaNav.navigate('explore', { category: '${cat}', query: '${searchQuery}' })"
        >
          ${cat}
        </button>
      `
      )
      .join('');

    let orgsHtml = '';
    if (orgs.length === 0) {
      orgsHtml = `
        <div class="empty-state">
          <div class="empty-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 class="empty-title">No organizations available</h3>
          <p class="empty-description">
            ${
              searchQuery || selectedCategory !== 'All'
                ? 'No organizations match your current search or filter criteria.'
                : 'Organizations will appear here once they start using ORDEXA.'
            }
          </p>
          ${
            searchQuery || selectedCategory !== 'All'
              ? `<button class="btn btn-outline btn-sm" onclick="OrdexaNav.navigate('explore')">Clear Filters</button>`
              : ''
          }
        </div>
      `;
    } else {
      orgsHtml = orgs
        .map((org) => {
          const srvs = OrdexaStorage.Services.getByOrg(org.id);
          const activeSrvs = srvs.filter((s) => s.queueEnabled);
          return `
            <a href="#organization?id=${org.id}" class="org-card">
              <div class="org-card-top">
                <div>
                  <h3 class="org-card-name">${OrdexaUtils.escapeHtml(org.name)}</h3>
                  <div class="org-card-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>${OrdexaUtils.escapeHtml(org.city || 'Location')}${org.state ? ', ' + OrdexaUtils.escapeHtml(org.state) : ''}</span>
                  </div>
                </div>
                <span class="badge badge-category">${OrdexaUtils.escapeHtml(org.category)}</span>
              </div>
              <p style="font-size:12px;color:#475569;margin-bottom:12px;line-height:1.4;">
                ${OrdexaUtils.escapeHtml(org.description || 'Configured real-time queue service provider.')}
              </p>
              <div class="org-card-stats">
                <div class="org-stat-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>${srvs.length} Services</span>
                </div>
                <div class="org-stat-item" style="color:${activeSrvs.length > 0 ? '#166534' : '#64748B'};">
                  <span style="width:6px;height:6px;border-radius:50%;background-color:${activeSrvs.length > 0 ? '#22C55E' : '#94A3B8'};"></span>
                  <span>${activeSrvs.length > 0 ? `${activeSrvs.length} Queues Open` : 'Queues Paused'}</span>
                </div>
              </div>
            </a>
          `;
        })
        .join('');
    }

    container.innerHTML = `
      <div class="explore-header">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <h1 style="font-size:22px;font-weight:800;color:#0B132B;">Explore</h1>
        </div>

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
            placeholder="Search organizations or services..."
            value="${OrdexaUtils.escapeHtml(searchQuery)}"
            onkeydown="if(event.key === 'Enter') OrdexaNav.navigate('explore', { category: '${selectedCategory}', query: this.value })"
          />
        </div>

        <div class="category-filter-scroll">
          ${pillsHtml}
        </div>
      </div>

      <div class="explore-results">
        ${orgsHtml}
      </div>
    `;
  }
};
