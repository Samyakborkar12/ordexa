/**
 * ORDEXA Admin Services Controller
 */

const OrdexaAdminServices = {
  async render(container, orgId) {
    const services = await OrdexaAPI.services.getByOrganization(orgId);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Service Management</h1>
          <p class="page-subtitle">Configure organization departments, offerings and queue capacities</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="OrdexaAdminServices.openCreateModal()">
            + Add New Service
          </button>
        </div>
      </div>

      ${
        services.length === 0
          ? `
          <div class="empty-state">
            <div class="empty-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h3 class="empty-title">No services configured</h3>
            <p class="empty-desc">Create the services your organization provides to allow customers to join queues.</p>
            <button class="btn btn-primary" onclick="OrdexaAdminServices.openCreateModal()">Add Your First Service</button>
          </div>
        `
          : `
          <div class="services-grid">
            ${services
              .map((srv) => {
                const entries = OrdexaStorage.Queues.getEntriesByService(srv.id);
                const waiting = entries.filter((e) => ['WAITING', 'CALLED'].includes(e.status)).length;
                return `
                  <div class="service-admin-card">
                    <div>
                      <div class="service-card-top">
                        <div>
                          <h3 class="service-admin-name">${OrdexaAdminUtils.escapeHtml(srv.name)}</h3>
                          <span style="font-size:11px;font-weight:700;color:#2563EB;">Token Prefix: [${srv.prefix || 'Q'}]</span>
                        </div>
                        <span class="badge ${srv.queueEnabled ? 'badge-serving' : 'badge-skipped'}">
                          ${srv.queueEnabled ? 'Queue Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p class="service-admin-desc">${OrdexaAdminUtils.escapeHtml(srv.description || 'No description provided.')}</p>
                    </div>

                    <div>
                      <div class="service-admin-meta">
                        <span>Avg: <strong>${srv.avgServiceTime} mins</strong></span>
                        <span>Waiting: <strong style="color:#2563EB;">${waiting}</strong></span>
                      </div>

                      <div style="display:flex;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid #E2E8F0;">
                        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="OrdexaAdminServices.toggleQueue('${srv.id}')">
                          ${srv.queueEnabled ? 'Pause Queue' : 'Open Queue'}
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="OrdexaAdminServices.openEditModal('${srv.id}')">
                          Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="OrdexaAdminServices.deleteService('${srv.id}')">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        `
      }

      <!-- Create / Edit Service Modal -->
      <div class="modal-overlay" id="service-modal">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="service-modal-title">Create Service</h3>
            <button class="modal-close-btn" onclick="OrdexaAdminUtils.closeModal('service-modal')">&times;</button>
          </div>
          <form id="service-modal-form">
            <input type="hidden" id="srv-edit-id" />
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Service Name</label>
                <input type="text" id="srv-name" class="form-input" placeholder="e.g. General Consultation, Cashier, Registration" required />
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group">
                  <label class="form-label">Token Prefix (Letter)</label>
                  <input type="text" id="srv-prefix" class="form-input" placeholder="e.g. A, B, C" maxlength="3" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Avg. Service Time (Minutes)</label>
                  <input type="number" id="srv-avg-time" class="form-input" min="1" max="180" value="10" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea id="srv-desc" class="form-textarea" rows="2" placeholder="Brief guidance or requirements for this service..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-checkbox-label">
                  <input type="checkbox" id="srv-queue-enabled" checked /> Enable Live Queue for this service
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="OrdexaAdminUtils.closeModal('service-modal')">Cancel</button>
              <button type="submit" class="btn btn-primary" id="srv-save-btn">Save Service</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('service-modal-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('srv-edit-id').value;
      const name = document.getElementById('srv-name').value.trim();
      const prefix = document.getElementById('srv-prefix').value.trim().toUpperCase();
      const avgServiceTime = parseInt(document.getElementById('srv-avg-time').value, 10) || 10;
      const description = document.getElementById('srv-desc').value.trim();
      const queueEnabled = document.getElementById('srv-queue-enabled').checked;

      try {
        if (id) {
          await OrdexaAPI.services.update(id, { name, prefix, avgServiceTime, description, queueEnabled });
          OrdexaAdminUtils.showToast('Service updated successfully');
        } else {
          await OrdexaAPI.services.create({
            organizationId: orgId,
            name,
            prefix,
            avgServiceTime,
            description,
            queueEnabled
          });
          OrdexaAdminUtils.showToast('Service created successfully');
        }
        OrdexaAdminUtils.closeModal('service-modal');
        OrdexaAdminServices.render(document.getElementById('admin-main-view'), orgId);
      } catch (err) {
        OrdexaAdminUtils.showToast(err.message, 'error');
      }
    };
  },

  openCreateModal() {
    document.getElementById('service-modal-title').innerText = 'Add New Service';
    document.getElementById('srv-edit-id').value = '';
    document.getElementById('srv-name').value = '';
    document.getElementById('srv-prefix').value = '';
    document.getElementById('srv-avg-time').value = '10';
    document.getElementById('srv-desc').value = '';
    document.getElementById('srv-queue-enabled').checked = true;
    OrdexaAdminUtils.openModal('service-modal');
  },

  async openEditModal(serviceId) {
    const srv = await OrdexaAPI.services.getById(serviceId);
    if (!srv) return;
    document.getElementById('service-modal-title').innerText = 'Edit Service';
    document.getElementById('srv-edit-id').value = srv.id;
    document.getElementById('srv-name').value = srv.name;
    document.getElementById('srv-prefix').value = srv.prefix || '';
    document.getElementById('srv-avg-time').value = srv.avgServiceTime || 10;
    document.getElementById('srv-desc').value = srv.description || '';
    document.getElementById('srv-queue-enabled').checked = srv.queueEnabled;
    OrdexaAdminUtils.openModal('service-modal');
  },

  async toggleQueue(serviceId) {
    const srv = await OrdexaAPI.services.getById(serviceId);
    if (!srv) return;
    await OrdexaAPI.services.update(serviceId, { queueEnabled: !srv.queueEnabled });
    OrdexaAdminUtils.showToast(`Queue ${!srv.queueEnabled ? 'opened' : 'paused'} for ${srv.name}`);
    const u = OrdexaAPI.auth.getCurrentUser();
    OrdexaAdminServices.render(document.getElementById('admin-main-view'), u.organizationId);
  },

  async deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    await OrdexaAPI.services.delete(serviceId);
    OrdexaAdminUtils.showToast('Service deleted');
    const u = OrdexaAPI.auth.getCurrentUser();
    OrdexaAdminServices.render(document.getElementById('admin-main-view'), u.organizationId);
  }
};
