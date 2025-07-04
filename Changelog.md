# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-07-01

### Summary

- Fully implement the `compmgr` engine to manage component project code without relying on the old approach of needing to clone the main index.js to each component project. `compmgr` also simplify and shorten components module declare method, including gui,api,rules,startup and common.

- Removed the webnodejs engine, which means the express.js framework is no longer supported

### Added

- Add check `winlist` is not empty array on `desktopcast` linstener in `engine/deskelectronjs/src/desktop.js`. Completed on 2025-07-01
- Improve and simplify rules declare method in gui and api at engine/compmgr. Completed on 2025-07-03
- Rule name defination change to prifix name `YS_` equalavent to yes strict and `NS_` equalavent to no strict engine/compmgr. Completed on 2025-07-03

### Changed

- Modify the `load_comp` function in `app.js` so that it ignores component folders that are not relevant to the engine. Completed on 2025-07-01
- Support directly import module from api/gui controller folder when `index.js` not exist at `engine/compmgr`. Completed on 2025-07-01
- Change route.json export in formatter method. Completed on 2025-07-04
- Change rules import modules third parameter in array type at `engine/compmgr`. Completed on 2025-07-04
- Swap the loading order of `startup` and `common.models` at `engine/compmgr`. Completed on 2025-07-04

### Deprecated

- webnodejs engine no longer supported. Will continue to be maintained at [github oricommjs](https://github.com/wkloh76/oricommjs)

### Removed

### Fixed

- Fix `engine/compmgr` when missing rules folder in components will failure to load api,gui modules. Completed on 2025-07-01
- Fix both webbunjs and webnodehonojs engine `reaction.js` logerr module unable write error message to error.log. Completed on 2025-07-04
- Fix `list_org_repos` function at `atomic/molecule/giteapi`. Completed on 2025-07-04
- Fix `guiapi` function failure split when rules regulation variable is undefined at `engine/compmgr`. Completed on 2025-07-04

### Security

[1.0.2]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.2

## [1.0.1] - 2025-05-08

### Summary

### Added

- Apply pino-roll instead log4js to handler all log file size and rotate the backup log files process. Completed on 2025-05-08
- Add downlod flag to `atomic/atom/smfetch/src/browser/smfetch/atom.js` for return data as blob data type. Completed on 2025-05-15
- Add download function to webnodejs engine. Completed on 2025-05-15
- Add `vmloader` and `fmloader` function to utils. Completed on 2025-06-08
- Add `compmgr` engine which will manage components project. It will instead the `OricommJS_Components`. Completed on 2025-06-08

### Changed

- Update all dependencies to latest version. Completed on 2025-05-19
- Apply Check folder exist method into `compmgr` engine to prevent crash during load module. Completed on 2025-06-16

### Deprecated

### Removed

### Fixed

- Fix `pino-roll` disturb vscode debugging with nodejs. Use streaming write method instead `pino-roll` module. Completed on 2025-05-19
- Fix mising checking reroute parameter in deskfetch method at `atomic/atom/smfetch/src/browser/atom.js` which will failure to automatically change the content of page. Completed on 2025-06-03
- Fix all web engine unable create log file due to directoroy no exist. Completed on 2025-06-08
- Fix bug in `compmgr` engine. Completed on 2025-06-09

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
- Add giteapi molecule to atomic. Completed on 2025-06-30

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
- Update `*.toml.example` at sqlmanager engine. Completed on 2025-06-13
- Apply reroute flag and `window.location` base on redirect url in webfetch function at `smfetch/browser/atom.js`. Completed on 2025-06-13

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
- Fix null value unable insert and update in `sqlitesession.js` at utils. Completes on 2025-05-02
- Fix atomic failure inherited from lower level modules. Completes on 2025-06-30
- Fix missing modules in `gotfetch.js` at `/atomic/atom/smfetch`. Completes on 2025-06-30

### Security

[1.0.0]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.0
