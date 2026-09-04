// --- js/constants.js ---
/**
 * constants.js — Application constants for Toggle Calendar
 * Pakistani public holidays, prayer times by city, category colors
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};

  /* ── Pakistani Public Holidays ── */
  Toggle.PK_HOLIDAYS = [
    { month: 2,  day: 5,  name: 'Kashmir Day' },
    { month: 3,  day: 23, name: 'Pakistan Day' },
    { month: 5,  day: 1,  name: 'Labour Day' },
    { month: 8,  day: 14, name: 'Independence Day' },
    { month: 11, day: 9,  name: 'Iqbal Day' },
    { month: 12, day: 25, name: 'Quaid Day / Christmas' },
  ];

  /* ── Prayer Times by City (approx for Sep 2026) ── */
  Toggle.PRAYER_TIMES = {
    karachi:   ['Fajr 05:04', 'Dhuhr 12:14', 'Asr 15:44', 'Maghrib 18:47', 'Isha 20:07'],
    lahore:    ['Fajr 04:40', 'Dhuhr 12:05', 'Asr 15:33', 'Maghrib 18:33', 'Isha 19:57'],
    islamabad: ['Fajr 04:38', 'Dhuhr 12:03', 'Asr 15:32', 'Maghrib 18:31', 'Isha 19:56'],
    peshawar:  ['Fajr 04:35', 'Dhuhr 11:58', 'Asr 15:29', 'Maghrib 18:27', 'Isha 19:50'],
    quetta:    ['Fajr 04:52', 'Dhuhr 12:08', 'Asr 15:38', 'Maghrib 18:41', 'Isha 20:03'],
    multan:    ['Fajr 04:45', 'Dhuhr 12:09', 'Asr 15:37', 'Maghrib 18:38', 'Isha 20:00'],
    faisalabad:['Fajr 04:43', 'Dhuhr 12:07', 'Asr 15:35', 'Maghrib 18:36', 'Isha 19:58'],
  };

  /* ── Category Color Map ── */
  Toggle.CAT_COLORS = {
    work: '#2563eb',
    personal: '#7c3aed',
    family: '#d97706',
    health: '#e11d48',
    religious: '#059669',
    social: '#db2777',
  };

  // Global aliases
  window.PK_HOLIDAYS = Toggle.PK_HOLIDAYS;
  window.PRAYER_TIMES = Toggle.PRAYER_TIMES;
  window.CAT_COLORS = Toggle.CAT_COLORS;
})(window);


// --- js/state.js ---
/**
 * state.js — Single source of truth for all app state.
 * Mutate directly; renderAll() will reflect changes.
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
    localStorage.setItem('toggle_events', JSON.stringify(Toggle.state.events));
  };

  Toggle.getEventId = function() {
    return 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  };

  /* ── Application State ── */
  Toggle.state = {
    today:           new Date(),
    current:         new Date(),
    selectedDate:    new Date(),
    view:            'month',   // 'month' | 'week' | 'day' | 'agenda'
    moonOffset:      0,         // Ruet-e-Hilal adjustment: -1 | 0 | +1
    city:            'karachi',
    showHijri:       true,
    showPrayer:      true,
    showJummah:      true,
    showRamadan:     false,
    showLoadShedding:false,
    events:          Toggle.loadEvents(),
    editingId:       null,
  };

  // Global aliases
  window.state = Toggle.state;
  window.loadEvents = Toggle.loadEvents;
  window.saveEvents = Toggle.saveEvents;
  window.getEventId = Toggle.getEventId;
})(window);


