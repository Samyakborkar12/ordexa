/**
 * ORDEXA Customer Organization Page Controller
 */

const OrdexaCustomerOrg = {
  async render(container, orgId) {
    if (!orgId) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">Organization not found</div>
          <button class="btn btn-primary btn-sm" onclick="OrdexaNav.navigate('explore')">Back to Explore</button>
        </div>
      `;
      return;
    }

    const org = await OrdexaAPI.organizations.getById(orgId);
    if (!org) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">Organization not found</div>
          <p class="empty-description">The requested organization does not exist or was removed.</p>
          <button class="btn btn-primary btn-sm" onclick="OrdexaNav.navigate('explore')">Back to Explore</button>
        </div>
      `;
      return;
    }

    const services = await OrdexaAPI.services.getByOrganization(orgId);
    const counters = await OrdexaAPI.counters.getByOrganization(orgId);

    // Available counters strip
    let countersHtml = '';
    if (counters.length === 0) {
      countersHtml = `<p style="font-size:12px;color:#94A3B8;font-style:italic;">No counters configured for this organization.</p>`;
    } else {
      countersHtml = `
        <div class="counters-strip">
          ${counters
            .map(
              (cnt) => `
              <div class="counter-chip">
                <span class="counter-status-dot ${cnt.status === 'OPEN' ? 'open' : 'closed'}"></span>
                <span style="font-weight:600;color:#0F172A;">${OrdexaUtils.escapeHtml(cnt.name)}</span>
                <span style="font-size:10px;color:#64748B;">(${cnt.status})</span>
              </div>
            `
            )
            .join('')}
        </div>
      `;
    }

    // Services list
    let servicesHtml = '';
    if (services.length === 0) {
      servicesHtml = `
        <div class="empty-state" style="padding:24px 12px;background:#FFFFFF;border-radius:12px;border:1px solid #E2E8F0;">
          <div class="empty-title" style="font-size:14px;">No services configured</div>
          <p class="empty-description" style="font-size:12px;">This organization has not added any services yet.</p>
        </div>
      `;
    } else {
      servicesHtml = `
        <div class="service-list">
          ${services
            .map((srv) => {
              const entries = OrdexaStorage.Queues.getEntriesByService(srv.id);
              const waiting = entries.filter((e) => ['WAITING', 'CALLED'].includes(e.status)).length;
              return `
                <div class="service-card" onclick="OrdexaNav.navigate('service', { id: '${srv.id}' })">
                  <div class="service-info">
                    <h4 class="service-name">${OrdexaUtils.escapeHtml(srv.name)}</h4>
                    <div class="service-meta">
                      ${srv.avgServiceTime} mins avg • Prefix [${srv.prefix || 'Q'}]
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:14px;font-weight:800;color:${srv.queueEnabled ? '#2563EB' : '#94A3B8'};">
                      ${srv.queueEnabled ? `${waiting} Waiting` : 'Disabled'}
                    </div>
                    <span style="font-size:11px;color:#2563EB;font-weight:600;">Details &rarr;</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <div style="margin-bottom:16px;">
        <button class="btn btn-secondary btn-sm" style="width:auto;margin-bottom:12px;" onclick="OrdexaNav.navigate('explore')">
          &larr; Back to Explore
        </button>

        <div class="org-profile-card">
          <div class="org-profile-header">
            <h1 class="org-profile-title">${OrdexaUtils.escapeHtml(org.name)}</h1>
            <div class="org-badge-row">
              <span class="badge badge-category">${OrdexaUtils.escapeHtml(org.category)}</span>
              <span class="badge badge-completed">Verified Active</span>
            </div>
            <p class="org-desc">${OrdexaUtils.escapeHtml(org.description || 'Configured real-time queue location.')}</p>
          </div>

          <div class="org-contact-details">
            <div><strong>Location:</strong> ${OrdexaUtils.escapeHtml(org.address ? org.address + ', ' : '')}${OrdexaUtils.escapeHtml(org.city || '')}${org.state ? ', ' + OrdexaUtils.escapeHtml(org.state) : ''}</div>
            ${org.contactNumber ? `<div><strong>Phone:</strong> ${OrdexaUtils.escapeHtml(org.contactNumber)}</div>` : ''}
          </div>
        </div>

        <div class="section-header">
          <h2 class="section-title">Available Counters</h2>
        </div>
        ${countersHtml}

        <div class="section-header" style="margin-top:20px;">
          <h2 class="section-title">Select a Service</h2>
        </div>
        ${servicesHtml}
      </div>
    `;
  }
};
