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
      const sehriIftar = views.buildRamadanSehriIftarBlocks ? views.buildRamadanSehriIftarBlocks(d) : '';
      const loadShedding = views.buildLoadSheddingBlocks ? views.buildLoadSheddingBlocks(d) : '';
      const ramadan = views.buildRamadanBlocks ? views.buildRamadanBlocks(d) : '';

      const isFri = utils.isFriday ? utils.isFriday(d) : d.getDay() === 5;
      const jum = (isFri && state.showJummah)
        ? `<div class="jummah-block-week" style="top:${765 * PX_PER_MIN}px;height:${105 * PX_PER_MIN}px" title="Protected: Friday Jummah Congregation">🕌 Jummah Guard: No Meetings 12:45–2:30 PM</div>`
        : '';

      col.innerHTML = `
        ${blocks}
        ${ramadan}
        ${sehriIftar}
        ${loadShedding}
        ${prayer}
        ${jum}
        ${evs}
        ${currentLine}
      `;

      // Event click -> Popover
      col.querySelectorAll('.week-event-block').forEach(el => {
        el.addEventListener('click', e => {
          if (e.target.closest('.resize-handle')) return;
          e.stopPropagation();
          if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
            Toggle.popover.showEventPopover(el.dataset.id, el);
          }
        });

        // Drag & Drop: dragstart
        el.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', el.dataset.id);
          e.dataTransfer.effectAllowed = 'move';
          el.classList.add('dragging');
          window.__toggleDraggingId = el.dataset.id;
        });

        el.addEventListener('dragend', () => {
          el.classList.remove('dragging');
          window.__toggleDraggingId = null;
        });
      });

      // Drag over and Drop on day-col
      col.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });

      col.addEventListener('drop', e => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const id = window.__toggleDraggingId || e.dataTransfer.getData('text/plain');
        if (!id) return;

        const isOcc = String(id).includes('__occ__');
        const parentId = isOcc ? String(id).split('__occ__')[0] : id;
        const ev = Toggle.state.events.find(x => x.id === parentId);
        if (!ev) return;

        const colRect = col.getBoundingClientRect();
        const y = Math.max(0, e.clientY - colRect.top);
        const totalMin = y / PX_PER_MIN;
        const snappedMin = Math.max(0, Math.min(1380, Math.round(totalMin / 15) * 15));

        const targetDate = new Date(d);
        const pad = n => n.toString().padStart(2, '0');
        const yyyy = targetDate.getFullYear();
        const mm = pad(targetDate.getMonth() + 1);
        const dd = pad(targetDate.getDate());

        const startH = Math.floor(snappedMin / 60);
        const startM = snappedMin % 60;
        const newStart = `${yyyy}-${mm}-${dd}T${pad(startH)}:${pad(startM)}`;

        const oldStart = new Date(ev.start);
        const oldEnd = ev.end ? new Date(ev.end) : new Date(oldStart.getTime() + 3600000);
        const durMs = Math.max(oldEnd.getTime() - oldStart.getTime(), 15 * 60000);
        const newEndDt = new Date(new Date(newStart).getTime() + durMs);
        const newEnd = `${newEndDt.getFullYear()}-${pad(newEndDt.getMonth() + 1)}-${pad(newEndDt.getDate())}T${pad(newEndDt.getHours())}:${pad(newEndDt.getMinutes())}`;

        if (isOcc) {
          const occDateKey = String(id).split('__occ__')[1];
          const moveAll = confirm('This is a repeating event.\n\nClick OK to shift ALL future occurrences to this new time.\nClick Cancel to move ONLY this single occurrence.');
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
        views.renderDayView();
        if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
          const timeStr = `${startH % 12 || 12}:${pad(startM)} ${startH >= 12 ? 'PM' : 'AM'}`;
          Toggle.popover.showToast(`Rescheduled to ${timeStr}`);
        }
      });

      // Vertical Resize Handle
      col.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', e => {
          e.stopPropagation();
          e.preventDefault();
          const id = handle.dataset.id;
          const parentId = String(id).includes('__occ__') ? String(id).split('__occ__')[0] : id;
          const ev = Toggle.state.events.find(x => x.id === parentId);
          if (!ev) return;

          const block = handle.closest('.week-event-block');
          const startY = e.clientY;
          const startHeight = parseFloat(block.style.height) || 26;

          function onMouseMove(moveEvent) {
            const dy = moveEvent.clientY - startY;
            const newHeight = Math.max(22, startHeight + dy);
            block.style.height = `${newHeight}px`;
          }

          function onMouseUp(upEvent) {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            const dy = upEvent.clientY - startY;
            const finalHeight = Math.max(22, startHeight + dy);
            const durMin = Math.max(15, Math.round((finalHeight / PX_PER_MIN) / 15) * 15);

            const sDt = new Date(ev.start);
            const eDt = new Date(sDt.getTime() + durMin * 60000);
            const pad = n => n.toString().padStart(2, '0');
            ev.end = `${eDt.getFullYear()}-${pad(eDt.getMonth() + 1)}-${pad(eDt.getDate())}T${pad(eDt.getHours())}:${pad(eDt.getMinutes())}`;

            Toggle.saveEvents();
            views.renderDayView();
            if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
              Toggle.popover.showToast(`Duration: ${durMin} min`);
            }
          }

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
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
