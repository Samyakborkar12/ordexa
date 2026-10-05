/**
 * ORDEXA Customer Authentication Controller
 */

const OrdexaCustomerAuth = {
  renderLogin(container, params = {}) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-header">
          <img src="assets/logo/ordexa-logo.svg" alt="ORDEXA" class="auth-logo" style="width:72px;height:72px;margin:0 auto 6px auto;" />
          <img src="assets/logo/ordexa-wordmark.svg" alt="ORDEXA" style="height:32px;margin:0 auto 12px auto;display:block;" />
          <p class="auth-subtitle">Sign in to join and track queues in real-time</p>
        </div>

        <div class="role-toggle">
          <button class="role-toggle-btn active" type="button">Customer</button>
          <a href="../admin-web/index.html#login" class="role-toggle-btn">Organization Admin</a>
        </div>

        <div id="auth-error-msg" class="form-error" style="display:none;margin-bottom:16px;text-align:center;"></div>

        <form id="customer-login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email Address</label>
            <input type="email" id="login-email" class="form-input" placeholder="name@example.com" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-input" placeholder="••••••••" required />
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <label class="form-checkbox-label">
              <input type="checkbox" checked /> Remember me
            </label>
            <a href="#forgot-password" style="font-size:12px;">Forgot password?</a>
          </div>

          <button type="submit" class="btn btn-primary" id="login-submit-btn">Sign In as Customer</button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a href="#register">Sign up now</a>
        </div>
      </div>
    `;

    const form = document.getElementById('customer-login-form');
    const errorBox = document.getElementById('auth-error-msg');
    const submitBtn = document.getElementById('login-submit-btn');

    form.onsubmit = async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerText = 'Signing In...';

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        await OrdexaAPI.auth.login(email, password, 'customer');
        OrdexaUtils.showToast('Successfully signed in');
        if (params.returnTo) {
          OrdexaNav.navigate(params.returnTo, params);
        } else {
          OrdexaNav.navigate('home');
        }
      } catch (err) {
        errorBox.innerText = err.message || 'Login failed. Please check credentials.';
        errorBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign In as Customer';
      }
    };
  },

  renderRegister(container) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-header">
          <img src="assets/logo/ordexa-logo.svg" alt="ORDEXA" class="auth-logo" style="width:72px;height:72px;margin:0 auto 6px auto;" />
          <img src="assets/logo/ordexa-wordmark.svg" alt="ORDEXA" style="height:32px;margin:0 auto 12px auto;display:block;" />
          <h2 style="font-size:20px;font-weight:800;color:#0B132B;margin-bottom:2px;">Create Account</h2>
          <p class="auth-subtitle">Join the queue from anywhere, anytime</p>
        </div>

        <div class="role-toggle">
          <button class="role-toggle-btn active" type="button">Customer</button>
          <a href="../admin-web/index.html#register" class="role-toggle-btn">Organization Admin</a>
        </div>

        <div id="auth-error-msg" class="form-error" style="display:none;margin-bottom:16px;text-align:center;"></div>

        <form id="customer-register-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label" for="reg-first-name">First Name</label>
              <input type="text" id="reg-first-name" class="form-input" placeholder="Jane" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-last-name">Last Name</label>
              <input type="text" id="reg-last-name" class="form-input" placeholder="Doe" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Email Address</label>
            <input type="email" id="reg-email" class="form-input" placeholder="jane@example.com" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-mobile">Mobile Number</label>
            <input type="tel" id="reg-mobile" class="form-input" placeholder="+1 234 567 8900" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Password</label>
            <input type="password" id="reg-password" class="form-input" placeholder="At least 6 characters" minlength="6" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-confirm-password">Confirm Password</label>
            <input type="password" id="reg-confirm-password" class="form-input" placeholder="Re-enter password" minlength="6" required />
          </div>

          <div class="form-group">
            <label class="form-checkbox-label">
              <input type="checkbox" id="reg-terms" required /> I accept the ORDEXA Terms & Conditions
            </label>
          </div>

          <button type="submit" class="btn btn-primary" id="reg-submit-btn">Create Customer Account</button>
        </form>

        <div class="auth-footer">
          Already have an account? <a href="#login">Sign in</a>
        </div>
      </div>
    `;

    const form = document.getElementById('customer-register-form');
    const errorBox = document.getElementById('auth-error-msg');
    const submitBtn = document.getElementById('reg-submit-btn');

    form.onsubmit = async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';

      const firstName = document.getElementById('reg-first-name').value.trim();
      const lastName = document.getElementById('reg-last-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const mobile = document.getElementById('reg-mobile').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;
      const termsAccepted = document.getElementById('reg-terms').checked;

      if (!firstName || !lastName || !email || !mobile || !password) {
        errorBox.innerText = 'Please complete all required fields.';
        errorBox.style.display = 'block';
        return;
      }

      if (password !== confirmPassword) {
        errorBox.innerText = 'Passwords do not match.';
        errorBox.style.display = 'block';
        return;
      }

      if (!termsAccepted) {
        errorBox.innerText = 'Please accept the Terms & Conditions.';
        errorBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Creating Account...';

      try {
        await OrdexaAPI.auth.registerCustomer({
          firstName,
          lastName,
          email,
          mobile,
          password
        });
        OrdexaUtils.showToast('Account created successfully! Welcome to ORDEXA.');
        OrdexaNav.navigate('home');
      } catch (err) {
        errorBox.innerText = err.message || 'Registration failed.';
        errorBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Create Customer Account';
      }
    };
  },

  renderForgotPassword(container) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-header">
          <img src="assets/logo/ordexa-logo.svg" alt="ORDEXA" class="auth-logo" />
          <h1 class="auth-title">Reset Password</h1>
          <p class="auth-subtitle">Enter your registered email address to receive password instructions</p>
        </div>

        <form id="forgot-form" onsubmit="event.preventDefault(); OrdexaUtils.showToast('Reset instructions sent if account exists.'); OrdexaNav.navigate('login');">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" placeholder="name@example.com" required />
          </div>
          <button type="submit" class="btn btn-primary" style="margin-top:12px;">Send Reset Link</button>
        </form>

        <div class="auth-footer">
          Remember your password? <a href="#login">Return to Sign In</a>
        </div>
      </div>
    `;
  }
};
