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

    const recIcon = (ev.recurrence && ev.recurrence.freq && ev.recurrence.freq !== 'none') || ev.isOccurrence ? ' 🔁' : '';

    return `<div class="week-event-block cat-${ev.category} ${isMatched ? 'search-matched' : ''}" style="top:${top}px;height:${height}px;--ev-color:${color};background:${color}" data-id="${ev.id}" draggable="true" title="${ev.title}${recIcon}${ev.location ? ' · ' + ev.location : ''}">
      <div class="week-event-title">${ev.title}${recIcon}</div>
      <div class="week-event-time">${fmt}</div>
      <div class="resize-handle" data-id="${ev.id}" title="Drag vertically to change duration"></div>
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

  views.buildRamadanSehriIftarBlocks = function(date) {
    if (!Toggle.state || !Toggle.state.showRamadan) return '';
    const city = Toggle.state.city || 'karachi';
    const utils = Toggle.utils || {};
    const timings = utils.getRamadanTimings ? utils.getRamadanTimings(date, city) : null;
    if (!timings) return '';

    const PX_PER_MIN = 52 / 60;
    const sehriTop = timings.sehriMin * PX_PER_MIN;
    const iftarTop = timings.iftarMin * PX_PER_MIN;

    return `
      <div class="ramadan-overlay-block sehri-block" style="top:${sehriTop}px;height:20px" title="🌙 Sehri Ends at ${timings.sehri}">
        <span>🌙 Sehri ${timings.sehri}</span>
      </div>
      <div class="ramadan-overlay-block iftar-block" style="top:${iftarTop}px;height:20px" title="🌅 Iftar Time at ${timings.iftar}">
        <span>🌅 Iftar ${timings.iftar}</span>
      </div>
    `;
  };

  views.buildLoadSheddingBlocks = function(date) {
    if (!Toggle.state || !Toggle.state.showLoadShedding) return '';
    if (date.getDay() === 0) return '';
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
      const dayNames = state.lang === 'ur' && Toggle.URDU ? Toggle.URDU.weekdays : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

      cols.innerHTML = days.map((d, dayIdx) => {
        const isToday = utils.sameDay && utils.sameDay(d, today);
        const evs = (utils.getEventsForDay ? utils.getEventsForDay(d) : []).map(ev => views.buildWeekEventBlock(ev)).join('');
        const prayer = views.buildPrayerBlocks(d);
        const sehriIftar = views.buildRamadanSehriIftarBlocks(d);
        const loadShedding = views.buildLoadSheddingBlocks(d);
        const ramadan = views.buildRamadanBlocks(d);

        const isFri = utils.isFriday ? utils.isFriday(d) : d.getDay() === 5;
        const jum = (isFri && state.showJummah)
          ? `<div class="jummah-block-week" style="top:${765 * PX_PER_MIN}px;height:${105 * PX_PER_MIN}px" title="Protected: Friday Jummah Congregation">🕌 Jummah Guard 12:45–2:30 PM</div>`
          : '';

        const currentLine = isToday
          ? `<div class="current-time-line" style="top:${(now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN}px"><span class="current-time-dot"></span></div>`
          : '';

        const blocks = Array.from({ length: 24 }, (_, h) =>
          `<div class="hour-block" data-hour="${h}" data-date="${d.toISOString()}"></div>`
        ).join('');

        return `<div class="week-col ${isToday ? 'today-col' : ''} ${isFri ? 'friday-col' : ''}" data-day-index="${dayIdx}" data-date="${d.toISOString()}">
          ${blocks}
          ${ramadan}
          ${sehriIftar}
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
          if (e.target.closest('.resize-handle')) return;
          e.stopPropagation();
          if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
            Toggle.popover.showEventPopover(el.dataset.id, el);
          }
        });

        // Drag & Drop: dragstart (Pillar 5)
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

      // Drag over and Drop on week-col
      cols.querySelectorAll('.week-col').forEach(col => {
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

          // Compute drop position
          const colRect = col.getBoundingClientRect();
          const y = Math.max(0, e.clientY - colRect.top);
          const totalMin = y / PX_PER_MIN;
          const snappedMin = Math.max(0, Math.min(1380, Math.round(totalMin / 15) * 15));

          const targetDate = new Date(col.dataset.date);
          const pad = n => n.toString().padStart(2, '0');
          const yyyy = targetDate.getFullYear();
          const mm = pad(targetDate.getMonth() + 1);
          const dd = pad(targetDate.getDate());

          const startH = Math.floor(snappedMin / 60);
          const startM = snappedMin % 60;
          const newStart = `${yyyy}-${mm}-${dd}T${pad(startH)}:${pad(startM)}`;

          // Preserve original duration
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
          views.renderWeekView();
          if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
            const timeStr = `${startH % 12 || 12}:${pad(startM)} ${startH >= 12 ? 'PM' : 'AM'}`;
            Toggle.popover.showToast(`Rescheduled to ${timeStr}`);
          }
        });
      });

      // Vertical Resize Handle (Pillar 5)
      cols.querySelectorAll('.resize-handle').forEach(handle => {
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
            views.renderWeekView();
            if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
              Toggle.popover.showToast(`Duration: ${durMin} min`);
            }
          }

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
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
  window.buildRamadanSehriIftarBlocks = views.buildRamadanSehriIftarBlocks;
  window.renderWeekView = views.renderWeekView;
})(window);
