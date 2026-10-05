/**
 * ORDEXA Admin Staff Management Controller
 */

const OrdexaAdminStaff = {
  async render(container, orgId) {
    const staffList = await OrdexaAPI.staff.getByOrganization(orgId);
    const counters = await OrdexaAPI.counters.getByOrganization(orgId);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Staff & Operators</h1>
          <p class="page-subtitle">Manage personnel, operators and counter assignments</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="OrdexaAdminStaff.openCreateModal()">
            + Add Staff Member
          </button>
        </div>
      </div>

      ${
        staffList.length === 0
          ? `
          <div class="empty-state">
            <div class="empty-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 class="empty-title">No staff members added</h3>
            <p class="empty-desc">Register operators and managers to handle counters and monitor queues.</p>
            <button class="btn btn-primary" onclick="OrdexaAdminStaff.openCreateModal()">Add Staff Member</button>
          </div>
        `
          : `
          <div class="staff-card-grid">
            ${staffList
              .map((stf) => {
                const initials = stf.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
                return `
                  <div class="staff-member-card">
                    <div class="staff-avatar-initials">${initials}</div>
                    <div class="staff-member-details">
                      <div class="staff-member-name">${OrdexaAdminUtils.escapeHtml(stf.name)}</div>
                      <div class="staff-member-role">${stf.role} • ${OrdexaAdminUtils.escapeHtml(stf.email)}</div>
                      <div style="margin-top:6px;">
                        <span class="badge ${stf.status === 'ACTIVE' ? 'badge-serving' : 'badge-skipped'}">
                          ${stf.status}
                        </span>
                      </div>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="OrdexaAdminStaff.deleteStaff('${stf.id}')">
                      &times;
                    </button>
                  </div>
                `;
              })
              .join('')}
          </div>
        `
      }

      <!-- Modal -->
      <div class="modal-overlay" id="staff-modal">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Add Staff Member</h3>
            <button class="modal-close-btn" onclick="OrdexaAdminUtils.closeModal('staff-modal')">&times;</button>
          </div>
          <form id="staff-modal-form">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="stf-name" class="form-input" placeholder="e.g. David Miller" required />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="stf-email" class="form-input" placeholder="david@organization.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">Mobile</label>
                <input type="tel" id="stf-mobile" class="form-input" placeholder="+1 555 304 9912" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group">
                  <label class="form-label">Role</label>
                  <select id="stf-role" class="form-select">
                    <option value="Operator">Operator</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select id="stf-status" class="form-select">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="OrdexaAdminUtils.closeModal('staff-modal')">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Member</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('staff-modal-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('stf-name').value.trim();
      const email = document.getElementById('stf-email').value.trim();
      const mobile = document.getElementById('stf-mobile').value.trim();
      const role = document.getElementById('stf-role').value;
      const status = document.getElementById('stf-status').value;

      try {
        await OrdexaAPI.staff.create({
          organizationId: orgId,
          name,
          email,
          mobile,
          role,
          status
        });
        OrdexaAdminUtils.showToast('Staff member added');
        OrdexaAdminUtils.closeModal('staff-modal');
        OrdexaAdminStaff.render(document.getElementById('admin-main-view'), orgId);
      } catch (err) {
        OrdexaAdminUtils.showToast(err.message, 'error');
      }
    };
  },

  openCreateModal() {
    document.getElementById('stf-name').value = '';
    document.getElementById('stf-email').value = '';
    document.getElementById('stf-mobile').value = '';
    OrdexaAdminUtils.openModal('staff-modal');
  },

  async deleteStaff(staffId) {
    if (!confirm('Remove this staff member?')) return;
    await OrdexaAPI.staff.delete(staffId);
    OrdexaAdminUtils.showToast('Staff member removed');
    const u = OrdexaAPI.auth.getCurrentUser();
    OrdexaAdminStaff.render(document.getElementById('admin-main-view'), u.organizationId);
  }
};
