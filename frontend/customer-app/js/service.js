/**
 * ORDEXA Customer Service Page Controller
 */

const OrdexaCustomerService = {
  async render(container, serviceId) {
    if (!serviceId) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">Service not found</div>
          <button class="btn btn-primary btn-sm" onclick="OrdexaNav.navigate('explore')">Explore Services</button>
        </div>
      `;
      return;
    }

    const service = await OrdexaAPI.services.getById(serviceId);
    if (!service) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">Service not found</div>
          <button class="btn btn-primary btn-sm" onclick="OrdexaNav.navigate('explore')">Explore Services</button>
        </div>
      `;
      return;
    }

    const org = await OrdexaAPI.organizations.getById(service.organizationId);
    const orgCounters = await OrdexaAPI.counters.getByOrganization(service.organizationId);
    const assignedCounters = orgCounters.filter(
      (c) => !c.assignedServiceIds || c.assignedServiceIds.length === 0 || c.assignedServiceIds.includes(service.id)
    );

    const entries = OrdexaStorage.Queues.getEntriesByService(service.id);
    const waitingEntries = entries.filter((e) => ['WAITING', 'CALLED'].includes(e.status));
    const servingEntry = entries.find((e) => e.status === 'SERVING');
    const calledEntry = entries.find((e) => e.status === 'CALLED');

    const waitingCount = waitingEntries.length;
    const estWaitMinutes = waitingCount * (service.avgServiceTime || 10);

    const currentlyServingDisplay = servingEntry ? servingEntry.token : (calledEntry ? calledEntry.token : 'None');

    const countersText = assignedCounters.length > 0
      ? assignedCounters.map((c) => c.name).join(', ')
      : 'All available counters';

    container.innerHTML = `
      <div style="margin-bottom:80px;">
        <button class="btn btn-secondary btn-sm" style="width:auto;margin-bottom:12px;" onclick="OrdexaNav.navigate('organization', { id: '${org.id}' })">
          &larr; Back to ${OrdexaUtils.escapeHtml(org.name)}
        </button>

        <div class="service-header-hero">
          <div class="service-org-subtitle">${OrdexaUtils.escapeHtml(org.name)}</div>
          <h1 class="service-title">${OrdexaUtils.escapeHtml(service.name)}</h1>
          <p style="font-size:13px;color:#475569;margin-bottom:12px;line-height:1.4;">
            ${OrdexaUtils.escapeHtml(service.description || 'Configured real-time queue service.')}
          </p>
          <div style="font-size:12px;color:#64748B;">
            <strong>Assigned Counters:</strong> ${OrdexaUtils.escapeHtml(countersText)}
          </div>
        </div>

        <div class="section-header">
          <h2 class="section-title">Live Queue Status</h2>
        </div>
        <div class="queue-stats-matrix">
          <div class="stat-box">
            <div class="stat-box-val" style="color:#2563EB;">${currentlyServingDisplay}</div>
            <div class="stat-box-label">Currently Serving</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">${waitingCount}</div>
            <div class="stat-box-label">People Waiting</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val">${service.avgServiceTime}m</div>
            <div class="stat-box-label">Avg. Service Time</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-val" style="color:#0284C7;">~${estWaitMinutes}m</div>
            <div class="stat-box-label">Est. Waiting Time</div>
          </div>
        </div>

        <!-- Historical Wait Times SVG Trend Line Visualization -->
        ${typeof OrdexaWaitTimeChart !== 'undefined' ? OrdexaWaitTimeChart.render(service.id, 'today') : ''}

        <div class="notice-box">
          <div class="notice-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Before you join
          </div>
          <ul class="notice-list">
            <li>Keep all required identity and service documents ready.</li>
            <li>Online and walk-in customers follow the same fair chronological queue.</li>
            <li>Estimated waiting time is approximate and updates as counters process tickets.</li>
            <li>You will receive live token updates on this device when your turn approaches.</li>
          </ul>
        </div>
      </div>

      <div class="sticky-bottom-action" style="display:flex;gap:10px;">
        ${
          service.queueEnabled
            ? `
              <button class="btn btn-primary" style="flex:1;" onclick="OrdexaNav.navigate('join-queue', { serviceId: '${service.id}', mode: 'queue' })">
                Join Live Queue
              </button>
              <button class="btn btn-secondary" style="flex:1;background:#EEF2FF;color:#4F46E5;border-color:#C7D2FE;" onclick="OrdexaNav.navigate('join-queue', { serviceId: '${service.id}', mode: 'appointment' })">
                Book Appointment
              </button>
            `
            : `<button class="btn btn-secondary" disabled>Queue Currently Unavailable</button>`
        }
      </div>
    `;
  }
};
