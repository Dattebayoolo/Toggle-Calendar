/**
 * dayView.js — Single day grid view component
 * Real-time astronomical prayer times, Jummah buffer, load shedding schedules,
 * Ramadan hours, clickable hour slots, and live time line.
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
        ? ` · 🌙 ${utils.hijriDateStr(d)} ${utils.hijriMonthStr(d)}`
        : '';
      const holiday = (state.showHolidays !== false && utils.isHoliday) ? utils.isHoliday(d) : null;
      const holidayBadge = holiday ? `<span class="holiday-badge" style="margin-left:10px">🎉 ${holiday.name}</span>` : '';

      header.innerHTML = `
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px">
          <div class="day-header-date">${dayStr}</div>
          ${holidayBadge}
        </div>
        <div class="day-header-meta">${hijri}</div>
      `;
    }

    const timeCol = document.getElementById('timeColumnDay');
    if (timeCol) {
      timeCol.innerHTML = Array.from({ length: 24 }, (_, h) =>
        `<div class="time-label">${h === 0 ? '' : `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`}</div>`
      ).join('');
    }

    const col = document.getElementById('dayColumn');
    if (col) {
      const today = state.today || new Date();
      const isToday = utils.sameDay && utils.sameDay(d, today);
      const now = new Date();
      const PX_PER_MIN = 52 / 60;

      const currentLine = isToday
        ? `<div class="current-time-line" style="top:${(now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN}px"><span class="current-time-dot"></span></div>`
        : '';

      const blocks = Array.from({ length: 24 }, (_, h) =>
        `<div class="hour-block" data-hour="${h}" data-date="${d.toISOString()}"></div>`
      ).join('');

      const evs = (utils.getEventsForDay ? utils.getEventsForDay(d) : []).map(ev => views.buildWeekEventBlock ? views.buildWeekEventBlock(ev) : '').join('');
      const prayer = views.buildPrayerBlocks ? views.buildPrayerBlocks(d) : '';
      const loadShedding = views.buildLoadSheddingBlocks ? views.buildLoadSheddingBlocks(d) : '';
      const ramadan = views.buildRamadanBlocks ? views.buildRamadanBlocks(d) : '';

      const isFri = utils.isFriday ? utils.isFriday(d) : d.getDay() === 5;
      const jum = (isFri && state.showJummah)
        ? `<div class="jummah-block-week" style="top:${765 * PX_PER_MIN}px;height:${105 * PX_PER_MIN}px" title="Protected: Friday Jummah Congregation">🕌 Jummah Guard: No Meetings 12:45–2:30 PM</div>`
        : '';

      col.innerHTML = `
        ${blocks}
        ${ramadan}
        ${loadShedding}
        ${prayer}
        ${jum}
        ${evs}
        ${currentLine}
      `;

      // Event click -> Popover
      col.querySelectorAll('.week-event-block').forEach(el => {
        el.addEventListener('click', e => {
          e.stopPropagation();
          if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
            Toggle.popover.showEventPopover(el.dataset.id, el);
          }
        });
      });

      // Click on hour slot -> Create event
      col.querySelectorAll('.hour-block').forEach(blk => {
        blk.addEventListener('click', e => {
          if (e.target.closest('.week-event-block')) return;
          const hour = parseInt(blk.dataset.hour, 10);
          const blockDate = new Date(blk.dataset.date);
          Toggle.state.selectedDate = blockDate;
          if (Toggle.modal && typeof Toggle.modal.openNewEventModal === 'function') {
            Toggle.modal.openNewEventModal(blockDate, hour);
          }
        });
      });
    }
  };

  // Global alias
  window.renderDayView = views.renderDayView;
})(window);
