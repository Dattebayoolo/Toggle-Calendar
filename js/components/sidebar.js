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
    const pills = [];

    if (state.showJummah) {
      pills.push(`<span class="status-pill green" title="Friday meetings blocked 12:45–2:30 PM"><span class="status-dot"></span><span class="material-icons-round pill-icon">mosque</span>Jummah Protected</span>`);
    }
    if (state.showHijri) {
      pills.push(`<span class="status-pill blue" title="Dual Gregorian and Umm al-Qura Hijri dates active"><span class="status-dot"></span><span class="material-icons-round pill-icon">bedtime</span>Hijri Dual-Sync</span>`);
    }
    if (state.showPrayer && utils.getNextPrayer) {
      const nextP = utils.getNextPrayer(state.city || 'karachi');
      if (nextP) {
        pills.push(`<span class="status-pill green" title="Next prayer window in ${state.city || 'Karachi'}"><span class="status-dot"></span><span class="material-icons-round pill-icon">schedule</span>${nextP.label}</span>`);
      }
    }
    if (state.showRamadan) {
      pills.push(`<span class="status-pill amber" title="Working hours shifted to 8:00 AM – 2:00 PM"><span class="status-dot"></span><span class="material-icons-round pill-icon">wb_sunny</span>Ramadan Mode</span>`);
    }
    if (state.showLoadShedding) {
      pills.push(`<span class="status-pill red" title="Load shedding windows monitored"><span class="status-dot"></span><span class="material-icons-round pill-icon">flash_off</span>Outage Monitored</span>`);
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
    const monthTitle = document.getElementById('monthTitle');
    if (monthTitle) {
      monthTitle.textContent = m.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
    }

    const hijriSubtitle = document.getElementById('hijriSubtitle');
    if (hijriSubtitle && Toggle.utils && typeof Toggle.utils.hijriMonthStr === 'function') {
      hijriSubtitle.textContent = state.showHijri ? `🌙 ${Toggle.utils.hijriMonthStr(m)}` : '';
    }
  };

  /* ── Live Pakistan Standard Time (PKT, UTC+5) Clock ── */
  sidebar.startClock = function() {
    const tick = () => {
      const now = new Date();
      // Format strictly in Asia/Karachi timezone
      const formatter = new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const el = document.getElementById('currentTime');
      if (el) el.textContent = formatter.format(now);
    };
    tick();
    setInterval(tick, 1000); // Live seconds accuracy
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
  window.renderStatusBar = sidebar.renderStatusBar;
  window.renderTopBar = sidebar.renderTopBar;
  window.startClock = sidebar.startClock;
  window.initTheme = sidebar.initTheme;
  window.toggleTheme = sidebar.toggleTheme;
  window.updateThemeIcon = sidebar.updateThemeIcon;
  window.syncControlsWithState = sidebar.syncControlsWithState;
})(window);
