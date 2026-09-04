/**
 * modal.js — Event creation and edit modal component
 * With real-time Jummah Guard overlap warning & auto-shift,
 * Load Shedding outage check, and WhatsApp notification integration.
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const modal = Toggle.modal = Toggle.modal || {};

  function updateOverlapAlerts() {
    const startEl = document.getElementById('eventStart');
    const endEl = document.getElementById('eventEnd');
    let alertBox = document.getElementById('modalOverlapAlert');

    if (!alertBox) {
      alertBox = document.createElement('div');
      alertBox.id = 'modalOverlapAlert';
      alertBox.className = 'modal-overlap-alert hidden';
      const form = document.getElementById('eventForm');
      if (form) form.insertBefore(alertBox, form.querySelector('.modal-section'));
    }

    if (!startEl || !startEl.value) {
      alertBox.classList.add('hidden');
      alertBox.innerHTML = '';
      return;
    }

    const state = Toggle.state || {};
    const utils = Toggle.utils || {};
    const alerts = [];

    // 1. Check Jummah overlap
    if (state.showJummah && utils.checkJummahOverlap && utils.checkJummahOverlap(startEl.value, endEl ? endEl.value : null)) {
      alerts.push(`
        <div class="alert-row jummah-alert">
          <span class="material-icons-round alert-icon">mosque</span>
          <div class="alert-text">
            <strong>Jummah Guard:</strong> Overlaps Friday congregation buffer (12:45 PM – 2:30 PM).
          </div>
          <button type="button" class="alert-action-btn" id="shiftJummahBtn">Shift to 2:45 PM</button>
        </div>
      `);
    }

    // 2. Check Load Shedding overlap
    if (state.showLoadShedding && utils.checkLoadSheddingOverlap) {
      const outageSlot = utils.checkLoadSheddingOverlap(startEl.value, endEl ? endEl.value : null, state.city || 'karachi');
      if (outageSlot) {
        alerts.push(`
          <div class="alert-row outage-alert">
            <span class="material-icons-round alert-icon">flash_off</span>
            <div class="alert-text">
              <strong>Outage Window:</strong> Load shedding scheduled (${outageSlot.start} – ${outageSlot.end}) in ${Toggle.utils.capitalize(state.city || 'Karachi')}.
            </div>
          </div>
        `);
      }
    }

    if (alerts.length) {
      alertBox.innerHTML = alerts.join('');
      alertBox.classList.remove('hidden');

      const shiftBtn = document.getElementById('shiftJummahBtn');
      if (shiftBtn) {
        shiftBtn.addEventListener('click', () => {
          const s = new Date(startEl.value);
          const pad = n => n.toString().padStart(2, '0');
          const y = s.getFullYear();
          const mo = pad(s.getMonth() + 1);
          const d = pad(s.getDate());
          startEl.value = `${y}-${mo}-${d}T14:45`;
          if (endEl) endEl.value = `${y}-${mo}-${d}T15:45`;
          updateOverlapAlerts();
        });
      }
    } else {
      alertBox.classList.add('hidden');
      alertBox.innerHTML = '';
    }
  }

  modal.openNewEventModal = function(date, startHour) {
    Toggle.state.editingId = null;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Create Event';

    const titleEl = document.getElementById('eventTitle');
    if (titleEl) titleEl.value = '';

    const catEl = document.getElementById('eventCategory');
    if (catEl) catEl.value = 'work';

    const locEl = document.getElementById('eventLocation');
    if (locEl) locEl.value = '';

    const descEl = document.getElementById('eventDesc');
    if (descEl) descEl.value = '';

    const attEl = document.getElementById('eventAttendees');
    if (attEl) attEl.value = '';

    const d = date ? new Date(date) : new Date();
    const pad = n => n.toString().padStart(2, '0');
    const y = d.getFullYear();
    const mo = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    let hour = 10;
    if (typeof startHour === 'number') {
      hour = startHour;
    } else if (date && typeof date.getHours === 'function' && date.getHours() !== 0) {
      hour = date.getHours();
    }

    const startEl = document.getElementById('eventStart');
    const endEl = document.getElementById('eventEnd');
    if (startEl) startEl.value = `${y}-${mo}-${day}T${pad(hour)}:00`;
    if (endEl) {
      const nextHour = (hour + 1) % 24;
      endEl.value = `${y}-${mo}-${day}T${pad(nextHour)}:00`;
    }

    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.add('open');

    updateOverlapAlerts();
    setTimeout(() => titleEl && titleEl.focus(), 80);
  };

  modal.openEditEventModal = function(id) {
    const ev = (Toggle.state && Toggle.state.events || []).find(e => e.id === id);
    if (!ev) return;

    Toggle.state.editingId = id;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Edit Event';

    const titleEl = document.getElementById('eventTitle');
    if (titleEl) titleEl.value = ev.title;

    const startEl = document.getElementById('eventStart');
    if (startEl) startEl.value = ev.start;

    const endEl = document.getElementById('eventEnd');
    if (endEl) endEl.value = ev.end || '';

    const catEl = document.getElementById('eventCategory');
    if (catEl) catEl.value = ev.category || 'work';

    const locEl = document.getElementById('eventLocation');
    if (locEl) locEl.value = ev.location || '';

    const descEl = document.getElementById('eventDesc');
    if (descEl) descEl.value = ev.description || '';

    const attEl = document.getElementById('eventAttendees');
    if (attEl) attEl.value = ev.attendees || '';

    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.add('open');

    updateOverlapAlerts();
  };

  modal.closeModal = function() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  modal.saveEvent = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const titleEl = document.getElementById('eventTitle');
    const title = titleEl ? titleEl.value.trim() : '';
    if (!title) return;

    const startEl = document.getElementById('eventStart');
    const endEl = document.getElementById('eventEnd');
    const catEl = document.getElementById('eventCategory');
    const locEl = document.getElementById('eventLocation');
    const descEl = document.getElementById('eventDesc');
    const attEl = document.getElementById('eventAttendees');

    const startVal = startEl ? startEl.value : '';
    let endVal = endEl ? endEl.value : '';
    if (!endVal && startVal) {
      const s = new Date(startVal);
      const eDate = new Date(s.getTime() + 3600000);
      const pad = n => n.toString().padStart(2, '0');
      endVal = `${eDate.getFullYear()}-${pad(eDate.getMonth()+1)}-${pad(eDate.getDate())}T${pad(eDate.getHours())}:${pad(eDate.getMinutes())}`;
    }

    const ev = {
      id: Toggle.state.editingId || Toggle.getEventId(),
      title,
      start: startVal,
      end: endVal,
      category: catEl ? catEl.value : 'work',
      location: locEl ? locEl.value.trim() : '',
      description: descEl ? descEl.value.trim() : '',
      attendees: attEl ? attEl.value.trim() : '',
      notify: [...document.querySelectorAll('[name="notifMethod"]:checked')].map(c => c.value),
    };

    if (Toggle.state.editingId) {
      const idx = Toggle.state.events.findIndex(x => x.id === Toggle.state.editingId);
      if (idx !== -1) Toggle.state.events[idx] = ev;
    } else {
      Toggle.state.events.push(ev);
    }

    Toggle.saveEvents();
    modal.closeModal();
    if (typeof Toggle.renderAll === 'function') Toggle.renderAll();

    if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
      Toggle.popover.showToast(`✅ "${title}" saved`);
    }

    // If WhatsApp notify was checked, offer instant WhatsApp RSVP share
    if (ev.notify.includes('whatsapp') && !Toggle.state.editingId) {
      setTimeout(() => {
        const text = encodeURIComponent(`📅 *${ev.title}*\n🕐 ${Toggle.utils.formatDateRange(ev.start, ev.end)}${ev.location ? '\n📍 ' + ev.location : ''}\n\n_Scheduled via Toggle Calendar PK_`);
        if (confirm(`Would you like to share the WhatsApp meeting invite now for "${ev.title}"?`)) {
          window.open(`https://wa.me/?text=${text}`, '_blank');
        }
      }, 350);
    }
  };

  modal.initModalListeners = function() {
    const modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', modal.closeModal);

    const cancelEvent = document.getElementById('cancelEvent');
    if (cancelEvent) cancelEvent.addEventListener('click', modal.closeModal);

    const eventForm = document.getElementById('eventForm');
    if (eventForm) eventForm.addEventListener('submit', modal.saveEvent);

    const startEl = document.getElementById('eventStart');
    const endEl = document.getElementById('eventEnd');

    if (startEl) {
      startEl.addEventListener('change', () => {
        if (endEl && (!endEl.value || endEl.value <= startEl.value)) {
          const s = new Date(startEl.value);
          const e = new Date(s.getTime() + 3600000);
          const pad = n => n.toString().padStart(2, '0');
          endEl.value = `${e.getFullYear()}-${pad(e.getMonth()+1)}-${pad(e.getDate())}T${pad(e.getHours())}:${pad(e.getMinutes())}`;
        }
        updateOverlapAlerts();
      });
    }

    if (endEl) {
      endEl.addEventListener('change', updateOverlapAlerts);
    }

    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) modal.closeModal();
      });
    }
  };

  // Global aliases
  window.openNewEventModal = modal.openNewEventModal;
  window.openEditEventModal = modal.openEditEventModal;
  window.closeModal = modal.closeModal;
  window.saveEvent = modal.saveEvent;
  window.initModalListeners = modal.initModalListeners;
})(window);
