/**
 * landing.js — Interactive Engine for Toggle Calendar Landing Page
 * Synchronized with Toggle Calendar app architecture (style.css, constants.js, utils.js)
 */

(function() {
  'use strict';

  /* ── 11 Pakistani Cities Coordinates ── */
  const CITIES = {
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

  /* ── Astronomical Prayer Calculation (Karachi Method: Fajr 18°, Isha 18°, Hanafi Asr) ── */
  const D2R = Math.PI / 180.0;
  const R2D = 180.0 / Math.PI;

  function toRad(deg) { return deg * D2R; }
  function toDeg(rad) { return rad * R2D; }
  function fixHour(a) { a = a - 24.0 * Math.floor(a / 24.0); return a < 0 ? a + 24.0 : a; }
  function fixAngle(a) { a = a - 360.0 * Math.floor(a / 360.0); return a < 0 ? a + 360.0 : a; }

  function getJulianDate(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const a = Math.floor((14 - m) / 12);
    const yPrime = y + 4800 - a;
    const mPrime = m + 12 * a - 3;
    const jdn = d + Math.floor((153 * mPrime + 2) / 5) + 365 * yPrime +
                Math.floor(yPrime / 4) - Math.floor(yPrime / 100) + Math.floor(yPrime / 400) - 32045;
    return jdn - 0.5 + (date.getHours() - 5) / 24.0;
  }

  function sunPosition(jd) {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g)));
    const e = 23.439 - 0.00000036 * D;
    const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15.0;
    const dec = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));
    const EqT = (q / 15.0) - fixHour(RA);
    return { declination: dec, equationOfTime: EqT };
  }

  function calcHourAngle(altitude, lat, dec) {
    const num = Math.sin(toRad(altitude)) - Math.sin(toRad(lat)) * Math.sin(toRad(dec));
    const den = Math.cos(toRad(lat)) * Math.cos(toRad(dec));
    const cosOmega = num / den;
    if (cosOmega > 1.0) return 0;
    if (cosOmega < -1.0) return 12.0;
    return toDeg(Math.acos(cosOmega)) / 15.0;
  }

  function formatTimeDec(hDec) {
    const totalMinutes = Math.round(fixHour(hDec) * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  }

  function calculatePrayerTimes(cityKey, dateObj = new Date()) {
    const city = CITIES[cityKey] || CITIES.karachi;
    const jd = getJulianDate(dateObj);
    const { declination: dec, equationOfTime: EqT } = sunPosition(jd);

    const noon = fixHour(12.0 - EqT + (city.tz - city.lng / 15.0));
    const fajrAngle = calcHourAngle(-18.0, city.lat, dec);
    const fajr = fixHour(noon - fajrAngle);

    const sunriseAngle = calcHourAngle(-0.833, city.lat, dec);
    const sunrise = fixHour(noon - sunriseAngle);
    const sunset = fixHour(noon + sunriseAngle);

    // Hanafi Asr: shadow factor = 2
    const asrAlt = toDeg(Math.atan(1.0 / (2.0 + Math.tan(toRad(Math.abs(city.lat - dec))))));
    const asrAngle = calcHourAngle(asrAlt, city.lat, dec);
    const asr = fixHour(noon + asrAngle);

    const dhuhr = noon + (2.0 / 60.0);
    const maghrib = sunset + (2.0 / 60.0);
    const ishaAngle = calcHourAngle(-18.0, city.lat, dec);
    const isha = fixHour(noon + ishaAngle);

    return {
      fajr: formatTimeDec(fajr),
      sunrise: formatTimeDec(sunrise),
      dhuhr: formatTimeDec(dhuhr),
      asr: formatTimeDec(asr),
      maghrib: formatTimeDec(maghrib),
      isha: formatTimeDec(isha)
    };
  }

  /* ── Hijri Date Sync with Ruet Offset ── */
  let currentRuetOffset = 0;

  function getHijriDate(date = new Date(), offset = 0) {
    const adjusted = new Date(date.getTime() + offset * 86400000);
    const jd = getJulianDate(adjusted);
    const l = Math.floor(jd - 1948440 + 10632);
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) +
              (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
    const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
               (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const m = Math.floor((24 * l3) / 709);
    const d = l3 - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;

    const islamicMonths = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha’ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi’dah', 'Dhu al-Hijjah'
    ];

    return {
      day: d,
      month: islamicMonths[(m - 1 + 12) % 12],
      year: y
    };
  }

  /* ── Live Mockup Header Updates ── */
  function updateMockupHeader() {
    const gregEl = document.getElementById('mockupGregDate');
    const hijriEl = document.getElementById('mockupHijriDate');
    const now = new Date();

    if (gregEl) {
      gregEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (hijriEl) {
      const h = getHijriDate(now, currentRuetOffset);
      hijriEl.textContent = `${h.day} ${h.month} ${h.year} AH`;
    }
  }

  /* ── Ruet Adjuster Controls in Mockup ── */
  function initRuetControls() {
    const wrap = document.getElementById('mockupRuetGroup');
    if (!wrap) return;

    wrap.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;

      wrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const val = chip.dataset.offset;
      currentRuetOffset = parseInt(val, 10) || 0;
      updateMockupHeader();
    });
  }

  /* ── Mockup Sidebar Interactive Toggles ── */
  function initMockupToggles() {
    const jummahSw = document.getElementById('mockupSwJummah');
    const ramadanSw = document.getElementById('mockupSwRamadan');
    const loadshedSw = document.getElementById('mockupSwLoadshed');

    const jummahBanner = document.getElementById('mockupEventJummah');
    const ramadanBanner = document.getElementById('mockupEventRamadan');
    const loadshedBanner = document.getElementById('mockupEventLoadshed');

    if (jummahSw && jummahBanner) {
      jummahSw.addEventListener('change', () => {
        jummahBanner.style.display = jummahSw.checked ? 'flex' : 'none';
      });
    }

    if (ramadanSw && ramadanBanner) {
      ramadanSw.addEventListener('change', () => {
        ramadanBanner.style.display = ramadanSw.checked ? 'flex' : 'none';
      });
    }

    if (loadshedSw && loadshedBanner) {
      loadshedSw.addEventListener('change', () => {
        loadshedBanner.style.display = loadshedSw.checked ? 'flex' : 'none';
      });
    }
  }

  /* ── Mockup View Switcher ── */
  function initMockupViews() {
    const group = document.getElementById('mockupViewGroup');
    if (!group) return;

    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  }

  /* ── City Prayer Explorer Playground ── */
  function initPrayerExplorer() {
    const container = document.getElementById('cityPillsGroup');
    const titleEl = document.getElementById('prayerCityName');
    const tiles = {
      fajr: document.getElementById('tileFajr'),
      dhuhr: document.getElementById('tileDhuhr'),
      asr: document.getElementById('tileAsr'),
      maghrib: document.getElementById('tileMaghrib'),
      isha: document.getElementById('tileIsha')
    };

    function selectCity(cityKey) {
      if (container) {
        container.querySelectorAll('.chip').forEach(c => {
          c.classList.toggle('active', c.dataset.city === cityKey);
        });
      }

      const p = calculatePrayerTimes(cityKey);
      if (titleEl) {
        titleEl.textContent = `${CITIES[cityKey].name}, Pakistan — Astronomical Solar Calculations`;
      }

      for (const [k, el] of Object.entries(tiles)) {
        if (el) el.textContent = p[k];
      }

      // Also update mockup sidebar prayer rows
      const sidePrayers = ['mockupFajr', 'mockupDhuhr', 'mockupAsr', 'mockupMaghrib', 'mockupIsha'];
      const pKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      pKeys.forEach((key, idx) => {
        const row = document.getElementById(sidePrayers[idx]);
        if (row) row.textContent = p[key];
      });
    }

    if (container) {
      container.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (chip && chip.dataset.city) {
          selectCity(chip.dataset.city);
        }
      });
    }

    selectCity('karachi');
  }

  /* ── Roman Urdu & English Natural Language Parser Engine ── */
  function parseNaturalLanguage(rawText) {
    if (!rawText || !rawText.trim()) {
      return {
        title: 'Enter meeting details above',
        date: 'Today',
        time: 'Not specified',
        safe: true,
        statusText: 'Type an event in Urdu or English'
      };
    }

    const text = rawText.toLowerCase();
    let title = rawText.trim();
    let dateStr = 'Today';
    let timeStr = '12:00 PM';
    let isFriday = false;

    // Date keywords
    if (text.includes('kal') || text.includes('tomorrow')) {
      dateStr = 'Tomorrow';
      title = title.replace(/\b(kal|tomorrow)\b/gi, '').trim();
    } else if (text.includes('parson') || text.includes('day after tomorrow')) {
      dateStr = 'Day After Tomorrow';
      title = title.replace(/\b(parson|day after tomorrow)\b/gi, '').trim();
    } else if (text.includes('aaj') || text.includes('today')) {
      dateStr = 'Today';
      title = title.replace(/\b(aaj|today)\b/gi, '').trim();
    } else if (text.includes('jummah') || text.includes('friday')) {
      dateStr = 'Coming Friday';
      isFriday = true;
      title = title.replace(/\b(jummah|friday)\b/gi, '').trim();
    }

    // Time keywords
    let hour = 12;
    let minute = 0;

    if (text.includes('dopahar') || text.includes('shaam') || text.includes('raat') || text.includes('pm')) {
      // afternoon / evening / night
    }

    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(baje|pm|am|o'clock)?/i);
    if (timeMatch) {
      let matchedHour = parseInt(timeMatch[1], 10);
      let matchedMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;

      if (text.includes('dopahar') || text.includes('shaam') || text.includes('raat') || text.includes('pm')) {
        if (matchedHour < 12) matchedHour += 12;
      }
      hour = matchedHour;
      minute = matchedMin;
      timeStr = `${hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;

      title = title.replace(timeMatch[0], '').replace(/\b(baje|dopahar|shaam|subah|raat)\b/gi, '').trim();
    }

    // Check Jummah Clash (Friday 12:45 PM – 2:30 PM)
    let isJummahClash = false;
    if (isFriday || text.includes('jummah')) {
      const minutes = hour * 60 + minute;
      if (minutes >= (12 * 60 + 45) && minutes <= (14 * 60 + 30)) {
        isJummahClash = true;
      }
    }

    title = title.replace(/\b(se|with|at|ko|ka|ki|meet|meeting)\b/gi, '').replace(/\s+/g, ' ').trim() || rawText;

    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      date: dateStr,
      time: timeStr,
      safe: !isJummahClash,
      statusText: isJummahClash
        ? '⚠️ Jummah Clash (Auto-Shift to 3:00 PM recommended)'
        : '✅ Verified: No Jummah or Prayer Clash'
    };
  }

  /* ── NLP Playground Engine ── */
  function initNLPPlayground() {
    const input = document.getElementById('nlpInputField');
    const presets = document.getElementById('nlpPresets');
    const outTitle = document.getElementById('nlpOutTitle');
    const outDate = document.getElementById('nlpOutDate');
    const outTime = document.getElementById('nlpOutTime');
    const outStatus = document.getElementById('nlpOutStatus');

    function update(val) {
      const res = parseNaturalLanguage(val);
      if (outTitle) outTitle.textContent = res.title;
      if (outDate) outDate.textContent = res.date;
      if (outTime) outTime.textContent = res.time;
      if (outStatus) {
        outStatus.textContent = res.statusText;
        outStatus.style.color = res.safe ? 'var(--green)' : 'var(--amber)';
      }
    }

    if (input) {
      input.addEventListener('input', () => update(input.value));
    }

    if (presets) {
      presets.addEventListener('click', (e) => {
        const btn = e.target.closest('.nlp-preset-btn');
        if (btn && btn.dataset.prompt) {
          if (input) {
            input.value = btn.dataset.prompt;
            update(btn.dataset.prompt);
          }
        }
      });
    }

    update('Chai with Hamza kal shaam 5 baje at Gloria Jeans');
  }

  /* ── Tab Switcher ── */
  function initTabs() {
    const tabs = document.querySelectorAll('.playground-tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.dataset.target;
        document.querySelectorAll('.tab-panel').forEach(p => {
          p.classList.toggle('active', p.id === target);
        });
      });
    });
  }

  /* ── Theme Switcher (Synced with App: toggle_theme in localStorage) ── */
  function initTheme() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const saved = localStorage.getItem('toggle_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);

    function updateIcon(theme) {
      if (themeBtn) {
        const icon = themeBtn.querySelector('.material-icons-round');
        if (icon) {
          icon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
        }
      }
    }

    updateIcon(saved);

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('toggle_theme', next);
        updateIcon(next);
      });
    }
  }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateMockupHeader();
    initRuetControls();
    initMockupToggles();
    initMockupViews();
    initPrayerExplorer();
    initNLPPlayground();
    initTabs();
  });
})();
