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
    const holiday = (state.showHolidays !== false && utils.isHoliday) ? utils.isHoliday(date) : null;
    const events = utils.getEventsForDay ? utils.getEventsForDay(date) : [];
    const isMatched = utils.dayMatchesSearch ? utils.dayMatchesSearch(date) : false;

    if (isOther) classes.push('other-month');
    if (isToday) classes.push('today');
    if (friday) classes.push('friday-cell');
    if (utils.sameDay && utils.sameDay(date, state.selectedDate)) classes.push('selected');
    if (isMatched) classes.push('search-matched');

    const hijri = state.showHijri && utils.hijriDateStr ? `<span class="hijri-number">${utils.hijriDateStr(date)}</span>` : '';

    let extras = '';
    if (holiday) extras += `<div class="holiday-badge" title="${holiday.name}">🎉 ${holiday.name}</div>`;
    if (friday && state.showJummah) extras += `<div class="jummah-indicator" title="12:45 PM – 2:30 PM Meeting Buffer">🕌 Jummah 12:45–2:30</div>`;
    if (state.showRamadan) extras += `<div class="ramadan-band-tag" style="position:static;display:inline-block;margin-bottom:2px">🌙 8 AM – 2 PM</div>`;

    const MAX_CHIPS = 3;
    const colors = Toggle.CAT_COLORS || {};
    const chips = events.slice(0, MAX_CHIPS).map(ev => {
      const color = colors[ev.category] || colors.work || '#2563eb';
      const label = utils.evt12Label ? utils.evt12Label(ev) : '';
      return `<div class="event-chip cat-${ev.category}" data-id="${ev.id}" style="--chip-color:${color}; background:${color}" title="${ev.title}${ev.location ? ' · ' + ev.location : ''}">
        <span class="chip-bar"></span>
        ${label ? `<span class="chip-time">${label}</span>` : ''}
        <span class="chip-title">${ev.title}</span>
      </div>`;
    }).join('');
    const moreChip = events.length > MAX_CHIPS ? `<div class="event-more">+${events.length - MAX_CHIPS} more</div>` : '';

    const jummahBlock = (friday && state.showJummah) ? `<div class="jummah-block"></div>` : '';
    const loadBlock = (state.showLoadShedding && date.getDay() !== 0) ? `<div class="load-shedding-block" title="Load shedding outage window active"></div>` : '';

    return `
      <div class="${classes.join(' ')}" data-date="${date.toISOString()}">
        ${loadBlock}
        <div class="day-number-row">
          ${hijri}
          <div class="day-number-wrap">
            <span class="day-number">${date.getDate()}</span>
            <span class="day-cell-add material-icons-round" title="Add event">add</span>
          </div>
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
