/**
 * main.js — Toggle Calendar entry point
 * Real-time event initialization, controls synchronization, and boot sequence.
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};

  Toggle.seedDemoEvents = function() {
    if (Toggle.state.events && Toggle.state.events.length > 0) return;

    const today = Toggle.state.today || new Date();

    function formatDT(offsetDays, hours, minutes = 0) {
      const d = new Date(today);
      d.setDate(today.getDate() + offsetDays);
      d.setHours(hours, minutes, 0, 0);
      const pad = n => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    Toggle.state.events = [
      {
        id: Toggle.getEventId(),
        title: 'Daily Engineering Standup',
        start: formatDT(0, 10, 0),
        end:   formatDT(0, 10, 30),
        category: 'work',
        recurrence: { freq: 'daily' },
        reminder: '15',
        exdates: [],
        location: 'Google Meet',
        description: 'Daily team sync on roadmap deliverables',
        attendees: 'team@toggle.pk',
        notify: ['whatsapp', 'push'],
      },
      {
        id: Toggle.getEventId(),
        title: 'Weekly Tech Demo & Retrospective',
        start: formatDT(1, 16, 0),
        end:   formatDT(1, 17, 30),
        category: 'work',
        recurrence: { freq: 'weekly' },
        reminder: '30',
        exdates: [],
        location: 'Zoom (ID: 849-201-443)',
        description: 'Feature show & tell + Q4 planning',
        attendees: 'devs@toggle.pk',
        notify: ['whatsapp'],
      },
      {
        id: Toggle.getEventId(),
        title: 'Doctor Checkup',
        start: formatDT(1, 11, 30),
        end:   formatDT(1, 12, 30),
        category: 'health',
        reminder: '60',
        location: 'Aga Khan Hospital, Karachi',
        description: 'Routine health checkup',
        attendees: '',
        notify: ['sms', 'push'],
      },
      {
        id: Toggle.getEventId(),
        title: 'Family Dinner',
        start: formatDT(2, 20, 0),
        end:   formatDT(2, 22, 0),
        category: 'family',
        reminder: '30',
        location: 'Kolachi Restaurant, Do Darya',
        description: 'Weekend family get-together',
        attendees: 'family-group',
        notify: ['whatsapp'],
      },
      {
        id: Toggle.getEventId(),
        title: 'Tech Meetup & Workshop',
        start: formatDT(4, 17, 0),
        end:   formatDT(4, 19, 0),
        category: 'social',
        reminder: '15',
        location: 'NIC Karachi / Habib University',
        description: 'Building modern Pakistani web applications',
        attendees: 'community@dev.pk',
        notify: ['whatsapp', 'push'],
      },
    ];

    Toggle.saveEvents();
  };

  Toggle.initApp = function() {
    // Global error surface: without this, one thrown error silently kills
    // every listener registered after it and the user sees nothing.
    window.addEventListener('error', e => {
      console.error('[Toggle]', e.message, e.filename ? `(${e.filename.split('/').pop()}:${e.lineno})` : '');
      try {
        if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
          Toggle.popover.showToast('⚠️ Something went wrong — please reload the page');
        }
      } catch { /* toast itself failed — nothing more we can do */ }
    });
    window.addEventListener('unhandledrejection', e => {
      console.error('[Toggle] Unhandled promise rejection:', e.reason);
    });

    // Register Service Worker for PWA (Pillar 1)
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.info('Service Worker registration skipped or failed:', err);
      });
    }

    if (Toggle.sidebar && typeof Toggle.sidebar.initTheme === 'function') Toggle.sidebar.initTheme();
    Toggle.seedDemoEvents();
    if (Toggle.sidebar && typeof Toggle.sidebar.syncControlsWithState === 'function') Toggle.sidebar.syncControlsWithState();
    if (Toggle.listeners && typeof Toggle.listeners.initListeners === 'function') Toggle.listeners.initListeners();
    if (Toggle.sidebar && typeof Toggle.sidebar.startClock === 'function') Toggle.sidebar.startClock();
    if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Toggle.initApp);
  } else {
    Toggle.initApp();
  }

  // Global aliases
  window.seedDemoEvents = Toggle.seedDemoEvents;
  window.initApp = Toggle.initApp;
})(window);
