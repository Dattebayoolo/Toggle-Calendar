/**
 * sidebar.js — Sidebar widgets: Real-time Prayer Times, Dynamic Holidays,
 * Context Status Bar with Next-Prayer countdown, Live PKT Clock, and Theme Engine.
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const sidebar = Toggle.sidebar = Toggle.sidebar || {};

  /* ── Prayer Times Widget (Real-time Astronomical Engine) ── */
  sidebar.renderPrayer = function() {
    const list = document.getElementById('prayerList');
    if (!list) return;

    const city = (Toggle.state && Toggle.state.city) || 'karachi';
    const activeDate = (Toggle.state && Toggle.state.selectedDate) || new Date();
    const utils = Toggle.utils || {};

    // Calculate prayer times for selected date
    const prayers = (utils.calcPrayerTimes ? utils.calcPrayerTimes(activeDate, city) : []).filter(p => !p.isAux);
    const now = new Date();
    const isToday = utils.sameDay && utils.sameDay(activeDate, now);
    const currentMin = now.getHours() * 60 + now.getMinutes();

    let activeIdx = -1;
    if (isToday && prayers.length) {
      for (let i = 0; i < prayers.length; i++) {
        if (currentMin < prayers[i].totalMin) {
          activeIdx = i; // Next upcoming prayer
          break;
        }
      }
      if (activeIdx === -1) activeIdx = 0; // Past Isha, next is Fajr
    }

    list.innerHTML = prayers.map((p, i) => {
      const isNext = (isToday && i === activeIdx);
      return `
        <div class="prayer-row ${isNext ? 'active' : ''}">
          <span class="prayer-name">
            <span class="prayer-dot"></span>
            ${p.name}
          </span>
          <span class="prayer-time-wrap">
            ${isNext ? `<span class="prayer-active-tag">Next</span>` : ''}
            <span class="prayer-time">${p.raw}</span>
          </span>
        </div>
      `;
    }).join('');

    // Populate city options if select exists
    const citySelect = document.getElementById('citySelect');
    if (citySelect && Toggle.CITIES && !citySelect.dataset.populated) {
      citySelect.innerHTML = Object.entries(Toggle.CITIES).map(([key, data]) =>
        `<option value="${key}" ${key === city ? 'selected' : ''}>${data.name}</option>`
      ).join('');
      citySelect.dataset.populated = 'true';
    } else if (citySelect) {
      citySelect.value = city;
    }
  };

  /* ── Holidays Widget (Gazetted & Islamic Lunar) ── */
  sidebar.renderHolidays = function() {
    const list = document.getElementById('holidayList');
    if (!list) return;

    const today = (Toggle.state && Toggle.state.today) || new Date();
    const utils = Toggle.utils || {};

    // Scan next 180 days for upcoming fixed and Islamic holidays
    const upcoming = [];
    const seen = new Set();

    for (let i = 0; i < 180; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const hol = utils.isHoliday ? utils.isHoliday(d) : null;
      if (hol && !seen.has(hol.name)) {
        seen.add(hol.name);
        upcoming.push({
          name: hol.name,
          date: d,
          diff: i,
          isGazetted: hol.isGazetted,
        });
        if (upcoming.length >= 5) break;
      }
    }

    list.innerHTML = upcoming.map(h => {
      const label = h.diff === 0 ? 'Today' : h.diff === 1 ? 'Tomorrow' : `in ${h.diff}d`;
      const dateStr = h.date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
      return `
        <div class="holiday-item" data-date="${h.date.toISOString()}">
          <div class="holiday-dot"></div>
          <div class="holiday-info">
            <div class="holiday-name">${h.name}</div>
            <div class="holiday-date">${dateStr}</div>
          </div>
          <span class="holiday-days-left">${label}</span>
        </div>
      `;
    }).join('');

    // Clicking a holiday jumps to that date!
    list.querySelectorAll('.holiday-item').forEach(el => {
      el.addEventListener('click', () => {
        const d = new Date(el.dataset.date);
        Toggle.state.current = new Date(d.getFullYear(), d.getMonth(), 1);
        Toggle.state.selectedDate = d;
        if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
      });
    });
  };

  /* ── Status Bar Widget (Real-time context indicators) ── */
  sidebar.renderStatusBar = function() {
    const bar = document.getElementById('statusIndicators');
    if (!bar) return;

    const state = Toggle.state || {};
    const utils = Toggle.utils || {};
    const isUrdu = state.lang === 'ur';
    const U = Toggle.URDU || {};
    const pills = [];

    if (state.showJummah) {
      pills.push(`<span class="status-pill green" title="Friday meetings blocked 12:45–2:30 PM"><span class="status-dot"></span><span class="material-icons-round pill-icon">mosque</span>${isUrdu ? 'جمعہ محفوظ' : 'Jummah Protected'}</span>`);
    }
    if (state.showHijri) {
      pills.push(`<span class="status-pill blue" title="Dual Gregorian and Umm al-Qura Hijri dates active"><span class="status-dot"></span><span class="material-icons-round pill-icon">bedtime</span>${isUrdu ? 'ہجری ڈوئل سنک' : 'Hijri Dual-Sync'}</span>`);
    }
    if (state.showPrayer && utils.getNextPrayer) {
      const nextP = utils.getNextPrayer(state.city || 'karachi');
      if (nextP) {
        let label = nextP.label;
        if (isUrdu) {
          const h = Math.floor(nextP.diffMinutes / 60);
          const m = nextP.diffMinutes % 60;
          const pName = (U.prayers && U.prayers[nextP.name]) || nextP.name;
          label = `${pName} میں ${h > 0 ? h + ' گھنٹے ' : ''}${m} منٹ`;
        }
        pills.push(`<span class="status-pill green" title="Next prayer window in ${state.city || 'Karachi'}"><span class="status-dot"></span><span class="material-icons-round pill-icon">schedule</span>${label}</span>`);
      }
    }
    if (state.showRamadan) {
      pills.push(`<span class="status-pill amber" title="Working hours shifted to 8:00 AM – 2:00 PM"><span class="status-dot"></span><span class="material-icons-round pill-icon">wb_sunny</span>${isUrdu ? U.ramadanMode : 'Ramadan Mode'}</span>`);
    }
    if (state.showLoadShedding) {
      pills.push(`<span class="status-pill red" title="Load shedding windows monitored"><span class="status-dot"></span><span class="material-icons-round pill-icon">flash_off</span>${isUrdu ? U.loadShedding : 'Outage Monitored'}</span>`);
    }
    if (state.moonOffset !== 0) {
      pills.push(`<span class="status-pill purple" title="Ruet-e-Hilal lunar adjustment"><span class="status-dot"></span>Ruet ${state.moonOffset > 0 ? '+' : ''}${state.moonOffset}d</span>`);
    }

    bar.innerHTML = pills.join('');
  };

  /* ── Top Bar Display ── */
  sidebar.renderTopBar = function() {
    const state = Toggle.state || {};
    const m = state.current || new Date();
    const isUrdu = state.lang === 'ur';
    const U = Toggle.URDU || {};
    const monthTitle = document.getElementById('monthTitle');
    if (monthTitle) {
      if (isUrdu && U.months) {
        monthTitle.textContent = `${U.months[m.getMonth()]} ${m.getFullYear()}`;
      } else {
        monthTitle.textContent = m.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
      }
    }

    const hijriSubtitle = document.getElementById('hijriSubtitle');
    if (hijriSubtitle && Toggle.utils && typeof Toggle.utils.hijriMonthStr === 'function') {
      hijriSubtitle.textContent = state.showHijri ? `🌙 ${Toggle.utils.hijriMonthStr(m)}` : '';
    }
  };

  /* ── Live Pakistan Standard Time (PKT, UTC+5) Clock ── */
  sidebar.startClock = function() {
    // Formatter is constant — build it once, not on every tick.
    // (It only displays minute precision, so a 15s cadence is plenty.)
    const formatter = new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const tick = () => {
      const el = document.getElementById('currentTime');
      if (el) el.textContent = formatter.format(new Date());
    };
    tick();
    setInterval(tick, 15000);
  };

  /* ── Theme Engine ── */
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

  /* ── Ramadan Sehri & Iftar Widget (Pillar 4a) ── */
  sidebar.renderRamadanWidget = function() {
    const sec = document.getElementById('ramadanSection');
    if (!sec) return;

    const state = Toggle.state || {};
    if (!state.showRamadan) {
      sec.classList.add('hidden');
      return;
    }

    sec.classList.remove('hidden');
    const city = state.city || 'karachi';
    const utils = Toggle.utils || {};
    const timings = utils.getRamadanTimings ? utils.getRamadanTimings(new Date(), city) : { sehri: '04:50', iftar: '18:40', sehriMin: 290, iftarMin: 1120 };

    const sehriEl = document.getElementById('sehriTimeVal');
    const iftarEl = document.getElementById('iftarTimeVal');
    const cdEl = document.getElementById('ramadanCountdown');

    if (sehriEl) sehriEl.textContent = timings.sehri;
    if (iftarEl) iftarEl.textContent = timings.iftar;

    if (cdEl) {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();

      if (currentMin < timings.sehriMin) {
        const diff = timings.sehriMin - currentMin;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        cdEl.textContent = `🌙 Sehri ends in ${h}h ${m}m`;
        cdEl.className = 'ramadan-countdown countdown-sehri';
      } else if (currentMin < timings.iftarMin) {
        const diff = timings.iftarMin - currentMin;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        cdEl.textContent = `🌅 Iftar in ${h}h ${m}m`;
        cdEl.className = 'ramadan-countdown countdown-fasting';
      } else {
        const diff = (24 * 60 - currentMin) + timings.sehriMin;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        cdEl.textContent = `✨ Fast opened! Next Sehri in ${h}h ${m}m`;
        cdEl.className = 'ramadan-countdown countdown-done';
      }
    }
  };

  /* ── Urdu / English Localization Engine (Pillar 4b) ── */
  sidebar.applyLanguage = function() {
    const s = Toggle.state || {};
    const isUrdu = s.lang === 'ur';
    const U = Toggle.URDU || {};

    // Urdu mode is purely typographic: swap labels & Arabic font, but NEVER
    // flip the layout (dir stays ltr everywhere so nothing mirrors).
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', isUrdu ? 'ur' : 'en');

    const toggleLabel = document.getElementById('langToggleLabel');
    if (toggleLabel) toggleLabel.textContent = isUrdu ? 'English' : 'اردو';

    // Sidebar section labels & items (MY CALENDARS / PAKISTAN FEATURES)
    const sidebarLabels = {
      myCalendarsLabel: isUrdu ? U.myCalendars : 'MY CALENDARS',
      pakistanFeaturesLabel: isUrdu ? U.pakistanFeatures : 'PAKISTAN FEATURES',
      calEventsName: isUrdu ? U.events : 'Events',
      calPrayerName: isUrdu ? U.prayerTimes : 'Prayer Times',
      calHolidaysName: isUrdu ? U.holidays : 'Pakistani Holidays',
      swHijriName: isUrdu ? U.hijriDates : 'Hijri Dates',
      swPrayerBlocksName: isUrdu ? U.prayerBlocks : 'Prayer Blocks',
      swJummahName: isUrdu ? U.jummahGuard : 'Jummah Guard',
      swRamadanName: isUrdu ? U.ramadanMode : 'Ramadan Mode',
      swLoadShedName: isUrdu ? U.loadShedding : 'Load Shedding',
    };
    Object.entries(sidebarLabels).forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });

    // Update section titles & button texts
    const prayerSecTitle = document.getElementById('prayerSecTitle');
    if (prayerSecTitle) prayerSecTitle.textContent = isUrdu ? U.prayerTimes : 'Prayer Times';

    const holidaysSecTitle = document.getElementById('holidaysSecTitle');
    if (holidaysSecTitle) holidaysSecTitle.textContent = isUrdu ? U.upcomingHolidays : 'Holidays';

    const newEventBtn = document.getElementById('newEventBtn');
    if (newEventBtn) {
      const span = newEventBtn.querySelector('span:last-child');
      if (span) span.textContent = isUrdu ? U.newEvent : 'New event';
    }

    const todayBtn = document.getElementById('todayBtn');
    if (todayBtn) todayBtn.textContent = isUrdu ? U.today : 'Today';

    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
      searchInput.placeholder = isUrdu ? U.searchPlaceholder : 'Search events, prayers, holidays...';
    }

    const viewMap = {
      viewMonth: isUrdu ? U.month : 'Month',
      viewWeek: isUrdu ? U.week : 'Week',
      viewDay: isUrdu ? U.day : 'Day',
      viewAgenda: isUrdu ? U.agenda : 'Agenda',
    };
    Object.entries(viewMap).forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });

    /* ── Event modal: placeholders, select options, buttons ── */
    const setPlaceholder = (id, en, ur) => {
      const el = document.getElementById(id);
      if (el) el.placeholder = isUrdu ? (ur || en) : en;
    };
    setPlaceholder('eventTitle', "Add title or type 'Meet Tariq tomorrow 3pm for 1hr at Dolmen Mall'...", U.titlePlaceholder);
    setPlaceholder('eventLocation', 'Add location or video call', U.addLocation);
    setPlaceholder('eventDesc', 'Add notes', U.addNotes);
    setPlaceholder('eventAttendees', 'Add attendees (phone or email)', U.addAttendees);

    const setOptions = (selectId, map) => {
      const sel = document.getElementById(selectId);
      if (!sel) return;
      [...sel.options].forEach(o => {
        if (map[o.value]) o.textContent = isUrdu ? (map[o.value].ur || map[o.value].en) : map[o.value].en;
      });
    };
    setOptions('eventRecurrence', {
      none:    { en: 'Does not repeat', ur: U.doesNotRepeat },
      daily:   { en: 'Daily',   ur: U.daily },
      weekly:  { en: 'Weekly',  ur: U.weekly },
      monthly: { en: 'Monthly', ur: U.monthly },
      yearly:  { en: 'Yearly',  ur: U.yearly },
    });
    setOptions('eventCategory', {
      work:      { en: 'Work / Meeting', ur: U.work },
      personal:  { en: 'Personal',       ur: U.personal },
      family:    { en: 'Family',         ur: U.family },
      health:    { en: 'Health / Doctor',ur: U.health },
      religious: { en: 'Religious',      ur: U.religious },
      social:    { en: 'Social',         ur: U.social },
    });
    setOptions('eventReminder', {
      none:  { en: 'No reminder',        ur: U.noReminder },
      '5':   { en: '5 minutes before',   ur: `5 ${U.minBefore}` },
      '15':  { en: '15 minutes before',  ur: `15 ${U.minBefore}` },
      '30':  { en: '30 minutes before',  ur: `30 ${U.minBefore}` },
      '60':  { en: '1 hour before',      ur: U.hourBefore },
      '1440':{ en: '1 day before',       ur: U.dayBefore },
    });

    const untilSep = document.querySelector('.recurrence-until-wrap .dt-sep');
    if (untilSep) untilSep.textContent = isUrdu ? (U.until || 'until') : 'until';

    const nlpBtn = document.getElementById('nlpApplyBtn');
    if (nlpBtn) nlpBtn.textContent = isUrdu ? (U.autoFill || 'Auto-fill') : 'Auto-fill';

    const cancelBtn = document.getElementById('cancelEvent');
    if (cancelBtn) cancelBtn.textContent = isUrdu ? (U.cancel || 'Cancel') : 'Cancel';
    const saveBtn = document.getElementById('saveEvent');
    if (saveBtn) saveBtn.textContent = isUrdu ? (U.save || 'Save') : 'Save';

    // Modal title follows the current mode too (open modal keeps correct label)
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle && typeof Toggle._modalTitle === 'function') {
      // Only re-label if a modal kind is active (tracked by modal.js state)
      if (Toggle.state.editingId) {
        modalTitle.textContent = Toggle._modalTitle(String(Toggle.state.editingId).includes('__occ__') ? 'editSeries' : 'edit');
      }
    }
  };

  /* ── Sync UI Controls with State ── */
  sidebar.syncControlsWithState = function() {
    const s = Toggle.state || {};
    const checkMap = {
      toggleCalEvents: s.showEvents !== false,
      toggleCalPrayer: s.showPrayer !== false,
      toggleCalHolidays: s.showHolidays !== false,
      toggleHijri: s.showHijri !== false,
      togglePrayer: s.showPrayer !== false,
      toggleJummah: s.showJummah !== false,
      toggleRamadan: s.showRamadan === true,
      toggleLoadShedding: s.showLoadShedding === true,
    };
    Object.entries(checkMap).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.checked = val;
    });

    const citySelect = document.getElementById('citySelect');
    if (citySelect && s.city) citySelect.value = s.city;

    const provinceSelect = document.getElementById('provinceSelect');
    if (provinceSelect && s.province) provinceSelect.value = s.province;

    sidebar.applyLanguage();
    sidebar.renderRamadanWidget();

    // View buttons
    if (s.view) {
      document.querySelectorAll('.chip[data-view]').forEach(b => {
        b.classList.toggle('active', b.dataset.view === s.view);
      });
    }

    // Moon buttons
    const moonId = s.moonOffset === -1 ? 'moonMinus' : s.moonOffset === 1 ? 'moonPlus' : 'moonAuto';
    document.querySelectorAll('#moonToggleGroup .chip').forEach(b => {
      b.classList.toggle('active', b.id === moonId);
    });
  };

  // Global aliases
  window.renderPrayer = sidebar.renderPrayer;
  window.renderHolidays = sidebar.renderHolidays;
  window.renderRamadanWidget = sidebar.renderRamadanWidget;
  window.applyLanguage = sidebar.applyLanguage;
  window.renderStatusBar = sidebar.renderStatusBar;
  window.renderTopBar = sidebar.renderTopBar;
  window.startClock = sidebar.startClock;
  window.initTheme = sidebar.initTheme;
  window.toggleTheme = sidebar.toggleTheme;
  window.updateThemeIcon = sidebar.updateThemeIcon;
  window.syncControlsWithState = sidebar.syncControlsWithState;
})(window);
