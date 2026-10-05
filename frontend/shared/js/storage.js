/**
 * ORDEXA Centralized Data Layer & Local Storage Repository
 * Supports zero-fake-data strict initialization, real-time cross-tab synchronization
 * via BroadcastChannel & StorageEvents, and transparent API-ready abstraction.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OrdexaStorage = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const KEYS = {
    USERS: 'ordexa_users',
    SESSIONS: 'ordexa_sessions',
    ORGANIZATIONS: 'ordexa_organizations',
    SERVICES: 'ordexa_services',
    COUNTERS: 'ordexa_counters',
    COUNTER_SERVICES: 'ordexa_counter_services',
    STAFF: 'ordexa_staff',
    QUEUES: 'ordexa_queues',
    QUEUE_ENTRIES: 'ordexa_queue_entries',
    NOTIFICATIONS: 'ordexa_notifications',
    FEEDBACK: 'ordexa_feedback'
  };

  // Broadcast channel for real-time synchronization between tabs/windows
  let broadcastChannel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel('ordexa_realtime_bus');
    }
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }

  function emitChange(event, payload) {
    const detail = { event, payload, timestamp: Date.now() };
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(detail);
      } catch (err) {
        console.error('Error posting to BroadcastChannel', err);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ordexa_sync', { detail }));
    }
  }

  // Pure JSON helpers with safe fallback
  function getRaw(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return null;
    }
  }

  function setRaw(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  }

  // Initialize all storage buckets as EMPTY ARRAYS - strictly NO DEMO DATA
  function initStorage() {
    Object.values(KEYS).forEach((k) => {
      if (k === KEYS.SESSIONS) {
        if (!getRaw(k)) setRaw(k, null);
      } else {
        if (!getRaw(k)) setRaw(k, []);
      }
    });
  }

  initStorage();

  // Helper UUID-like ID generator
  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // ==========================================
  // USERS & AUTHENTICATION REPOSITORY
  // ==========================================
  const Users = {
    getAll() {
      return getRaw(KEYS.USERS) || [];
    },
    findById(id) {
      return this.getAll().find((u) => u.id === id) || null;
    },
    findByEmail(email) {
      if (!email) return null;
      return this.getAll().find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
    },
    create(userData) {
      const users = this.getAll();
      if (this.findByEmail(userData.email)) {
        throw new Error('An account with this email address already exists.');
      }
      const newUser = {
        id: generateId('usr'),
        role: userData.role || 'customer', // 'customer' | 'admin'
        firstName: (userData.firstName || '').trim(),
        lastName: (userData.lastName || '').trim(),
        email: (userData.email || '').trim().toLowerCase(),
        mobile: (userData.mobile || '').trim(),
        password: userData.password, // In future, FastAPI will handle hashed passwords
        organizationId: userData.organizationId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.push(newUser);
      setRaw(KEYS.USERS, users);
      emitChange('user_created', { userId: newUser.id, role: newUser.role });
      return newUser;
    },
    update(id, updates) {
      const users = this.getAll();
      const index = users.findIndex((u) => u.id === id);
      if (index === -1) throw new Error('User not found');
      users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
      setRaw(KEYS.USERS, users);
      emitChange('user_updated', { userId: id });
      return users[index];
    },
    authenticate(email, password, expectedRole) {
      const user = this.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password.');
      }
      if (user.password !== password) {
        throw new Error('Invalid email or password.');
      }
      if (expectedRole && user.role !== expectedRole) {
        throw new Error(`This account is registered as ${user.role}. Please log in under the ${user.role} portal.`);
      }
      return user;
    }
  };

  // ==========================================
  // SESSION REPOSITORY
  // ==========================================
  const Session = {
    get() {
      return getRaw(KEYS.SESSIONS);
    },
    set(user) {
      const sessionData = {
        userId: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        organizationId: user.organizationId || null,
        token: `ordexa_jwt_mock_${Date.now()}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };
      setRaw(KEYS.SESSIONS, sessionData);
      emitChange('session_login', sessionData);
      return sessionData;
    },
    clear() {
      setRaw(KEYS.SESSIONS, null);
      emitChange('session_logout', null);
    },
    isAuthenticated() {
      const s = this.get();
      return !!(s && s.userId && s.expiresAt > Date.now());
    }
  };

  // ==========================================
  // ORGANIZATIONS REPOSITORY
  // ==========================================
  const Organizations = {
    getAll() {
      return getRaw(KEYS.ORGANIZATIONS) || [];
    },
    getById(id) {
      return this.getAll().find((o) => o.id === id) || null;
    },
    create(data, adminUserId) {
      const orgs = this.getAll();
      const newOrg = {
        id: generateId('org'),
        name: (data.name || '').trim(),
        category: (data.category || 'Other').trim(),
        address: (data.address || '').trim(),
        city: (data.city || '').trim(),
        state: (data.state || '').trim(),
        contactNumber: (data.contactNumber || '').trim(),
        description: (data.description || '').trim(),
        status: 'ACTIVE',
        adminUserId: adminUserId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      orgs.push(newOrg);
      setRaw(KEYS.ORGANIZATIONS, orgs);

      // Link to admin user if provided
      if (adminUserId) {
        try {
          Users.update(adminUserId, { organizationId: newOrg.id });
        } catch (e) {}
      }

      emitChange('organization_created', newOrg);
      return newOrg;
    },
    update(id, updates) {
      const orgs = this.getAll();
      const index = orgs.findIndex((o) => o.id === id);
      if (index === -1) throw new Error('Organization not found');
      orgs[index] = { ...orgs[index], ...updates, updatedAt: new Date().toISOString() };
      setRaw(KEYS.ORGANIZATIONS, orgs);
      emitChange('organization_updated', orgs[index]);
      return orgs[index];
    }
  };

  // ==========================================
  // SERVICES REPOSITORY
  // ==========================================
  const Services = {
    getAll() {
      return getRaw(KEYS.SERVICES) || [];
    },
    getByOrg(orgId) {
      return this.getAll().filter((s) => s.organizationId === orgId);
    },
    getById(id) {
      return this.getAll().find((s) => s.id === id) || null;
    },
    create(data) {
      if (!data.organizationId) throw new Error('organizationId is required for service');
      const services = this.getAll();
      const newService = {
        id: generateId('srv'),
        organizationId: data.organizationId,
        name: (data.name || '').trim(),
        description: (data.description || '').trim(),
        prefix: (data.prefix || data.name.substring(0, 1).toUpperCase() || 'A').trim(),
        avgServiceTime: parseInt(data.avgServiceTime, 10) || 10, // in minutes
        queueEnabled: data.queueEnabled !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      services.push(newService);
      setRaw(KEYS.SERVICES, services);
      emitChange('service_created', newService);
      return newService;
    },
    update(id, updates) {
      const services = this.getAll();
      const index = services.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Service not found');
      services[index] = { ...services[index], ...updates, updatedAt: new Date().toISOString() };
      setRaw(KEYS.SERVICES, services);
      emitChange('service_updated', services[index]);
      return services[index];
    },
    delete(id) {
      let services = this.getAll();
      const target = services.find((s) => s.id === id);
      if (!target) return false;
      services = services.filter((s) => s.id !== id);
      setRaw(KEYS.SERVICES, services);
      emitChange('service_deleted', { id, organizationId: target.organizationId });
      return true;
    }
  };

  // ==========================================
  // COUNTERS REPOSITORY
  // ==========================================
  const Counters = {
    getAll() {
      return getRaw(KEYS.COUNTERS) || [];
    },
    getByOrg(orgId) {
      return this.getAll().filter((c) => c.organizationId === orgId);
    },
    getById(id) {
      return this.getAll().find((c) => c.id === id) || null;
    },
    create(data) {
      if (!data.organizationId) throw new Error('organizationId is required for counter');
      const counters = this.getAll();
      const newCounter = {
        id: generateId('cnt'),
        organizationId: data.organizationId,
        name: (data.name || '').trim(), // e.g. "Counter 1", "Registration Counter"
        counterNumber: data.counterNumber || `${counters.filter(c => c.organizationId === data.organizationId).length + 1}`,
        status: data.status || 'OPEN', // 'OPEN' | 'CLOSED' | 'PAUSED'
        assignedServiceIds: Array.isArray(data.assignedServiceIds) ? data.assignedServiceIds : [],
        currentServingEntryId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      counters.push(newCounter);
      setRaw(KEYS.COUNTERS, counters);
      emitChange('counter_created', newCounter);
      return newCounter;
    },
    update(id, updates) {
      const counters = this.getAll();
      const index = counters.findIndex((c) => c.id === id);
      if (index === -1) throw new Error('Counter not found');
      counters[index] = { ...counters[index], ...updates, updatedAt: new Date().toISOString() };
      setRaw(KEYS.COUNTERS, counters);
      emitChange('counter_updated', counters[index]);
      return counters[index];
    },
    delete(id) {
      let counters = this.getAll();
      const target = counters.find((c) => c.id === id);
      if (!target) return false;
      counters = counters.filter((c) => c.id !== id);
      setRaw(KEYS.COUNTERS, counters);
      emitChange('counter_deleted', { id, organizationId: target.organizationId });
      return true;
    }
  };

  // ==========================================
  // STAFF REPOSITORY
  // ==========================================
  const Staff = {
    getAll() {
      return getRaw(KEYS.STAFF) || [];
    },
    getByOrg(orgId) {
      return this.getAll().filter((s) => s.organizationId === orgId);
    },
    create(data) {
      if (!data.organizationId) throw new Error('organizationId is required for staff member');
      const staffList = this.getAll();
      const newStaff = {
        id: generateId('stf'),
        organizationId: data.organizationId,
        name: (data.name || '').trim(),
        email: (data.email || '').trim().toLowerCase(),
        mobile: (data.mobile || '').trim(),
        role: data.role || 'Operator', // 'Operator' | 'Manager'
        status: data.status || 'ACTIVE', // 'ACTIVE' | 'INACTIVE'
        assignedCounterIds: Array.isArray(data.assignedCounterIds) ? data.assignedCounterIds : [],
        createdAt: new Date().toISOString()
      };
      staffList.push(newStaff);
      setRaw(KEYS.STAFF, staffList);
      emitChange('staff_created', newStaff);
      return newStaff;
    },
    update(id, updates) {
      const staffList = this.getAll();
      const index = staffList.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Staff member not found');
      staffList[index] = { ...staffList[index], ...updates };
      setRaw(KEYS.STAFF, staffList);
      emitChange('staff_updated', staffList[index]);
      return staffList[index];
    },
    delete(id) {
      let staffList = this.getAll();
      const target = staffList.find((s) => s.id === id);
      if (!target) return false;
      staffList = staffList.filter((s) => s.id !== id);
      setRaw(KEYS.STAFF, staffList);
      emitChange('staff_deleted', { id, organizationId: target.organizationId });
      return true;
    }
  };

  // ==========================================
  // QUEUE & QUEUE ENTRIES REPOSITORY
  // ==========================================
  const Queues = {
    getEntries() {
      return getRaw(KEYS.QUEUE_ENTRIES) || [];
    },
    setEntries(entries) {
      setRaw(KEYS.QUEUE_ENTRIES, entries);
    },
    getEntriesByOrg(orgId) {
      return this.getEntries().filter((e) => e.organizationId === orgId);
    },
    getEntriesByService(serviceId) {
      return this.getEntries().filter((e) => e.serviceId === serviceId);
    },
    getEntryById(id) {
      return this.getEntries().find((e) => e.id === id) || null;
    },
    getActiveCustomerEntry(customerId) {
      if (!customerId) return null;
      // Active states: WAITING, CALLED, SERVING, HOLD
      return (
        this.getEntries().find(
          (e) =>
            e.customerId === customerId &&
            ['WAITING', 'CALLED', 'SERVING', 'HOLD'].includes(e.status)
        ) || null
      );
    },
    getCustomerHistory(customerId) {
      if (!customerId) return [];
      return this.getEntries()
        .filter((e) => e.customerId === customerId)
        .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    },

    /**
     * Compute next token for a service, e.g. "A-101", "B-102"
     */
    generateToken(service) {
      const prefix = service.prefix || service.name.substring(0, 1).toUpperCase() || 'Q';
      const allEntries = this.getEntriesByService(service.id);
      const today = new Date().toDateString();
      const todayCount = allEntries.filter(
        (e) => new Date(e.joinedAt).toDateString() === today
      ).length;
      const tokenNumber = 101 + todayCount;
      return `${prefix}-${tokenNumber}`;
    },

    /**
     * Join Queue - either online customer or walk-in
     */
    joinQueue({ customerId, customerName, customerMobile, serviceId, orgId, isWalkIn = false }) {
      const service = Services.getById(serviceId);
      if (!service) throw new Error('Service not found or queue is closed.');
      if (!service.queueEnabled) throw new Error('Queue for this service is currently disabled.');

      const org = Organizations.getById(orgId);
      if (!org) throw new Error('Organization not found.');

      // Check if user already in an active queue for this service
      if (customerId && !isWalkIn) {
        const existing = this.getActiveCustomerEntry(customerId);
        if (existing) {
          throw new Error('You already have an active queue token. Please complete or leave it first.');
        }
      }

      const token = this.generateToken(service);
      const entries = this.getEntries();

      // Current waiting count
      const currentWaiting = entries.filter(
        (e) => e.serviceId === serviceId && ['WAITING', 'CALLED', 'SERVING'].includes(e.status)
      );

      const newEntry = {
        id: generateId('tkn'),
        token,
        organizationId: orgId,
        serviceId,
        serviceName: service.name,
        organizationName: org.name,
        customerId: customerId || null,
        customerName: (customerName || 'Walk-in Guest').trim(),
        customerMobile: (customerMobile || '').trim(),
        isWalkIn: !!isWalkIn,
        status: 'WAITING', // WAITING | CALLED | SERVING | HOLD | SKIPPED | COMPLETED | CANCELLED
        counterId: null,
        counterName: null,
        joinedAt: new Date().toISOString(),
        calledAt: null,
        servedAt: null,
        completedAt: null,
        avgServiceTime: service.avgServiceTime || 10
      };

      entries.push(newEntry);
      this.setEntries(entries);

      // Create initial notification for customer if registered
      if (customerId) {
        Notifications.create({
          userId: customerId,
          type: 'QUEUE_JOINED',
          title: `Joined Queue: ${service.name}`,
          message: `Your token is ${token} at ${org.name}. Position: ${currentWaiting.length + 1}.`,
          token
        });
      }

      emitChange('queue_updated', {
        action: 'join',
        entryId: newEntry.id,
        serviceId,
        orgId
      });

      return newEntry;
    },

    /**
     * Calculate live position and wait time for a specific queue entry
     */
    getLivePosition(entryId) {
      const entry = this.getEntryById(entryId);
      if (!entry) return null;
      if (entry.status === 'COMPLETED' || entry.status === 'CANCELLED' || entry.status === 'SKIPPED') {
        return {
          status: entry.status,
          position: 0,
          peopleAhead: 0,
          estimatedWaitMinutes: 0
        };
      }

      const serviceEntries = this.getEntriesByService(entry.serviceId)
        .filter((e) => ['WAITING', 'CALLED', 'SERVING'].includes(e.status))
        .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

      const index = serviceEntries.findIndex((e) => e.id === entryId);
      const position = index >= 0 ? index + 1 : 1;
      const peopleAhead = Math.max(0, position - 1);
      const estimatedWaitMinutes = peopleAhead * (entry.avgServiceTime || 10);

      return {
        status: entry.status,
        position,
        peopleAhead,
        estimatedWaitMinutes,
        servingNow: serviceEntries.find((e) => e.status === 'SERVING')?.token || null,
        calledNow: serviceEntries.find((e) => e.status === 'CALLED')?.token || null
      };
    },

    /**
     * Admin Action: Call Next Customer
     */
    callNext(counterId, orgId) {
      const counter = Counters.getById(counterId);
      if (!counter) throw new Error('Counter not found.');
      if (counter.status === 'CLOSED') throw new Error('Counter is closed. Open it to call customers.');

      const entries = this.getEntries();

      // Complete any currently serving ticket on this counter if needed
      if (counter.currentServingEntryId) {
        const curr = entries.find((e) => e.id === counter.currentServingEntryId);
        if (curr && (curr.status === 'SERVING' || curr.status === 'CALLED')) {
          curr.status = 'COMPLETED';
          curr.completedAt = new Date().toISOString();
        }
      }

      // Find next WAITING ticket matching assigned services of this counter
      const candidateEntries = entries
        .filter((e) => {
          if (e.organizationId !== orgId || e.status !== 'WAITING') return false;
          if (counter.assignedServiceIds && counter.assignedServiceIds.length > 0) {
            return counter.assignedServiceIds.includes(e.serviceId);
          }
          return true; // if no specific filter, can call from all org services
        })
        .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

      if (candidateEntries.length === 0) {
        // Clear counter serving entry
        Counters.update(counterId, { currentServingEntryId: null });
        emitChange('queue_updated', { action: 'no_waiting', counterId, orgId });
        return null;
      }

      const nextEntry = candidateEntries[0];
      nextEntry.status = 'CALLED';
      nextEntry.counterId = counter.id;
      nextEntry.counterName = counter.name;
      nextEntry.calledAt = new Date().toISOString();

      this.setEntries(entries);
      Counters.update(counterId, { currentServingEntryId: nextEntry.id });

      // Notify customer
      if (nextEntry.customerId) {
        Notifications.create({
          userId: nextEntry.customerId,
          type: 'CALLED',
          title: `It's Your Turn! Token: ${nextEntry.token}`,
          message: `Please proceed to ${counter.name} for ${nextEntry.serviceName}.`,
          token: nextEntry.token
        });
      }

      emitChange('queue_updated', {
        action: 'call_next',
        entryId: nextEntry.id,
        counterId,
        orgId
      });

      return nextEntry;
    },

    /**
     * Admin Action: Mark Ticket as SERVING (in progress)
     */
    startServing(entryId) {
      const entries = this.getEntries();
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) throw new Error('Entry not found');
      entry.status = 'SERVING';
      entry.servedAt = new Date().toISOString();
      this.setEntries(entries);
      emitChange('queue_updated', { action: 'serving', entryId });
      return entry;
    },

    /**
     * Admin Action: Recall
     */
    recall(entryId) {
      const entry = this.getEntryById(entryId);
      if (!entry) throw new Error('Entry not found');
      if (entry.customerId) {
        Notifications.create({
          userId: entry.customerId,
          type: 'RECALLED',
          title: `Attention: Token ${entry.token}`,
          message: `Second call for token ${entry.token} at ${entry.counterName || 'Counter'}.`,
          token: entry.token
        });
      }
      emitChange('queue_updated', { action: 'recall', entryId });
      return entry;
    },

    /**
     * Admin or Customer Action: Hold
     */
    holdQueueEntry(entryId) {
      const entries = this.getEntries();
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) throw new Error('Entry not found');
      entry.status = 'HOLD';
      entry.heldAt = new Date().toISOString();
      this.setEntries(entries);

      if (entry.customerId) {
        Notifications.create({
          userId: entry.customerId,
          type: 'HOLD',
          title: `Token ${entry.token} on Hold`,
          message: `Your token has been placed on hold. Tap Rejoin when you are ready.`,
          token: entry.token
        });
      }

      emitChange('queue_updated', { action: 'hold', entryId });
      return entry;
    },

    /**
     * Rejoin from Hold
     */
    rejoinQueueEntry(entryId) {
      const entries = this.getEntries();
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) throw new Error('Entry not found');
      entry.status = 'WAITING';
      entry.joinedAt = new Date().toISOString(); // fair queue placement
      delete entry.heldAt;
      this.setEntries(entries);

      if (entry.customerId) {
        Notifications.create({
          userId: entry.customerId,
          type: 'RESUMED',
          title: `Token ${entry.token} Rejoined`,
          message: `You are back in the waiting queue for ${entry.serviceName}.`,
          token: entry.token
        });
      }

      emitChange('queue_updated', { action: 'rejoin', entryId });
      return entry;
    },

    /**
     * Admin Action: Skip
     */
    skipQueueEntry(entryId) {
      const entries = this.getEntries();
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) throw new Error('Entry not found');
      entry.status = 'SKIPPED';
      entry.skippedAt = new Date().toISOString();
      this.setEntries(entries);

      if (entry.customerId) {
        Notifications.create({
          userId: entry.customerId,
          type: 'SKIPPED',
          title: `Token ${entry.token} Skipped`,
          message: `Your turn was skipped as you were not present at the counter.`,
          token: entry.token
        });
      }

      emitChange('queue_updated', { action: 'skip', entryId });
      return entry;
    },

    /**
     * Admin Action: Complete
     */
    completeQueueEntry(entryId) {
      const entries = this.getEntries();
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) throw new Error('Entry not found');
      entry.status = 'COMPLETED';
      entry.completedAt = new Date().toISOString();
      this.setEntries(entries);

      // Clear counter if matching
      if (entry.counterId) {
        const counter = Counters.getById(entry.counterId);
        if (counter && counter.currentServingEntryId === entryId) {
          Counters.update(counter.id, { currentServingEntryId: null });
        }
      }

      if (entry.customerId) {
        Notifications.create({
          userId: entry.customerId,
          type: 'COMPLETED',
          title: `Service Completed! Token: ${entry.token}`,
          message: `Thank you for using ORDEXA. Your session at ${entry.organizationName} is complete.`,
          token: entry.token
        });
      }

      emitChange('queue_updated', { action: 'complete', entryId });
      return entry;
    },

    /**
     * Customer Action: Leave Queue
     */
    leaveQueue(entryId, customerId) {
      const entries = this.getEntries();
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) throw new Error('Entry not found');
      if (customerId && entry.customerId !== customerId) {
        throw new Error('Unauthorized');
      }
      entry.status = 'CANCELLED';
      entry.cancelledAt = new Date().toISOString();
      this.setEntries(entries);

      emitChange('queue_updated', { action: 'leave', entryId });
      return entry;
    }
  };

  // ==========================================
  // NOTIFICATIONS REPOSITORY
  // ==========================================
  const Notifications = {
    getAll() {
      return getRaw(KEYS.NOTIFICATIONS) || [];
    },
    getByUser(userId) {
      if (!userId) return [];
      return this.getAll()
        .filter((n) => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    create({ userId, type, title, message, token }) {
      const list = this.getAll();
      const newNotif = {
        id: generateId('notif'),
        userId,
        type: type || 'INFO',
        title: title || 'Notification',
        message: message || '',
        token: token || null,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      list.push(newNotif);
      setRaw(KEYS.NOTIFICATIONS, list);
      emitChange('notification_created', newNotif);
      return newNotif;
    },
    markAsRead(id) {
      const list = this.getAll();
      const target = list.find((n) => n.id === id);
      if (target) {
        target.isRead = true;
        setRaw(KEYS.NOTIFICATIONS, list);
      }
    },
    clearForUser(userId) {
      let list = this.getAll();
      list = list.filter((n) => n.userId !== userId);
      setRaw(KEYS.NOTIFICATIONS, list);
      emitChange('notifications_cleared', { userId });
    }
  };

  // ==========================================
  // FEEDBACK REPOSITORY
  // ==========================================
  const Feedback = {
    getAll() {
      return getRaw(KEYS.FEEDBACK) || [];
    },
    getByOrg(orgId) {
      return this.getAll().filter((f) => f.organizationId === orgId);
    },
    create(data) {
      const list = this.getAll();
      const newFb = {
        id: generateId('fb'),
        organizationId: data.organizationId,
        serviceId: data.serviceId || null,
        customerId: data.customerId || null,
        customerName: data.customerName || 'Anonymous',
        rating: data.rating || 5,
        comment: (data.comment || '').trim(),
        createdAt: new Date().toISOString()
      };
      list.push(newFb);
      setRaw(KEYS.FEEDBACK, list);
      emitChange('feedback_created', newFb);
      return newFb;
    }
  };

  // ==========================================
  // REAL-TIME ANALYTICS (100% Dynamic, Zero Fake)
  // ==========================================
  const Analytics = {
    getOrgStats(orgId) {
      const allEntries = Queues.getEntriesByOrg(orgId);
      const services = Services.getByOrg(orgId);
      const counters = Counters.getByOrg(orgId);

      const today = new Date().toDateString();
      const todayEntries = allEntries.filter(
        (e) => new Date(e.joinedAt).toDateString() === today
      );

      const waitingCount = allEntries.filter((e) =>
        ['WAITING', 'CALLED'].includes(e.status)
      ).length;

      const servedTodayCount = todayEntries.filter(
        (e) => e.status === 'COMPLETED'
      ).length;

      const activeQueuesCount = services.filter((s) => s.queueEnabled).length;
      const openCountersCount = counters.filter((c) => c.status === 'OPEN').length;

      // Calculate real average wait time in minutes for completed entries today
      const completedToday = todayEntries.filter(
        (e) => e.status === 'COMPLETED' && e.completedAt && e.joinedAt
      );

      let avgWaitMin = 0;
      if (completedToday.length > 0) {
        const totalWaitMs = completedToday.reduce((sum, item) => {
          const duration = new Date(item.completedAt) - new Date(item.joinedAt);
          return sum + Math.max(0, duration);
        }, 0);
        avgWaitMin = Math.round(totalWaitMs / completedToday.length / (1000 * 60));
      }

      // Breakdown by service
      const serviceStats = services.map((srv) => {
        const srvEntries = allEntries.filter((e) => e.serviceId === srv.id);
        const srvWaiting = srvEntries.filter((e) => ['WAITING', 'CALLED'].includes(e.status)).length;
        const srvServed = srvEntries.filter((e) => e.status === 'COMPLETED').length;
        return {
          serviceId: srv.id,
          name: srv.name,
          waiting: srvWaiting,
          served: srvServed,
          avgServiceTime: srv.avgServiceTime
        };
      });

      return {
        activeQueues: activeQueuesCount,
        waitingCustomers: waitingCount,
        servedToday: servedTodayCount,
        averageWaitMinutes: avgWaitMin,
        openCounters: openCountersCount,
        totalServices: services.length,
        totalCounters: counters.length,
        serviceStats
      };
    }
  };

  // Expose API
  return {
    KEYS,
    initStorage,
    emitChange,
    Users,
    Session,
    Organizations,
    Services,
    Counters,
    Staff,
    Queues,
    Notifications,
    Feedback,
    Analytics
  };
});
