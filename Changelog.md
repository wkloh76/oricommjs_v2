# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-05-08

### Summary

### Added

- Apply pino-roll instead log4js to handler all log file size and rotate the backup log files process. Completed on 2025-05-08
- Add downlod flag to `atomic/atom/smfetch/src/browser/smfetch/atom.js` for return data as blob data type. Completed on 2025-05-15
- Add download function to webnodejs engine. Completed on 2025-05-15

### Changed

- Update all dependencies to latest version. Completed on 2025-05-19

### Deprecated

### Removed

### Fixed

- Fix `pino-roll` disturb vscode debugging with nodejs. Use streaming write method instead `pino-roll` module. Completed on 2025-05-19
- Fix mising checking reroute parameter in deskfetch method at `atomic/atom/smfetch/src/browser/atom.js` which will failure to automatically change the content of page. Completed on 2025-06-03

### Security

[1.0.1]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.1

## [1.0.0] - 2025-02-17

### Summary

- New design for workflow engine which work close with serialize method in both frontend and backend.
- Establish webbunjs engine base on honoJS framework and run with bun interpreter.
- Establish webnodehonojs engine base on honoJS framework and run in nodejs interpreter.

### Added

- Add `str_replacelast` method into `utils`. Completed on 2025-04-22
- webbunjs engine design majority done and can work work oricommjs_component project. Completed on 2025-04-29
- Add a feature to allow deskelectronjs engine to change page base on internel GUI url. Completed on 2025-04-29
- ~~Create `mimes.json` for webbundjs server to get headers "Content-Type" value. Completed on 2025-04-30~~
- webnodehonojs engine design majority done and can work work oricommjs_component project. Completed on 2025-04-30
- Apply cors and secureHeaders to both webbunjs and webnodehonojs engine. Completed on 2025-04-30
- ~~Create `sqlitesession.js` at utils to manage all engine relate with http session. Completed on 2025-05-02~~
- Redefine `less.js` file routing method into `load_pubshare` function at both webbunjs and webnodehonojs engine. Completed on 2025-05-02
- Redesign `sqlitesession.js` at utils to manage all engine relate with http session (include webnodejs express-session format). Completed on 2025-05-03
- Apply pino as logger manager to manage webnodejs engine http access log. Completed on 2025-05-04
- Add pino module to `package.json`. Completed on 2025-05-04

### Changed

- Upgrade engine/sqlmanager dependencies modules `libsql`, `jandas` and `mariadb` to latest version. Completed on 2025-04-04
- Upgrade engine/webexpress dependencies modules `libsql` and `helmet` to latest version. Completed on 2025-04-04
- Upgrade atomic/atom/smfetch dependencies modules `got` to latest version. Completed on 2025-04-04
- `kernel.Utils` object import twice to make sure all parameters updated to apply anywhere at `app.js`. Completed on 2025-04-05
- Update workspaces in `package.json` and `package.json.example`. Completed on 2025-04-06
- Change the import sqlite module method in `sqlmanager` base on engine name because bun.js has it own built in sqlite. Completed on 2025-04-22
- ~~Improve webbunjs engine which handle static-server process in load_pubshare and load_atomic at `server.js`. Completed on 2025-04-30~~
- Move both `html-tage.json` and `mimes.json` to utils handler to handle data. Both webbunjs and webnodehonojs engine will be afftected. Completed on 2025-05-02
- Improve both webbunjs and webnodehonojs engine which handle static-server process in load_pubshare and load_atomic at `server.js`. Completed on 2025-05-02
- Update README. Completed on 2025-05-03
- Direct apply pino from sysmodule intead direct import pino module from webbunjs and webnodehonojs engine. Completed on 2025-05-04
- Change all success.log from all engine which will only accept by project own api and gui request. Completed on 2025-05-04

### Deprecated

### Removed

- Remove SqliteStore.js from webnodehonojs engine. Completed on 2025-05-02
- Remove onless,castless and mergecss method from both webbunjs and webnodehonojs engine. Completed on 2025-05-02
- Remove unused variable and async defination in all engine. Completed on 2025-05-03
- Romve loghttp from `app.js`. Completed on 2025-05-04
- Remove pino module from webbunjs and webnodehonojs engine `package.json`. Completed on 2025-05-04

### Fixed

- Fix session bypass checking the static file request in `webserver.js` at webnodejs, webbunjs and webnodehonojs engine. Completed on 2025-05-02
- Fix extract data from setting object in establish method at webbunjs and webnodehonojs engine. Completed on 2025-05-02
- Fix null value unable insert and update in `sqlitesession.js` at utils. Completes on 2025-05-0

### Security

[1.0.0]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.0
