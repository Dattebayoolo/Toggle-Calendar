/**
 * popover.js — Event detail popover and toast notification component
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const popover = Toggle.popover = Toggle.popover || {};

  /* ── Toast Notifications ── */
  popover.showToast = function(msg, duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fadeout');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  /* ── Event Popover Display ── */
  popover.showEventPopover = function(id, anchor) {
    const events = (Toggle.state && Toggle.state.events) || [];
    const ev = events.find(e => e.id === id);
    if (!ev) return;

    const pop = document.getElementById('eventPopover');
    if (!pop) return;

    const colors = Toggle.CAT_COLORS || {};
    const color = colors[ev.category] || '#1a73e8';

    const colorBar = document.getElementById('popoverColorBar');
    if (colorBar) colorBar.style.background = color;

    const titleEl = document.getElementById('popoverTitle');
    if (titleEl) titleEl.textContent = ev.title;

    const timeEl = document.getElementById('popoverTime');
    if (timeEl) timeEl.textContent = Toggle.utils.formatDateRange(ev.start, ev.end);

    const locEl = document.getElementById('popoverLocation');
    if (locEl) locEl.textContent = ev.location ? '📍 ' + ev.location : '';

    const descEl = document.getElementById('popoverDesc');
    if (descEl) descEl.textContent = ev.description || '';

    // Position popover
    const rect = anchor.getBoundingClientRect();
    pop.classList.remove('hidden');
    pop.style.left = Math.min(rect.right + 8, window.innerWidth - 340) + 'px';
    pop.style.top  = Math.min(rect.top, window.innerHeight - 280) + 'px';

    pop.dataset.currentId = id;
  };

  popover.hidePopover = function() {
    const pop = document.getElementById('eventPopover');
    if (pop) pop.classList.add('hidden');
  };

  /* ── Popover Actions Setup ── */
  popover.initPopoverListeners = function() {
    const popClose = document.getElementById('popoverClose');
    if (popClose) popClose.addEventListener('click', popover.hidePopover);

    const popDelete = document.getElementById('popDelete');
    if (popDelete) {
      popDelete.addEventListener('click', () => {
        const pop = document.getElementById('eventPopover');
        const id = pop?.dataset.currentId;
        if (!id) return;
        const ev = Toggle.state.events.find(e => e.id === id);
        if (ev && confirm(`Delete "${ev.title}"?`)) {
          Toggle.state.events = Toggle.state.events.filter(e => e.id !== id);
          Toggle.saveEvents();
          popover.hidePopover();
          if (typeof Toggle.renderAll === 'function') Toggle.renderAll();
          popover.showToast('Event deleted');
        }
      });
    }

    const popEdit = document.getElementById('popEdit');
    if (popEdit) {
      popEdit.addEventListener('click', () => {
        const pop = document.getElementById('eventPopover');
        const id = pop?.dataset.currentId;
        if (!id) return;
        popover.hidePopover();
        if (Toggle.modal && typeof Toggle.modal.openEditEventModal === 'function') {
          Toggle.modal.openEditEventModal(id);
        }
      });
    }

    const popShareWhatsApp = document.getElementById('popShareWhatsApp');
    if (popShareWhatsApp) {
      popShareWhatsApp.addEventListener('click', () => {
        const pop = document.getElementById('eventPopover');
        const id = pop?.dataset.currentId;
        const ev = Toggle.state.events.find(e => e.id === id);
        if (!ev) return;
        const text = encodeURIComponent(`📅 ${ev.title}\n🕐 ${Toggle.utils.formatDateRange(ev.start, ev.end)}${ev.location ? '\n📍 ' + ev.location : ''}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      });
    }
  };

  // Global aliases
  window.showToast = popover.showToast;
  window.showEventPopover = popover.showEventPopover;
  window.hidePopover = popover.hidePopover;
  window.initPopoverListeners = popover.initPopoverListeners;
})(window);
