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
      const recIcon = (ev.recurrence && ev.recurrence.freq && ev.recurrence.freq !== 'none') || ev.isOccurrence ? ' 🔁' : '';
      return `<div class="event-chip cat-${ev.category}" data-id="${ev.id}" draggable="true" style="--chip-color:${color}; background:${color}" title="${ev.title}${recIcon}${ev.location ? ' · ' + ev.location : ''}">
        <span class="chip-bar"></span>
        ${label ? `<span class="chip-time">${label}</span>` : ''}
        <span class="chip-title">${ev.title}${recIcon}</span>
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
    const state = Toggle.state || {};
    const m = current.getMonth();
    const y = current.getFullYear();
    const first = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0).getDate();
    const startDay = first.getDay();

    // Weekday headers
    const weekdayNames = state.lang === 'ur' && Toggle.URDU ? Toggle.URDU.weekdays : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

    // Event delegation: all interactions handled by listeners on the grid
    // itself, attached ONCE (not per cell/chip on every render).
    if (!grid.__toggleDelegated) {
      grid.__toggleDelegated = true;

      grid.addEventListener('click', e => {
        // "+N more" chip is not clickable (preserves existing behavior)
        if (e.target.closest('.event-more')) return;

        const chip = e.target.closest('.event-chip');
        if (chip) {
          e.stopPropagation();
          if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
            Toggle.popover.showEventPopover(chip.dataset.id, chip);
          }
          return;
        }

        const cell = e.target.closest('.day-cell');
        if (cell) {
          const d = new Date(cell.dataset.date);
          Toggle.state.selectedDate = d;
          if (Toggle.modal && typeof Toggle.modal.openNewEventModal === 'function') {
            Toggle.modal.openNewEventModal(d);
          }
        }
      });

      grid.addEventListener('dragstart', e => {
        const chip = e.target.closest('.event-chip');
        if (!chip) return;
        e.dataTransfer.setData('text/plain', chip.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
        chip.classList.add('dragging');
        window.__toggleDraggingId = chip.dataset.id;
      });

      grid.addEventListener('dragend', e => {
        const chip = e.target.closest('.event-chip');
        if (chip) chip.classList.remove('dragging');
        window.__toggleDraggingId = null;
      });

      grid.addEventListener('dragover', e => {
        const cell = e.target.closest('.day-cell');
        if (!cell) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cell.classList.add('drag-over');
      });

      grid.addEventListener('dragleave', e => {
        const cell = e.target.closest('.day-cell');
        if (cell) cell.classList.remove('drag-over');
      });

      grid.addEventListener('drop', e => {
        const cell = e.target.closest('.day-cell');
        if (!cell) return;
        e.preventDefault();
        cell.classList.remove('drag-over');

        const id = window.__toggleDraggingId || e.dataTransfer.getData('text/plain');
        if (!id) return;

        const isOcc = String(id).includes('__occ__');
        const parentId = isOcc ? String(id).split('__occ__')[0] : id;
        const ev = Toggle.state.events.find(x => x.id === parentId);
        if (!ev) return;

        const targetDate = new Date(cell.dataset.date);
        const pad = n => n.toString().padStart(2, '0');
        const yyyy = targetDate.getFullYear();
        const mm = pad(targetDate.getMonth() + 1);
        const dd = pad(targetDate.getDate());

        const sDt = new Date(ev.start);
        const eDt = ev.end ? new Date(ev.end) : new Date(sDt.getTime() + 3600000);
        const durMs = Math.max(eDt.getTime() - sDt.getTime(), 15 * 60000);

        const newStart = `${yyyy}-${mm}-${dd}T${pad(sDt.getHours())}:${pad(sDt.getMinutes())}`;
        const newEndDt = new Date(new Date(newStart).getTime() + durMs);
        const newEnd = `${newEndDt.getFullYear()}-${pad(newEndDt.getMonth() + 1)}-${pad(newEndDt.getDate())}T${pad(newEndDt.getHours())}:${pad(newEndDt.getMinutes())}`;

        if (isOcc) {
          const occDateKey = String(id).split('__occ__')[1];
          const moveAll = confirm('This is a repeating event.\n\nClick OK to shift the entire series.\nClick Cancel to move ONLY this occurrence.');
          if (moveAll) {
            ev.start = newStart;
            ev.end = newEnd;
          } else {
            ev.exdates = ev.exdates || [];
            if (!ev.exdates.includes(occDateKey)) ev.exdates.push(occDateKey);
            Toggle.state.events.push({
              ...ev,
              id: Toggle.getEventId(),
              start: newStart,
              end: newEnd,
              recurrence: null,
              exdates: [],
            });
          }
        } else {
          ev.start = newStart;
          ev.end = newEnd;
        }

        Toggle.saveEvents();
        views.renderMonthView();
        if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
          const dateStr = targetDate.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
          Toggle.popover.showToast(`Moved to ${dateStr}`);
        }
      });
    }
  };

  // Global aliases
  window.buildDayCell = views.buildDayCell;
  window.renderMonthView = views.renderMonthView;
})(window);
