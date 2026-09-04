/**
 * constants.js — Application constants for Toggle Calendar
 * Pakistani public holidays, city coordinates for astronomical calculations,
 * Islamic lunar events, load shedding schedules, and category colors.
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};

  /* ── City Coordinates (for Real-Time Astronomical Calculations) ── */
  Toggle.CITIES = {
    karachi:    { name: 'Karachi',    lat: 24.8607, lng: 67.0011, tz: 5 },
    lahore:     { name: 'Lahore',     lat: 31.5204, lng: 74.3587, tz: 5 },
    islamabad:  { name: 'Islamabad',  lat: 33.6844, lng: 73.0479, tz: 5 },
    rawalpindi: { name: 'Rawalpindi', lat: 33.5651, lng: 73.0169, tz: 5 },
    peshawar:   { name: 'Peshawar',   lat: 34.0151, lng: 71.5249, tz: 5 },
    quetta:     { name: 'Quetta',     lat: 30.1798, lng: 66.9750, tz: 5 },
    multan:     { name: 'Multan',     lat: 30.1575, lng: 71.5249, tz: 5 },
    faisalabad: { name: 'Faisalabad', lat: 31.4504, lng: 73.1350, tz: 5 },
    sialkot:    { name: 'Sialkot',    lat: 32.4945, lng: 74.5229, tz: 5 },
    hyderabad:  { name: 'Hyderabad',  lat: 25.3960, lng: 68.3578, tz: 5 },
    gilgit:     { name: 'Gilgit',     lat: 35.9208, lng: 74.3144, tz: 5 },
  };

  /* ── Pakistani Gazetted Federal Holidays (Fixed Dates) ── */
  Toggle.PK_HOLIDAYS = [
    { month: 1,  day: 1,  name: 'New Year / Bank Holiday', type: 'bank' },
    { month: 2,  day: 5,  name: 'Kashmir Solidarity Day',   type: 'gazetted' },
    { month: 3,  day: 23, name: 'Pakistan Day (Resolution)',type: 'gazetted' },
    { month: 5,  day: 1,  name: 'Labour Day',               type: 'gazetted' },
    { month: 8,  day: 14, name: 'Independence Day 🇵🇰',     type: 'national' },
    { month: 11, day: 9,  name: 'Iqbal Day',                type: 'gazetted' },
    { month: 12, day: 25, name: 'Quaid-e-Azam Day / Christmas', type: 'gazetted' },
  ];

  /* ── Islamic Lunar Gazetted & Observance Days (Hijri Dates) ── */
  Toggle.ISLAMIC_EVENTS = [
    { hMonth: 1,  hDay: 9,  name: 'Tasu’a (9th Muharram)',         gazetted: true },
    { hMonth: 1,  hDay: 10, name: 'Ashura (10th Muharram)',        gazetted: true },
    { hMonth: 3,  hDay: 12, name: 'Eid Milad-un-Nabi (12 Rabi I)', gazetted: true },
    { hMonth: 8,  hDay: 15, name: 'Shab-e-Barat',                  gazetted: false },
    { hMonth: 9,  hDay: 1,  name: '1st Ramadan (Bank Closure)',    gazetted: true },
    { hMonth: 9,  hDay: 27, name: 'Laylat al-Qadr (27th Ramadan)',  gazetted: false },
    { hMonth: 10, hDay: 1,  name: 'Eid-ul-Fitr (Day 1)',           gazetted: true },
    { hMonth: 10, hDay: 2,  name: 'Eid-ul-Fitr (Day 2)',           gazetted: true },
    { hMonth: 10, hDay: 3,  name: 'Eid-ul-Fitr (Day 3)',           gazetted: true },
    { hMonth: 12, hDay: 9,  name: 'Day of Arafah / Hajj',          gazetted: false },
    { hMonth: 12, hDay: 10, name: 'Eid-ul-Adha (Day 1)',           gazetted: true },
    { hMonth: 12, hDay: 11, name: 'Eid-ul-Adha (Day 2)',           gazetted: true },
    { hMonth: 12, hDay: 12, name: 'Eid-ul-Adha (Day 3)',           gazetted: true },
  ];

  /* ── Load Shedding Feeder Outage Windows (by City) ── */
  Toggle.LOAD_SHEDDING_SCHEDULES = {
    karachi:    [{ start: '10:00', end: '11:30' }, { start: '15:30', end: '17:00' }],
    lahore:     [{ start: '11:00', end: '12:30' }, { start: '16:00', end: '17:30' }],
    islamabad:  [{ start: '09:30', end: '11:00' }, { start: '14:30', end: '16:00' }],
    rawalpindi: [{ start: '09:30', end: '11:00' }, { start: '14:30', end: '16:00' }],
    peshawar:   [{ start: '10:30', end: '12:00' }, { start: '15:00', end: '16:30' }],
    quetta:     [{ start: '11:30', end: '13:00' }, { start: '16:30', end: '18:00' }],
    multan:     [{ start: '10:00', end: '11:30' }, { start: '15:00', end: '16:30' }],
    faisalabad: [{ start: '10:30', end: '12:00' }, { start: '15:30', end: '17:00' }],
    sialkot:    [{ start: '10:00', end: '11:30' }, { start: '16:00', end: '17:30' }],
    hyderabad:  [{ start: '11:00', end: '12:30' }, { start: '16:00', end: '17:30' }],
    gilgit:     [{ start: '09:00', end: '10:30' }, { start: '14:00', end: '15:30' }],
  };

  /* ── Category Color Map (Modern Jewel Tones) ── */
  Toggle.CAT_COLORS = {
    work:      '#2563eb',
    personal:  '#7c3aed',
    family:    '#d97706',
    health:    '#e11d48',
    religious: '#059669',
    social:    '#db2777',
  };

  // Global aliases
  window.CITIES = Toggle.CITIES;
  window.PK_HOLIDAYS = Toggle.PK_HOLIDAYS;
  window.ISLAMIC_EVENTS = Toggle.ISLAMIC_EVENTS;
  window.LOAD_SHEDDING_SCHEDULES = Toggle.LOAD_SHEDDING_SCHEDULES;
  window.CAT_COLORS = Toggle.CAT_COLORS;
})(window);
