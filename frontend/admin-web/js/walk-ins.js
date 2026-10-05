/**
 * ORDEXA Admin Walk-ins Controller
 */

const OrdexaAdminWalkIns = {
  async render(container, orgId) {
    const services = await OrdexaAPI.services.getByOrganization(orgId);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Issue Walk-in Ticket</h1>
          <p class="page-subtitle">Add in-person kiosk and reception visitors directly into the queue</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:24px;">
        <div class="card" style="padding:28px;">
          <h3 style="font-size:16px;font-weight:700;color:#0B132B;margin-bottom:16px;">New Walk-in Customer</h3>

          ${
            services.length === 0
              ? `
              <div class="empty-state" style="border:none;padding:20px;">
                <p class="empty-desc">You need at least one service configured to issue walk-in tickets.</p>
                <button class="btn btn-primary btn-sm" onclick="OrdexaAdminNav.navigate('services')">Create Service First</button>
              </div>
            `
              : `
              <form id="walk-in-form">
                <div class="form-group">
                  <label class="form-label">Select Service</label>
                  <select id="wi-service" class="form-select" required>
                    ${services
                      .map(
                        (s) => `
                        <option value="${s.id}" ${!s.queueEnabled ? 'disabled' : ''}>
                          ${OrdexaAdminUtils.escapeHtml(s.name)} (Prefix: ${s.prefix || 'Q'}${!s.queueEnabled ? ' - Disabled' : ''})
                        </option>
                      `
                      )
                      .join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Customer / Guest Name</label>
                  <input type="text" id="wi-name" class="form-input" placeholder="e.g. Robert Smith or Guest 101" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Mobile Number (Optional)</label>
                  <input type="tel" id="wi-mobile" class="form-input" placeholder="+1 555 204 1928" />
                </div>

                <button type="submit" class="btn btn-primary" id="wi-submit-btn" style="width:100%;margin-top:8px;">
                  Generate & Issue Walk-in Token
                </button>
              </form>
            `
          }
        </div>

        <!-- Right Side: Ticket Preview & Recent Walk-ins -->
        <div class="card" style="padding:24px;">
          <h3 style="font-size:15px;font-weight:700;color:#0B132B;margin-bottom:16px;">Recent Walk-in Passes</h3>
          <div id="recent-walk-ins-list">
            <!-- Filled dynamically -->
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('walk-in-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('wi-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Printing Token...';

        const serviceId = document.getElementById('wi-service').value;
        const customerName = document.getElementById('wi-name').value.trim();
        const customerMobile = document.getElementById('wi-mobile').value.trim();

        try {
          const entry = await OrdexaAPI.queues.join({
            customerId: null,
            customerName,
            customerMobile,
            serviceId,
            orgId,
            isWalkIn: true
          });

          OrdexaAdminUtils.showToast(`Token ${entry.token} issued to ${entry.customerName}!`);
          document.getElementById('wi-name').value = '';
          document.getElementById('wi-mobile').value = '';
          OrdexaAdminWalkIns.loadRecent(orgId);
        } catch (err) {
          OrdexaAdminUtils.showToast(err.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Generate & Issue Walk-in Token';
        }
      };
    }

    this.loadRecent(orgId);
  },

  loadRecent(orgId) {
    const listContainer = document.getElementById('recent-walk-ins-list');
    if (!listContainer) return;

    const entries = OrdexaStorage.Queues.getEntriesByOrg(orgId)
      .filter((e) => e.isWalkIn)
      .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
      .slice(0, 5);

    if (entries.length === 0) {
      listContainer.innerHTML = `<p style="font-size:12px;color:#94A3B8;font-style:italic;">No walk-in tickets issued today.</p>`;
      return;
    }

    listContainer.innerHTML = entries
      .map(
        (e) => `
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:16px;font-weight:800;color:#0B132B;">${OrdexaAdminUtils.escapeHtml(e.token)}</div>
            <div style="font-size:12px;color:#64748B;">${OrdexaAdminUtils.escapeHtml(e.customerName)} • ${OrdexaAdminUtils.escapeHtml(e.serviceName)}</div>
          </div>
          ${OrdexaAdminUtils.getStatusBadge(e.status)}
        </div>
      `
      )
      .join('');
  }
};
