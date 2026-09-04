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
      const holiday = (state.showHolidays !== false && utils.isHoliday) ? utils.isHoliday(d) : null;
      const isTodayDay = utils.sameDay && utils.sameDay(d, today);
      const friday = utils.isFriday ? utils.isFriday(d) : d.getDay() === 5;

      const dayStr = d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short' });
      const hijri = state.showHijri && utils.hijriDateStr ? `<span class="agenda-day-hijri">${utils.hijriDateStr(d)}</span>` : '';

      const eventItems = evs.map(ev => {
        const color = colors[ev.category] || colors.work || '#2563eb';
        const timeRange = utils.formatDateRange ? utils.formatDateRange(ev.start, ev.end) : '';
        return `<div class="agenda-event-item" data-id="${ev.id}">
          <div class="agenda-event-bar" style="background:${color}"></div>
          <div class="agenda-event-info">
            <div class="agenda-title-row">
              <span class="agenda-event-title">${ev.title}</span>
              <span class="agenda-cat-badge" style="color:${color};background:${color}18">${ev.category || 'event'}</span>
            </div>
            <div class="agenda-event-time">
              <span class="material-icons-round" style="font-size:13px">schedule</span>
              <span>${timeRange}</span>
            </div>
            ${ev.location ? `<div class="agenda-event-loc"><span class="material-icons-round" style="font-size:13px">location_on</span><span>${ev.location}</span></div>` : ''}
          </div>
          <button class="agenda-wa-share" data-id="${ev.id}" title="Share invite on WhatsApp" aria-label="Share WhatsApp">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.993 8.993 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M11.954 0C5.368 0 0 5.373 0 11.965a11.93 11.93 0 0 0 1.598 5.985L0 24l6.186-1.573a11.94 11.94 0 0 0 5.768 1.474C18.562 23.901 24 18.528 24 11.937 24 5.373 18.562 0 11.954 0z"/></svg>
            <span>Invite</span>
          </button>
        </div>`;
      }).join('');

      const holidayItem = holiday ? `<div class="agenda-event-item holiday-agenda-item">
        <div class="agenda-event-bar" style="background:#059669"></div>
        <div class="agenda-event-info">
          <div class="agenda-title-row">
            <span class="agenda-event-title">🎉 ${holiday.name}</span>
            <span class="agenda-cat-badge" style="color:#059669;background:#05966918">Public Holiday</span>
          </div>
          <div class="agenda-event-time">Pakistan Gazetted Holiday</div>
        </div>
      </div>` : '';

      const jummahItem = (friday && state.showJummah) ? `<div class="agenda-event-item jummah-agenda-item">
        <div class="agenda-event-bar" style="background:#059669"></div>
        <div class="agenda-event-info">
          <div class="agenda-title-row">
            <span class="agenda-event-title">🕌 Jummah Congregation Buffer</span>
            <span class="agenda-cat-badge" style="color:#059669;background:#05966918">Meeting Guard</span>
          </div>
          <div class="agenda-event-time">12:45 PM – 2:30 PM (Protected Time Slot)</div>
        </div>
      </div>` : '';

      if (!evs.length && !holiday && (!friday || !state.showJummah)) return '';

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

    const emptyMsg = state.searchQuery && state.searchQuery.trim()
      ? `No events or holidays matching "${state.searchQuery}"`
      : 'No upcoming events in the next 60 days';
    list.innerHTML = groups.length ? groups.join('') : `<div class="no-events-msg">${emptyMsg}</div>`;

    list.querySelectorAll('.agenda-event-item[data-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.agenda-wa-share')) {
          e.stopPropagation();
          const evId = el.dataset.id;
          const ev = (Toggle.state && Toggle.state.events || []).find(x => x.id === evId);
          if (ev) {
            const text = encodeURIComponent(`📅 ${ev.title}\n🕐 ${Toggle.utils.formatDateRange(ev.start, ev.end)}${ev.location ? '\n📍 ' + ev.location : ''}\n(Via Toggle Calendar PK)`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
          }
          return;
        }
        if (Toggle.popover && typeof Toggle.popover.showEventPopover === 'function') {
          Toggle.popover.showEventPopover(el.dataset.id, el);
        }
      });
    });
  };

  // Global alias
  window.renderAgendaView = views.renderAgendaView;
})(window);
