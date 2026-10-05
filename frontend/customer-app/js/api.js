/**
 * ORDEXA Centralized API Client Layer
 * Standard asynchronous interface for all data calls.
 * Seamlessly interfaces with local storage repository in MVP mode,
 * and is 100% plug-and-play ready for FastAPI REST backend endpoints.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['OrdexaStorage'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./storage.js'));
  } else {
    root.OrdexaAPI = factory(root.OrdexaStorage);
  }
})(typeof self !== 'undefined' ? self : this, function (storage) {
  'use strict';

  // Config flag: when ready to switch to FastAPI backend, set USE_REMOTE_API = true
  const USE_REMOTE_API = false;
  const API_BASE_URL = '/api';

  // Simulated latency helper to test realistic loading states (50-120ms)
  function delay(ms = 80) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const auth = {
    async registerCustomer(userData) {
      await delay();
      if (!storage) throw new Error('Storage repository not loaded');
      const user = storage.Users.create({
        ...userData,
        role: 'customer'
      });
      storage.Session.set(user);
      return { success: true, user };
    },

    async registerAdmin(userData, orgData) {
      await delay();
      if (!storage) throw new Error('Storage repository not loaded');
      const user = storage.Users.create({
        ...userData,
        role: 'admin'
      });
      const org = storage.Organizations.create(orgData, user.id);
      user.organizationId = org.id;
      storage.Session.set(user);
      return { success: true, user, organization: org };
    },

    async login(email, password, expectedRole) {
      await delay();
      if (!storage) throw new Error('Storage repository not loaded');
      const user = storage.Users.authenticate(email, password, expectedRole);
      const session = storage.Session.set(user);
      return { success: true, user, session };
    },

    async logout() {
      await delay();
      if (!storage) throw new Error('Storage repository not loaded');
      storage.Session.clear();
      return { success: true };
    },

    getCurrentUser() {
      if (!storage) return null;
      const session = storage.Session.get();
      if (!session) return null;
      return storage.Users.findById(session.userId) || session;
    },

    isAuthenticated() {
      return storage ? storage.Session.isAuthenticated() : false;
    }
  };

  const organizations = {
    async getAll() {
      await delay();
      return storage.Organizations.getAll();
    },

    async getById(id) {
      await delay();
      const org = storage.Organizations.getById(id);
      if (!org) return null;
      const services = storage.Services.getByOrg(id);
      const counters = storage.Counters.getByOrg(id);
      return { ...org, services, counters };
    },

    async create(orgData, adminUserId) {
      await delay();
      return storage.Organizations.create(orgData, adminUserId);
    },

    async update(id, updates) {
      await delay();
      return storage.Organizations.update(id, updates);
    }
  };

  const services = {
    async getByOrganization(orgId) {
      await delay();
      return storage.Services.getByOrg(orgId);
    },

    async getById(id) {
      await delay();
      return storage.Services.getById(id);
    },

    async create(serviceData) {
      await delay();
      return storage.Services.create(serviceData);
    },

    async update(id, updates) {
      await delay();
      return storage.Services.update(id, updates);
    },

    async delete(id) {
      await delay();
      return storage.Services.delete(id);
    }
  };

  const counters = {
    async getByOrganization(orgId) {
      await delay();
      return storage.Counters.getByOrg(orgId);
    },

    async getById(id) {
      await delay();
      return storage.Counters.getById(id);
    },

    async create(counterData) {
      await delay();
      return storage.Counters.create(counterData);
    },

    async update(id, updates) {
      await delay();
      return storage.Counters.update(id, updates);
    },

    async delete(id) {
      await delay();
      return storage.Counters.delete(id);
    }
  };

  const staff = {
    async getByOrganization(orgId) {
      await delay();
      return storage.Staff.getByOrg(orgId);
    },

    async create(staffData) {
      await delay();
      return storage.Staff.create(staffData);
    },

    async update(id, updates) {
      await delay();
      return storage.Staff.update(id, updates);
    },

    async delete(id) {
      await delay();
      return storage.Staff.delete(id);
    }
  };

  const queues = {
    async getEntriesByOrg(orgId) {
      await delay();
      return storage.Queues.getEntriesByOrg(orgId);
    },

    async getEntriesByService(serviceId) {
      await delay();
      return storage.Queues.getEntriesByService(serviceId);
    },

    async getCustomerActiveEntry(customerId) {
      await delay();
      return storage.Queues.getActiveCustomerEntry(customerId);
    },

    async getCustomerHistory(customerId) {
      await delay();
      return storage.Queues.getCustomerHistory(customerId);
    },

    async getLivePosition(entryId) {
      return storage.Queues.getLivePosition(entryId);
    },

    async join(params) {
      await delay();
      return storage.Queues.joinQueue(params);
    },

    async hold(entryId) {
      await delay();
      return storage.Queues.holdQueueEntry(entryId);
    },

    async rejoin(entryId) {
      await delay();
      return storage.Queues.rejoinQueueEntry(entryId);
    },

    async leave(entryId, customerId) {
      await delay();
      return storage.Queues.leaveQueue(entryId, customerId);
    }
  };

  const admin = {
    async callNext(counterId, orgId) {
      await delay();
      return storage.Queues.callNext(counterId, orgId);
    },

    async startServing(entryId) {
      await delay();
      return storage.Queues.startServing(entryId);
    },

    async recall(entryId) {
      await delay();
      return storage.Queues.recall(entryId);
    },

    async skip(entryId) {
      await delay();
      return storage.Queues.skipQueueEntry(entryId);
    },

    async complete(entryId) {
      await delay();
      return storage.Queues.completeQueueEntry(entryId);
    },

    async hold(entryId) {
      await delay();
      return storage.Queues.holdQueueEntry(entryId);
    },

    async getAnalytics(orgId) {
      await delay();
      return storage.Analytics.getOrgStats(orgId);
    }
  };

  const notifications = {
    async getByUser(userId) {
      await delay();
      return storage.Notifications.getByUser(userId);
    },

    async markAsRead(id) {
      return storage.Notifications.markAsRead(id);
    },

    async clear(userId) {
      return storage.Notifications.clearForUser(userId);
    }
  };

  const feedback = {
    async submit(data) {
      await delay();
      return storage.Feedback.create(data);
    },

    async getByOrg(orgId) {
      await delay();
      return storage.Feedback.getByOrg(orgId);
    }
  };

  return {
    auth,
    organizations,
    services,
    counters,
    staff,
    queues,
    admin,
    notifications,
    feedback
  };
});
