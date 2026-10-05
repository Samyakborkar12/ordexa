/**
 * ORDEXA Admin Dashboard Controller
 */

const OrdexaAdminDashboard = {
  async render(container, orgId) {
    if (!orgId) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="empty-title">No organization profile linked</h3>
          <p class="empty-desc">Please set up your organization to activate the real-time queue management system.</p>
          <button class="btn btn-primary" onclick="OrdexaAdminNav.navigate('organization')">Configure Organization</button>
        </div>
      `;
      return;
    }

    const org = await OrdexaAPI.organizations.getById(orgId);
    const stats = await OrdexaAPI.admin.getAnalytics(orgId);
    const services = await OrdexaAPI.services.getByOrganization(orgId);
    const counters = await OrdexaAPI.counters.getByOrganization(orgId);

    // Compute setup status
    const hasServices = services.length > 0;
    const hasCounters = counters.length > 0;
    const hasAssignments = counters.some((c) => c.assignedServiceIds && c.assignedServiceIds.length > 0);
    const hasActiveQueue = stats.activeQueues > 0;
    const allSetupDone = hasServices && hasCounters && hasAssignments && hasActiveQueue;

    let setupGuideHtml = '';
    if (!allSetupDone) {
      setupGuideHtml = `
        <div class="setup-guide-card">
          <h2 class="setup-guide-title">Welcome to ORDEXA</h2>
          <p class="setup-guide-desc">
            Complete these 4 initial configuration steps to activate live token generation and start receiving customers.
          </p>

          <div class="setup-steps-row">
            <div class="setup-step-box">
              <div class="setup-step-num">${hasServices ? '✓' : '1'}</div>
              <div class="setup-step-name">1. Create Services</div>
              <div class="setup-step-status">${hasServices ? `${services.length} configured` : 'Pending'}</div>
              ${!hasServices ? `<button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="OrdexaAdminNav.navigate('services')">Add Service</button>` : ''}
            </div>

            <div class="setup-step-box">
              <div class="setup-step-num">${hasCounters ? '✓' : '2'}</div>
              <div class="setup-step-name">2. Create Counters</div>
              <div class="setup-step-status">${hasCounters ? `${counters.length} configured` : 'Pending'}</div>
              ${hasServices && !hasCounters ? `<button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="OrdexaAdminNav.navigate('counters')">Add Counter</button>` : ''}
            </div>

            <div class="setup-step-box">
              <div class="setup-step-num">${hasAssignments ? '✓' : '3'}</div>
              <div class="setup-step-name">3. Assign Services</div>
              <div class="setup-step-status">${hasAssignments ? 'Linked' : 'Pending'}</div>
              ${hasCounters && !hasAssignments ? `<button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="OrdexaAdminNav.navigate('counters')">Map Counter</button>` : ''}
            </div>

            <div class="setup-step-box">
              <div class="setup-step-num">${hasActiveQueue ? '✓' : '4'}</div>
              <div class="setup-step-name">4. Open Queues</div>
              <div class="setup-step-status">${hasActiveQueue ? 'Active' : 'Pending'}</div>
              ${hasAssignments && !hasActiveQueue ? `<button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="OrdexaAdminNav.navigate('services')">Enable Queues</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Operations Dashboard</h1>
          <p class="page-subtitle">Real-time status of ${OrdexaAdminUtils.escapeHtml(org ? org.name : 'Organization')}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="OrdexaAdminNav.navigate('walk-ins')">
            + Walk-in Customer
          </button>
          <button class="btn btn-primary btn-sm" onclick="OrdexaAdminNav.navigate('queue')">
            Open Queue Console &rarr;
          </button>
        </div>
      </div>

      ${setupGuideHtml}

      <!-- Dynamic Stat Matrix - Zero Fake Data -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">Active Queues</div>
            <div class="stat-value">${stats.activeQueues}</div>
            <div class="stat-sub">${stats.totalServices} total services</div>
          </div>
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">Waiting Customers</div>
            <div class="stat-value" style="color:#2563EB;">${stats.waitingCustomers}</div>
            <div class="stat-sub">Across all active queues</div>
          </div>
          <div class="stat-icon" style="background:#EFF6FF;color:#2563EB;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">Served Today</div>
            <div class="stat-value" style="color:#16A34A;">${stats.servedToday}</div>
            <div class="stat-sub">Completed tokens</div>
          </div>
          <div class="stat-icon" style="background:#F0FDF4;color:#16A34A;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">Average Wait</div>
            <div class="stat-value">${stats.averageWaitMinutes} <span style="font-size:1rem;font-weight:600;">min</span></div>
            <div class="stat-sub">${stats.openCounters} open counters</div>
          </div>
          <div class="stat-icon" style="background:#FEF3C7;color:#D97706;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Quick Operational Action Row -->
      <div class="dashboard-columns">
        <!-- Left: Service Queue Status Table -->
        <div class="table-card">
          <div class="table-header-bar">
            <h3 class="table-title">Service Queue Status</h3>
            <button class="btn btn-secondary btn-sm" onclick="OrdexaAdminNav.navigate('services')">Manage Services</button>
          </div>
          ${
            services.length === 0
              ? `
              <div class="empty-state" style="border:none;padding:36px;">
                <p class="empty-desc" style="margin-bottom:12px;">No services configured yet.</p>
                <button class="btn btn-primary btn-sm" onclick="OrdexaAdminNav.navigate('services')">+ Add Your First Service</button>
              </div>
            `
              : `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Prefix</th>
                    <th>Waiting</th>
                    <th>Served Today</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${services
                    .map((s) => {
                      const stat = stats.serviceStats.find((st) => st.serviceId === s.id) || { waiting: 0, served: 0 };
                      return `
                        <tr>
                          <td style="font-weight:600;">${OrdexaAdminUtils.escapeHtml(s.name)}</td>
                          <td><code>${s.prefix || 'Q'}</code></td>
                          <td style="font-weight:700;color:#2563EB;">${stat.waiting}</td>
                          <td>${stat.served}</td>
                          <td>
                            <span class="badge ${s.queueEnabled ? 'badge-serving' : 'badge-skipped'}">
                              ${s.queueEnabled ? 'Queue Active' : 'Disabled'}
                            </span>
                          </td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>
            `
          }
        </div>

        <!-- Right: Counter Overview -->
        <div class="table-card">
          <div class="table-header-bar">
            <h3 class="table-title">Live Counters</h3>
            <button class="btn btn-secondary btn-sm" onclick="OrdexaAdminNav.navigate('counters')">Counters</button>
          </div>
          ${
            counters.length === 0
              ? `
              <div class="empty-state" style="border:none;padding:36px;">
                <p class="empty-desc" style="margin-bottom:12px;">No counters created yet.</p>
                <button class="btn btn-primary btn-sm" onclick="OrdexaAdminNav.navigate('counters')">+ Add Counter</button>
              </div>
            `
              : `
              <div style="padding:16px;display:flex;flex-direction:column;gap:10px;">
                ${counters
                  .map((cnt) => {
                    const servingEntry = cnt.currentServingEntryId
                      ? OrdexaStorage.Queues.getEntryById(cnt.currentServingEntryId)
                      : null;
                    return `
                      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                          <div style="font-weight:700;color:#0F172A;">${OrdexaAdminUtils.escapeHtml(cnt.name)}</div>
                          <div style="font-size:11px;color:#64748B;">
                            Serving: <strong style="color:#2563EB;">${servingEntry ? servingEntry.token : 'None'}</strong>
                          </div>
                        </div>
                        <span class="badge ${cnt.status === 'OPEN' ? 'badge-serving' : 'badge-skipped'}">${cnt.status}</span>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `
          }
        </div>
      </div>
    `;
  }
};
