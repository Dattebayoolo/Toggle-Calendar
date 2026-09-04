/**
 * weekView.js — Week grid view component
 * Real-time astronomical prayer times, Jummah buffer, load shedding schedules,
 * Ramadan hours, clickable hour slots, and live time line.
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const views = Toggle.views = Toggle.views || {};

  views.buildWeekEventBlock = function(ev) {
    if (!ev || !ev.start) return '';
    const start = new Date(ev.start);
    const end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 3600000);
    const topMin = start.getHours() * 60 + start.getMinutes();
    const heightMin = Math.max((end - start) / 60000, 25);
    const PX_PER_MIN = 52 / 60;
    const top = topMin * PX_PER_MIN;
    const height = Math.max(heightMin * PX_PER_MIN, 26);
    const colors = Toggle.CAT_COLORS || {};
    const color = colors[ev.category] || '#2563eb';
    const fmt = Toggle.utils && Toggle.utils.fmt12 ? Toggle.utils.fmt12(ev.start) : '';

    const state = Toggle.state || {};
    const q = (state.searchQuery || '').trim().toLowerCase();
    const isMatched = q && (
      (ev.title && ev.title.toLowerCase().includes(q)) ||
      (ev.location && ev.location.toLowerCase().includes(q)) ||
      (ev.category && ev.category.toLowerCase().includes(q))
    );

    return `<div class="week-event-block cat-${ev.category} ${isMatched ? 'search-matched' : ''}" style="top:${top}px;height:${height}px;--ev-color:${color};background:${color}" data-id="${ev.id}" title="${ev.title}${ev.location ? ' · ' + ev.location : ''}">
      <div class="week-event-title">${ev.title}</div>
      <div class="week-event-time">${fmt}</div>
    </div>`;
  };

  views.buildPrayerBlocks = function(date) {
    if (!Toggle.state || !Toggle.state.showPrayer) return '';
    const city = Toggle.state.city || 'karachi';
    const utils = Toggle.utils || {};
    const prayers = (utils.calcPrayerTimes ? utils.calcPrayerTimes(date, city) : []).filter(p => !p.isAux);
    const PX_PER_MIN = 52 / 60;

    return prayers.map(p => {
      const top = p.totalMin * PX_PER_MIN;
      return `<div class="prayer-block-week" style="top:${top}px;height:20px" title="${p.name} Prayer at ${p.fmt12}">
        <span>🕌 ${p.name} ${p.raw}</span>
      </div>`;
    }).join('');
  };

  views.buildLoadSheddingBlocks = function(date) {
    if (!Toggle.state || !Toggle.state.showLoadShedding) return '';
    if (date.getDay() === 0) return ''; // Usually no scheduled load shedding on Sunday
    const city = Toggle.state.city || 'karachi';
    const schedules = Toggle.LOAD_SHEDDING_SCHEDULES || {};
    const slots = schedules[city] || schedules.karachi || [];
    const PX_PER_MIN = 52 / 60;

    return slots.map(slot => {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      const sMin = sh * 60 + sm;
      const eMin = eh * 60 + em;
      const top = sMin * PX_PER_MIN;
      const height = Math.max((eMin - sMin) * PX_PER_MIN, 22);
      return `<div class="load-shedding-band-week" style="top:${top}px;height:${height}px" title="Load Shedding Outage: ${slot.start} – ${slot.end}">
        <span>⚡ Outage (${slot.start} – ${slot.end})</span>
      </div>`;
    }).join('');
  };

  views.buildRamadanBlocks = function(date) {
    if (!Toggle.state || !Toggle.state.showRamadan) return '';
    // Ramadan working hours 8:00 AM (480 min) – 2:00 PM (840 min)
    const PX_PER_MIN = 52 / 60;
    const top = 480 * PX_PER_MIN;
    const height = 360 * PX_PER_MIN;
    return `<div class="ramadan-band-week" style="top:${top}px;height:${height}px">
      <span class="ramadan-band-tag">🌙 Ramadan Hours (8 AM – 2 PM)</span>
    </div>`;
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
        const hijri = state.showHijri && utils.hijriDateStr ? `<div style="font-size:0.64rem;color:var(--t3);margin-top:2px">${utils.hijriDateStr(d)}</div>` : '';
        return `<div class="week-header-cell ${i === 5 ? 'friday-col' : ''}">
          <div class="week-header-day">${dayNames[i]}</div>
          <div class="week-header-date ${isToday ? 'today-date' : ''}">${d.getDate()}</div>
          ${hijri}
        </div>`;
      }).join('');
    }

    // Time column
    const timeCol = document.getElementById('timeColumn');
    if (timeCol) {
      timeCol.innerHTML = Array.from({ length: 24 }, (_, h) =>
        `<div class="time-label">${h === 0 ? '' : `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`}</div>`
      ).join('');
    }

    const cols = document.getElementById('weekColumns');
    if (cols) {
      cols.style.gridTemplateColumns = `repeat(7, 1fr)`;
      const now = new Date();
      const PX_PER_MIN = 52 / 60;

      cols.innerHTML = days.map(d => {
        const isToday = utils.sameDay && utils.sameDay(d, today);
        const evs = (utils.getEventsForDay ? utils.getEventsForDay(d) : []).map(ev => views.buildWeekEventBlock(ev)).join('');
        const prayer = views.buildPrayerBlocks(d);
        const loadShedding = views.buildLoadSheddingBlocks(d);
        const ramadan = views.buildRamadanBlocks(d);

        const isFri = utils.isFriday ? utils.isFriday(d) : d.getDay() === 5;
        // Jummah buffer 12:45 PM – 2:30 PM (765 min to 870 min)
        const jum = (isFri && state.showJummah)
          ? `<div class="jummah-block-week" style="top:${765 * PX_PER_MIN}px;height:${105 * PX_PER_MIN}px" title="Protected: Friday Jummah Congregation">🕌 Jummah Guard 12:45–2:30 PM</div>`
          : '';

        const currentLine = isToday
          ? `<div class="current-time-line" style="top:${(now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN}px"><span class="current-time-dot"></span></div>`
          : '';

        // 24 clickable hour blocks
        const blocks = Array.from({ length: 24 }, (_, h) =>
          `<div class="hour-block" data-hour="${h}" data-date="${d.toISOString()}"></div>`
        ).join('');

        return `<div class="week-col ${isToday ? 'today-col' : ''} ${isFri ? 'friday-col' : ''}">
          ${blocks}
          ${ramadan}
          ${loadShedding}
          ${prayer}
          ${jum}
          ${evs}
          ${currentLine}
        </div>`;
      }).join('');

      // Event click -> Popover
      cols.querySelectorAll('.week-event-block').forEach(el => {
        el.addEventListener('click', e => {
          e.stopPropagation();
          if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
            Toggle.popover.showEventPopover(el.dataset.id, el);
          }
        });
      });

      // Hour block click -> Open new event modal
      cols.querySelectorAll('.hour-block').forEach(blk => {
        blk.addEventListener('click', e => {
          if (e.target.closest('.week-event-block')) return;
          const hour = parseInt(blk.dataset.hour, 10);
          const d = new Date(blk.dataset.date);
          Toggle.state.selectedDate = d;
          if (Toggle.modal && typeof Toggle.modal.openNewEventModal === 'function') {
            Toggle.modal.openNewEventModal(d, hour);
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