// --- js/utils.js ---
/**
 * utils.js — Helper utilities for Toggle Calendar
 * Hijri date conversion, date checks, formatters
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const utils = Toggle.utils = Toggle.utils || {};

  /* ── Hijri Conversion (simplified Umm al-Qura approximate) ── */
  utils.toHijri = function(date) {
    const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
    let l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
              Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
        Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l) / 709);
    const day = l - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    const months = ['Muh', 'Saf', 'Rab I', 'Rab II', 'Jum I', 'Jum II', 'Raj', 'Sha', 'Ram', 'Shw', 'Dhu Q', 'Dhu H'];
    return { day, month, year, monthName: months[month - 1] };
  };

  utils.hijriDateStr = function(date, offset) {
    const off = (offset !== undefined) ? offset : Toggle.state.moonOffset;
    const h = utils.toHijri(date);
    const adjDay = h.day + off;
    return `${adjDay} ${h.monthName}`;
  };

  utils.hijriMonthStr = function(date) {
    const h = utils.toHijri(date);
    return `${h.monthName} ${h.year} AH`;
  };

  /* ── Date Comparison & Checks ── */
  utils.sameDay = function(a, b) {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  };

  utils.isFriday = function(date) {
    return date.getDay() === 5;
  };

  utils.isHoliday = function(date) {
    const holidays = Toggle.PK_HOLIDAYS || [];
    return holidays.find(h => h.month === date.getMonth() + 1 && h.day === date.getDate());
  };

  utils.getEventsForDay = function(date) {
    const events = (Toggle.state && Toggle.state.events) || [];
    return events.filter(e => {
      const d = new Date(e.start);
      return utils.sameDay(d, date);
    });
  };

  /* ── String & Time Formatters ── */
  utils.fmt12 = function(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${m} ${ampm}`;
  };

  utils.formatDateRange = function(start, end) {
    const ds = new Date(start);
    const de = end ? new Date(end) : null;
    const dateStr = ds.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!de) return `${dateStr} · ${utils.fmt12(start)}`;
    return `${dateStr}, ${utils.fmt12(start)} – ${utils.fmt12(end)}`;
  };

  utils.capitalize = function(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  utils.evt12Label = function(ev) {
    if (!ev || !ev.start) return '';
    const d = new Date(ev.start);
    if (d.getHours() === 0 && d.getMinutes() === 0) return '';
    return utils.fmt12(ev.start);
  };

  // Global aliases
  window.toHijri = utils.toHijri;
  window.hijriDateStr = utils.hijriDateStr;
  window.hijriMonthStr = utils.hijriMonthStr;
  window.sameDay = utils.sameDay;
  window.isFriday = utils.isFriday;
  window.isHoliday = utils.isHoliday;
  window.getEventsForDay = utils.getEventsForDay;
  window.fmt12 = utils.fmt12;
  window.formatDateRange = utils.formatDateRange;
  window.capitalize = utils.capitalize;
  window.evt12Label = utils.evt12Label;
})(window);


// --- js/components/popover.js ---
/**
 * popover.js — Event detail popover and toast notification component
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const popover = Toggle.popover = Toggle.popover || {};

  /* ── Toast Notifications ── */
  popover.showToast = function(msg, duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fadeout');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  /* ── Event Popover Display ── */
  popover.showEventPopover = function(id, anchor) {
    const events = (Toggle.state && Toggle.state.events) || [];
    const ev = events.find(e => e.id === id);
    if (!ev) return;

    const pop = document.getElementById('eventPopover');
    if (!pop) return;

    const colors = Toggle.CAT_COLORS || {};
    const color = colors[ev.category] || '#1a73e8';

    const colorBar = document.getElementById('popoverColorBar');
    if (colorBar) colorBar.style.background = color;

    const titleEl = document.getElementById('popoverTitle');
    if (titleEl) titleEl.textContent = ev.title;

    const timeEl = document.getElementById('popoverTime');
    if (timeEl) timeEl.textContent = Toggle.utils.formatDateRange(ev.start, ev.end);

    const locEl = document.getElementById('popoverLocation');
    if (locEl) locEl.textContent = ev.location ? '📍 ' + ev.location : '';

    const descEl = document.getElementById('popoverDesc');
    if (descEl) descEl.textContent = ev.description || '';

    // Position popover
    const rect = anchor.getBoundingClientRect();
    pop.classList.remove('hidden');
    pop.style.left = Math.min(rect.right + 8, window.innerWidth - 340) + 'px';
    pop.style.top  = Math.min(rect.top, window.innerHeight - 280) + 'px';

    pop.dataset.currentId = id;
  };

  popover.hidePopover = function() {
    const pop = document.getElementById('eventPopover');
    if (pop) pop.classList.add('hidden');
  };

  /* ── Popover Actions Setup ── */
  popover.initPopoverListeners = function() {
    const popClose = document.getElementById('popoverClose');
    if (popClose) popClose.addEventListener('click', popover.hidePopover);

    const popDelete = document.getElementById('popDelete');
    if (popDelete) {
      popDelete.addEventListener('click', () => {
        const pop = document.getElementById('eventPopover');
        const id = pop?.dataset.currentId;
        if (!id) return;
        const ev = Toggle.state.events.find(e => e.id === id);
        if (ev && confirm(`Delete "${ev.title}"?`)) {
          Toggle.state.events = Toggle.state.events.filter(e => e.id !== id);
          Toggle.saveEvents();
          popover.hidePopover();
          if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
          popover.showToast('Event deleted');
        }
      });
    }

    const popEdit = document.getElementById('popEdit');
    if (popEdit) {
      popEdit.addEventListener('click', () => {
        const pop = document.getElementById('eventPopover');
        const id = pop?.dataset.currentId;
        if (!id) return;
        popover.hidePopover();
        if (Toggle.modal && typeof Toggle.modal.openEditEventModal === 'function') {
          Toggle.modal.openEditEventModal(id);
        }
      });
    }

    const popShareWhatsApp = document.getElementById('popShareWhatsApp');
    if (popShareWhatsApp) {
      popShareWhatsApp.addEventListener('click', () => {
        const pop = document.getElementById('eventPopover');
        const id = pop?.dataset.currentId;
        const ev = Toggle.state.events.find(e => e.id === id);
        if (!ev) return;
        const text = encodeURIComponent(`📅 ${ev.title}\n🕐 ${Toggle.utils.formatDateRange(ev.start, ev.end)}${ev.location ? '\n📍 ' + ev.location : ''}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      });
    }
  };

  // Global aliases
  window.showToast = popover.showToast;
  window.showEventPopover = popover.showEventPopover;
  window.hidePopover = popover.hidePopover;
  window.initPopoverListeners = popover.initPopoverListeners;
})(window);


