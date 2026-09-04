/**
 * modal.js — Event creation and edit modal component
 * With real-time Jummah Guard overlap warning & auto-shift,
 * Load Shedding outage check, and WhatsApp notification integration.
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const modal = Toggle.modal = Toggle.modal || {};

  /* Localized modal titles (Urdu mode via Toggle.URDU) */
  Toggle._modalTitle = function(kind) {
    const U = Toggle.URDU || {};
    if ((Toggle.state && Toggle.state.lang) === 'ur') {
      if (kind === 'create') return U.createEvent || 'Create Event';
      if (kind === 'edit') return U.editEvent || 'Edit Event';
      if (kind === 'editSeries') return `${U.editEvent || 'Edit Event'} (پوری سیریز)`;
    }
    if (kind === 'create') return 'Create Event';
    if (kind === 'edit') return 'Edit Event';
    return 'Edit Repeating Event';
  };

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
    if (modalTitle) modalTitle.textContent = Toggle._modalTitle('create');

    const titleEl = document.getElementById('eventTitle');
    if (titleEl) titleEl.value = '';

    const nlpStrip = document.getElementById('nlpStrip');
    if (nlpStrip) nlpStrip.classList.add('hidden');

    const recEl = document.getElementById('eventRecurrence');
    if (recEl) recEl.value = 'none';

    const recWrap = document.getElementById('recurrenceUntilWrap');
    if (recWrap) recWrap.classList.add('hidden');

    const untilEl = document.getElementById('eventUntil');
    if (untilEl) untilEl.value = '';

    const remEl = document.getElementById('eventReminder');
    if (remEl) remEl.value = '15';

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
    const isOcc = String(id).includes('__occ__');
    const parentId = isOcc ? String(id).split('__occ__')[0] : id;
    const ev = (Toggle.state && Toggle.state.events || []).find(e => e.id === parentId);
    if (!ev) return;

    Toggle.state.editingId = id;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = Toggle._modalTitle(isOcc ? 'editSeries' : 'edit');

    const titleEl = document.getElementById('eventTitle');
    if (titleEl) titleEl.value = ev.title;

    const nlpStrip = document.getElementById('nlpStrip');
    if (nlpStrip) nlpStrip.classList.add('hidden');

    const startEl = document.getElementById('eventStart');
    if (startEl) {
      if (isOcc) {
        const occDateKey = String(id).split('__occ__')[1];
        const sTime = ev.start.includes('T') ? ev.start.split('T')[1] : '10:00';
        startEl.value = `${occDateKey}T${sTime}`;
      } else {
        startEl.value = ev.start;
      }
    }

    const endEl = document.getElementById('eventEnd');
    if (endEl) {
      if (isOcc && ev.end) {
        const occDateKey = String(id).split('__occ__')[1];
        const eTime = ev.end.includes('T') ? ev.end.split('T')[1] : '11:00';
        endEl.value = `${occDateKey}T${eTime}`;
      } else {
        endEl.value = ev.end || '';
      }
    }

    const recEl = document.getElementById('eventRecurrence');
    const recWrap = document.getElementById('recurrenceUntilWrap');
    const untilEl = document.getElementById('eventUntil');
    if (recEl) {
      recEl.value = (ev.recurrence && ev.recurrence.freq) ? ev.recurrence.freq : 'none';
      if (recWrap) {
        if (recEl.value !== 'none') {
          recWrap.classList.remove('hidden');
          if (untilEl) untilEl.value = ev.recurrence?.until || '';
        } else {
          recWrap.classList.add('hidden');
          if (untilEl) untilEl.value = '';
        }
      }
    }

    const remEl = document.getElementById('eventReminder');
    if (remEl) {
      remEl.value = ev.reminder !== undefined ? String(ev.reminder) : '15';
    }

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
    const nlpStrip = document.getElementById('nlpStrip');
    if (nlpStrip) nlpStrip.classList.add('hidden');
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
    const recEl = document.getElementById('eventRecurrence');
    const untilEl = document.getElementById('eventUntil');
    const remEl = document.getElementById('eventReminder');

    const startVal = startEl ? startEl.value : '';
    let endVal = endEl ? endEl.value : '';
    if (!endVal && startVal) {
      const s = new Date(startVal);
      const eDate = new Date(s.getTime() + 3600000);
      const pad = n => n.toString().padStart(2, '0');
      endVal = `${eDate.getFullYear()}-${pad(eDate.getMonth()+1)}-${pad(eDate.getDate())}T${pad(eDate.getHours())}:${pad(eDate.getMinutes())}`;
    }

    const recurrence = (recEl && recEl.value !== 'none') ? {
      freq: recEl.value,
      until: (untilEl && untilEl.value) ? untilEl.value : null,
    } : null;

    const reminder = remEl ? remEl.value : '15';

    const ev = {
      id: Toggle.state.editingId || Toggle.getEventId(),
      title,
      start: startVal,
      end: endVal,
      recurrence,
      reminder,
      exdates: [],
      category: catEl ? catEl.value : 'work',
      location: locEl ? locEl.value.trim() : '',
      description: descEl ? descEl.value.trim() : '',
      attendees: attEl ? attEl.value.trim() : '',
      notify: [...document.querySelectorAll('[name="notifMethod"]:checked')].map(c => c.value),
    };

    const editingId = Toggle.state.editingId;
    if (editingId) {
      const isOcc = String(editingId).includes('__occ__');
      if (isOcc) {
        const parentId = String(editingId).split('__occ__')[0];
        const occDateKey = String(editingId).split('__occ__')[1];
        const editAll = confirm('This is a repeating event.\n\nClick OK to update ALL occurrences in the series.\nClick Cancel to update ONLY this occurrence.');
        if (editAll) {
          const parentIdx = Toggle.state.events.findIndex(x => x.id === parentId);
          if (parentIdx !== -1) {
            Toggle.state.events[parentIdx] = {
              ...Toggle.state.events[parentIdx],
              title: ev.title,
              category: ev.category,
              location: ev.location,
              description: ev.description,
              attendees: ev.attendees,
              recurrence: ev.recurrence,
              reminder: ev.reminder,
              notify: ev.notify,
            };
          }
        } else {
          // Exclude this date from parent
          const parent = Toggle.state.events.find(x => x.id === parentId);
          if (parent) {
            parent.exdates = parent.exdates || [];
            if (!parent.exdates.includes(occDateKey)) parent.exdates.push(occDateKey);
          }
          // Add as separate event
          ev.id = Toggle.getEventId();
          ev.recurrence = null;
          Toggle.state.events.push(ev);
        }
      } else {
        const idx = Toggle.state.events.findIndex(x => x.id === editingId);
        if (idx !== -1) {
          ev.exdates = Toggle.state.events[idx].exdates || [];
          Toggle.state.events[idx] = ev;
        }
      }
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
    const titleEl = document.getElementById('eventTitle');
    const nlpStrip = document.getElementById('nlpStrip');
    const nlpSummary = document.getElementById('nlpSummary');
    const nlpApplyBtn = document.getElementById('nlpApplyBtn');
    const recEl = document.getElementById('eventRecurrence');
    const recWrap = document.getElementById('recurrenceUntilWrap');

    // Recurrence dropdown toggles 'until' date wrap
    if (recEl && recWrap) {
      recEl.addEventListener('change', () => {
        if (recEl.value !== 'none') {
          recWrap.classList.remove('hidden');
        } else {
          recWrap.classList.add('hidden');
        }
      });
    }

    // Natural Language Parser (Pillar 3)
    let nlpParsed = null;
    if (titleEl && nlpStrip && nlpSummary) {
      titleEl.addEventListener('input', () => {
        const val = titleEl.value.trim();
        if (val.length > 5 && Toggle.utils && typeof Toggle.utils.parseNLP === 'function') {
          const res = Toggle.utils.parseNLP(val);
          if (res && (res.hasDate || res.hasTime || res.location || res.durationMin !== 60)) {
            nlpParsed = res;
            nlpSummary.textContent = res.summary;
            nlpStrip.classList.remove('hidden');
            return;
          }
        }
        nlpStrip.classList.add('hidden');
        nlpParsed = null;
      });
    }

    if (nlpApplyBtn) {
      nlpApplyBtn.addEventListener('click', () => {
        if (!nlpParsed) return;
        if (titleEl) titleEl.value = nlpParsed.title;
        if (startEl && nlpParsed.start) startEl.value = nlpParsed.start;
        if (endEl && nlpParsed.end) endEl.value = nlpParsed.end;
        const locEl = document.getElementById('eventLocation');
        if (locEl && nlpParsed.location) locEl.value = nlpParsed.location;
        if (nlpStrip) nlpStrip.classList.add('hidden');
        updateOverlapAlerts();
      });
    }

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
