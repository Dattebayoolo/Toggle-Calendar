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
        Toggle.state.current = new Date(d.getFullYear(), d.getMonth(), 1);
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