// --- js/components/modal.js ---
/**
 * modal.js — Event creation and edit modal component
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const modal = Toggle.modal = Toggle.modal || {};

  modal.openNewEventModal = function(date) {
    Toggle.state.editingId = null;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Create event';

    const titleEl = document.getElementById('eventTitle');
    if (titleEl) titleEl.value = '';

    const catEl = document.getElementById('eventCategory');
    if (catEl) catEl.value = 'work';

    const locEl = document.getElementById('eventLocation');
    if (locEl) locEl.value = '';

    const descEl = document.getElementById('eventDesc');
    if (descEl) descEl.value = '';

    const attEl = document.getElementById('eventAttendees');
    if (attEl) attEl.value = '';

    if (date) {
      const pad = n => n.toString().padStart(2, '0');
      const y = date.getFullYear();
      const mo = pad(date.getMonth() + 1);
      const d = pad(date.getDate());
      const hour = 9;
      const startEl = document.getElementById('eventStart');
      const endEl = document.getElementById('eventEnd');
      if (startEl) startEl.value = `${y}-${mo}-${d}T${pad(hour)}:00`;
      if (endEl) endEl.value = `${y}-${mo}-${d}T${pad(hour + 1)}:00`;
    }

    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.add('open');
    setTimeout(() => titleEl && titleEl.focus(), 80);
  };

  modal.openEditEventModal = function(id) {
    const ev = Toggle.state.events.find(e => e.id === id);
    if (!ev) return;

    Toggle.state.editingId = id;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Edit event';

    const titleEl = document.getElementById('eventTitle');
    if (titleEl) titleEl.value = ev.title;

    const startEl = document.getElementById('eventStart');
    if (startEl) startEl.value = ev.start;

    const endEl = document.getElementById('eventEnd');
    if (endEl) endEl.value = ev.end || '';

    const catEl = document.getElementById('eventCategory');
    if (catEl) catEl.value = ev.category;

    const locEl = document.getElementById('eventLocation');
    if (locEl) locEl.value = ev.location || '';

    const descEl = document.getElementById('eventDesc');
    if (descEl) descEl.value = ev.description || '';

    const attEl = document.getElementById('eventAttendees');
    if (attEl) attEl.value = ev.attendees || '';

    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.add('open');
  };

  modal.closeModal = function() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  modal.saveEvent = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const titleEl = document.getElementById('eventTitle');
    const title = titleEl ? titleEl.value.trim() : '';
    if (!title) return;

    const startEl = document.getElementById('eventStart');
    const endEl = document.getElementById('eventEnd');
    const catEl = document.getElementById('eventCategory');
    const locEl = document.getElementById('eventLocation');
    const descEl = document.getElementById('eventDesc');
    const attEl = document.getElementById('eventAttendees');

    const ev = {
      id: Toggle.state.editingId || Toggle.getEventId(),
      title,
      start: startEl ? startEl.value : '',
      end: endEl ? endEl.value : '',
      category: catEl ? catEl.value : 'work',
      location: locEl ? locEl.value.trim() : '',
      description: descEl ? descEl.value.trim() : '',
      attendees: attEl ? attEl.value.trim() : '',
      notify: [...document.querySelectorAll('[name="notifMethod"]:checked')].map(c => c.value),
    };

    if (Toggle.state.editingId) {
      const idx = Toggle.state.events.findIndex(x => x.id === Toggle.state.editingId);
      if (idx !== -1) Toggle.state.events[idx] = ev;
    } else {
      Toggle.state.events.push(ev);
    }

    Toggle.saveEvents();
    modal.closeModal();
    if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
    if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
      Toggle.popover.showToast(`✅ "${title}" saved`);
    }
  };

  modal.initModalListeners = function() {
    const modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', modal.closeModal);

    const cancelEvent = document.getElementById('cancelEvent');
    if (cancelEvent) cancelEvent.addEventListener('click', modal.closeModal);

    const eventForm = document.getElementById('eventForm');
    if (eventForm) eventForm.addEventListener('submit', modal.saveEvent);

    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) modal.closeModal();
      });
    }
  };

  // Global aliases
  window.openNewEventModal = modal.openNewEventModal;
  window.openEditEventModal = modal.openEditEventModal;
  window.closeModal = modal.closeModal;
  window.saveEvent = modal.saveEvent;
  window.initModalListeners = modal.initModalListeners;
})(window);


// --- js/components/sidebar.js ---
/**
 * sidebar.js — Sidebar widgets: Prayer Times, Holidays, Status Bar, Clock, and Theme
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const sidebar = Toggle.sidebar = Toggle.sidebar || {};

  /* ── Prayer Times Widget ── */
  sidebar.renderPrayer = function() {
    const list = document.getElementById('prayerList');
    if (!list) return;

    const prayerTimesMap = Toggle.PRAYER_TIMES || {};
    const city = (Toggle.state && Toggle.state.city) || 'karachi';
    const times = prayerTimesMap[city] || prayerTimesMap.karachi || [];
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Parse prayer minutes
    const parsed = times.map(t => {
      const parts = t.split(' ');
      const name = parts[0];
      const [hStr, mStr] = parts[1].split(':');
      return { name, totalMin: parseInt(hStr, 10) * 60 + parseInt(mStr, 10), raw: parts[1] };
    });

    // Find active prayer
    let activeIdx = parsed.length - 1;
    for (let i = 0; i < parsed.length; i++) {
      if (nowMinutes < parsed[i].totalMin) {
        activeIdx = i === 0 ? parsed.length - 1 : i - 1;
        break;
      }
    }

    list.innerHTML = parsed.map((p, i) => `
      <div class="prayer-row ${i === activeIdx ? 'active' : ''}">
        <span class="prayer-name">${p.name}</span>
        <span class="prayer-time">${p.raw}</span>
      </div>
    `).join('');

    const cityBadge = document.getElementById('cityBadge');
    if (cityBadge && Toggle.utils && typeof Toggle.utils.capitalize === 'function') {
      cityBadge.textContent = Toggle.utils.capitalize(city);
    }
  };

  /* ── Holidays Widget ── */
  sidebar.renderHolidays = function() {
    const list = document.getElementById('holidayList');
    if (!list) return;

    const today = (Toggle.state && Toggle.state.today) || new Date();
    const holidays = Toggle.PK_HOLIDAYS || [];

    const upcoming = holidays.map(h => {
      let hDate = new Date(today.getFullYear(), h.month - 1, h.day);
      if (hDate < today) hDate = new Date(today.getFullYear() + 1, h.month - 1, h.day);
      const diff = Math.round((hDate - today) / 86400000);
      return { ...h, date: hDate, diff };
    }).sort((a, b) => a.diff - b.diff).slice(0, 5);

    list.innerHTML = upcoming.map(h => {
      const label = h.diff === 0 ? 'Today' : h.diff === 1 ? 'Tomorrow' : `${h.diff}d`;
      const dateStr = h.date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
      return `
        <div class="holiday-item">
          <div class="holiday-dot"></div>
          <div class="holiday-info">
            <div class="holiday-name">${h.name}</div>
            <div class="holiday-date">${dateStr}</div>
          </div>
          <span class="holiday-days-left">${label}</span>
        </div>
      `;
    }).join('');
  };

  /* ── Status Bar Widget ── */
  sidebar.renderStatusBar = function() {
    const bar = document.getElementById('statusIndicators');
    if (!bar) return;

    const state = Toggle.state || {};
    const pills = [];
    if (state.showJummah) pills.push(`<span class="status-pill green"><span class="status-dot"></span>Jummah Guard On</span>`);
    if (state.showHijri)  pills.push(`<span class="status-pill blue"><span class="status-dot"></span>Hijri Active</span>`);
    if (state.showRamadan) pills.push(`<span class="status-pill amber"><span class="status-dot"></span>Ramadan Mode</span>`);
    if (state.showLoadShedding) pills.push(`<span class="status-pill red"><span class="status-dot"></span>Load Shedding</span>`);
    if (state.moonOffset !== 0) pills.push(`<span class="status-pill amber"><span class="status-dot"></span>Moon ${state.moonOffset > 0 ? '+' : ''}${state.moonOffset}d</span>`);

    bar.innerHTML = pills.join('');
  };

  /* ── Top Bar Display ── */
  sidebar.renderTopBar = function() {
    const state = Toggle.state || {};
    const m = state.current || new Date();
    const monthTitle = document.getElementById('monthTitle');
    if (monthTitle) {
      monthTitle.textContent = m.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
    }

    const hijriSubtitle = document.getElementById('hijriSubtitle');
    if (hijriSubtitle && Toggle.utils && typeof Toggle.utils.hijriMonthStr === 'function') {
      hijriSubtitle.textContent = state.showHijri ? Toggle.utils.hijriMonthStr(m) : '';
    }
  };

  /* ── Clock ── */
  sidebar.startClock = function() {
    const tick = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const el = document.getElementById('currentTime');
      if (el) el.textContent = `${h}:${m}`;
    };
    tick();
    setInterval(tick, 30000);
  };

  /* ── Theme Toggle ── */
  sidebar.initTheme = function() {
    const saved = localStorage.getItem('toggle_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    sidebar.updateThemeIcon(saved);
  };

  sidebar.toggleTheme = function() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('toggle_theme', next);
    sidebar.updateThemeIcon(next);
  };

  sidebar.updateThemeIcon = function(theme) {
    const el = document.querySelector('#themeToggle .material-icons-round.icon-mode');
    if (el) el.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
  };

  // Global aliases
  window.renderPrayer = sidebar.renderPrayer;
  window.renderHolidays = sidebar.renderHolidays;
  window.renderStatusBar = sidebar.renderStatusBar;
  window.renderTopBar = sidebar.renderTopBar;
  window.startClock = sidebar.startClock;
  window.initTheme = sidebar.initTheme;
  window.toggleTheme = sidebar.toggleTheme;
  window.updateThemeIcon = sidebar.updateThemeIcon;
})(window);


