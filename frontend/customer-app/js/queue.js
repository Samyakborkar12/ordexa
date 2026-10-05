/**
 * ORDEXA Customer Queue Management Controller & SVG Wait Time Visualizer
 */

const OrdexaWaitTimeChart = {
  currentRange: 'today',
  selectedNodes: {},

  getData(serviceId, range = 'today') {
    const service = OrdexaStorage.Services.getById(serviceId);
    const baseline = service ? (service.avgServiceTime || 10) : 10;
    const allEntries = OrdexaStorage.Queues.getEntriesByService(serviceId);
    const completed = allEntries.filter((e) => e.status === 'COMPLETED' && e.completedAt && e.joinedAt);

    if (range === 'today') {
      const slots = [
        { label: '9 AM', targetHour: 9, defaultMult: 0.8 },
        { label: '11 AM', targetHour: 11, defaultMult: 1.4 },
        { label: '1 PM', targetHour: 13, defaultMult: 1.9 },
        { label: '3 PM', targetHour: 15, defaultMult: 1.3 },
        { label: '5 PM', targetHour: 17, defaultMult: 1.0 },
        { label: 'Now', targetHour: new Date().getHours(), isCurrent: true }
      ];

      const todayStr = new Date().toDateString();
      const todayCompleted = completed.filter((e) => new Date(e.joinedAt).toDateString() === todayStr);

      return slots.map((slot) => {
        if (slot.isCurrent) {
          const waitingNow = allEntries.filter((e) => ['WAITING', 'CALLED'].includes(e.status)).length;
          const currentWait = waitingNow > 0 ? waitingNow * baseline : Math.round(baseline * 1.1);
          return { label: slot.label, value: currentWait, isCurrent: true, realCount: waitingNow };
        }

        const bucketMatches = todayCompleted.filter((e) => {
          const h = new Date(e.joinedAt).getHours();
          return h >= slot.targetHour - 1 && h <= slot.targetHour + 1;
        });

        if (bucketMatches.length > 0) {
          const sumMin = bucketMatches.reduce(
            (acc, m) => acc + (new Date(m.completedAt) - new Date(m.joinedAt)) / 60000,
            0
          );
          return {
            label: slot.label,
            value: Math.max(3, Math.round(sumMin / bucketMatches.length)),
            isCurrent: false,
            realCount: bucketMatches.length
          };
        }

        return { label: slot.label, value: Math.round(baseline * slot.defaultMult), isCurrent: false, realCount: 0 };
      });
    } else {
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const defaultMults = [1.3, 1.0, 1.1, 1.2, 1.5, 1.8, 1.4];

      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = i === 0 ? 'Today' : daysOfWeek[d.getDay()];
        const dStr = d.toDateString();
        const dayMatches = completed.filter((e) => new Date(e.joinedAt).toDateString() === dStr);

        let val = Math.round(baseline * defaultMults[d.getDay()]);
        if (dayMatches.length > 0) {
          const sumMin = dayMatches.reduce(
            (acc, m) => acc + (new Date(m.completedAt) - new Date(m.joinedAt)) / 60000,
            0
          );
          val = Math.max(3, Math.round(sumMin / dayMatches.length));
        } else if (i === 0) {
          const waitingNow = allEntries.filter((e) => ['WAITING', 'CALLED'].includes(e.status)).length;
          if (waitingNow > 0) val = waitingNow * baseline;
        }

        days.push({ label: dayName, value: val, isCurrent: i === 0, realCount: dayMatches.length });
      }
      return days;
    }
  },

  render(serviceId, range = 'today') {
    this.currentRange = range;
    const points = this.getData(serviceId, range);

    const maxVal = Math.max(25, Math.ceil((Math.max(...points.map((p) => p.value)) * 1.25) / 5) * 5);
    const midVal = Math.round(maxVal / 2);

    const svgWidth = 340;
    const svgHeight = 140;
    const padL = 36;
    const padR = 20;
    const padT = 16;
    const padB = 24;
    const plotW = svgWidth - padL - padR;
    const plotH = svgHeight - padT - padB;

    const coords = points.map((p, idx) => {
      const x = padL + (idx / (points.length - 1)) * plotW;
      const y = padT + plotH - (p.value / maxVal) * plotH;
      return { ...p, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    });

    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cp1x = (p0.x + (p1.x - p0.x) * 0.5).toFixed(1);
      const cp1y = p0.y.toFixed(1);
      const cp2x = (p0.x + (p1.x - p0.x) * 0.5).toFixed(1);
      const cp2y = p1.y.toFixed(1);
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`;

    const y0 = padT + plotH;
    const yMid = padT + plotH - (midVal / maxVal) * plotH;
    const yMax = padT;

    const currentVal = points.find((p) => p.isCurrent)?.value || points[points.length - 1].value;
    const peakVal = Math.max(...points.map((p) => p.value));
    const peakPoint = points.find((p) => p.value === peakVal);
    const lowestVal = Math.min(...points.map((p) => p.value));
    const lowestPoint = points.find((p) => p.value === lowestVal);

    const selectedInfo = this.selectedNodes[serviceId] || null;

    return `
      <div class="wait-trend-card" id="wait-trend-card-${serviceId}">
        <div class="wait-trend-header">
          <div class="wait-trend-title-box">
            <h3 class="wait-trend-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Historical Wait Times
            </h3>
            <span class="wait-trend-subtitle">Turnaround duration trend (minutes)</span>
          </div>

          <div class="trend-range-toggle">
            <button
              class="trend-range-btn ${range === 'today' ? 'active' : ''}"
              onclick="OrdexaWaitTimeChart.setRange('${serviceId}', 'today')">
              Today
            </button>
            <button
              class="trend-range-btn ${range === 'week' ? 'active' : ''}"
              onclick="OrdexaWaitTimeChart.setRange('${serviceId}', 'week')">
              7 Days
            </button>
          </div>
        </div>

        <div class="trend-kpi-row">
          <div class="trend-kpi-item">
            <span class="trend-kpi-label">Current Wait</span>
            <span class="trend-kpi-val highlight-val">~${currentVal}m</span>
          </div>
          <div class="trend-kpi-item">
            <span class="trend-kpi-label">Peak Window</span>
            <span class="trend-kpi-val" style="color:#DC2626;">~${peakVal}m <span style="font-size:10px;font-weight:600;color:#64748B;">(${peakPoint ? peakPoint.label : ''})</span></span>
          </div>
          <div class="trend-kpi-item">
            <span class="trend-kpi-label">Fastest Turn</span>
            <span class="trend-kpi-val" style="color:#16A34A;">~${lowestVal}m <span style="font-size:10px;font-weight:600;color:#64748B;">(${lowestPoint ? lowestPoint.label : ''})</span></span>
          </div>
        </div>

        <div class="svg-chart-wrapper">
          <svg class="svg-chart-element" viewBox="0 0 ${svgWidth} ${svgHeight}">
            <defs>
              <linearGradient id="waitGrad-${serviceId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2563EB" stop-opacity="0.32" />
                <stop offset="100%" stop-color="#2563EB" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Horizontal Dashed Grid Lines -->
            <line class="chart-grid-line" x1="${padL}" y1="${yMax}" x2="${svgWidth - padR}" y2="${yMax}" />
            <text class="chart-axis-text" x="${padL - 6}" y="${yMax + 3}" text-anchor="end">${maxVal}m</text>

            <line class="chart-grid-line" x1="${padL}" y1="${yMid}" x2="${svgWidth - padR}" y2="${yMid}" />
            <text class="chart-axis-text" x="${padL - 6}" y="${yMid + 3}" text-anchor="end">${midVal}m</text>

            <line class="chart-grid-line" x1="${padL}" y1="${y0}" x2="${svgWidth - padR}" y2="${y0}" />
            <text class="chart-axis-text" x="${padL - 6}" y="${y0 + 3}" text-anchor="end">0m</text>

            <!-- Area Gradient Fill -->
            <path d="${areaD}" fill="url(#waitGrad-${serviceId})" />

            <!-- Smooth Trend Line Curve -->
            <path class="chart-curve-path" d="${pathD}" />

            <!-- Interactive Nodes and Axis Labels -->
            ${coords
              .map(
                (c) => `
              <text class="chart-axis-text" x="${c.x}" y="${y0 + 16}" text-anchor="middle">
                ${c.label}
              </text>
              <circle
                class="chart-data-node ${c.isCurrent ? 'chart-current-node' : ''}"
                cx="${c.x}"
                cy="${c.y}"
                r="${c.isCurrent ? 5.5 : 4}"
                onclick="OrdexaWaitTimeChart.selectPoint('${serviceId}', '${c.label}', ${c.value})"
              />
            `
              )
              .join('')}
          </svg>
        </div>

        <div id="chart-tooltip-${serviceId}" style="min-height:26px;display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
          ${
            selectedInfo
              ? `
            <div class="chart-tooltip-box">
              <span>Time: <strong>${OrdexaUtils.escapeHtml(selectedInfo.label)}</strong></span>
              <span>• Avg Wait: <strong>~${selectedInfo.value} mins</strong></span>
            </div>
            <span style="font-size:10px;color:#2563EB;cursor:pointer;" onclick="OrdexaWaitTimeChart.clearSelection('${serviceId}')">Reset</span>
          `
              : `
            <div style="font-size:11px;color:#64748B;display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:#38BDF8;display:inline-block;"></span>
              <span>Tap any data point on the curve for interval details</span>
            </div>
            <span style="font-size:10px;color:#94A3B8;text-transform:uppercase;font-weight:600;">SVG Vector Trend</span>
          `
          }
        </div>
      </div>
    `;
  },

  setRange(serviceId, range) {
    this.currentRange = range;
    const card = document.getElementById(`wait-trend-card-${serviceId}`);
    if (card) {
      card.outerHTML = this.render(serviceId, range);
    }
  },

  selectPoint(serviceId, label, value) {
    this.selectedNodes[serviceId] = { label, value };
    const card = document.getElementById(`wait-trend-card-${serviceId}`);
    if (card) {
      card.outerHTML = this.render(serviceId, this.currentRange);
    }
  },

  clearSelection(serviceId) {
    delete this.selectedNodes[serviceId];
    const card = document.getElementById(`wait-trend-card-${serviceId}`);
    if (card) {
      card.outerHTML = this.render(serviceId, this.currentRange);
    }
  }
};

/**
 * Modal Confirmation Dialog for Queue Join & Appointment Booking
 */
const OrdexaQueueConfirmationModal = {
  show({ entry, service, org, expectedWait, isAppointment, appointmentSlot }) {
    const existing = document.getElementById('queue-confirm-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'queue-confirm-modal-overlay';
    overlay.id = 'queue-confirm-modal';

    const tokenNumber = entry.token || 'T-101';
    const serviceName = service ? service.name : (entry.serviceName || 'Service');
    const orgName = org ? org.name : (entry.organizationName || 'Organization');
    const waitDisplay = isAppointment && appointmentSlot
      ? `${appointmentSlot} (Est. turn: ~${expectedWait}m)`
      : `~${expectedWait} mins`;

    overlay.innerHTML = `
      <div class="queue-confirm-modal-card">
        <button class="queue-confirm-close-btn" onclick="OrdexaQueueConfirmationModal.goToLiveQueue('${entry.id}')" aria-label="Close dialog">&times;</button>
        
        <div class="queue-confirm-badge-icon ${isAppointment ? 'appointment-badge' : ''}">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h3 class="queue-confirm-title">${isAppointment ? 'Appointment Confirmed!' : 'Queue Entry Confirmed!'}</h3>
        <p class="queue-confirm-subtitle">
          ${isAppointment ? 'Your appointment slot and token have been reserved.' : 'Your spot has been secured in the real-time queue.'}
        </p>

        <!-- Token Number Hero Box -->
        <div class="queue-confirm-token-box">
          <div class="token-box-label">${isAppointment ? 'Appointment Token' : 'Your Queue Token'}</div>
          <div class="token-box-number">${OrdexaUtils.escapeHtml(tokenNumber)}</div>
          <div class="token-box-service">${OrdexaUtils.escapeHtml(serviceName)}</div>
        </div>

        <!-- Summary Details List -->
        <div class="queue-confirm-details-list">
          <div class="confirm-detail-row">
            <span class="confirm-detail-key">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v4m4-4v4m4-4v4" />
              </svg>
              Organization
            </span>
            <span class="confirm-detail-val">${OrdexaUtils.escapeHtml(orgName)}</span>
          </div>

          <div class="confirm-detail-row">
            <span class="confirm-detail-key">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
              Service
            </span>
            <span class="confirm-detail-val">${OrdexaUtils.escapeHtml(serviceName)}</span>
          </div>

          <div class="confirm-detail-row">
            <span class="confirm-detail-key">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
              ${isAppointment ? 'Appointment Window' : 'Expected Wait Time'}
            </span>
            <span class="confirm-detail-val highlight-wait">${OrdexaUtils.escapeHtml(waitDisplay)}</span>
          </div>

          <div class="confirm-detail-row">
            <span class="confirm-detail-key">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Queue Status
            </span>
            <span class="confirm-detail-val" style="color:#059669;">
              ${isAppointment ? 'Scheduled & Confirmed' : 'Waiting in Line'}
            </span>
          </div>
        </div>

        <!-- Action CTAs -->
        <div class="queue-confirm-actions">
          <button class="btn btn-primary" onclick="OrdexaQueueConfirmationModal.goToLiveQueue('${entry.id}')">
            Track Live Queue &rarr;
          </button>
          <button class="btn btn-secondary" onclick="OrdexaQueueConfirmationModal.closeToHome()">
            Done / Return to Home
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  },

  goToLiveQueue(entryId) {
    const el = document.getElementById('queue-confirm-modal');
    if (el) el.remove();
    OrdexaNav.navigate('live-queue', { entryId });
  },

  closeToHome() {
    const el = document.getElementById('queue-confirm-modal');
    if (el) el.remove();
    OrdexaNav.navigate('home');
  }
};

