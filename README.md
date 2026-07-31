# WebOS ✦ v2

A small desktop environment that runs entirely in your browser — no install, no server, no accounts.

Built with HTML, CSS, and vanilla JavaScript. One file.

---

## Quick start

1. Download `webos-fun.html`
2. Open it in Chrome, Firefox, Edge, or Safari

**Optional (recommended for network features):**

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/webos-fun.html`

Some browsers restrict `fetch` on `file://` URLs. Serving over `http://localhost` avoids that.

---

## Features

### Desktop
- Draggable icons (snap to grid)
- Right-click context menu
- Live canvas wallpapers (Aurora, Nebula, Orbs, Circuit, Party, None)
- Sticky notes on the desktop
- Accent color themes
- Show / hide desktop icons

### Window system
- Drag, resize, minimize, maximize, close
- Taskbar with open windows
- Focus mode (dims other windows)
- Open / close animations

### Regional clock
- Taskbar clock uses your chosen city and timezone
- Click the clock for **World Clock** (home + major cities)
- Presets include India (IST), UK, US, Japan, UAE, and more
- Custom city + timezone supported

---

## Apps

| App | What it does |
|-----|----------------|
| **Files** | Simple virtual file manager (stored in browser storage) |
| **Notepad** | Create and save text files |
| **Terminal** | Commands, network helpers, fun extras |
| **Browser** | Address bar + search; open pages in a tab when embedding is blocked |
| **Calculator** | Basic calculator (keyboard supported) |
| **Tasks** | To-do list with filters |
| **Snake** | Classic snake game |
| **Paint** | Freehand drawing |
| **Stickies** | Sticky notes on the desktop |
| **Focus Timer** | Pomodoro-style work / break timer |
| **Settings** | Wallpaper, sound, accent color, desktop icons, region |

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `⌘K` | Command palette |
| `Esc` | Close start menu / command palette / context menu |
| Arrow keys / WASD | Snake controls |
| Number keys / operators | Calculator (when Calculator is focused) |

---

## Command palette

Press **Ctrl+K** (or **⌘K** on Mac) to:

- Launch apps
- Open saved files
- Run actions (World Clock, sticky note, focus mode, arrange icons, …)

Type to filter, use ↑↓ and Enter to run.

---

## Terminal commands

```
help              List commands
ls                List virtual files
cat <file>        Show file contents
live <name>       Change wallpaper (aurora, nebula, orbs, circuit, party, off)
clear             Clear terminal
ip                Public IP lookup
joke              Random joke from the web
curl <url>        Fetch a URL (text, truncated)
ping              Connectivity check
```

Network commands need internet access.

---

## Data & privacy

- Preferences, notes, tasks, files, and sticky notes use **localStorage** when available
- If storage is blocked (some sandboxed previews), data stays in memory for the session only
- No accounts, no backend, no tracking — everything stays in your browser

---

## Tips

- **Double-click** empty desktop → new sticky note  
- **Right-click** desktop → wallpapers, notes, command palette, world clock  
- **Right-click** an icon → open or remove from desktop  
- Many websites block iframes; use the browser’s **↗** button to open in a real tab  
- Focus Mode is available from the Focus Timer app and the command palette  

---

## Credits

Originally inspired by [personal-webOS](https://github.com/STEVEALEX-source/personal-webOS) by Rizz.

Extended as **WebOS Fun Edition** with command palette, stickies, focus timer, paint, regional clock, and other quality-of-life features.

---

## License

Use and modify freely for personal or educational projects.
