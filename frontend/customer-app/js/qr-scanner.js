/**
 * ORDEXA Customer QR Scanner Controller
 */

const OrdexaCustomerQR = {
  render(container) {
    const orgs = OrdexaStorage.Organizations.getAll();

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <button class="btn btn-secondary btn-sm" style="width:auto;margin-bottom:16px;" onclick="OrdexaNav.navigate('home')">
          &larr; Back to Home
        </button>

        <h1 style="font-size:22px;font-weight:800;color:#0B132B;margin-bottom:6px;">Scan Queue QR</h1>
        <p style="font-size:13px;color:#475569;margin-bottom:20px;">Scan an organization or counter QR code to instantly join the queue.</p>

        <!-- Simulated Interactive Scanner Viewfinder -->
        <div style="background-color:#0B132B;border-radius:16px;padding:32px 16px;text-align:center;color:#FFFFFF;margin-bottom:24px;position:relative;overflow:hidden;">
          <div style="width:180px;height:180px;margin:0 auto 16px auto;border:2px dashed #38BDF8;border-radius:16px;display:flex;align-items:center;justify-content:center;position:relative;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <div style="position:absolute;top:0;left:0;right:0;height:2px;background:#38BDF8;box-shadow:0 0 8px #38BDF8;animation:scan-sweep 2.5s infinite linear;"></div>
          </div>
          <p style="font-size:12px;color:#94A3B8;">Point your device camera at an ORDEXA counter code</p>
        </div>

        <style>
          @keyframes scan-sweep {
            0% { top: 0; }
            50% { top: 100%; }
            100% { top: 0; }
          }
        </style>

        <div class="card">
          <h3 style="font-size:14px;font-weight:700;margin-bottom:8px;">Or Enter Code / Select Service</h3>
          <p style="font-size:12px;color:#64748B;margin-bottom:12px;">If your camera is busy, choose from registered organizations:</p>
          
          ${
            orgs.length === 0
              ? `<p style="font-size:12px;color:#94A3B8;font-style:italic;">No organizations registered yet. Create one in the Admin portal to test QR codes.</p>`
              : `
              <div style="display:flex;flex-direction:column;gap:8px;">
                ${orgs
                  .map(
                    (o) => `
                    <button class="btn btn-secondary btn-sm" style="text-align:left;justify-content:space-between;" onclick="OrdexaNav.navigate('organization', { id: '${o.id}' })">
                      <span>${OrdexaUtils.escapeHtml(o.name)}</span>
                      <span>Scan Code &rarr;</span>
                    </button>
                  `
                  )
                  .join('')}
              </div>
            `
          }
        </div>
      </div>
    `;
  }
};
