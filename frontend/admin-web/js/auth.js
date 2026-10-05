/**
 * ORDEXA Admin Authentication Controller
 */

const OrdexaAdminAuth = {
  renderLogin(container) {
    container.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B132B;padding:24px;">
        <div style="background:#FFFFFF;border-radius:16px;width:100%;max-width:440px;padding:36px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          <div style="text-align:center;margin-bottom:28px;">
            <img src="assets/logo/ordexa-logo.svg" alt="ORDEXA" style="width:72px;height:72px;margin:0 auto 6px auto;display:block;" />
            <img src="assets/logo/ordexa-wordmark.svg" alt="ORDEXA" style="height:36px;margin:0 auto 12px auto;display:block;" />
            <p style="font-size:13px;color:#64748B;">Admin Web Console • Operations & Queue Orchestration</p>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;background:#F1F5F9;padding:4px;border-radius:8px;margin-bottom:24px;">
            <a href="../customer-app/index.html#login" style="padding:8px;font-size:12px;font-weight:600;text-align:center;color:#64748B;text-decoration:none;">Customer</a>
            <button type="button" style="padding:8px;font-size:12px;font-weight:600;background:#FFFFFF;color:#2563EB;border:none;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,0.05);cursor:default;">Organization Admin</button>
          </div>

          <div id="admin-auth-error" class="form-error" style="display:none;margin-bottom:16px;text-align:center;"></div>

          <form id="admin-login-form">
            <div class="form-group">
              <label class="form-label">Admin Email</label>
              <input type="email" id="admin-email" class="form-input" placeholder="admin@organization.com" required />
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="admin-password" class="form-input" placeholder="••••••••" required />
            </div>

            <button type="submit" class="btn btn-primary" id="admin-login-btn" style="width:100%;margin-top:8px;">
              Sign In to Admin Console
            </button>
          </form>

          <div style="margin-top:24px;text-align:center;font-size:13px;color:#64748B;">
            Need to register an organization? <a href="#register" style="font-weight:600;color:#2563EB;">Create Account</a>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('admin-login-form');
    const errorBox = document.getElementById('admin-auth-error');
    const submitBtn = document.getElementById('admin-login-btn');

    form.onsubmit = async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerText = 'Verifying...';

      const email = document.getElementById('admin-email').value;
      const password = document.getElementById('admin-password').value;

      try {
        await OrdexaAPI.auth.login(email, password, 'admin');
        OrdexaAdminUtils.showToast('Welcome back, Admin');
        OrdexaAdminNav.navigate('dashboard');
      } catch (err) {
        errorBox.innerText = err.message || 'Login failed. Please verify credentials.';
        errorBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign In to Admin Console';
      }
    };
  },

  renderRegister(container) {
    container.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B132B;padding:36px 20px;">
        <div style="background:#FFFFFF;border-radius:16px;width:100%;max-width:680px;padding:36px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          <div style="text-align:center;margin-bottom:28px;">
            <img src="assets/logo/ordexa-logo.svg" alt="ORDEXA" style="width:72px;height:72px;margin:0 auto 6px auto;display:block;" />
            <img src="assets/logo/ordexa-wordmark.svg" alt="ORDEXA" style="height:36px;margin:0 auto 12px auto;display:block;" />
            <h2 style="font-size:22px;font-weight:800;color:#0B132B;margin-bottom:4px;">Register Organization</h2>
            <p style="font-size:13px;color:#64748B;">Set up your enterprise queue infrastructure in minutes</p>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;background:#F1F5F9;padding:4px;border-radius:8px;margin-bottom:24px;">
            <a href="../customer-app/index.html#register" style="padding:8px;font-size:12px;font-weight:600;text-align:center;color:#64748B;text-decoration:none;">Customer</a>
            <button type="button" style="padding:8px;font-size:12px;font-weight:600;background:#FFFFFF;color:#2563EB;border:none;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,0.05);cursor:default;">Organization Admin</button>
          </div>

          <div id="admin-reg-error" class="form-error" style="display:none;margin-bottom:16px;text-align:center;"></div>

          <form id="admin-reg-form">
            <h3 style="font-size:13px;font-weight:800;color:#2563EB;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;border-bottom:1px solid #E2E8F0;padding-bottom:6px;">
              1. Admin Account Information
            </h3>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input type="text" id="adm-first-name" class="form-input" placeholder="Alex" required />
              </div>
              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input type="text" id="adm-last-name" class="form-input" placeholder="Morgan" required />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="adm-email" class="form-input" placeholder="alex@organization.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">Mobile Number</label>
                <input type="tel" id="adm-mobile" class="form-input" placeholder="+1 555 019 2831" required />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="adm-password" class="form-input" placeholder="Min. 6 characters" minlength="6" required />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <input type="password" id="adm-confirm-password" class="form-input" placeholder="Re-enter password" minlength="6" required />
              </div>
            </div>

            <h3 style="font-size:13px;font-weight:800;color:#2563EB;text-transform:uppercase;letter-spacing:1px;margin:20px 0 12px 0;border-bottom:1px solid #E2E8F0;padding-bottom:6px;">
              2. Organization Information
            </h3>

            <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Organization Name</label>
                <input type="text" id="adm-org-name" class="form-input" placeholder="e.g. Apex Health Center" required />
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <select id="adm-org-category" class="form-select" required>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Diagnostic Centre">Diagnostic Centre</option>
                  <option value="Banking">Banking</option>
                  <option value="Government">Government</option>
                  <option value="RTO">RTO</option>
                  <option value="Aadhaar Services">Aadhaar Services</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Physical Address</label>
              <input type="text" id="adm-org-address" class="form-input" placeholder="100 Enterprise Way, Suite 400" required />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">City</label>
                <input type="text" id="adm-org-city" class="form-input" placeholder="Metro City" required />
              </div>
              <div class="form-group">
                <label class="form-label">State / Province</label>
                <input type="text" id="adm-org-state" class="form-input" placeholder="CA" required />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Number</label>
                <input type="tel" id="adm-org-contact" class="form-input" placeholder="+1 555 100 2000" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description / Public Note</label>
              <textarea id="adm-org-desc" class="form-textarea" rows="2" placeholder="Brief overview of services provided..."></textarea>
            </div>

            <button type="submit" class="btn btn-primary" id="adm-reg-btn" style="width:100%;margin-top:12px;padding:12px;">
              Complete Organization Setup & Register
            </button>
          </form>

          <div style="margin-top:20px;text-align:center;font-size:13px;color:#64748B;">
            Already registered? <a href="#login" style="font-weight:600;color:#2563EB;">Sign in here</a>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('admin-reg-form');
    const errorBox = document.getElementById('admin-reg-error');
    const submitBtn = document.getElementById('adm-reg-btn');

    form.onsubmit = async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';

      const firstName = document.getElementById('adm-first-name').value.trim();
      const lastName = document.getElementById('adm-last-name').value.trim();
      const email = document.getElementById('adm-email').value.trim();
      const mobile = document.getElementById('adm-mobile').value.trim();
      const password = document.getElementById('adm-password').value;
      const confirmPassword = document.getElementById('adm-confirm-password').value;

      const orgName = document.getElementById('adm-org-name').value.trim();
      const category = document.getElementById('adm-org-category').value;
      const address = document.getElementById('adm-org-address').value.trim();
      const city = document.getElementById('adm-org-city').value.trim();
      const state = document.getElementById('adm-org-state').value.trim();
      const contactNumber = document.getElementById('adm-org-contact').value.trim();
      const description = document.getElementById('adm-org-desc').value.trim();

      if (password !== confirmPassword) {
        errorBox.innerText = 'Passwords do not match.';
        errorBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Creating Organization...';

      try {
        await OrdexaAPI.auth.registerAdmin(
          { firstName, lastName, email, mobile, password },
          { name: orgName, category, address, city, state, contactNumber, description }
        );
        OrdexaAdminUtils.showToast(`Organization "${orgName}" created successfully!`);
        OrdexaAdminNav.navigate('dashboard');
      } catch (err) {
        errorBox.innerText = err.message || 'Registration failed.';
        errorBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Complete Organization Setup & Register';
      }
    };
  }
};
