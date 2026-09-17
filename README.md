# Hourglass — Floating Windows Desktop Productivity Timer

A minimalist, elegant floating digital hourglass widget application for Windows desktop.

## Features

- **Realistic Digital Hourglass**: Precision vector SVG graphics with dual chambers, curved glass reflections, dynamic funneling sand in the upper bulb, a falling stream with particle animations, and a natural sand heap/cone in the lower bulb.
- **Two Timer Modes**:
  - **Task Countdown**: Quick presets (15m, 25m Pomodoro, 45m Writing, 1h, 2h) or custom hours & minutes.
  - **Daily Time**: Set Start & End times (e.g., 9:00 AM → 11:00 PM). Automatically calculates remaining percentage from actual system time, handles past start times, and offers daily repetition.
- **Floating Desktop Behavior**:
  - Borderless, transparent floating widgets with subtle acrylic glass backdrop.
  - **Always on Top** enabled by default.
  - Freely draggable and freely resizable (small 120px, medium 250px, large 500px+).
  - Multiple independent instances running simultaneously.
- **Accuracy**: Based strictly on actual system clock timestamps (`Date.now()`), immune to frame drops, CPU throttles, and computer sleep.
- **Unobtrusive Controls**: Hover over any hourglass to reveal pause/resume, restart, edit, theme palette, sound toggle, and always-on-top pin.
- **Global Management Window ("MY HOURGLASSES")**: Overview of all active timers, quick pause/resume all, show/hide, duplicate, and delete.
- **Windows System Tray**: Tray menu with quick actions (New, Show All, Hide All, Pause All, Resume All, Settings, Exit).
- **Keyboard Shortcuts**:
  - `Ctrl + Alt + H`: Create new hourglass
  - `Ctrl + Alt + P`: Pause/resume active hourglass
  - `Ctrl + Alt + M`: Toggle management window
  - `Escape`: Close modals

---

## Running in Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Web Browser**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

3. **Run as Native Windows Desktop App (Electron)**:
   ```bash
   npm install -D electron concurrently
   npm run electron:dev
   ```

---

## Building the Windows .exe Installer

To package Hourglass into a standalone Windows `.exe` installer (NSIS) and portable `.exe`:

1. Install `electron-builder`:
   ```bash
   npm install -D electron-builder
   ```

2. Build and package:
   ```bash
   npm run electron:build
   ```

3. The generated installer (`Hourglass-Setup-1.0.0.exe`) will be located in the `dist_electron/` directory ready for distribution and installation on any Windows PC.
