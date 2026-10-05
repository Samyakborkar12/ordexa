/**
 * ORDEXA Admin Organization Settings Controller
 */

const OrdexaAdminOrganization = {
  async render(container, orgId) {
    const org = await OrdexaAPI.organizations.getById(orgId);
    if (!org) return;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Organization Settings</h1>
          <p class="page-subtitle">Manage public details, location, categories and queue operating parameters</p>
        </div>
      </div>

      <div class="card" style="max-width:760px;padding:32px;">
        <form id="org-settings-form">
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
            <div class="form-group">
              <label class="form-label">Organization Name</label>
              <input type="text" id="edit-org-name" class="form-input" value="${OrdexaAdminUtils.escapeHtml(org.name)}" required />
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="edit-org-category" class="form-select" required>
                ${['Healthcare', 'Diagnostic Centre', 'Banking', 'Government', 'RTO', 'Aadhaar Services', 'Education', 'Other']
                  .map(
                    (cat) => `
                    <option value="${cat}" ${org.category === cat ? 'selected' : ''}>${cat}</option>
                  `
                  )
                  .join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Physical Address</label>
            <input type="text" id="edit-org-address" class="form-input" value="${OrdexaAdminUtils.escapeHtml(org.address || '')}" />
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" id="edit-org-city" class="form-input" value="${OrdexaAdminUtils.escapeHtml(org.city || '')}" required />
            </div>
            <div class="form-group">
              <label class="form-label">State / Province</label>
              <input type="text" id="edit-org-state" class="form-input" value="${OrdexaAdminUtils.escapeHtml(org.state || '')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input type="tel" id="edit-org-contact" class="form-input" value="${OrdexaAdminUtils.escapeHtml(org.contactNumber || '')}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Public Description & Hours</label>
            <textarea id="edit-org-desc" class="form-textarea" rows="3">${OrdexaAdminUtils.escapeHtml(org.description || '')}</textarea>
          </div>

          <button type="submit" class="btn btn-primary" id="save-org-btn" style="margin-top:12px;">
            Save Organization Profile
          </button>
        </form>
      </div>
    `;

    const form = document.getElementById('org-settings-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('save-org-btn');
      btn.disabled = true;
      btn.innerText = 'Saving...';

      const name = document.getElementById('edit-org-name').value.trim();
      const category = document.getElementById('edit-org-category').value;
      const address = document.getElementById('edit-org-address').value.trim();
      const city = document.getElementById('edit-org-city').value.trim();
      const state = document.getElementById('edit-org-state').value.trim();
      const contactNumber = document.getElementById('edit-org-contact').value.trim();
      const description = document.getElementById('edit-org-desc').value.trim();

      try {
        await OrdexaAPI.organizations.update(orgId, {
          name,
          category,
          address,
          city,
          state,
          contactNumber,
          description
        });
        OrdexaAdminUtils.showToast('Organization profile updated');
        // Refresh shell to update header badge
        const u = OrdexaAPI.auth.getCurrentUser();
        OrdexaAdminNav.ensureShell(u);
      } catch (err) {
        OrdexaAdminUtils.showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = 'Save Organization Profile';
      }
    };
  }
};
