/**
 * state.js — Single source of truth for all app state.
 * Real-time state management with localStorage synchronization.
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};

  /* ── Event persistence ── */
  Toggle.loadEvents = function() {
    try {
      return JSON.parse(localStorage.getItem('toggle_events') || '[]');
    } catch {
      return [];
    }
  };

  Toggle.saveEvents = function() {
    localStorage.setItem('toggle_events', JSON.stringify(Toggle.state.events || []));
    // Bump version so per-day event caches know to recompute
    Toggle._eventsVersion = (Toggle._eventsVersion || 0) + 1;
  };

  Toggle.getEventId = function() {
    return 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  };

  /* ── User Preferences Persistence ── */
  Toggle.loadPrefs = function() {
    try {
      return JSON.parse(localStorage.getItem('toggle_prefs') || '{}');
    } catch {
      return {};
    }
  };

  Toggle.savePrefs = function() {
    const s = Toggle.state || {};
    const prefs = {
      city: s.city,
      showHijri: s.showHijri,
      showPrayer: s.showPrayer,
      showJummah: s.showJummah,
      showRamadan: s.showRamadan,
      showLoadShedding: s.showLoadShedding,
      showEvents: s.showEvents,
      showHolidays: s.showHolidays,
      moonOffset: s.moonOffset,
      view: s.view,
      lang: s.lang,
      province: s.province,
      notificationsEnabled: s.notificationsEnabled,
    };
    localStorage.setItem('toggle_prefs', JSON.stringify(prefs));
  };

  const savedPrefs = Toggle.loadPrefs();

  /* ── Application State (Real-time single source of truth) ── */
  Toggle.state = {
    today:                new Date(),
    current:              new Date(),
    selectedDate:         new Date(),
    view:                 savedPrefs.view || 'month',   // 'month' | 'week' | 'day' | 'agenda'
    moonOffset:           typeof savedPrefs.moonOffset === 'number' ? savedPrefs.moonOffset : 0,
    city:                 savedPrefs.city || 'karachi',
    lang:                 savedPrefs.lang || 'en',       // 'en' | 'ur'
    province:             savedPrefs.province || 'all',  // 'all' | 'federal' | 'punjab' | 'sindh' | 'kpk' | 'balochistan' | 'ajk_gb'
    notificationsEnabled: savedPrefs.notificationsEnabled === true,
    showHijri:            savedPrefs.showHijri !== undefined ? savedPrefs.showHijri : true,
    showPrayer:           savedPrefs.showPrayer !== undefined ? savedPrefs.showPrayer : true,
    showJummah:           savedPrefs.showJummah !== undefined ? savedPrefs.showJummah : true,
    showRamadan:          savedPrefs.showRamadan !== undefined ? savedPrefs.showRamadan : false,
    showLoadShedding:     savedPrefs.showLoadShedding !== undefined ? savedPrefs.showLoadShedding : false,
    showEvents:           savedPrefs.showEvents !== undefined ? savedPrefs.showEvents : true,
    showHolidays:         savedPrefs.showHolidays !== undefined ? savedPrefs.showHolidays : true,
    searchQuery:          '',
    events:               Toggle.loadEvents(),
    editingId:            null,
    deferredInstallPrompt: null,
  };

  // Global aliases
  window.state = Toggle.state;
  window.loadEvents = Toggle.loadEvents;
  window.saveEvents = Toggle.saveEvents;
  window.savePrefs = Toggle.savePrefs;
  window.getEventId = Toggle.getEventId;
})(window);