if (typeof window !== 'undefined') {
  window.OrdexaWaitTimeChart = OrdexaWaitTimeChart;
  window.OrdexaQueueConfirmationModal = OrdexaQueueConfirmationModal;
}

const OrdexaCustomerQueue = {
  activeUnsubscribe: null,
  joinMode: 'queue', // 'queue' | 'appointment'

  async renderJoin(container, serviceId) {
    const user = OrdexaAPI.auth.getCurrentUser();
    if (!user) {
      OrdexaNav.navigate('login', { returnTo: 'join-queue', serviceId });
      return;
    }

    const service = await OrdexaAPI.services.getById(serviceId);
    if (!service) {
      OrdexaNav.navigate('explore');
      return;
    }

    const org = await OrdexaAPI.organizations.getById(service.organizationId);

    // Check if customer already has active ticket
    const existing = await OrdexaAPI.queues.getCustomerActiveEntry(user.id);
    if (existing) {
      OrdexaUtils.showToast('You already have an active queue token');
      OrdexaNav.navigate('live-queue', { entryId: existing.id });
      return;
    }

    const entries = OrdexaStorage.Queues.getEntriesByService(service.id);
    const waiting = entries.filter((e) => ['WAITING', 'CALLED'].includes(e.status)).length;
    const estWait = waiting * (service.avgServiceTime || 10);

    const isAppt = OrdexaNav.routeParams.mode === 'appointment' || this.joinMode === 'appointment';

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <button class="btn btn-secondary btn-sm" style="width:auto;margin-bottom:16px;" onclick="OrdexaNav.navigate('service', { id: '${service.id}' })">
          &larr; Back to Service
        </button>

        <h1 style="font-size:22px;font-weight:800;color:#0B132B;margin-bottom:6px;">
          ${isAppt ? 'Book Appointment' : 'Confirm Queue Entry'}
        </h1>
        <p style="font-size:13px;color:#475569;margin-bottom:16px;">
          ${isAppt ? 'Select a time slot to reserve your scheduled service.' : 'Review details before reserving your spot in line.'}
        </p>

        <!-- Mode Toggle Tabs (Instant Queue vs Appointment) -->
        <div style="display:grid;grid-template-columns:1fr 1fr;background:#F1F5F9;padding:4px;border-radius:10px;margin-bottom:18px;">
          <button
            type="button"
            id="tab-mode-queue"
            style="padding:8px;font-size:12px;font-weight:700;border:none;border-radius:8px;cursor:pointer;transition:all 0.15s ease;background:${!isAppt ? '#FFFFFF' : 'transparent'};color:${!isAppt ? '#2563EB' : '#64748B'};box-shadow:${!isAppt ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};"
            onclick="OrdexaCustomerQueue.switchJoinMode('${service.id}', 'queue')">
            Instant Queue
          </button>
          <button
            type="button"
            id="tab-mode-appointment"
            style="padding:8px;font-size:12px;font-weight:700;border:none;border-radius:8px;cursor:pointer;transition:all 0.15s ease;background:${isAppt ? '#FFFFFF' : 'transparent'};color:${isAppt ? '#2563EB' : '#64748B'};box-shadow:${isAppt ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};"
            onclick="OrdexaCustomerQueue.switchJoinMode('${service.id}', 'appointment')">
            Book Appointment
          </button>
        </div>

        <div class="card">
          <div style="font-size:11px;font-weight:700;color:#2563EB;text-transform:uppercase;margin-bottom:4px;">${OrdexaUtils.escapeHtml(org.name)}</div>
          <h2 style="font-size:18px;font-weight:800;color:#0F172A;margin-bottom:8px;">${OrdexaUtils.escapeHtml(service.name)}</h2>
          <div style="display:flex;gap:16px;font-size:12px;color:#64748B;padding-top:8px;border-top:1px solid #E2E8F0;">
            <span>People ahead: <strong>${waiting}</strong></span>
            <span>Est. wait: <strong>~${estWait} mins</strong></span>
          </div>
        </div>

        <form id="confirm-join-form">
          ${
            isAppt
              ? `
              <div class="form-group">
                <label class="form-label">Select Available Time Slot (Today)</label>
                <select id="appointment-slot-select" class="form-input" required>
                  <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM (Next available)</option>
                  <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                  <option value="01:30 PM - 02:00 PM">01:30 PM - 02:00 PM</option>
                  <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                  <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                  <option value="04:30 PM - 05:00 PM">04:30 PM - 05:00 PM</option>
                </select>
              </div>
            `
              : ''
          }

          <div class="form-group">
            <label class="form-label">Customer Name</label>
            <input type="text" id="join-cust-name" class="form-input" value="${OrdexaUtils.escapeHtml(user.firstName + ' ' + user.lastName)}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Mobile Number (for SMS & updates)</label>
            <input type="tel" id="join-cust-mobile" class="form-input" value="${OrdexaUtils.escapeHtml(user.mobile || '')}" required />
          </div>

          <div class="notice-box" style="margin-top:16px;">
            <p style="font-size:11px;color:#1E3A8A;margin:0;">
              ${
                isAppt
                  ? 'Your appointment token will be allocated upon confirmation. Please arrive 5 minutes before your window.'
                  : 'By joining this queue, your spot will be held in real-time. Please stay within notification reach.'
              }
            </p>
          </div>

          <button type="submit" class="btn btn-primary" id="confirm-join-btn" style="margin-top:16px;">
            ${isAppt ? 'Confirm & Book Appointment' : 'Confirm & Get Token'}
          </button>
        </form>
      </div>
    `;

    document.getElementById('confirm-join-form').onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('confirm-join-btn');
      btn.disabled = true;
      btn.innerText = isAppt ? 'Booking Appointment...' : 'Allocating Token...';

      const customerName = document.getElementById('join-cust-name').value.trim();
      const customerMobile = document.getElementById('join-cust-mobile').value.trim();
      const apptSlotSelect = document.getElementById('appointment-slot-select');
      const appointmentSlot = apptSlotSelect ? apptSlotSelect.value : null;

      try {
        const entry = await OrdexaAPI.queues.join({
          customerId: user.id,
          customerName,
          customerMobile,
          serviceId: service.id,
          orgId: org.id,
          isWalkIn: false,
          isAppointment: isAppt,
          appointmentTime: appointmentSlot
        });

        // Trigger Modal Confirmation Dialog summarizing service, expected wait time & token number
        OrdexaQueueConfirmationModal.show({
          entry,
          service,
          org,
          expectedWait: isAppt ? (service.avgServiceTime || 10) : estWait,
          isAppointment: isAppt,
          appointmentSlot
        });

        btn.disabled = false;
        btn.innerText = isAppt ? 'Confirm & Book Appointment' : 'Confirm & Get Token';
      } catch (err) {
        OrdexaUtils.showToast(err.message || 'Could not complete request', 'error');
        btn.disabled = false;
        btn.innerText = isAppt ? 'Confirm & Book Appointment' : 'Confirm & Get Token';
      }
    };
  },

  switchJoinMode(serviceId, mode) {
    this.joinMode = mode;
    OrdexaNav.navigate('join-queue', { serviceId, mode });
  },

  async renderLive(container, entryId) {
    if (this.activeUnsubscribe) {
      this.activeUnsubscribe();
      this.activeUnsubscribe = null;
    }

    const user = OrdexaAPI.auth.getCurrentUser();
    let entry = null;

    if (entryId) {
      entry = OrdexaStorage.Queues.getEntryById(entryId);
    } else if (user) {
      entry = await OrdexaAPI.queues.getCustomerActiveEntry(user.id);
    }

    if (!entry) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          </div>
          <h3 class="empty-title">No Active Queue</h3>
          <p class="empty-description">You are not currently waiting in any organization queue.</p>
          <button class="btn btn-primary btn-sm" onclick="OrdexaNav.navigate('explore')">Find a Queue</button>
        </div>
      `;
      return;
    }

    const refreshLiveView = async () => {
      const currentEntry = OrdexaStorage.Queues.getEntryById(entry.id);
      if (!currentEntry) return;

      const live = await OrdexaAPI.queues.getLivePosition(currentEntry.id);
      const isCalled = currentEntry.status === 'CALLED';
      const isServing = currentEntry.status === 'SERVING';
      const isHold = currentEntry.status === 'HOLD';
      const isCompleted = currentEntry.status === 'COMPLETED';

      let statusPillClass = 'badge-waiting';
      let statusText = 'Waiting in Line';
      if (isCalled) {
        statusPillClass = 'badge-called';
        statusText = 'NOW CALLED';
      } else if (isServing) {
        statusPillClass = 'badge-serving';
        statusText = 'Currently Serving';
      } else if (isHold) {
        statusPillClass = 'badge-hold';
        statusText = 'On Hold';
      } else if (isCompleted) {
        statusPillClass = 'badge-completed';
        statusText = 'Service Completed';
      }

      container.innerHTML = `
        <div style="margin-bottom:30px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <button class="btn btn-secondary btn-sm" style="width:auto;" onclick="OrdexaNav.navigate('home')">
              &larr; Home
            </button>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#059669;font-weight:600;">
              <span style="width:8px;height:8px;border-radius:50%;background:#10B981;animation:pulse-border 1.5s infinite;"></span>
              Real-Time Sync Active
            </div>
          </div>

          <div class="token-card ${isCalled ? 'status-called' : ''}">
            <div class="token-header-meta">${OrdexaUtils.escapeHtml(currentEntry.organizationName)}</div>
            <div class="token-number-hero">${OrdexaUtils.escapeHtml(currentEntry.token)}</div>
            <div class="token-service-name">${OrdexaUtils.escapeHtml(currentEntry.serviceName)}</div>
            <span class="token-status-pill ${statusPillClass}">
              ${statusText}
            </span>
          </div>

          ${
            isCalled
              ? `
              <div style="background-color:#E0E7FF;border:2px solid #818CF8;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center;">
                <div style="font-size:16px;font-weight:800;color:#312E81;margin-bottom:4px;">
                  IT'S YOUR TURN NOW!
                </div>
                <div style="font-size:14px;color:#3730A3;">
                  Please proceed immediately to <strong>${OrdexaUtils.escapeHtml(currentEntry.counterName || 'Counter')}</strong>.
                </div>
              </div>
            `
              : ''
          }

          <div class="live-metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${live.peopleAhead}</div>
              <div class="metric-label">People Ahead</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">~${live.estimatedWaitMinutes}m</div>
              <div class="metric-label">Est. Waiting Time</div>
            </div>
          </div>

          <!-- Historical Wait Times SVG Trend Line Visualization -->
          ${OrdexaWaitTimeChart.render(currentEntry.serviceId, OrdexaWaitTimeChart.currentRange || 'today')}

          <div class="queue-progress-bar">
            <div class="progress-step-item">
              <div class="step-indicator done">✓</div>
              <div class="step-text">Queue Joined (Token Issued)</div>
            </div>
            <div class="progress-step-item">
              <div class="step-indicator ${isCalled || isServing || isCompleted ? 'done' : 'active'}">
                ${isCalled || isServing || isCompleted ? '✓' : '2'}
              </div>
              <div class="step-text">Waiting in Line (${live.position > 1 ? `Position #${live.position}` : 'Next Up'})</div>
            </div>
            <div class="progress-step-item">
              <div class="step-indicator ${isCalled ? 'active' : isServing || isCompleted ? 'done' : ''}">
                ${isServing || isCompleted ? '✓' : '3'}
              </div>
              <div class="step-text">Called to Counter (${currentEntry.counterName || 'Awaiting counter'})</div>
            </div>
            <div class="progress-step-item">
              <div class="step-indicator ${isCompleted ? 'done' : ''}">
                ${isCompleted ? '✓' : '4'}
              </div>
              <div class="step-text">Service Completed</div>
            </div>
          </div>

          <div class="queue-actions-row">
            ${
              isHold
                ? `
                <button class="btn btn-primary" onclick="OrdexaCustomerQueue.rejoin('${currentEntry.id}')">
                  Rejoin Queue
                </button>
              `
                : !isCompleted && !isServing
                ? `
                <button class="btn btn-secondary" onclick="OrdexaCustomerQueue.hold('${currentEntry.id}')">
                  Put Spot On Hold
                </button>
              `
                : ''
            }

            ${
              !isCompleted
                ? `
                <button class="btn btn-danger btn-sm" onclick="OrdexaCustomerQueue.leave('${currentEntry.id}')">
                  Leave Queue
                </button>
              `
                : `
                <button class="btn btn-primary" onclick="OrdexaNav.navigate('home')">
                  Back to Home
                </button>
              `
            }
          </div>
        </div>
      `;
    };

    // Initial render
    await refreshLiveView();

    // Subscribe to real-time events & storage changes
    this.activeUnsubscribe = OrdexaRealtime.subscribe('queue_updated', () => {
      refreshLiveView();
    });
  },

  async hold(entryId) {
    if (!confirm('Put your spot on hold? You can rejoin whenever you are ready.')) return;
    try {
      await OrdexaAPI.queues.hold(entryId);
      OrdexaUtils.showToast('Spot placed on hold');
      this.renderLive(document.getElementById('app-main-content'), entryId);
    } catch (e) {
      OrdexaUtils.showToast(e.message, 'error');
    }
  },

  async rejoin(entryId) {
    try {
      await OrdexaAPI.queues.rejoin(entryId);
      OrdexaUtils.showToast('You have rejoined the queue');
      this.renderLive(document.getElementById('app-main-content'), entryId);
    } catch (e) {
      OrdexaUtils.showToast(e.message, 'error');
    }
  },

  async leave(entryId) {
    if (!confirm('Are you sure you want to cancel and leave this queue?')) return;
    try {
      const user = OrdexaAPI.auth.getCurrentUser();
      await OrdexaAPI.queues.leave(entryId, user ? user.id : null);
      OrdexaUtils.showToast('You have left the queue');
      OrdexaNav.navigate('home');
    } catch (e) {
      OrdexaUtils.showToast(e.message, 'error');
    }
  },

  async renderHistory(container) {
    const user = OrdexaAPI.auth.getCurrentUser();
    if (!user) {
      OrdexaNav.navigate('login', { returnTo: 'queue-history' });
      return;
    }

    const history = await OrdexaAPI.queues.getCustomerHistory(user.id);

    let listHtml = '';
    if (history.length === 0) {
      listHtml = `
        <div class="empty-state">
          <div class="empty-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          </div>
          <h3 class="empty-title">No queue history</h3>
          <p class="empty-description">Your completed and past queue entries will appear here.</p>
          <button class="btn btn-primary btn-sm" onclick="OrdexaNav.navigate('explore')">Find a Service</button>
        </div>
      `;
    } else {
      listHtml = history
        .map(
          (item) => `
          <div class="card">
            <div class="card-header">
              <div>
                <span style="font-size:18px;font-weight:800;color:#0B132B;">${OrdexaUtils.escapeHtml(item.token)}</span>
                <div style="font-size:12px;color:#64748B;">${OrdexaUtils.escapeHtml(item.serviceName)} • ${OrdexaUtils.escapeHtml(item.organizationName)}</div>
              </div>
              ${OrdexaUtils.getStatusBadge(item.status)}
            </div>
            <div style="font-size:11px;color:#94A3B8;display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid #F1F5F9;">
              <span>Joined: ${OrdexaUtils.formatDate(item.joinedAt)} at ${OrdexaUtils.formatTime(item.joinedAt)}</span>
              ${item.completedAt ? `<span>Completed: ${OrdexaUtils.formatTime(item.completedAt)}</span>` : ''}
            </div>
          </div>
        `
        )
        .join('');
    }

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <button class="btn btn-secondary btn-sm" style="width:auto;margin-bottom:16px;" onclick="OrdexaNav.navigate('profile')">
          &larr; Back to Profile
        </button>
        <h1 style="font-size:22px;font-weight:800;color:#0B132B;margin-bottom:16px;">Queue History</h1>
        ${listHtml}
      </div>
    `;
  }
};
