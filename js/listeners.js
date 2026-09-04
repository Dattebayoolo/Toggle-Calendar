/**
 * listeners.js — Global DOM event listeners registration
 * Handles navigation, interactive toggles, live search, view switching,
 * calendar filtering, keyboard shortcuts, and export.
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const listeners = Toggle.listeners = Toggle.listeners || {};

  listeners.initListeners = function() {
    // Month / Period Navigation
    const prevBtn = document.getElementById('prevMonth');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const cur = Toggle.state.current || new Date();
        const sel = Toggle.state.selectedDate || new Date();
        const view = Toggle.state.view || 'month';

        if (view === 'week') {
          const d = new Date(sel);
          d.setDate(d.getDate() - 7);
          Toggle.state.selectedDate = d;
          Toggle.state.current = new Date(d.getFullYear(), d.getMonth(), 1);
        } else if (view === 'day') {
          const d = new Date(sel);
          d.setDate(d.getDate() - 1);
          Toggle.state.selectedDate = d;
          Toggle.state.current = new Date(d.getFullYear(), d.getMonth(), 1);
        } else {
          Toggle.state.current = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
        }
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    }

    const nextBtn = document.getElementById('nextMonth');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const cur = Toggle.state.current || new Date();
        const sel = Toggle.state.selectedDate || new Date();
        const view = Toggle.state.view || 'month';

        if (view === 'week') {
          const d = new Date(sel);
          d.setDate(d.getDate() + 7);
          Toggle.state.selectedDate = d;
          Toggle.state.current = new Date(d.getFullYear(), d.getMonth(), 1);
        } else if (view === 'day') {
          const d = new Date(sel);
          d.setDate(d.getDate() + 1);
          Toggle.state.selectedDate = d;
          Toggle.state.current = new Date(d.getFullYear(), d.getMonth(), 1);
        } else {
          Toggle.state.current = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    }

    const todayBtn = document.getElementById('todayBtn');
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        const today = Toggle.state.today || new Date();
        Toggle.state.current = new Date(today);
        Toggle.state.selectedDate = new Date(today);
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    }

    // View switch buttons
    document.querySelectorAll('.chip[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        Toggle.state.view = btn.dataset.view;
        document.querySelectorAll('.chip[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (typeof Toggle.savePrefs === 'function') Toggle.savePrefs();
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    });

    // Moon sighting toggle (Ruet-e-Hilal adjustment)
    ['moonAuto', 'moonMinus', 'moonPlus'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => {
        const offset = { moonAuto: 0, moonMinus: -1, moonPlus: 1 }[id];
        Toggle.state.moonOffset = offset;
        document.querySelectorAll('#moonToggleGroup .chip').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        if (typeof Toggle.savePrefs === 'function') Toggle.savePrefs();
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    });

    // City selector
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
      citySelect.addEventListener('change', e => {
        Toggle.state.city = e.target.value;
        if (typeof Toggle.savePrefs === 'function') Toggle.savePrefs();
        if (Toggle.sidebar && typeof Toggle.sidebar.renderPrayer === 'function') {
          Toggle.sidebar.renderPrayer();
        }
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    }

    // Cultural & Pakistan feature switches
    const toggleMap = {
      toggleCalEvents: 'showEvents',
      toggleCalPrayer: 'showPrayer',
      toggleCalHolidays: 'showHolidays',
      toggleHijri: 'showHijri',
      togglePrayer: 'showPrayer',
      toggleJummah: 'showJummah',
      toggleRamadan: 'showRamadan',
      toggleLoadShedding: 'showLoadShedding',
    };

    Object.entries(toggleMap).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          Toggle.state[key] = el.checked;

          // Keep MY CALENDARS Prayer checkbox and PAKISTAN FEATURES Prayer switch in sync
          if (id === 'toggleCalPrayer') {
            const prayerSwitch = document.getElementById('togglePrayer');
            if (prayerSwitch) prayerSwitch.checked = el.checked;
          } else if (id === 'togglePrayer') {
            const prayerCheck = document.getElementById('toggleCalPrayer');
            if (prayerCheck) prayerCheck.checked = el.checked;
          }

          if (typeof Toggle.savePrefs === 'function') Toggle.savePrefs();
          if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
        });
      }
    });

    // Live Real-Time Search
    const searchInput = document.getElementById('globalSearchInput') || document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        Toggle.state.searchQuery = e.target.value;
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    }

    // Export .ics Button
    const exportIcsBtn = document.getElementById('exportIcsBtn');
    if (exportIcsBtn) {
      exportIcsBtn.addEventListener('click', () => {
        if (Toggle.utils && typeof Toggle.utils.exportToICS === 'function') {
          Toggle.utils.exportToICS();
        }
      });
    }

    // Create event triggers
    const newEventBtn = document.getElementById('newEventBtn');
    if (newEventBtn) {
      newEventBtn.addEventListener('click', () => {
        if (Toggle.modal && typeof Toggle.modal.openNewEventModal === 'function') {
          Toggle.modal.openNewEventModal(Toggle.state.selectedDate);
        }
      });
    }

    const fab = document.getElementById('fab');
    if (fab) {
      fab.addEventListener('click', () => {
        if (Toggle.modal && typeof Toggle.modal.openNewEventModal === 'function') {
          Toggle.modal.openNewEventModal(Toggle.state.selectedDate);
        }
      });
    }

    // Modal & popover sub-listeners
    if (Toggle.modal && typeof Toggle.modal.initModalListeners === 'function') {
      Toggle.modal.initModalListeners();
    }
    if (Toggle.popover && typeof Toggle.popover.initPopoverListeners === 'function') {
      Toggle.popover.initPopoverListeners();
    }

    // Mobile sidebar hamburger
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('open');
      });
    }

    // Dismiss popover when clicking outside
    document.addEventListener('click', e => {
      const pop = document.getElementById('eventPopover');
      if (pop && !pop.classList.contains('hidden')) {
        if (!pop.contains(e.target) &&
            !e.target.closest('.event-chip') &&
            !e.target.closest('.agenda-event-item[data-id]') &&
            !e.target.closest('.week-event-block')) {
          if (Toggle.popover && typeof Toggle.popover.hidePopover === 'function') {
            Toggle.popover.hidePopover();
          }
        }
      }
    });

    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        if (Toggle.sidebar && typeof Toggle.sidebar.toggleTheme === 'function') {
          Toggle.sidebar.toggleTheme();
        }
      });
    }

    // Global keyboard shortcuts (Cmd+K / Ctrl+K, Escape)
    document.addEventListener('keydown', e => {
      // ⌘K or Ctrl+K -> Focus Search
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const input = document.getElementById('globalSearchInput') || document.querySelector('.search-input');
        if (input) {
          input.focus();
          input.select();
        }
      }

      if (e.key === 'Escape') {
        const input = document.getElementById('globalSearchInput') || document.querySelector('.search-input');
        if (document.activeElement === input) {
          input.value = '';
          Toggle.state.searchQuery = '';
          input.blur();
          if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
        }
        if (Toggle.modal && typeof Toggle.modal.closeModal === 'function') {
          Toggle.modal.closeModal();
        }
        if (Toggle.popover && typeof Toggle.popover.hidePopover === 'function') {
          Toggle.popover.hidePopover();
        }
      }
    });

    // Periodic real-time update (every 30 seconds):
    // Keeps next-prayer countdown and live current-time indicator line accurate
    setInterval(() => {
      Toggle.state.today = new Date();
      if (Toggle.sidebar && typeof Toggle.sidebar.renderStatusBar === 'function') {
        Toggle.sidebar.renderStatusBar();
      }
      // If in week or day view, re-render to advance red current time line
      const view = Toggle.state.view;
      if (view === 'week' || view === 'day') {
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      }
    }, 30000);
  };

  // Global alias
  window.initListeners = listeners.initListeners;
})(window);
