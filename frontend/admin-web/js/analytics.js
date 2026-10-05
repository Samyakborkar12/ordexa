/**
 * ORDEXA Admin Analytics Controller
 */

const OrdexaAdminAnalytics = {
  async render(container, orgId) {
    const stats = await OrdexaAPI.admin.getAnalytics(orgId);
    const services = await OrdexaAPI.services.getByOrganization(orgId);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Queue Performance Analytics</h1>
          <p class="page-subtitle">Real-time throughput metrics, wait durations and service distribution</p>
        </div>
      </div>

      <!-- Overview Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">Served Today</div>
            <div class="stat-value" style="color:#16A34A;">${stats.servedToday}</div>
            <div class="stat-sub">Completed transactions</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">Currently Waiting</div>
            <div class="stat-value" style="color:#2563EB;">${stats.waitingCustomers}</div>
            <div class="stat-sub">Across all counters</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">Avg. Turnaround Time</div>
            <div class="stat-value">${stats.averageWaitMinutes} <span style="font-size:1rem;font-weight:600;">min</span></div>
            <div class="stat-sub">Computed from actual arrivals</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">Operational Counters</div>
            <div class="stat-value">${stats.openCounters} / ${stats.totalCounters}</div>
            <div class="stat-sub">Active stations</div>
          </div>
        </div>
      </div>

      <!-- Service Volume Distribution Chart -->
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Customer Distribution by Service</h3>
          <span style="font-size:12px;color:#64748B;">Live counts</span>
        </div>

        ${
          services.length === 0
            ? `<div class="empty-state" style="border:none;padding:30px;"><p class="empty-desc">No services configured yet.</p></div>`
            : `
            <div class="bars-container">
              ${stats.serviceStats
                .map((s) => {
                  const maxVal = Math.max(1, ...stats.serviceStats.map((x) => x.waiting + x.served));
                  const total = s.waiting + s.served;
                  const heightPercent = Math.max(8, Math.round((total / maxVal) * 100));
                  return `
                    <div class="bar-column">
                      <span style="font-size:11px;font-weight:700;color:#2563EB;margin-bottom:6px;">${total}</span>
                      <div class="bar-fill" style="height:${heightPercent}%;"></div>
                      <span class="bar-label">${OrdexaAdminUtils.escapeHtml(s.name.substring(0, 14))}</span>
                    </div>
                  `;
                })
                .join('')}
            </div>
            <div style="display:flex;justify-content:center;gap:20px;margin-top:16px;font-size:12px;color:#64748B;">
              <span style="display:flex;align-items:center;gap:6px;">
                <span style="width:10px;height:10px;background:#2563EB;border-radius:2px;"></span>
                Total Customers (Waiting + Completed)
              </span>
            </div>
          `
        }
      </div>
    `;
  }
};
