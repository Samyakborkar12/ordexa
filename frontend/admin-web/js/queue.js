/**
 * ORDEXA Admin Live Queue Console Controller
 */

const OrdexaAdminQueue = {
  activeUnsubscribe: null,
  selectedCounterId: null,

  async render(container, orgId) {
    if (this.activeUnsubscribe) {
      this.activeUnsubscribe();
      this.activeUnsubscribe = null;
    }

    const counters = await OrdexaAPI.counters.getByOrganization(orgId);
    if (counters.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
            </svg>
          </div>
          <h3 class="empty-title">No counters configured</h3>
          <p class="empty-desc">You need at least one counter to call and serve queue entries.</p>
          <button class="btn btn-primary" onclick="OrdexaAdminNav.navigate('counters')">Create First Counter</button>
        </div>
      `;
      return;
    }

    // Default to first open counter or first counter
    if (!this.selectedCounterId || !counters.find((c) => c.id === this.selectedCounterId)) {
      const openCounter = counters.find((c) => c.status === 'OPEN');
      this.selectedCounterId = openCounter ? openCounter.id : counters[0].id;
    }

    const refreshConsole = () => {
      const selectedCounter = counters.find((c) => c.id === this.selectedCounterId) || counters[0];
      const allEntries = OrdexaStorage.Queues.getEntriesByOrg(orgId);

      // Filter entries relevant to current counter (or all org services if none mapped)
      const assignedServiceIds = selectedCounter.assignedServiceIds || [];

      const waitingEntries = allEntries
        .filter((e) => {
          if (e.status !== 'WAITING') return false;
          if (assignedServiceIds.length > 0) return assignedServiceIds.includes(e.serviceId);
          return true;
        })
        .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

      const activeCounterEntry = selectedCounter.currentServingEntryId
        ? allEntries.find((e) => e.id === selectedCounter.currentServingEntryId)
        : null;

      const calledOrServingEntries = allEntries.filter(
        (e) => ['CALLED', 'SERVING'].includes(e.status) && e.counterId === selectedCounter.id
      );

      const holdEntries = allEntries.filter((e) => e.status === 'HOLD');

      container.innerHTML = `
        <div class="page-header" style="margin-bottom:16px;">
          <div>
            <h1 class="page-title">Live Queue Console</h1>
            <p class="page-subtitle">Real-time caller and queue orchestration board</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="OrdexaAdminNav.navigate('walk-ins')">
              + Issue Walk-in Token
            </button>
          </div>
        </div>

        <!-- Counter Selector Bar -->
        <div class="queue-console-header">
          <div class="counter-selector-panel">
            <label style="font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;">Active Counter:</label>
            <select
              id="active-counter-select"
              class="form-select"
              style="width:auto;min-width:200px;"
              onchange="OrdexaAdminQueue.switchCounter(this.value, '${orgId}')"
            >
              ${counters
                .map(
                  (c) => `
                  <option value="${c.id}" ${c.id === selectedCounter.id ? 'selected' : ''}>
                    ${OrdexaAdminUtils.escapeHtml(c.name)} (${c.status})
                  </option>
                `
                )
                .join('')}
            </select>
            <span class="badge ${selectedCounter.status === 'OPEN' ? 'badge-serving' : 'badge-skipped'}">
              ${selectedCounter.status}
            </span>
          </div>

          <div style="display:flex;gap:10px;">
            <button
              class="btn btn-primary"
              id="call-next-btn"
              onclick="OrdexaAdminQueue.callNext('${selectedCounter.id}', '${orgId}')"
              ${selectedCounter.status === 'CLOSED' ? 'disabled' : ''}
              style="padding:10px 20px;font-size:15px;"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              CALL NEXT
            </button>
          </div>
        </div>

        <!-- Current Counter Serving Banner -->
        ${
          activeCounterEntry && ['CALLED', 'SERVING'].includes(activeCounterEntry.status)
            ? `
            <div class="serving-banner">
              <div class="serving-token-display">
                <div class="serving-huge-token">${OrdexaAdminUtils.escapeHtml(activeCounterEntry.token)}</div>
                <div class="serving-details">
                  <div class="serving-customer-name">${OrdexaAdminUtils.escapeHtml(activeCounterEntry.customerName)}</div>
                  <div class="serving-meta">
                    Service: <strong>${OrdexaAdminUtils.escapeHtml(activeCounterEntry.serviceName)}</strong> • 
                    Status: <span class="badge ${activeCounterEntry.status === 'CALLED' ? 'badge-called' : 'badge-serving'}">${activeCounterEntry.status}</span> •
                    ${activeCounterEntry.isWalkIn ? '<span style="color:#38BDF8;">Walk-in</span>' : '<span style="color:#A7F3D0;">Online Customer</span>'}
                  </div>
                </div>
              </div>

              <div class="operator-actions-group">
                ${
                  activeCounterEntry.status === 'CALLED'
                    ? `
                    <button class="btn btn-primary btn-sm" onclick="OrdexaAdminQueue.startServing('${activeCounterEntry.id}')">
                      Start Serving
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="OrdexaAdminQueue.recall('${activeCounterEntry.id}')">
                      Recall Alert
                    </button>
                  `
                    : ''
                }
                <button class="btn btn-warning btn-sm" onclick="OrdexaAdminQueue.hold('${activeCounterEntry.id}')">
                  Put On Hold
                </button>
                <button class="btn btn-secondary btn-sm" onclick="OrdexaAdminQueue.skip('${activeCounterEntry.id}')">
                  Skip
                </button>
                <button class="btn btn-success btn-sm" style="background:#16A34A;color:#FFFFFF;" onclick="OrdexaAdminQueue.complete('${activeCounterEntry.id}')">
                  ✓ Complete Service
                </button>
              </div>
            </div>
          `
            : `
            <div style="background:#FFFFFF;border:1px dashed #CBD5E1;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;color:#64748B;">
              No customer currently active at <strong>${OrdexaAdminUtils.escapeHtml(selectedCounter.name)}</strong>. Tap <strong>CALL NEXT</strong> to summon the next customer.
            </div>
          `
        }

        <!-- 3-Column Queue Board -->
        <div class="queue-board-grid">
          <!-- Column 1: Waiting -->
          <div class="queue-column">
            <div class="queue-column-header">
              <div class="queue-column-title">
                <span style="width:8px;height:8px;border-radius:50%;background:#F59E0B;"></span>
                Waiting (${waitingEntries.length})
              </div>
            </div>
            <div class="queue-column-body">
              ${
                waitingEntries.length === 0
                  ? `<div style="text-align:center;padding:24px;color:#94A3B8;font-size:12px;">No customers in this queue</div>`
                  : waitingEntries
                      .map(
                        (e, idx) => `
                        <div class="queue-ticket-card">
                          <div class="queue-ticket-top">
                            <span class="queue-ticket-token">${OrdexaAdminUtils.escapeHtml(e.token)}</span>
                            <span style="font-size:11px;font-weight:700;color:#64748B;">#${idx + 1} in line</span>
                          </div>
                          <div class="queue-ticket-name">${OrdexaAdminUtils.escapeHtml(e.customerName)}</div>
                          <div class="queue-ticket-meta">
                            ${OrdexaAdminUtils.escapeHtml(e.serviceName)} • Joined ${OrdexaAdminUtils.timeAgo(e.joinedAt)}
                          </div>
                        </div>
                      `
                      )
                      .join('')
              }
            </div>
          </div>

          <!-- Column 2: Called / In Service -->
          <div class="queue-column">
            <div class="queue-column-header">
              <div class="queue-column-title">
                <span style="width:8px;height:8px;border-radius:50%;background:#2563EB;"></span>
                Active at Counters (${calledOrServingEntries.length})
              </div>
            </div>
            <div class="queue-column-body">
              ${
                calledOrServingEntries.length === 0
                  ? `<div style="text-align:center;padding:24px;color:#94A3B8;font-size:12px;">No active tickets</div>`
                  : calledOrServingEntries
                      .map(
                        (e) => `
                        <div class="queue-ticket-card" style="border-left:3px solid #2563EB;">
                          <div class="queue-ticket-top">
                            <span class="queue-ticket-token">${OrdexaAdminUtils.escapeHtml(e.token)}</span>
                            <span class="badge ${e.status === 'CALLED' ? 'badge-called' : 'badge-serving'}">${e.status}</span>
                          </div>
                          <div class="queue-ticket-name">${OrdexaAdminUtils.escapeHtml(e.customerName)}</div>
                          <div class="queue-ticket-meta">${OrdexaAdminUtils.escapeHtml(e.serviceName)} • At ${OrdexaAdminUtils.escapeHtml(e.counterName || 'Counter')}</div>
                          <div class="queue-ticket-actions">
                            <button class="btn btn-sm btn-secondary" onclick="OrdexaAdminQueue.recall('${e.id}')">Recall</button>
                            <button class="btn btn-sm btn-warning" onclick="OrdexaAdminQueue.hold('${e.id}')">Hold</button>
                            <button class="btn btn-sm btn-primary" onclick="OrdexaAdminQueue.complete('${e.id}')">Done</button>
                          </div>
                        </div>
                      `
                      )
                      .join('')
              }
            </div>
          </div>

          <!-- Column 3: On Hold -->
          <div class="queue-column">
            <div class="queue-column-header">
              <div class="queue-column-title">
                <span style="width:8px;height:8px;border-radius:50%;background:#EA580C;"></span>
                On Hold (${holdEntries.length})
              </div>
            </div>
            <div class="queue-column-body">
              ${
                holdEntries.length === 0
                  ? `<div style="text-align:center;padding:24px;color:#94A3B8;font-size:12px;">No held entries</div>`
                  : holdEntries
                      .map(
                        (e) => `
                        <div class="queue-ticket-card" style="border-left:3px solid #EA580C;">
                          <div class="queue-ticket-top">
                            <span class="queue-ticket-token">${OrdexaAdminUtils.escapeHtml(e.token)}</span>
                            <span class="badge badge-hold">HOLD</span>
                          </div>
                          <div class="queue-ticket-name">${OrdexaAdminUtils.escapeHtml(e.customerName)}</div>
                          <div class="queue-ticket-meta">${OrdexaAdminUtils.escapeHtml(e.serviceName)}</div>
                          <div class="queue-ticket-actions">
                            <button class="btn btn-sm btn-primary" onclick="OrdexaAdminQueue.rejoin('${e.id}')">Resume / Rejoin</button>
                            <button class="btn btn-sm btn-secondary" onclick="OrdexaAdminQueue.skip('${e.id}')">Skip</button>
                          </div>
                        </div>
                      `
                      )
                      .join('')
              }
            </div>
          </div>
        </div>
      `;
    };

    // Initial render
    refreshConsole();

    // Subscribe to real-time events
    this.activeUnsubscribe = OrdexaRealtime.subscribe('queue_updated', () => {
      refreshConsole();
    });
  },

  switchCounter(counterId, orgId) {
    this.selectedCounterId = counterId;
    this.render(document.getElementById('admin-main-view'), orgId);
  },

  async callNext(counterId, orgId) {
    try {
      const entry = await OrdexaAPI.admin.callNext(counterId, orgId);
      if (!entry) {
        OrdexaAdminUtils.showToast('No waiting customers in this queue.');
      } else {
        OrdexaAdminUtils.showToast(`Called Token ${entry.token} for ${entry.customerName}`);
      }
    } catch (err) {
      OrdexaAdminUtils.showToast(err.message || 'Error calling next', 'error');
    }
  },

  async startServing(entryId) {
    try {
      await OrdexaAPI.admin.startServing(entryId);
      OrdexaAdminUtils.showToast('Service started');
    } catch (err) {
      OrdexaAdminUtils.showToast(err.message, 'error');
    }
  },

  async recall(entryId) {
    try {
      await OrdexaAPI.admin.recall(entryId);
      OrdexaAdminUtils.showToast('Recall notification dispatched');
    } catch (err) {
      OrdexaAdminUtils.showToast(err.message, 'error');
    }
  },

  async hold(entryId) {
    try {
      await OrdexaAPI.admin.hold(entryId);
      OrdexaAdminUtils.showToast('Entry moved to hold');
    } catch (err) {
      OrdexaAdminUtils.showToast(err.message, 'error');
    }
  },

  async rejoin(entryId) {
    try {
      await OrdexaAPI.queues.rejoin(entryId);
      OrdexaAdminUtils.showToast('Entry resumed back into waiting line');
    } catch (err) {
      OrdexaAdminUtils.showToast(err.message, 'error');
    }
  },

  async skip(entryId) {
    try {
      await OrdexaAPI.admin.skip(entryId);
      OrdexaAdminUtils.showToast('Entry skipped');
    } catch (err) {
      OrdexaAdminUtils.showToast(err.message, 'error');
    }
  },

  async complete(entryId) {
    try {
      await OrdexaAPI.admin.complete(entryId);
      OrdexaAdminUtils.showToast('Customer service marked completed');
    } catch (err) {
      OrdexaAdminUtils.showToast(err.message, 'error');
    }
  }
};
