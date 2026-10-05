/**
 * ORDEXA Real-time Abstraction (WebSocket / EventBus Bridge)
 * In local MVP: binds to BroadcastChannel & custom DOM sync events so multiple
 * tabs/windows update in real-time without polling.
 * In production: transparently switches to real FastAPI WebSocket endpoint /ws/queues/{queueId}
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OrdexaRealtime = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class RealtimeClient {
    constructor() {
      this.listeners = new Map();
      this.ws = null;
      this.channel = null;
      this.connected = false;

      this.initLocalBus();
    }

    initLocalBus() {
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          this.channel = new BroadcastChannel('ordexa_realtime_bus');
          this.channel.onmessage = (e) => {
            if (e.data && e.data.event) {
              this.dispatch(e.data.event, e.data.payload);
            }
          };
        }
      } catch (err) {
        console.warn('BroadcastChannel failed to initialize:', err);
      }

      // Also listen to window ordexa_sync custom event
      if (typeof window !== 'undefined') {
        window.addEventListener('ordexa_sync', (e) => {
          if (e.detail && e.detail.event) {
            this.dispatch(e.detail.event, e.detail.payload);
          }
        });

        // Also listen to window storage event for cross-domain/tab updates
        window.addEventListener('storage', (e) => {
          if (e.key && e.key.startsWith('ordexa_')) {
            this.dispatch('storage_change', { key: e.key });
            this.dispatch('queue_updated', { key: e.key });
          }
        });
      }

      this.connected = true;
    }

    connect(endpointUrl) {
      if (!endpointUrl) return;
      try {
        this.ws = new WebSocket(endpointUrl);
        this.ws.onopen = () => {
          this.connected = true;
          this.dispatch('connected', {});
        };
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event) {
              this.dispatch(data.event, data.payload || data);
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };
        this.ws.onclose = () => {
          this.connected = false;
          this.dispatch('disconnected', {});
        };
      } catch (e) {
        console.warn('Could not establish WebSocket, fallback to local bus active', e);
      }
    }

    subscribe(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);

      // Return unsubscribe function
      return () => {
        const set = this.listeners.get(event);
        if (set) {
          set.delete(callback);
        }
      };
    }

    dispatch(event, payload) {
      // Notify specific event listeners
      const set = this.listeners.get(event);
      if (set) {
        set.forEach((cb) => {
          try {
            cb(payload);
          } catch (e) {
            console.error(`Error in event listener for ${event}:`, e);
          }
        });
      }
      // Notify wildcard listeners
      const wildcardSet = this.listeners.get('*');
      if (wildcardSet) {
        wildcardSet.forEach((cb) => {
          try {
            cb({ event, payload });
          } catch (e) {
            console.error('Error in wildcard event listener:', e);
          }
        });
      }
    }

    broadcast(event, payload) {
      if (this.channel) {
        this.channel.postMessage({ event, payload, timestamp: Date.now() });
      }
      this.dispatch(event, payload);
    }
  }

  return new RealtimeClient();
});
