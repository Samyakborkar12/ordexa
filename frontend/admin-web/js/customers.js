/**
 * ORDEXA Admin Queue Customers / Records Controller
 */

const OrdexaAdminCustomers = {
  async render(container, orgId) {
    const entries = OrdexaStorage.Queues.getEntriesByOrg(orgId)
      .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Queue Records & Customers</h1>
          <p class="page-subtitle">Complete chronological history of customer visits and queue transactions</p>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header-bar">
          <h3 class="table-title">Customer Queue Activity</h3>
          <span style="font-size:12px;color:#64748B;">Total logged: <strong>${entries.length}</strong></span>
        </div>

        ${
          entries.length === 0
            ? `
            <div class="empty-state" style="border:none;padding:48px;">
              <div class="empty-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <h3 class="empty-title">No customers recorded yet</h3>
              <p class="empty-desc">Tokens and customer visits will appear here in real time as queues operate.</p>
            </div>
          `
            : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Customer Name</th>
                  <th>Type</th>
                  <th>Service</th>
                  <th>Station</th>
                  <th>Time Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${entries
                  .map(
                    (e) => `
                    <tr>
                      <td style="font-weight:800;color:#0B132B;">${OrdexaAdminUtils.escapeHtml(e.token)}</td>
                      <td style="font-weight:600;">${OrdexaAdminUtils.escapeHtml(e.customerName)}</td>
                      <td>
                        <span style="font-size:11px;font-weight:600;color:${e.isWalkIn ? '#0284C7' : '#166534'};">
                          ${e.isWalkIn ? 'Walk-in' : 'Online'}
                        </span>
                      </td>
                      <td>${OrdexaAdminUtils.escapeHtml(e.serviceName)}</td>
                      <td>${OrdexaAdminUtils.escapeHtml(e.counterName || '—')}</td>
                      <td style="font-size:12px;color:#64748B;">
                        ${OrdexaAdminUtils.formatDate(e.joinedAt)} ${OrdexaAdminUtils.formatTime(e.joinedAt)}
                      </td>
                      <td>${OrdexaAdminUtils.getStatusBadge(e.status)}</td>
                    </tr>
                  `
                  )
                  .join('')}
              </tbody>
            </table>
          `
        }
      </div>
    `;
  }
};
