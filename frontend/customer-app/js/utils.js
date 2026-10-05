/**
 * ORDEXA Customer App Utilities
 */

const OrdexaUtils = {
  formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  },

  timeAgo(isoString) {
    if (!isoString) return '';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  showToast(message, type = 'info') {
    let container = document.getElementById('ordexa-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ordexa-toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>${this.escapeHtml(message)}</span>
      <button style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:0 4px;" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  getStatusBadge(status) {
    const s = (status || 'WAITING').toUpperCase();
    const map = {
      WAITING: { class: 'badge-waiting', label: 'Waiting' },
      CALLED: { class: 'badge-called', label: 'Now Calling' },
      SERVING: { class: 'badge-serving', label: 'Serving' },
      HOLD: { class: 'badge-hold', label: 'On Hold' },
      SKIPPED: { class: 'badge-skipped', label: 'Skipped' },
      COMPLETED: { class: 'badge-completed', label: 'Completed' },
      CANCELLED: { class: 'badge-cancelled', label: 'Cancelled' }
    };
    const item = map[s] || { class: 'badge-waiting', label: s };
    return `<span class="badge ${item.class}">${item.label}</span>`;
  }
};
