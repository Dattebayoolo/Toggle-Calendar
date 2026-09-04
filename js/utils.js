/**
 * utils.js — Helper utilities for Toggle Calendar
 * Real-time astronomical prayer calculation engine (Karachi/Pakistan standard),
 * Hijri lunar conversion, holiday matching, ICS export, and formatters.
 */

(function(window) {
  'use strict';
  const Toggle = window.Toggle = window.Toggle || {};
  const utils = Toggle.utils = Toggle.utils || {};

  /* ─────────────────────────────────────────────────────────────────────────────
     ASTRONOMICAL SOLAR & PRAYER CALCULATION ENGINE
     University of Islamic Sciences, Karachi method (standard in Pakistan)
     Fajr: 18°, Isha: 18°, Asr: Hanafi (shadow factor = 2)
  ───────────────────────────────────────────────────────────────────────────── */
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
    let jdn = d + Math.floor((153 * mPrime + 2) / 5) + 365 * yPrime +
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
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Calculates high-precision prayer times for a given date and city.
   * Returns array of prayer objects with raw 24h, 12h, totalMin, and string format.
   */
  utils.calcPrayerTimes = function(date, cityKey) {
    const cities = Toggle.CITIES || {};
    const city = cities[cityKey] || cities.karachi || { lat: 24.8607, lng: 67.0011, tz: 5 };
    const lat = city.lat;
    const lng = city.lng;
    const tz = city.tz || 5;

    const jd = getJulianDate(date);
    const sun = sunPosition(jd);
    const dec = sun.declination;
    const EqT = sun.equationOfTime;

    // Solar noon (Dhuhr)
    const dhuhrDec = fixHour(12.0 + tz - (lng / 15.0) - EqT);

    // Fajr (18° below horizon)
    const fajrAngle = calcHourAngle(-18.0, lat, dec);
    const fajrDec = dhuhrDec - fajrAngle;

    // Sunrise (-0.833°)
    const sunriseAngle = calcHourAngle(-0.833, lat, dec);
    const sunriseDec = dhuhrDec - sunriseAngle;

    // Asr (Hanafi juristic method: shadow factor = 2)
    const asrAltitude = toDeg(Math.atan(1.0 / (2.0 + Math.tan(toRad(Math.abs(lat - dec))))));
    const asrAngle = calcHourAngle(asrAltitude, lat, dec);
    const asrDec = dhuhrDec + asrAngle;

    // Sunset / Maghrib (-0.833° + 2 min buffer)
    const sunsetAngle = calcHourAngle(-0.833, lat, dec);
    const maghribDec = dhuhrDec + sunsetAngle + (2.0 / 60.0);

    // Isha (18° below horizon)
    const ishaAngle = calcHourAngle(-18.0, lat, dec);
    const ishaDec = dhuhrDec + ishaAngle;

    const prayers = [
      { name: 'Fajr',    dec: fajrDec,    raw: formatTimeDec(fajrDec) },
      { name: 'Sunrise', dec: sunriseDec, raw: formatTimeDec(sunriseDec), isAux: true },
      { name: 'Dhuhr',   dec: dhuhrDec,   raw: formatTimeDec(dhuhrDec) },
      { name: 'Asr',     dec: asrDec,     raw: formatTimeDec(asrDec) },
      { name: 'Maghrib', dec: maghribDec, raw: formatTimeDec(maghribDec) },
      { name: 'Isha',    dec: ishaDec,    raw: formatTimeDec(ishaDec) },
    ];

    return prayers.map(p => {
      const [hStr, mStr] = p.raw.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const totalMin = h * 60 + m;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr12 = h % 12 || 12;
      const fmt12 = `${hr12}:${m.toString().padStart(2, '0')} ${ampm}`;
      return {
        name: p.name,
        raw: p.raw,
        fmt12,
        hour: h,
        min: m,
        totalMin,
        str: `${p.name} ${p.raw}`,
        isAux: !!p.isAux,
      };
    });
  };

  /* ── Prayer time memoization ──
     calcPrayerTimes is full trig astronomy and gets called many times per
     render (per week-view day, sidebar, next-prayer countdown, 30s tick).
     Results depend only on (date, city), so cache them. */
  const _prayerCache = new Map();
  const _calcPrayerTimesRaw = utils.calcPrayerTimes;
  utils.calcPrayerTimes = function(date, cityKey) {
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return _calcPrayerTimesRaw(date, cityKey);
    const pad = n => n.toString().padStart(2, '0');
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}|${cityKey || 'karachi'}`;
    if (_prayerCache.has(key)) return _prayerCache.get(key);
    const result = _calcPrayerTimesRaw(d, cityKey);
    if (_prayerCache.size > 400) _prayerCache.clear();
    _prayerCache.set(key, result);
    return result;
  };

  /**
   * Helper to return array of prayer strings: ['Fajr 05:04', 'Dhuhr 12:14', ...]
   * Omits auxiliary (Sunrise) for calendar block lists.
   */
  utils.getPrayerStrings = function(date, cityKey) {
    const list = utils.calcPrayerTimes(date, cityKey);
    return list.filter(p => !p.isAux).map(p => p.str);
  };

  /**
   * Returns live countdown to the next upcoming prayer.
   */
  utils.getNextPrayer = function(cityKey) {
    const now = new Date();
    const prayers = utils.calcPrayerTimes(now, cityKey).filter(p => !p.isAux);
    const currentMin = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < prayers.length; i++) {
      if (prayers[i].totalMin > currentMin) {
        const diff = prayers[i].totalMin - currentMin;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
        return {
          prayer: prayers[i],
          name: prayers[i].name,
          diffMinutes: diff,
          label: `Next: ${prayers[i].name} in ${timeStr}`,
        };
      }
    }

    // After Isha, next is Fajr tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomPrayers = utils.calcPrayerTimes(tomorrow, cityKey);
    const fajr = tomPrayers[0];
    const diff = (24 * 60 - currentMin) + fajr.totalMin;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return {
      prayer: fajr,
      name: 'Fajr',
      diffMinutes: diff,
      label: `Next: Fajr in ${h}h ${m}m`,
    };
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     HIJRI CALENDAR & LUNAR EVENTS ENGINE
  ───────────────────────────────────────────────────────────────────────────── */
  utils.toHijri = function(date) {
    const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
    let l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
              Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
        Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l) / 709);
    const day = l - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    const months = ['Muh', 'Saf', 'Rab I', 'Rab II', 'Jum I', 'Jum II', 'Raj', 'Sha', 'Ram', 'Shw', 'Dhu Q', 'Dhu H'];
    const fullMonths = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha’ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi’dah', 'Dhu al-Hijjah'
    ];
    return {
      day,
      month,
      year,
      monthName: months[month - 1] || '',
      fullMonthName: fullMonths[month - 1] || '',
    };
  };

  utils.hijriDateStr = function(date, offset) {
    const off = (offset !== undefined) ? offset : ((Toggle.state && Toggle.state.moonOffset) || 0);
    const h = utils.toHijri(date);
    const adjDay = h.day + off;
    return `${adjDay} ${h.monthName}`;
  };

  utils.hijriMonthStr = function(date) {
    const h = utils.toHijri(date);
    return `${h.fullMonthName} ${h.year} AH`;
  };

  /**
   * Ramadan Timings (Pillar 4a): Computes Sehri end (Fajr - 10 min) and Iftar (Maghrib).
   */
  utils.getRamadanTimings = function(date, cityKey) {
    const d = date || new Date();
    const prayers = utils.calcPrayerTimes(d, cityKey);
    const fajr = prayers.find(p => p.name === 'Fajr');
    const maghrib = prayers.find(p => p.name === 'Maghrib');
    if (!fajr || !maghrib) return { sehri: '04:50', iftar: '18:40', sehriMin: 290, iftarMin: 1120 };

    let sehriMin = fajr.totalMin - 10;
    if (sehriMin < 0) sehriMin += 24 * 60;
    const sH = Math.floor(sehriMin / 60);
    const sM = sehriMin % 60;
    const sehri = `${sH.toString().padStart(2, '0')}:${sM.toString().padStart(2, '0')}`;

    return {
      sehri,
      iftar: maghrib.raw,
      sehriMin,
      iftarMin: maghrib.totalMin,
      fajrRaw: fajr.raw,
      maghribRaw: maghrib.raw,
    };
  };

  /**
   * Natural Language Parser (Pillar 3): English & Roman Urdu parser for event inputs.
   */
  utils.parseNLP = function(rawText) {
    if (!rawText || !rawText.trim()) return null;
    const text = rawText.trim();
    let cleanTitle = text;
    let targetDate = new Date();
    let startHour = 10;
    let startMin = 0;
    let durationMin = 60;
    let location = '';
    let hasDate = false;
    let hasTime = false;

    // 1. Duration ("for 1 hour", "for 2 hrs", "for 30 min", "1 ghanta", "2 ghante", "aadha ghanta")
    const durMatch = cleanTitle.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/i);
    if (durMatch) {
      durationMin = Math.round(parseFloat(durMatch[1]) * 60);
      cleanTitle = cleanTitle.replace(durMatch[0], '');
    } else {
      const durMinMatch = cleanTitle.match(/\bfor\s+(\d+)\s*(mins?|minutes?|m)\b/i);
      if (durMinMatch) {
        durationMin = parseInt(durMinMatch[1], 10);
        cleanTitle = cleanTitle.replace(durMinMatch[0], '');
      } else {
        const ghanteMatch = cleanTitle.match(/\b(\d+)\s*(ghante?|ghanta)\b/i);
        if (ghanteMatch) {
          durationMin = parseInt(ghanteMatch[1], 10) * 60;
          cleanTitle = cleanTitle.replace(ghanteMatch[0], '');
        } else if (/\baadha\s*ghanta\b/i.test(cleanTitle) || /\bhalf\s*an\s*hour\b/i.test(cleanTitle)) {
          durationMin = 30;
          cleanTitle = cleanTitle.replace(/\b(aadha\s*ghanta|half\s*an\s*hour)\b/i, '');
        }
      }
    }

    // 2. Date ("today"/"aaj", "tomorrow"/"kal", "parson"/"day after tomorrow", weekday names)
    if (/\b(today|aaj)\b/i.test(cleanTitle)) {
      targetDate = new Date();
      hasDate = true;
      cleanTitle = cleanTitle.replace(/\b(today|aaj)\b/i, '');
    } else if (/\b(tomorrow|kal)\b/i.test(cleanTitle)) {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      hasDate = true;
      cleanTitle = cleanTitle.replace(/\b(tomorrow|kal)\b/i, '');
    } else if (/\b(parson|day\s+after\s+tomorrow)\b/i.test(cleanTitle)) {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 2);
      hasDate = true;
      cleanTitle = cleanTitle.replace(/\b(parson|day\s+after\s+tomorrow)\b/i, '');
    } else {
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayMatch = cleanTitle.match(/\b(?:next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
      if (dayMatch) {
        const targetDay = daysOfWeek.indexOf(dayMatch[1].toLowerCase());
        const curDay = targetDate.getDay();
        let diff = targetDay - curDay;
        if (diff <= 0) diff += 7;
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + diff);
        hasDate = true;
        cleanTitle = cleanTitle.replace(dayMatch[0], '');
      }
    }

    // 3. Time ("3pm", "3:30 pm", "4 baje", "shaam 5 baje", "subah 9 baje", "raat 8 baje")
    let isPMHint = false;
    let isAMHint = false;
    if (/\b(shaam|raat)\b/i.test(cleanTitle)) {
      isPMHint = true;
      cleanTitle = cleanTitle.replace(/\b(shaam|raat)\b/i, '');
    } else if (/\b(subah)\b/i.test(cleanTitle)) {
      isAMHint = true;
      cleanTitle = cleanTitle.replace(/\b(subah)\b/i, '');
    } else if (/\b(dopahar)\b/i.test(cleanTitle)) {
      isPMHint = true;
      cleanTitle = cleanTitle.replace(/\b(dopahar)\b/i, '');
    }

    const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|bje)?\b/i;
    const timeMatch = cleanTitle.match(timeRegex);
    if (timeMatch && (timeMatch[3] || timeMatch[2] || isPMHint || isAMHint || cleanTitle.toLowerCase().includes('at ' + timeMatch[1]))) {
      let h = parseInt(timeMatch[1], 10);
      let m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : '';

      if (meridiem === 'pm') {
        if (h < 12) h += 12;
      } else if (meridiem === 'am') {
        if (h === 12) h = 0;
      } else if (meridiem === 'baje' || meridiem === 'bje' || !meridiem) {
        if (isPMHint && h < 12) h += 12;
        else if (isAMHint && h === 12) h = 0;
        else if (!isAMHint && h >= 1 && h <= 6) h += 12;
      }
      startHour = h;
      startMin = m;
      hasTime = true;
      cleanTitle = cleanTitle.replace(timeMatch[0], '');
    }

    // 4. Location ("at Dolmen Mall", "in Zoom", "mein NIC Karachi", "me Emporium")
    const locMatch = cleanTitle.match(/\b(?:at|in|mein|me)\s+([A-Za-z0-9\s&.–'-]+?)(?=(?:\s+(?:for|on|with|kal|aaj|today|tomorrow))|$)/i);
    if (locMatch) {
      location = locMatch[1].trim();
      cleanTitle = cleanTitle.replace(locMatch[0], '');
    }

    cleanTitle = cleanTitle.replace(/\b(at|on|with)\b/gi, ' ')
                           .replace(/\s+/g, ' ')
                           .replace(/^[\s,–-]+|[\s,–-]+$/g, '')
                           .trim();
    if (!cleanTitle) cleanTitle = rawText.trim();

    const pad = n => n.toString().padStart(2, '0');
    const y = targetDate.getFullYear();
    const mo = pad(targetDate.getMonth() + 1);
    const d = pad(targetDate.getDate());
    const startStr = `${y}-${mo}-${d}T${pad(startHour)}:${pad(startMin)}`;

    const endDt = new Date(new Date(startStr).getTime() + durationMin * 60000);
    const endStr = `${endDt.getFullYear()}-${pad(endDt.getMonth() + 1)}-${pad(endDt.getDate())}T${pad(endDt.getHours())}:${pad(endDt.getMinutes())}`;

    const timeDisplay = `${startHour % 12 || 12}:${pad(startMin)} ${startHour >= 12 ? 'PM' : 'AM'}`;
    const dateDisplay = targetDate.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
    const durDisplay = durationMin >= 60 ? `${durationMin / 60}h` : `${durationMin}m`;
    const summary = `${dateDisplay} at ${timeDisplay} (${durDisplay})${location ? ' · ' + location : ''}`;

    return {
      title: cleanTitle,
      start: startStr,
      end: endStr,
      location,
      durationMin,
      hasDate,
      hasTime,
      summary,
    };
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     PAKISTANI GAZETTED, PROVINCIAL & LUNAR HOLIDAYS CHECKER (Pillar 4d)
  ───────────────────────────────────────────────────────────────────────────── */
  utils.isHoliday = function(date) {
    const state = Toggle.state || {};
    const selectedProv = state.province || 'all';

    // 1. Fixed Gregorian Federal Holidays
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const holidays = Toggle.PK_HOLIDAYS || [];
    const fixed = holidays.find(h => {
      if (h.month !== m || h.day !== d) return false;
      if (selectedProv === 'all' || selectedProv === 'federal') return true;
      return h.province === 'federal' || h.province === selectedProv;
    });
    if (fixed) return { name: fixed.name, isGazetted: true, type: fixed.type, province: fixed.province };

    // 2. Fixed / Solar Provincial Holidays (Pillar 4d)
    const provHols = Toggle.PROVINCIAL_HOLIDAYS || [];
    const provFixed = provHols.find(h => {
      if (!h.month || h.month !== m || h.day !== d) return false;
      if (selectedProv === 'federal') return false;
      return selectedProv === 'all' || h.province === selectedProv;
    });
    if (provFixed) return { name: provFixed.name, isGazetted: false, type: provFixed.type, province: provFixed.province };

    // 3. Islamic Lunar Gazetted & Observance Days
    const h = utils.toHijri(date);
    const off = (state && state.moonOffset) || 0;
    const hDay = h.day + off;
    const hMonth = h.month;

    const islamicEvents = Toggle.ISLAMIC_EVENTS || [];
    const lunar = islamicEvents.find(e => {
      if (e.hMonth !== hMonth || e.hDay !== hDay) return false;
      if (selectedProv === 'all' || selectedProv === 'federal') return true;
      return e.province === 'federal' || e.province === selectedProv;
    });
    if (lunar) return { name: lunar.name, isGazetted: lunar.gazetted, type: 'islamic', province: 'federal' };

    // Provincial lunar holidays (e.g. Urs Shah Abdul Latif, Urs Data Ganj Bakhsh)
    const provLunar = provHols.find(e => {
      if (!e.hMonth || e.hMonth !== hMonth || e.hDay !== hDay) return false;
      if (selectedProv === 'federal') return false;
      return selectedProv === 'all' || e.province === selectedProv;
    });
    if (provLunar) return { name: provLunar.name, isGazetted: false, type: 'provincial', province: provLunar.province };

    return null;
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     JUMMAH & LOAD SHEDDING OVERLAP DETECTION
  ───────────────────────────────────────────────────────────────────────────── */
  utils.checkJummahOverlap = function(startStr, endStr) {
    if (!startStr) return false;
    const s = new Date(startStr);
    if (s.getDay() !== 5) return false; // Not Friday

    const sMin = s.getHours() * 60 + s.getMinutes();
    let eMin = sMin + 60;
    if (endStr) {
      const e = new Date(endStr);
      eMin = e.getHours() * 60 + e.getMinutes();
    }

    // Jummah buffer window: 12:45 PM (765 min) – 2:30 PM (870 min)
    const jumStart = 12 * 60 + 45;
    const jumEnd = 14 * 60 + 30;
    return (sMin < jumEnd && eMin > jumStart);
  };

  utils.checkLoadSheddingOverlap = function(startStr, endStr, cityKey) {
    if (!startStr) return null;
    const schedules = Toggle.LOAD_SHEDDING_SCHEDULES || {};
    const citySlots = schedules[cityKey] || schedules.karachi || [];
    const s = new Date(startStr);
    const sMin = s.getHours() * 60 + s.getMinutes();
    let eMin = sMin + 60;
    if (endStr) {
      const e = new Date(endStr);
      eMin = e.getHours() * 60 + e.getMinutes();
    }

    for (const slot of citySlots) {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      const slotStart = sh * 60 + sm;
      const slotEnd = eh * 60 + em;
      if (sMin < slotEnd && eMin > slotStart) {
        return slot;
      }
    }
    return null;
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     DATE COMPARISONS & EVENT HELPERS (with Recurring Events Expansion - Pillar 2)
  ───────────────────────────────────────────────────────────────────────────── */
  utils.sameDay = function(a, b) {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  };

  utils.isFriday = function(date) {
    return date.getDay() === 5;
  };

  utils.getEventsForDay = function(date) {
    const state = Toggle.state || {};
    if (state.showEvents === false) return [];
    const events = state.events || [];
    const target = new Date(date);
    const pad = n => n.toString().padStart(2, '0');
    const dateKey = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;

    let list = [];

    events.forEach(e => {
      if (!e.start) return;
      const baseStart = new Date(e.start);
      const baseEnd = e.end ? new Date(e.end) : new Date(baseStart.getTime() + 3600000);
      const isSame = utils.sameDay(baseStart, target);

      // If exact date matches and not in exdates
      if (isSame) {
        if (!e.exdates || !e.exdates.includes(dateKey)) {
          list.push(e);
        }
        return;
      }

      // Check recurrence expansion (Pillar 2)
      if (e.recurrence && e.recurrence.freq && e.recurrence.freq !== 'none') {
        const baseDayStart = new Date(baseStart.getFullYear(), baseStart.getMonth(), baseStart.getDate());
        const targetDayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());

        if (targetDayStart >= baseDayStart) {
          // Check 'until' boundary
          if (e.recurrence.until) {
            const untilDate = new Date(e.recurrence.until);
            untilDate.setHours(23, 59, 59, 999);
            if (targetDayStart > untilDate) return;
          }

          // Check if excluded on this occurrence
          if (e.exdates && e.exdates.includes(dateKey)) return;

          let matchesFreq = false;
          const freq = e.recurrence.freq;

          if (freq === 'daily') {
            matchesFreq = true;
          } else if (freq === 'weekly') {
            matchesFreq = (target.getDay() === baseStart.getDay());
          } else if (freq === 'monthly') {
            matchesFreq = (target.getDate() === baseStart.getDate());
          } else if (freq === 'yearly') {
            matchesFreq = (target.getDate() === baseStart.getDate() && target.getMonth() === baseStart.getMonth());
          }

          if (matchesFreq) {
            list.push({
              ...e,
              id: `${e.id}__occ__${dateKey}`,
              originalId: e.id,
              isOccurrence: true,
              occurrenceDate: dateKey,
              start: `${dateKey}T${pad(baseStart.getHours())}:${pad(baseStart.getMinutes())}`,
              end: `${dateKey}T${pad(baseEnd.getHours())}:${pad(baseEnd.getMinutes())}`,
            });
          }
        }
      }
    });

    if (state.searchQuery && state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      list = list.filter(e => {
        return (e.title && e.title.toLowerCase().includes(q)) ||
               (e.location && e.location.toLowerCase().includes(q)) ||
               (e.description && e.description.toLowerCase().includes(q)) ||
               (e.category && e.category.toLowerCase().includes(q)) ||
               (e.attendees && e.attendees.toLowerCase().includes(q));
      });
    }
    return list;
  };

  /* ── Per-day event memoization ──
     The month grid calls this for 42 cells per render, each scanning all
     events. Cache results, invalidated when events change (version bump in
     state.saveEvents), when the event filter toggles, or on search changes. */
  const _eventsDayCache = new Map();
  const _getEventsForDayRaw = utils.getEventsForDay;
  utils.getEventsForDay = function(date) {
    const state = Toggle.state || {};
    if (state.showEvents === false) return [];
    const target = (date instanceof Date) ? date : new Date(date);
    if (isNaN(target.getTime())) return _getEventsForDayRaw(date);
    const pad = n => n.toString().padStart(2, '0');
    const dateKey = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
    const q = (state.searchQuery || '').trim().toLowerCase();
    const key = `${dateKey}|v${Toggle._eventsVersion || 0}|q:${q}`;
    if (_eventsDayCache.has(key)) return _eventsDayCache.get(key);
    const result = _getEventsForDayRaw(target);
    if (_eventsDayCache.size > 300) _eventsDayCache.clear();
    _eventsDayCache.set(key, result);
    return result;
  };

  utils.dayMatchesSearch = function(date) {
    const state = Toggle.state || {};
    if (!state.searchQuery || !state.searchQuery.trim()) return false;
    const q = state.searchQuery.trim().toLowerCase();

    // Check holiday
    if (state.showHolidays !== false && utils.isHoliday) {
      const h = utils.isHoliday(date);
      if (h && h.name.toLowerCase().includes(q)) return true;
    }

    // Check prayer
    if (state.showPrayer && utils.calcPrayerTimes) {
      const prayers = utils.calcPrayerTimes(date, state.city || 'karachi');
      if (prayers.some(p => p.name.toLowerCase().includes(q))) return true;
    }

    // Check Jummah
    if (state.showJummah && utils.isFriday(date) && 'jummah'.includes(q)) return true;

    // Check events
    const evs = utils.getEventsForDay(date);
    return evs.length > 0;
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     FORMATTING & ICS EXPORT (with RRULE - Pillar 2)
  ───────────────────────────────────────────────────────────────────────────── */
  utils.fmt12 = function(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${m} ${ampm}`;
  };

  utils.formatDateRange = function(start, end) {
    const ds = new Date(start);
    const de = end ? new Date(end) : null;
    const dateStr = ds.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (!de) return `${dateStr} · ${utils.fmt12(start)}`;
    return `${dateStr}, ${utils.fmt12(start)} – ${utils.fmt12(end)}`;
  };

  utils.capitalize = function(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  utils.evt12Label = function(ev) {
    if (!ev || !ev.start) return '';
    const d = new Date(ev.start);
    if (d.getHours() === 0 && d.getMinutes() === 0) return '';
    return utils.fmt12(ev.start);
  };

  /**
   * Export events to RFC 5545 standard .ics file for Google Calendar / Apple Calendar
   */
  utils.exportToICS = function() {
    const events = (Toggle.state && Toggle.state.events) || [];
    if (!events.length) {
      if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
        Toggle.popover.showToast('No events to export');
      }
      return;
    }

    const pad = n => n.toString().padStart(2, '0');
    const toICSDate = dt => {
      const d = new Date(dt);
      return d.getUTCFullYear() +
             pad(d.getUTCMonth() + 1) +
             pad(d.getUTCDate()) + 'T' +
             pad(d.getUTCHours()) +
             pad(d.getUTCMinutes()) +
             pad(d.getUTCSeconds()) + 'Z';
    };

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Toggle Calendar PK//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Toggle Calendar PK',
      'X-WR-TIMEZONE:Asia/Karachi',
    ];

    events.forEach(ev => {
      const start = toICSDate(ev.start);
      const end = ev.end ? toICSDate(ev.end) : toICSDate(new Date(new Date(ev.start).getTime() + 3600000));
      
      let rrule = '';
      if (ev.recurrence && ev.recurrence.freq && ev.recurrence.freq !== 'none') {
        rrule = `RRULE:FREQ=${ev.recurrence.freq.toUpperCase()}`;
        if (ev.recurrence.until) {
          const u = new Date(ev.recurrence.until);
          u.setHours(23, 59, 59, 0);
          rrule += `;UNTIL=${toICSDate(u)}`;
        }
      }

      ics.push(
        'BEGIN:VEVENT',
        `UID:${ev.id}@toggle.pk`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        rrule || '',
        `SUMMARY:${(ev.title || 'Event').replace(/,/g, '\\,')}`,
        ev.location ? `LOCATION:${ev.location.replace(/,/g, '\\,')}` : '',
        ev.description ? `DESCRIPTION:${ev.description.replace(/\n/g, '\\n')}` : '',
        'END:VEVENT'
      );
    });

    ics.push('END:VCALENDAR');
    const content = ics.filter(Boolean).join('\r\n');
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `toggle-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (Toggle.popover && typeof Toggle.popover.showToast === 'function') {
      Toggle.popover.showToast(`📅 Exported ${events.length} events to .ics`);
    }
  };

  // Global aliases
  window.toHijri = utils.toHijri;
  window.hijriDateStr = utils.hijriDateStr;
  window.hijriMonthStr = utils.hijriMonthStr;
  window.sameDay = utils.sameDay;
  window.isFriday = utils.isFriday;
  window.isHoliday = utils.isHoliday;
  window.calcPrayerTimes = utils.calcPrayerTimes;
  window.getPrayerStrings = utils.getPrayerStrings;
  window.getNextPrayer = utils.getNextPrayer;
  window.getRamadanTimings = utils.getRamadanTimings;
  window.parseNLP = utils.parseNLP;
  window.exportToICS = utils.exportToICS;
})(window);
