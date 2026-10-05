/**
 * ORDEXA Admin Feedback Controller
 */

const OrdexaAdminFeedback = {
  async render(container, orgId) {
    const feedbackList = await OrdexaAPI.feedback.getByOrg(orgId);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Customer Feedback & Reviews</h1>
          <p class="page-subtitle">Real ratings and comments submitted by serviced visitors</p>
        </div>
      </div>

      <div class="card" style="padding:24px;">
        ${
          feedbackList.length === 0
            ? `
            <div class="empty-state" style="border:none;padding:36px;">
              <div class="empty-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 class="empty-title">No feedback received yet</h3>
              <p class="empty-desc">Feedback submitted by customers after queue completion will show up here.</p>
            </div>
          `
            : `
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${feedbackList
                .map(
                  (fb) => `
                  <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                      <span style="font-weight:700;color:#0B132B;">${OrdexaAdminUtils.escapeHtml(fb.customerName)}</span>
                      <span style="color:#F59E0B;font-weight:700;">★ ${fb.rating}/5</span>
                    </div>
                    <p style="font-size:13px;color:#475569;margin-bottom:6px;">"${OrdexaAdminUtils.escapeHtml(fb.comment || 'Good service')}"</p>
                    <span style="font-size:11px;color:#94A3B8;">${OrdexaAdminUtils.formatDate(fb.createdAt)}</span>
                  </div>
                `
                )
                .join('')}
            </div>
          `
        }
      </div>
    `;
  }
};
