<div align="center">

<img src="assets/banner.svg" alt="Toggle Calendar — Pakistan's Smart Calendar" width="100%">

# 🌙 Toggle Calendar

**Pakistan's first culturally-aware scheduling platform** — Hijri dates, prayer times, Jummah protection, and WhatsApp reminders in a beautiful, installable PWA.

[![License](https://img.shields.io/badge/license-MIT-01411C?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=0a0f1a)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](manifest.json)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-00C853?style=for-the-badge&logo=npm&logoColor=white)](#)

[![Stars](https://img.shields.io/github/stars/Dattebayoolo/Toggle-Calendar?style=flat-square&color=01411C)](https://github.com/Dattebayoolo/Toggle-Calendar/stargazers)
[![Forks](https://img.shields.io/github/forks/Dattebayoolo/Toggle-Calendar?style=flat-square&color=057a3e)](https://github.com/Dattebayoolo/Toggle-Calendar/network/members)
[![Issues](https://img.shields.io/github/issues/Dattebayoolo/Toggle-Calendar?style=flat-square&color=db2777)](https://github.com/Dattebayoolo/Toggle-Calendar/issues)

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🕌 | **Prayer Times** | Built-in times for 7 major cities — Karachi, Lahore, Islamabad, Peshawar, Quetta, Multan & Faisalabad |
| 🌙 | **Hijri Dates** | Islamic calendar conversion alongside Gregorian dates |
| 🤲 | **Jummah Protection** | Never double-book Friday prayers — events are blocked around Jummah |
| 🇵🇰 | **PK Holidays** | Kashmir Day, Pakistan Day, Independence Day, Iqbal Day, Quaid Day & more, built right in |
| 📅 | **4 Calendar Views** | Day · Week · Month · Agenda — switch instantly with a mini-calendar navigator |
| 🏷️ | **Event Categories** | Color-coded Work, Personal, Family, Health, Religious & Social events |
| 💬 | **WhatsApp Reminders** | Share event reminders via WhatsApp deep links |
| 🌗 | **Light / Dark Mode** | Fully themed UI in both modes |
| 📲 | **Installable PWA** | Add to home screen, standalone window, offline-ready |
| 🔒 | **Private by Design** | All events stored locally — no server, no tracking, no accounts |

## 🛠️ Tech Stack

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=0a0f1a)
![localStorage](https://img.shields.io/badge/storage-localStorage-4A154B?style=flat-square&logo=googlechrome&logoColor=white)
![Material Icons](https://img.shields.io/badge/Material_Icons-Round-01411C?style=flat-square&logo=materialdesignicons&logoColor=white)

**Plus Jakarta Sans · Outfit · Noto Naskh Arabic** — no frameworks, no build step, zero dependencies.

</div>

## 🚀 Getting Started

Toggle Calendar is a pure static app — clone and open. That's it.

```bash
# 1. Clone the repository
git clone https://github.com/Dattebayoolo/Toggle-Calendar.git
cd Toggle-Calendar

# 2. Open it (or serve it for PWA features)
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

> 💡 **For the full PWA experience** (install prompt, standalone mode), serve over HTTP:
>
> ```bash
> npx serve .          # or: python -m http.server 8080
> ```

Then open `http://localhost:3000` (or `:8080`) and hit **Install** in your browser.

## 📂 Project Structure

```
Toggle-Calendar/
├── 📄 index.html          # App shell & markup
├── 🎨 style.css           # Full theming system (light/dark)
├── ⚙️  app.js              # Legacy bundle (constants, state, utils, views)
├── 📦 js/                 # Modular source
│   ├── constants.js       # Holidays, prayer times, category colors
│   ├── state.js           # Single source of truth + localStorage persistence
│   ├── listeners.js       # Event wiring
│   ├── main.js            # Boot sequence
│   ├── render.js          # Render orchestrator
│   ├── utils.jsX          # Date & Hijri helpers
│   ├── views/             # monthView · weekView · dayView · agendaView · miniCal
│   └── components/        # modal · popover · sidebar
├── 🖼️  assets/             # Banner & graphics
└── 📱 manifest.json       # PWA manifest (installable, shortcuts)
```

## 🗺️ Roadmap

- [ ] Live prayer times via calculation API (per-location, auto-updating)
- [ ] Offline-first caching with a service worker
- [ ] Cloud sync (optional, opt-in)
- [ ] Drag & drop event rescheduling
- [ ] Urdu / RTL interface support
- [ ] Ramadan & Islamic event calendar overlay

## 🤝 Contributing

Contributions are what make open source amazing! Any contributions are **greatly appreciated**:

```bash
# 1. Fork the project
# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit your changes
git commit -m "✨ Add amazing feature"

# 4. Push and open a Pull Request
git push origin feature/amazing-feature
```

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

**Made with 💚 in Pakistan**

⭐ Star this repo if you find it useful!

[![Report Bug](https://img.shields.io/badge/🐞_Report_a_Bug-db2777?style=for-the-badge)](https://github.com/Dattebayoolo/Toggle-Calendar/issues)
[![Request Feature](https://img.shields.io/badge/✨_Request_a_Feature-057a3e?style=for-the-badge)](https://github.com/Dattebayoolo/Toggle-Calendar/issues)

</div>
