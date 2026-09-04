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
        title: 'Sprint Planning & Standup',
        start: formatDT(0, 10, 0),
        end:   formatDT(0, 11, 0),
        category: 'work',
        location: 'Google Meet',
        description: 'Q4 Product Roadmap & Sprint Backlog review',
        attendees: 'team@toggle.pk',
        notify: ['whatsapp', 'push'],
      },
      {
        id: Toggle.getEventId(),
        title: 'Client Sync (London / Dubai)',
        start: formatDT(0, 15, 30),
        end:   formatDT(0, 16, 30),
        category: 'work',
        location: 'Zoom',
        description: 'Cross-timezone deliverable handoff',
        attendees: 'ahmed@client.co.uk',
        notify: ['whatsapp'],
      },
      {
        id: Toggle.getEventId(),
        title: 'Doctor Checkup',
        start: formatDT(1, 11, 30),
        end:   formatDT(1, 12, 30),
        category: 'health',
        location: 'Aga Khan Hospital, Karachi',
        description: 'Routine annual health checkup',
        attendees: '',
        notify: ['sms', 'push'],
      },
      {
        id: Toggle.getEventId(),
        title: 'Family Dinner',
        start: formatDT(2, 20, 0),
        end:   formatDT(2, 22, 0),
        category: 'family',
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
        location: 'NIC Karachi / Habib University',
        description: 'Building modern Pakistani web applications',
        attendees: 'community@dev.pk',
        notify: ['whatsapp', 'push'],
      },
    ];

    Toggle.saveEvents();
  };

  Toggle.initApp = function() {
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
