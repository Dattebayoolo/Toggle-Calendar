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

    // Live Real-Time Search (debounced — a full re-render per keystroke is wasteful)
    const searchInput = document.getElementById('globalSearchInput') || document.querySelector('.search-input');
    if (searchInput) {
      let searchDebounce = null;
      searchInput.addEventListener('input', e => {
        Toggle.state.searchQuery = e.target.value;
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
        }, 150);
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

    // Sidebar toggle (hamburger)
    // - Desktop (> 960px): collapse/expand the sidebar in the layout
    // - Mobile (<= 960px): slide the off-canvas sidebar in over a backdrop
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const mobileMQ = window.matchMedia('(max-width: 960px)');

    function setMobileSidebar(open) {
      if (sidebar) sidebar.classList.toggle('open', open);
      if (backdrop) backdrop.classList.toggle('visible', open);
    }
    function toggleSidebar(forceClose) {
      if (!sidebar) return;
      if (mobileMQ.matches) {
        const shouldOpen = forceClose ? false : !sidebar.classList.contains('open');
        setMobileSidebar(shouldOpen);
      } else if (forceClose) {
        document.body.classList.remove('sidebar-collapsed');
      } else {
        document.body.classList.toggle('sidebar-collapsed');
      }
    }

    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        if (mobileMQ.matches) {
          // On mobile the sidebar covers the screen, so this button closes it
          setMobileSidebar(false);
        } else {
          // On desktop the sidebar is always docked — this button toggles it
          document.body.classList.toggle('sidebar-collapsed');
        }
      });
    }

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => toggleSidebar());
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => setMobileSidebar(false));
    }

    // If the viewport crosses the breakpoint, reset transient sidebar state
    mobileMQ.addEventListener('change', e => {
      setMobileSidebar(false);
      if (e.matches) document.body.classList.remove('sidebar-collapsed');
    });

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

    // Urdu Language Toggle (Pillar 4b)
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        Toggle.state.lang = Toggle.state.lang === 'ur' ? 'en' : 'ur';
        if (typeof Toggle.savePrefs === 'function') Toggle.savePrefs();
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
        if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
          Toggle.popover.showToast(Toggle.state.lang === 'ur' ? 'زبان تبدیل ہوگئی (اردو)' : 'Switched to English');
        }
      });
    }

    // Provincial Holiday Selector (Pillar 4d)
    const provinceSelect = document.getElementById('provinceSelect');
    if (provinceSelect) {
      provinceSelect.addEventListener('change', e => {
        Toggle.state.province = e.target.value;
        if (typeof Toggle.savePrefs === 'function') Toggle.savePrefs();
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
        if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
          const provNames = {
            all: 'All Pakistan',
            federal: 'Federal Only',
            punjab: 'Punjab Holidays',
            sindh: 'Sindh Holidays',
            kpk: 'KPK Holidays',
            balochistan: 'Balochistan Holidays',
            ajk_gb: 'AJK / GB Holidays',
          };
          Toggle.popover.showToast(`Filtering: ${provNames[e.target.value] || e.target.value}`);
        }
      });
    }

    // PWA Install Prompt (Pillar 1)
    const installAppBtn = document.getElementById('installAppBtn');
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      Toggle.state.deferredInstallPrompt = e;
      if (installAppBtn) installAppBtn.classList.remove('hidden');
    });

    if (installAppBtn) {
      installAppBtn.addEventListener('click', async () => {
        const promptEvent = Toggle.state.deferredInstallPrompt;
        if (promptEvent) {
          promptEvent.prompt();
          const { outcome } = await promptEvent.userChoice;
          if (outcome === 'accepted') {
            installAppBtn.classList.add('hidden');
            if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
              Toggle.popover.showToast('App installed successfully! 🎉');
            }
          }
          Toggle.state.deferredInstallPrompt = null;
        } else {
          if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
            Toggle.popover.showToast('To install, use browser menu -> "Install App" or "Add to Home Screen"');
          }
        }
      });
    }

    // Notification Permission & Bell Toggle (Pillar 6)
    const notifBellBtn = document.getElementById('notifBellBtn');
    const notifBellIcon = document.getElementById('notifBellIcon');

    function updateBellUI() {
      if (!notifBellIcon) return;
      if ('Notification' in window && Notification.permission === 'granted' && Toggle.state.notificationsEnabled) {
        notifBellIcon.textContent = 'notifications_active';
        notifBellIcon.style.color = '#059669';
      } else {
        notifBellIcon.textContent = 'notifications_none';
        notifBellIcon.style.color = '';
      }
    }
    updateBellUI();

    if (notifBellBtn) {
      notifBellBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) {
          if (Toggle.popover) Toggle.popover.showToast('Notifications not supported in this browser');
          return;
        }

        if (Notification.permission === 'default') {
          const res = await Notification.requestPermission();
          if (res === 'granted') {
            Toggle.state.notificationsEnabled = true;
            if (typeof Toggle.savePrefs === 'function') Toggle.savePrefs();
            updateBellUI();
            new Notification('Toggle Calendar PK', {
              body: 'Reminders and prayer notifications activated! 🇵🇰',
              icon: 'icons/icon-192.svg',
            });
          }
        } else if (Notification.permission === 'granted') {
          Toggle.state.notificationsEnabled = !Toggle.state.notificationsEnabled;
          if (typeof Toggle.savePrefs === 'function') Toggle.savePrefs();
          updateBellUI();
          if (Toggle.popover) {
            Toggle.popover.showToast(Toggle.state.notificationsEnabled ? '🔔 Notifications enabled' : '🔕 Notifications muted');
          }
        } else {
          if (Toggle.popover) Toggle.popover.showToast('Please enable notifications in your browser site settings');
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

    // Tracking sets for periodic notifications
    window.__notifiedReminders = window.__notifiedReminders || new Set();
    window.__notifiedPrayers = window.__notifiedPrayers || new Set();
    window.__lastDigestDate = window.__lastDigestDate || '';

    // Periodic real-time background scheduler (every 30 seconds):
    // 1. Keeps next-prayer countdown and live current-time indicator line accurate
    // 2. Dispatches event reminders (5m, 15m, 30m, 1hr)
    // 3. Dispatches prayer Azan notifications
    // 4. Dispatches 8:00 AM PKT Daily Digest
    setInterval(() => {
      const now = new Date();
      Toggle.state.today = now;

      if (Toggle.sidebar && typeof Toggle.sidebar.renderStatusBar === 'function') {
        Toggle.sidebar.renderStatusBar();
      }
      if (Toggle.sidebar && typeof Toggle.sidebar.renderRamadanWidget === 'function') {
        Toggle.sidebar.renderRamadanWidget();
      }

      // Lightweight tick: move the "now" line + refresh status bar without
      // rebuilding the entire week/day grid every 30 seconds
      if (typeof Toggle.updateLiveIndicators === 'function') {
        Toggle.updateLiveIndicators();
      }
      // Full re-render only on date rollover (midnight), when "today" cells change
      const todayKey = now.toDateString();
      if (Toggle.__lastTickDateKey !== todayKey) {
        Toggle.__lastTickDateKey = todayKey;
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      }

      // Check Notification Reminders (Pillar 6)
      const notifsAllowed = ('Notification' in window && Notification.permission === 'granted' && Toggle.state.notificationsEnabled);
      const todayEvents = Toggle.utils && Toggle.utils.getEventsForDay ? Toggle.utils.getEventsForDay(now) : [];
      const nowMs = now.getTime();

      todayEvents.forEach(ev => {
        if (!ev.start) return;
        const remMin = ev.reminder !== undefined && ev.reminder !== 'none' ? parseInt(ev.reminder, 10) : 15;
        if (isNaN(remMin) || remMin <= 0) return;

        const startMs = new Date(ev.start).getTime();
        const diffMs = startMs - nowMs;
        const diffMin = Math.round(diffMs / 60000);

        if (diffMin >= 0 && diffMin <= remMin) {
          const notifKey = `rem_${ev.id}_${ev.start}_${remMin}`;
          if (!window.__notifiedReminders.has(notifKey)) {
            window.__notifiedReminders.add(notifKey);

            const title = `Reminder: ${ev.title}`;
            const body = `Starts in ${diffMin} min (${Toggle.utils.fmt12(ev.start)})${ev.location ? ' · ' + ev.location : ''}`;

            if (notifsAllowed) {
              new Notification(title, {
                body,
                icon: 'icons/icon-192.svg',
              });
            }
            if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
              Toggle.popover.showToast(`🔔 ${title}: ${body}`, 5000);
            }
          }
        }
      });

      // Prayer Time Alerts (Pillar 6)
      if (Toggle.utils && Toggle.utils.calcPrayerTimes) {
        const prayers = Toggle.utils.calcPrayerTimes(now, Toggle.state.city || 'karachi').filter(p => !p.isAux);
        const curH = now.getHours();
        const curM = now.getMinutes();

        prayers.forEach(p => {
          if (p.hour === curH && p.min === curM) {
            const prayerKey = `prayer_${p.name}_${now.toISOString().slice(0, 10)}`;
            if (!window.__notifiedPrayers.has(prayerKey)) {
              window.__notifiedPrayers.add(prayerKey);
              if (notifsAllowed) {
                new Notification(`🕌 Time for ${p.name} Prayer`, {
                  body: `${p.name} Azan in ${Toggle.utils.capitalize(Toggle.state.city || 'Karachi')} at ${p.fmt12}`,
                  icon: 'icons/icon-192.svg',
                });
              }
              if (Toggle.popover) {
                Toggle.popover.showToast(`🕌 Time for ${p.name} Prayer (${p.fmt12})`);
              }
            }
          }
        });
      }

      // 8:00 AM PKT Daily Digest (Pillar 6)
      const formatterPKT = new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });
      const pktParts = formatterPKT.formatToParts(now);
      const pktH = parseInt(pktParts.find(p => p.type === 'hour')?.value || '0', 10);
      const pktM = parseInt(pktParts.find(p => p.type === 'minute')?.value || '0', 10);
      const todayDateKey = now.toISOString().slice(0, 10);

      if (pktH === 8 && pktM === 0 && window.__lastDigestDate !== todayDateKey) {
        window.__lastDigestDate = todayDateKey;
        const count = todayEvents.length;
        const digestMsg = count === 0
          ? 'Good morning! No events scheduled for today.'
          : `Good morning! You have ${count} event${count > 1 ? 's' : ''} scheduled today.`;

        if (notifsAllowed) {
          new Notification("Today's Agenda — Toggle Calendar 🇵🇰", {
            body: digestMsg,
            icon: 'icons/icon-192.svg',
          });
        }
        if (Toggle.popover) {
          Toggle.popover.showToast(`📅 ${digestMsg}`, 6000);
        }
      }
    }, 30000);
  };

  // Global alias
  window.initListeners = listeners.initListeners;
})(window);
