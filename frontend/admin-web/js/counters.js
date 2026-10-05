/**
 * ORDEXA Admin Counters Controller
 */

const OrdexaAdminCounters = {
  async render(container, orgId) {
    const counters = await OrdexaAPI.counters.getByOrganization(orgId);
    const services = await OrdexaAPI.services.getByOrganization(orgId);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Counter Configuration</h1>
          <p class="page-subtitle">Configure physical stations, teller windows and map supported services</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="OrdexaAdminCounters.openCreateModal('${orgId}')">
            + Add New Counter
          </button>
        </div>
      </div>

      ${
        counters.length === 0
          ? `
          <div class="empty-state">
            <div class="empty-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h3 class="empty-title">No counters configured</h3>
            <p class="empty-desc">Create physical desks or windows where staff call and serve customers.</p>
            <button class="btn btn-primary" onclick="OrdexaAdminCounters.openCreateModal('${orgId}')">Create First Counter</button>
          </div>
        `
          : `
          <div class="counters-grid">
            ${counters
              .map((cnt) => {
                const assignedNames = services
                  .filter((s) => (cnt.assignedServiceIds || []).includes(s.id))
                  .map((s) => s.name);

                return `
                  <div class="counter-admin-card">
                    <div class="counter-card-header">
                      <div>
                        <h3 class="counter-name-title">${OrdexaAdminUtils.escapeHtml(cnt.name)}</h3>
                        <span style="font-size:11px;color:#64748B;">Station #${cnt.counterNumber || '1'}</span>
                      </div>
                      <span class="badge ${cnt.status === 'OPEN' ? 'badge-serving' : 'badge-skipped'}">
                        ${cnt.status}
                      </span>
                    </div>

                    <div style="font-size:12px;font-weight:600;color:#475569;margin-top:12px;">Assigned Services:</div>
                    <div class="assigned-services-tag-list">
                      ${
                        assignedNames.length === 0
                          ? `<span style="font-size:11px;color:#94A3B8;font-style:italic;">Serving all services (General)</span>`
                          : assignedNames
                              .map(
                                (name) => `
                                <span class="service-mini-tag">${OrdexaAdminUtils.escapeHtml(name)}</span>
                              `
                              )
                              .join('')
                      }
                    </div>

                    <div style="display:flex;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid #E2E8F0;">
                      <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="OrdexaAdminCounters.toggleStatus('${cnt.id}')">
                        ${cnt.status === 'OPEN' ? 'Close Counter' : 'Open Counter'}
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="OrdexaAdminCounters.openEditModal('${cnt.id}', '${orgId}')">
                        Edit
                      </button>
                      <button class="btn btn-danger btn-sm" onclick="OrdexaAdminCounters.deleteCounter('${cnt.id}')">
                        Delete
                      </button>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        `
      }

      <!-- Create / Edit Counter Modal -->
      <div class="modal-overlay" id="counter-modal">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="counter-modal-title">Create Counter</h3>
            <button class="modal-close-btn" onclick="OrdexaAdminUtils.closeModal('counter-modal')">&times;</button>
          </div>
          <form id="counter-modal-form">
            <input type="hidden" id="cnt-edit-id" />
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Counter Name</label>
                <input type="text" id="cnt-name" class="form-input" placeholder="e.g. Counter 1, Window A, OPD Desk" required />
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group">
                  <label class="form-label">Counter Number / ID</label>
                  <input type="text" id="cnt-number" class="form-input" placeholder="1" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Initial Status</label>
                  <select id="cnt-status" class="form-select">
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Assign Supported Services</label>
                <div id="counter-services-checklist" style="display:flex;flex-direction:column;gap:8px;max-height:160px;overflow-y:auto;background:#F8FAFC;padding:12px;border:1px solid #E2E8F0;border-radius:8px;">
                  <!-- Checkboxes injected dynamically -->
                </div>
                <p style="font-size:11px;color:#64748B;margin-top:4px;">If none checked, this counter will handle all services.</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="OrdexaAdminUtils.closeModal('counter-modal')">Cancel</button>
              <button type="submit" class="btn btn-primary" id="cnt-save-btn">Save Counter</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('counter-modal-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('cnt-edit-id').value;
      const name = document.getElementById('cnt-name').value.trim();
      const counterNumber = document.getElementById('cnt-number').value.trim();
      const status = document.getElementById('cnt-status').value;

      // Collect checked services
      const checkboxes = document.querySelectorAll('input[name="cnt-service-box"]:checked');
      const assignedServiceIds = Array.from(checkboxes).map((cb) => cb.value);

      try {
        if (id) {
          await OrdexaAPI.counters.update(id, { name, counterNumber, status, assignedServiceIds });
          OrdexaAdminUtils.showToast('Counter updated');
        } else {
          await OrdexaAPI.counters.create({
            organizationId: orgId,
            name,
            counterNumber,
            status,
            assignedServiceIds
          });
          OrdexaAdminUtils.showToast('Counter created successfully');
        }
        OrdexaAdminUtils.closeModal('counter-modal');
        OrdexaAdminCounters.render(document.getElementById('admin-main-view'), orgId);
      } catch (err) {
        OrdexaAdminUtils.showToast(err.message, 'error');
      }
    };
  },

  async openCreateModal(orgId) {
    document.getElementById('counter-modal-title').innerText = 'Add Counter';
    document.getElementById('cnt-edit-id').value = '';
    document.getElementById('cnt-name').value = '';
    document.getElementById('cnt-number').value = '';
    document.getElementById('cnt-status').value = 'OPEN';

    this.renderServiceCheckboxes(orgId, []);
    OrdexaAdminUtils.openModal('counter-modal');
  },

  async openEditModal(counterId, orgId) {
    const cnt = await OrdexaAPI.counters.getById(counterId);
    if (!cnt) return;

    document.getElementById('counter-modal-title').innerText = 'Edit Counter';
    document.getElementById('cnt-edit-id').value = cnt.id;
    document.getElementById('cnt-name').value = cnt.name;
    document.getElementById('cnt-number').value = cnt.counterNumber || '';
    document.getElementById('cnt-status').value = cnt.status;

    this.renderServiceCheckboxes(orgId, cnt.assignedServiceIds || []);
    OrdexaAdminUtils.openModal('counter-modal');
  },

  async renderServiceCheckboxes(orgId, selectedIds) {
    const list = document.getElementById('counter-services-checklist');
    const services = await OrdexaAPI.services.getByOrganization(orgId);

    if (services.length === 0) {
      list.innerHTML = `<span style="font-size:12px;color:#94A3B8;">No services exist yet. Create a service first.</span>`;
      return;
    }

    list.innerHTML = services
      .map(
        (s) => `
        <label class="form-checkbox-label">
          <input type="checkbox" name="cnt-service-box" value="${s.id}" ${selectedIds.includes(s.id) ? 'checked' : ''} />
          <span>${OrdexaAdminUtils.escapeHtml(s.name)} [${s.prefix || 'Q'}]</span>
        </label>
      `
      )
      .join('');
  },

  async toggleStatus(counterId) {
    const cnt = await OrdexaAPI.counters.getById(counterId);
    if (!cnt) return;
    const newStatus = cnt.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    await OrdexaAPI.counters.update(counterId, { status: newStatus });
    OrdexaAdminUtils.showToast(`Counter status set to ${newStatus}`);
    const u = OrdexaAPI.auth.getCurrentUser();
    OrdexaAdminCounters.render(document.getElementById('admin-main-view'), u.organizationId);
  },

  async deleteCounter(counterId) {
    if (!confirm('Are you sure you want to delete this counter?')) return;
    await OrdexaAPI.counters.delete(counterId);
    OrdexaAdminUtils.showToast('Counter removed');
    const u = OrdexaAPI.auth.getCurrentUser();
    OrdexaAdminCounters.render(document.getElementById('admin-main-view'), u.organizationId);
  }
};