// --- js/views/miniCal.js ---
/**
 * miniCal.js — Mini calendar sidebar widget
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const views = Toggle.views = Toggle.views || {};

  views.renderMiniCal = function() {
    const wrap = document.getElementById('miniCalendar');
    if (!wrap) return;

    const current = (Toggle.state && Toggle.state.current) || new Date();
    const today = (Toggle.state && Toggle.state.today) || new Date();
    const selectedDate = (Toggle.state && Toggle.state.selectedDate) || new Date();

    const m = current.getMonth();
    const y = current.getFullYear();

    const first = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0).getDate();
    const startDay = first.getDay(); // 0=Sun

    const monthName = first.toLocaleString('en-PK', { month: 'long', year: 'numeric' });
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    let html = `
      <div class="mini-cal-header">
        <button class="mini-cal-nav" id="miniPrev" aria-label="Previous month"><span class="material-icons-round" style="font-size:16px">chevron_left</span></button>
        <span class="mini-cal-month">${monthName}</span>
        <button class="mini-cal-nav" id="miniNext" aria-label="Next month"><span class="material-icons-round" style="font-size:16px">chevron_right</span></button>
      </div>
      <div class="mini-weekdays">${weekdays.map(d => `<div class="mini-weekday">${d}</div>`).join('')}</div>
      <div class="mini-days">
    `;

    // Previous month padding
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(y, m, 1 - (startDay - i));
      html += `<div class="mini-day other-month">${prevDate.getDate()}</div>`;
    }

    const utils = Toggle.utils || {};
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(y, m, d);
      const classes = ['mini-day'];
      if (utils.sameDay && utils.sameDay(date, today)) classes.push('today');
      if (utils.sameDay && utils.sameDay(date, selectedDate)) classes.push('selected');
      if (utils.isFriday && utils.isFriday(date)) classes.push('friday');
      if (utils.getEventsForDay && utils.getEventsForDay(date).length > 0) classes.push('has-event');
      html += `<div class="${classes.join(' ')}" data-date="${date.toISOString()}">${d}</div>`;
    }

    // Fill rest
    const total = startDay + lastDay;
    const remaining = (7 - (total % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="mini-day other-month">${i}</div>`;
    }

    html += `</div>`;
    wrap.innerHTML = html;

    wrap.querySelectorAll('.mini-day:not(.other-month)').forEach(el => {
      el.addEventListener('click', () => {
        const d = new Date(el.dataset.date);
        Toggle.state.selectedDate = d;
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    });

    const miniPrev = document.getElementById('miniPrev');
    if (miniPrev) {
      miniPrev.addEventListener('click', e => {
        e.stopPropagation();
        Toggle.state.current = new Date(y, m - 1, 1);
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    }

    const miniNext = document.getElementById('miniNext');
    if (miniNext) {
      miniNext.addEventListener('click', e => {
        e.stopPropagation();
        Toggle.state.current = new Date(y, m + 1, 1);
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    }
  };

  // Global alias
  window.renderMiniCal = views.renderMiniCal;
})(window);


// --- js/views/weekView.js ---
/**
 * weekView.js — Week grid view component
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const views = Toggle.views = Toggle.views || {};

  views.buildWeekEventBlock = function(ev) {
    if (!ev.start) return '';
    const start = new Date(ev.start);
    const end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 3600000);
    const topMin = start.getHours() * 60 + start.getMinutes();
    const heightMin = (end - start) / 60000;
    const PX_PER_MIN = 52 / 60;
    const top = topMin * PX_PER_MIN;
    const height = Math.max(heightMin * PX_PER_MIN, 20);
    const colors = Toggle.CAT_COLORS || {};
    const color = colors[ev.category] || '#1a73e8';
    const fmt = Toggle.utils && Toggle.utils.fmt12 ? Toggle.utils.fmt12(ev.start) : '';
    return `<div class="week-event-block" style="top:${top}px;height:${height}px;background:${color}" data-id="${ev.id}" title="${ev.title}">
      <div>${fmt} ${ev.title}</div>
    </div>`;
  };

  views.buildPrayerBlocks = function() {
    const prayerTimesMap = Toggle.PRAYER_TIMES || {};
    const city = (Toggle.state && Toggle.state.city) || 'karachi';
    const times = prayerTimesMap[city] || prayerTimesMap.karachi || [];
    return times.map(t => {
      const parts = t.split(' ');
      const [h, min] = parts[1].split(':').map(Number);
      const top = (h * 60 + min) * (52 / 60);
      return `<div class="prayer-block-week" style="top:${top}px;height:20px">${parts[0]}</div>`;
    }).join('');
  };

  views.renderWeekView = function() {
    const cur = (Toggle.state && Toggle.state.selectedDate) || new Date();
    const today = (Toggle.state && Toggle.state.today) || new Date();
    const state = Toggle.state || {};
    const utils = Toggle.utils || {};

    const dayOfWeek = cur.getDay();
    const weekStart = new Date(cur);
    weekStart.setDate(cur.getDate() - dayOfWeek);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });

    const header = document.getElementById('weekHeader');
    if (header) {
      header.style.gridTemplateColumns = `64px repeat(7, 1fr)`;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      header.innerHTML = `<div class="week-header-cell"></div>` + days.map((d, i) => {
        const isToday = utils.sameDay && utils.sameDay(d, today);
        return `<div class="week-header-cell">
          <div class="week-header-day">${dayNames[i]}</div>
          <div class="week-header-date ${isToday ? 'today-date' : ''}">${d.getDate()}</div>
        </div>`;
      }).join('');
    }

    // Time column
    const timeCol = document.getElementById('timeColumn');
    if (timeCol) {
      timeCol.innerHTML = Array.from({ length: 24 }, (_, h) =>
        `<div class="time-label">${h === 0 ? '' : `${h}:00`}</div>`
      ).join('');
    }

    const cols = document.getElementById('weekColumns');
    if (cols) {
      cols.style.gridTemplateColumns = `repeat(7, 1fr)`;
      cols.innerHTML = days.map(d => {
        const evs = (utils.getEventsForDay ? utils.getEventsForDay(d) : []).map(ev => views.buildWeekEventBlock(ev)).join('');
        const prayer = state.showPrayer ? views.buildPrayerBlocks() : '';
        const isFri = utils.isFriday ? utils.isFriday(d) : d.getDay() === 5;
        const jum = (isFri && state.showJummah) ? `<div class="jummah-block-week" style="top:${(12.75 * 60 + 45 / 60) * 52 / 60}px;height:${105 * 52 / 60}px">🕌 Jummah Guard</div>` : '';
        const blocks = Array.from({ length: 24 }, () => `<div class="hour-block"></div>`).join('');
        return `<div class="week-col">${blocks}${evs}${isFri ? jum : ''}${d.getDay() !== 5 ? prayer : ''}</div>`;
      }).join('');

      cols.querySelectorAll('.week-event-block').forEach(el => {
        el.addEventListener('click', e => {
          e.stopPropagation();
          if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
            Toggle.popover.showEventPopover(el.dataset.id, el);
          }
        });
      });
    }
  };

  // Global aliases
  window.buildWeekEventBlock = views.buildWeekEventBlock;
  window.buildPrayerBlocks = views.buildPrayerBlocks;
  window.renderWeekView = views.renderWeekView;
})(window);


// --- js/views/monthView.js ---
/**
 * monthView.js — Month grid view component
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const views = Toggle.views = Toggle.views || {};

  views.buildDayCell = function(date, isOther) {
    const state = Toggle.state || {};
    const utils = Toggle.utils || {};
    const classes = ['day-cell'];
    const isToday = utils.sameDay && utils.sameDay(date, state.today);
    const friday = utils.isFriday && utils.isFriday(date);
    const holiday = utils.isHoliday && utils.isHoliday(date);
    const events = utils.getEventsForDay ? utils.getEventsForDay(date) : [];

    if (isOther) classes.push('other-month');
    if (isToday) classes.push('today');
    if (friday) classes.push('friday-cell');
    if (utils.sameDay && utils.sameDay(date, state.selectedDate)) classes.push('selected');

    const hijri = state.showHijri && utils.hijriDateStr ? `<span class="hijri-number">${utils.hijriDateStr(date)}</span>` : '';

    let extras = '';
    if (holiday) extras += `<div class="holiday-badge">🎉 ${holiday.name}</div>`;
    if (friday && state.showJummah) extras += `<div class="jummah-indicator">🕌 Jummah 12:45–2:30</div>`;

    const MAX_CHIPS = 3;
    const colors = Toggle.CAT_COLORS || {};
    const chips = events.slice(0, MAX_CHIPS).map(ev => {
      const color = colors[ev.category] || colors.work || '#1a73e8';
      const label = utils.evt12Label ? utils.evt12Label(ev) : '';
      return `<div class="event-chip cat-${ev.category}" data-id="${ev.id}" style="background:${color}" title="${ev.title}">${label} ${ev.title}</div>`;
    }).join('');
    const moreChip = events.length > MAX_CHIPS ? `<div class="event-more">+${events.length - MAX_CHIPS} more</div>` : '';

    const jummahBlock = (friday && state.showJummah) ? `<div class="jummah-block"></div>` : '';
    const loadBlock = (state.showLoadShedding && date.getDay() !== 0) ? `<div class="load-shedding-block"></div>` : '';

    return `
      <div class="${classes.join(' ')}" data-date="${date.toISOString()}">
        ${loadBlock}
        <div class="day-number-row">
          ${hijri}
          <div class="day-number">${date.getDate()}</div>
        </div>
        ${extras}
        <div class="day-events">${chips}${moreChip}</div>
        ${jummahBlock}
      </div>
    `;
  };

  views.renderMonthView = function() {
    const current = (Toggle.state && Toggle.state.current) || new Date();
    const m = current.getMonth();
    const y = current.getFullYear();
    const first = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0).getDate();
    const startDay = first.getDay();

    // Weekday headers
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayHeaders = document.getElementById('weekdayHeaders');
    if (weekdayHeaders) {
      weekdayHeaders.innerHTML = weekdayNames.map((d, i) =>
        `<div class="weekday-header ${i === 5 ? 'friday' : ''}">${d}</div>`
      ).join('');
    }

    const grid = document.getElementById('daysGrid');
    if (!grid) return;
    let html = '';

    // Prev month days
    for (let i = 0; i < startDay; i++) {
      const d = new Date(y, m, 1 - (startDay - i));
      html += views.buildDayCell(d, true);
    }

    // Current month
    for (let d = 1; d <= lastDay; d++) {
      html += views.buildDayCell(new Date(y, m, d), false);
    }

    // Fill remainder
    const total = startDay + lastDay;
    const remaining = (7 - (total % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      html += views.buildDayCell(new Date(y, m + 1, i), true);
    }

    grid.innerHTML = html;

    // Attach click listeners
    grid.querySelectorAll('.day-cell').forEach(cell => {
      cell.addEventListener('click', e => {
        if (e.target.closest('.event-chip')) return;
        const d = new Date(cell.dataset.date);
        Toggle.state.selectedDate = d;
        if (Toggle.modal && typeof Toggle.modal.openNewEventModal === 'function') {
          Toggle.modal.openNewEventModal(d);
        }
      });
    });

    grid.querySelectorAll('.event-chip').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        const id = chip.dataset.id;
        if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
          Toggle.popover.showEventPopover(id, chip);
        }
      });
    });
  };

  // Global aliases
  window.buildDayCell = views.buildDayCell;
  window.renderMonthView = views.renderMonthView;
})(window);


// --- js/views/dayView.js ---
/**
 * dayView.js — Single day grid view component
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const views = Toggle.views = Toggle.views || {};

  views.renderDayView = function() {
    const state = Toggle.state || {};
    const utils = Toggle.utils || {};
    const d = state.selectedDate || new Date();

    const header = document.getElementById('dayHeader');
    if (header) {
      const dayStr = d.toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const hijri = state.showHijri && utils.hijriDateStr && utils.hijriMonthStr
        ? ` · ${utils.hijriDateStr(d)} ${utils.hijriMonthStr(d)}`
        : '';
      header.innerHTML = `<div class="day-header-date">${dayStr}</div><div class="day-header-meta">${hijri}</div>`;
    }

    const timeCol = document.getElementById('timeColumnDay');
    if (timeCol) {
      timeCol.innerHTML = Array.from({ length: 24 }, (_, h) =>
        `<div class="time-label">${h === 0 ? '' : `${h}:00`}</div>`
      ).join('');
    }

    const col = document.getElementById('dayColumn');
    if (col) {
      const blocks = Array.from({ length: 24 }, () => `<div class="hour-block"></div>`).join('');
      const evs = (utils.getEventsForDay ? utils.getEventsForDay(d) : []).map(ev => views.buildWeekEventBlock(ev)).join('');
      const prayer = state.showPrayer && views.buildPrayerBlocks ? views.buildPrayerBlocks() : '';
      const isFri = utils.isFriday ? utils.isFriday(d) : d.getDay() === 5;
      const jum = (isFri && state.showJummah) ? `<div class="jummah-block-week" style="top:${(12.75 * 52)}px;height:${105 * 52 / 60}px">🕌 Jummah Guard: No Meetings 12:45–2:30 PM</div>` : '';
      col.innerHTML = blocks + evs + prayer + jum;

      col.querySelectorAll('.week-event-block').forEach(el => {
        el.addEventListener('click', e => {
          e.stopPropagation();
          if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
            Toggle.popover.showEventPopover(el.dataset.id, el);
          }
        });
      });
    }
  };

  // Global alias
  window.renderDayView = views.renderDayView;
})(window);


// --- js/views/agendaView.js ---
/**
 * agendaView.js — Agenda list view component
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const views = Toggle.views = Toggle.views || {};

  views.renderAgendaView = function() {
    const list = document.getElementById('agendaList');
    if (!list) return;

    const state = Toggle.state || {};
    const utils = Toggle.utils || {};
    const today = state.today || new Date();

    // Get 60 days of events
    const days = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }

    const colors = Toggle.CAT_COLORS || {};

    const groups = days.map(d => {
      const evs = utils.getEventsForDay ? utils.getEventsForDay(d) : [];
      const holiday = utils.isHoliday ? utils.isHoliday(d) : null;
      const isTodayDay = utils.sameDay && utils.sameDay(d, today);
      const friday = utils.isFriday ? utils.isFriday(d) : d.getDay() === 5;

      const dayStr = d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short' });
      const hijri = state.showHijri && utils.hijriDateStr ? `<span class="agenda-day-hijri">${utils.hijriDateStr(d)}</span>` : '';

      const eventItems = evs.map(ev => {
        const color = colors[ev.category] || colors.work || '#1a73e8';
        const timeRange = utils.formatDateRange ? utils.formatDateRange(ev.start, ev.end) : '';
        return `<div class="agenda-event-item" data-id="${ev.id}">
          <div class="agenda-event-color" style="background:${color}"></div>
          <div class="agenda-event-info">
            <div class="agenda-event-title">${ev.title}</div>
            <div class="agenda-event-time">${timeRange}</div>
            ${ev.location ? `<div class="agenda-event-loc">📍 ${ev.location}</div>` : ''}
          </div>
        </div>`;
      }).join('');

      const holidayItem = holiday ? `<div class="agenda-event-item">
        <div class="agenda-event-color" style="background:#0f9d58"></div>
        <div class="agenda-event-info">
          <div class="agenda-event-title">🎉 ${holiday.name}</div>
          <div class="agenda-event-time">Public Holiday</div>
        </div>
      </div>` : '';

      const jummahItem = (friday && state.showJummah) ? `<div class="agenda-event-item">
        <div class="agenda-event-color" style="background:#0f9d58"></div>
        <div class="agenda-event-info">
          <div class="agenda-event-title">🕌 Jummah Prayer</div>
          <div class="agenda-event-time">12:45 PM – 2:30 PM</div>
        </div>
      </div>` : '';

      if (!evs.length && !holiday && !friday) return '';

      return `<div class="agenda-day-group">
        <div class="agenda-day-header">
          <div class="agenda-day-number ${isTodayDay ? 'today-agn' : ''}">${d.getDate()}</div>
          <div>
            <div class="agenda-day-date">${dayStr}</div>
            ${hijri}
          </div>
          <div class="agenda-line"></div>
        </div>
        ${holidayItem}${jummahItem}${eventItems}
      </div>`;
    }).filter(Boolean);

    list.innerHTML = groups.length ? groups.join('') : `<div class="no-events-msg">No upcoming events</div>`;

    list.querySelectorAll('.agenda-event-item[data-id]').forEach(el => {
      el.addEventListener('click', () => {
        if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
          Toggle.popover.showEventPopover(el.dataset.id, el);
        }
      });
    });
  };

  // Global alias
  window.renderAgendaView = views.renderAgendaView;
})(window);


// --- js/render.js ---
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

  // Global alias
  window.renderAll = Toggle.renderAll;
})(window);


// --- js/listeners.js ---
/**
 * listeners.js — Global DOM event listeners registration
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const listeners = Toggle.listeners = Toggle.listeners || {};

  listeners.initListeners = function() {
    // Navigation
    const prevBtn = document.getElementById('prevMonth');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const cur = Toggle.state.current || new Date();
        Toggle.state.current = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    }

    const nextBtn = document.getElementById('nextMonth');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const cur = Toggle.state.current || new Date();
        Toggle.state.current = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
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
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    });

    // Moon sighting toggle
    ['moonAuto', 'moonMinus', 'moonPlus'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => {
        const offset = { moonAuto: 0, moonMinus: -1, moonPlus: 1 }[id];
        Toggle.state.moonOffset = offset;
        document.querySelectorAll('#moonToggleGroup .chip').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    });

    // City selector
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
      citySelect.addEventListener('change', e => {
        Toggle.state.city = e.target.value;
        if (Toggle.sidebar && typeof Toggle.sidebar.renderPrayer === 'function') {
          Toggle.sidebar.renderPrayer();
        }
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    }

    // Cultural & feature toggles
    const toggleMap = {
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
          if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
        });
      }
    });

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

    // Global keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (Toggle.modal && typeof Toggle.modal.closeModal === 'function') {
          Toggle.modal.closeModal();
        }
        if (Toggle.popover && typeof Toggle.popover.hidePopover === 'function') {
          Toggle.popover.hidePopover();
        }
      }
    });
  };

  // Global alias
  window.initListeners = listeners.initListeners;
})(window);


// --- js/main.js ---
/**
 * main.js — Toggle Calendar entry point
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};

  Toggle.seedDemoEvents = function() {
    if (Toggle.state.events && Toggle.state.events.length > 0) return;

    const today = Toggle.state.today || new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const pad = n => n.toString().padStart(2, '0');

    Toggle.state.events = [
      {
        id: Toggle.getEventId(),
        title: 'Team Standup',
        start: `${y}-${pad(m + 1)}-${pad(today.getDate())}T09:00`,
        end:   `${y}-${pad(m + 1)}-${pad(today.getDate())}T09:30`,
        category: 'work',
        location: 'Google Meet',
        description: 'Daily team check-in',
      },
      {
        id: Toggle.getEventId(),
        title: 'Doctor Appointment',
        start: `${y}-${pad(m + 1)}-${pad(today.getDate() + 2)}T14:00`,
        end:   `${y}-${pad(m + 1)}-${pad(today.getDate() + 2)}T15:00`,
        category: 'health',
        location: 'Aga Khan Hospital, Karachi',
        description: '',
      },
      {
        id: Toggle.getEventId(),
        title: 'Family Dinner',
        start: `${y}-${pad(m + 1)}-${pad(today.getDate() + 3)}T20:00`,
        end:   `${y}-${pad(m + 1)}-${pad(today.getDate() + 3)}T22:00`,
        category: 'family',
        location: 'Home',
        description: '',
      },
      {
        id: Toggle.getEventId(),
        title: 'Client Call (UK)',
        start: `${y}-${pad(m + 1)}-${pad(today.getDate() + 1)}T16:00`,
        end:   `${y}-${pad(m + 1)}-${pad(today.getDate() + 1)}T17:00`,
        category: 'work',
        location: 'Zoom',
        description: 'Q4 project review',
      },
    ];

    Toggle.saveEvents();
  };

  Toggle.initApp = function() {
    if (Toggle.sidebar && typeof Toggle.sidebar.initTheme === 'function') Toggle.sidebar.initTheme();
    Toggle.seedDemoEvents();
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
