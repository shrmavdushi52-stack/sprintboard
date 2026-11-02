# Sprintboard
One dataset, four views: Kanban, Timeline (Gantt), Calendar, List. Zero runtime dependencies.

## Run
    npm start            # python static server on :8080 (no install needed)
    npm run dev          # Vite dev server (npm install first)
    npm run build        # production bundle in dist/
    npm test             # node:test unit tests, no install needed
    docker build -t sprintboard . && docker run -p 8080:80 sprintboard

## Layout
    src/main.js          UI, rendering, events
    src/lib/util.js      dates, escaping, Markdown
    src/lib/history.js   undo/redo
    src/lib/filters.js   filter predicate + URL (de)serialisation
    src/lib/schedule.js  cycle check, dependency cascade, critical path, .ics export
    src/lib/storage.js   versioned localStorage, schema validation, JSON import/export
    tests/               unit tests for everything in lib/

## Features beyond the basics
Dependency cycle prevention, automatic rescheduling of dependent cards, critical-path highlight,
JSON export/import with validation, .ics calendar export, Alt+←/→ to move a focused card between columns.
Shortcuts: N new, / search, 1-4 views, T theme, Ctrl+Z / Ctrl+Shift+Z, Esc, ?.
