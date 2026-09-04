/**
 * render.js — Main render orchestrator
 * Coordinates rendering the active view and sidebar widgets
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};

  Toggle.renderAll = function() {
    // Sidebar & header widgets
    if (Toggle.views && typeof Toggle.views.renderMiniCal === 'function') Toggle.views.renderMiniCal();
    if (Toggle.sidebar) {
      if (typeof Toggle.sidebar.renderPrayer === 'function') Toggle.sidebar.renderPrayer();
      if (typeof Toggle.sidebar.renderHolidays === 'function') Toggle.sidebar.renderHolidays();
      if (typeof Toggle.sidebar.renderRamadanWidget === 'function') Toggle.sidebar.renderRamadanWidget();
      if (typeof Toggle.sidebar.applyLanguage === 'function') Toggle.sidebar.applyLanguage();
      if (typeof Toggle.sidebar.renderStatusBar === 'function') Toggle.sidebar.renderStatusBar();
      if (typeof Toggle.sidebar.renderTopBar === 'function') Toggle.sidebar.renderTopBar();
    }

    // Hide all views first
    const views = ['monthView', 'weekView', 'dayView', 'agendaView'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    const activeView = (Toggle.state && Toggle.state.view) || 'month';

    // Display active view
    if (activeView === 'month') {
      const el = document.getElementById('monthView');
      if (el) el.classList.remove('hidden');
      if (Toggle.views && typeof Toggle.views.renderMonthView === 'function') Toggle.views.renderMonthView();
    } else if (activeView === 'week') {
      const el = document.getElementById('weekView');
      if (el) el.classList.remove('hidden');
      if (Toggle.views && typeof Toggle.views.renderWeekView === 'function') Toggle.views.renderWeekView();
    } else if (activeView === 'day') {
      const el = document.getElementById('dayView');
      if (el) el.classList.remove('hidden');
      if (Toggle.views && typeof Toggle.views.renderDayView === 'function') Toggle.views.renderDayView();
    } else if (activeView === 'agenda') {
      const el = document.getElementById('agendaView');
      if (el) el.classList.remove('hidden');
      if (Toggle.views && typeof Toggle.views.renderAgendaView === 'function') Toggle.views.renderAgendaView();
    }
  };

  // Lightweight live update: reposition the current-time line and refresh the
  // status bar without rebuilding the entire grid (called by the 30s timer).
  Toggle.updateLiveIndicators = function() {
    const PX_PER_MIN = 52 / 60;
    const now = new Date();
    const top = (now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN;
    document.querySelectorAll('.current-time-line').forEach(line => {
      line.style.top = `${top}px`;
    });
    if (Toggle.sidebar && typeof Toggle.sidebar.renderStatusBar === 'function') {
      Toggle.sidebar.renderStatusBar();
    }
  };

  // Global alias
  window.renderAll = Toggle.renderAll;
})(window);
