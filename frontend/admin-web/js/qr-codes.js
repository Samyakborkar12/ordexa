/**
 * ORDEXA Admin QR Codes Generator Controller
 */

const OrdexaAdminQR = {
  async render(container, orgId) {
    const org = await OrdexaAPI.organizations.getById(orgId);
    const services = await OrdexaAPI.services.getByOrganization(orgId);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">QR Code Signage & Posters</h1>
          <p class="page-subtitle">Printable check-in codes for front desks, entrance kiosks and service windows</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <!-- Organization Main Poster -->
        <div class="card" style="padding:24px;text-align:center;">
          <h3 style="font-size:16px;font-weight:700;color:#0B132B;margin-bottom:4px;">Organization Entrance Standee</h3>
          <p style="font-size:12px;color:#64748B;margin-bottom:20px;">Place at the main reception for remote mobile queuing</p>

          <div style="background:#0B132B;border-radius:16px;padding:28px 20px;color:#FFFFFF;max-width:320px;margin:0 auto 20px auto;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#38BDF8;text-transform:uppercase;margin-bottom:6px;">Scan to Join Queue</div>
            <div style="font-size:18px;font-weight:800;color:#FFFFFF;margin-bottom:16px;">${OrdexaAdminUtils.escapeHtml(org ? org.name : 'ORDEXA')}</div>

            <!-- Stylized Crisp High-Contrast SVG QR -->
            <div style="background:#FFFFFF;border-radius:12px;padding:16px;width:180px;height:180px;margin:0 auto 16px auto;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <!-- QR Position Detection Patterns -->
                <rect x="5" y="5" width="28" height="28" fill="#0B132B" rx="4" />
                <rect x="9" y="9" width="20" height="20" fill="#FFFFFF" rx="2" />
                <rect x="13" y="13" width="12" height="12" fill="#0B132B" rx="2" />

                <rect x="67" y="5" width="28" height="28" fill="#0B132B" rx="4" />
                <rect x="71" y="9" width="20" height="20" fill="#FFFFFF" rx="2" />
                <rect x="75" y="13" width="12" height="12" fill="#0B132B" rx="2" />

                <rect x="5" y="67" width="28" height="28" fill="#0B132B" rx="4" />
                <rect x="9" y="71" width="20" height="20" fill="#FFFFFF" rx="2" />
                <rect x="13" y="75" width="12" height="12" fill="#0B132B" rx="2" />

                <!-- Mock data matrix modules -->
                <rect x="38" y="10" width="8" height="8" fill="#2563EB" />
                <rect x="50" y="15" width="8" height="8" fill="#0B132B" />
                <rect x="42" y="25" width="8" height="8" fill="#0B132B" />
                <rect x="15" y="42" width="8" height="8" fill="#0B132B" />
                <rect x="25" y="48" width="8" height="8" fill="#2563EB" />
                <rect x="38" y="42" width="14" height="14" fill="#0B132B" rx="3" />
                <rect x="58" y="38" width="8" height="8" fill="#0B132B" />
                <rect x="70" y="48" width="8" height="8" fill="#2563EB" />
                <rect x="45" y="65" width="8" height="8" fill="#0B132B" />
                <rect x="55" y="75" width="8" height="8" fill="#2563EB" />
                <rect x="68" y="68" width="12" height="12" fill="#0B132B" />
                <rect x="85" y="78" width="8" height="8" fill="#0B132B" />
              </svg>
            </div>

            <div style="font-size:11px;color:#94A3B8;">Powered by ORDEXA Real-Time Engine</div>
          </div>

          <button class="btn btn-secondary btn-sm" onclick="window.print()">Print Poster</button>
        </div>

        <!-- Service-Specific QR Codes -->
        <div class="card" style="padding:24px;">
          <h3 style="font-size:16px;font-weight:700;color:#0B132B;margin-bottom:4px;">Service Direct-Join QRs</h3>
          <p style="font-size:12px;color:#64748B;margin-bottom:16px;">Direct links to jump straight into specific queues</p>

          ${
            services.length === 0
              ? `<p style="font-size:12px;color:#94A3B8;font-style:italic;">No services created yet.</p>`
              : `
              <div style="display:flex;flex-direction:column;gap:10px;">
                ${services
                  .map(
                    (s) => `
                    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center;">
                      <div>
                        <div style="font-weight:700;color:#0F172A;">${OrdexaAdminUtils.escapeHtml(s.name)}</div>
                        <div style="font-size:11px;color:#64748B;">Prefix: ${s.prefix || 'Q'} • ${s.avgServiceTime}m avg</div>
                      </div>
                      <a href="../customer-app/index.html#service?id=${s.id}" target="_blank" class="btn btn-secondary btn-sm">
                        Test Link &rarr;
                      </a>
                    </div>
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
