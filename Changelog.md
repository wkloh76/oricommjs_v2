# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2025-10-05

### Summary

### Added

- Upgrade nodejs,bunjs and electronjs to 24.9.0,1.2.23 and 38.2.1. Completed on 2025-10-05
- Implment built in sqlite database egine instead third party "@libsql/client" dependencies module for both webbunjs and webnodehonojs engine to handle web session. Completed on 2025-10-05
- Implment built in sqlite database egine to sqlmanager. Completed on 2025-10-06
- Apply write query stament to the log file in sqlmanager engine at sqlite3 module trans function. Completed on 2025-10-07

### Changed

- Optimize sqlitesession design in utils. Completed on 2025-10-05
- Redesign mariadb module in sqlmanager engine to integration with atom/startupinit module. Completed on 2025-10-07

### Deprecated

### Removed

- Remove unused console.log. Completed on 2025-10-06

### Fixed

- Bug fix webbunjs engine insert empty value into the sessiion table issue. Completed on 2025-10-06
- Fixed some typos in dependency module versions. Completed on 2025-10-06

### Security

[1.0.6]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.6

## [1.0.5] - 2025-08-22

### Summary

### Added

- Add list_branches_repos function into atomic\molecule\giteapi module. Completed on 2025-09-24

### Changed

- Redefine deskelectronjs electron-builder installer method. Completed on 2025-08-22
- Update some dependencies modules to latest version such as `dayjs,pino,got,libsql,@libsql/client,jsdom,hono`. Completed on 2025-09-11
- Update @hono/node-server modules dependencies to latest version. Completed on 2025-09-12
- Update some dependencies modules to latest version such as `dayjs,pino,got,libsql,@libsql/client,jsdom,hono`. Completed on 2025-09-24
- Update @hono/node-server modules dependencies to latest version 1.19.5. Completed on 2025-10-03

### Deprecated

### Removed

### Fixed

- Fix bug in `utils\datatype` function which return wrong type when value is empty string. Completed on 2025-09-12
- Fix bug in `engine\deskelectronjs\src\reaction.js` logger is not function issue. Completed on 2025-10-02

### Security

[1.0.5]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.5

## [1.0.4] - 2025-08-13

### Summary

### Added

- Upgrade hono version to 4.9.1 for both webbunjs and webnodehonojs engine. Completed on 2025-08-13
- Implement download file function to both webnodehonojs and webbunjs engine. Completed on 2025-08-14
- Added refengine data to the coresetting.toml.example file. Completed on 2025-08-18.

### Changed

- Update the import modules method from atomic at app.js. Completed on 2025-08-20.

### Deprecated

### Removed

### Fixed

### Security

[1.0.4]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.4

## [1.0.3] - 2025-07-17

### Summary

### Added

- Re-design sqlite3 middleware and log in `engine/sqlmanager/src/sqlite3.js`. Completed on 2025-07-17
- Release a simple design of the `atomic/atom/startupinit` module to help all components initialize the startup mode, especially the database sqlite. Completed on 2025-07-17.
- Add get_repos_rawfile function to giteapi molecule at atomic which able retrive raw file from gitea tag in json format. Completed on 2025-07-31
- Apply session.destroy function into deskelectronjs engine. Completed on 2025-08-07
- Add missing and upgrade package. Completed on 2025-08-011
- Add missing upgrade to engine/webbunjs. Completed on 2025-08-013

### Changed

- Redesign data passing from frontend request to backend and date return at deskelectronjs engine. Completed on 2025-07-25
- Increase timeout value to 30s in giteapi molecule at atomic. Completed on 2025-07-31
- Improve redirect from atom/smfetch, engine/webnodehonojs and engine/webbunjs which will determite the request from browser or fetchapi. Completed on 2025-08-06

### Deprecated

### Removed

- Remove unsed module from compmgr engine. Completed on 2025-07-25
- Remove unsed console.log from atom/smfetch and molecule/giteapi. Completed on 2025-07-31

### Fixed

- Fix session not pass to onredict funcion in `reaction.js` at deskelectronjs engine. Completed on 2025-07-24
- Fix `GET` querystring parameters empty data issue in both webhononodejs and webbunjs engine. Completed on 2025-07-31
- Fix GOT module unrecognized URLSearchParams data format in atom/smfetch/src/gotfetch.js. Completed on 2025-07-31

### Security

[1.0.3]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.3

## [1.0.2] - 2025-07-01

### Summary

- Fully implement the `compmgr` engine to manage component project code without relying on the old approach of needing to clone the main index.js to each component project. `compmgr` also simplify and shorten components module declare method, including gui,api,rules,startup and common.

- Removed the webnodejs engine, which means the express.js framework is no longer supported

### Added

- Add check `winlist` is not empty array on `desktopcast` linstener in `engine/deskelectronjs/src/desktop.js`. Completed on 2025-07-01
- Improve and simplify rules declare method in gui and api at engine/compmgr. Completed on 2025-07-03
- Rule name defination change to prifix name `YS_` equalavent to yes strict and `NS_` equalavent to no strict engine/compmgr. Completed on 2025-07-03
- Simple session design for deskelectronjs engine. Completed on 2025-07-13

### Changed

- Modify the `load_comp` function in `app.js` so that it ignores component folders that are not relevant to the engine. Completed on 2025-07-01
- Support directly import module from api/gui controller folder when `index.js` not exist at `engine/compmgr`. Completed on 2025-07-01
- Change route.json export in formatter method. Completed on 2025-07-04
- Change rules import modules third parameter in array type at `engine/compmgr`. Completed on 2025-07-04
- Swap the loading order of `startup` and `common.models` at `engine/compmgr`. Completed on 2025-07-04
- Change `engine/compmgr` gui api url definition to three levels, i.e. controller file naming will be between api name and function name. Completed on 2025-07-06.
- Update `list_releases_repos` function in `atomic/molecule/giteapi` to support retrieving repository releases from Github. Completed on 2025-07-07.
- Change the default engine defination to `webnodehonojs` instead `webnodejs` which no longer support in the framework at `app.js`. Completed on 2025-07-11.
- Change redirect gui url method in deskelectronjs engine which will axactly same like webnodejs. Completed on 2025-07-13

### Deprecated

- webnodejs engine no longer supported. Will continue to be maintained at [github oricommjs](https://github.com/wkloh76/oricommjs)

### Removed

### Fixed

- Fix `engine/compmgr` when missing rules folder in components will failure to load api,gui modules. Completed on 2025-07-01
- Fix both webbunjs and webnodehonojs engine `reaction.js` logerr module unable write error message to error.log. Completed on 2025-07-04
- Fix `list_org_repos` function at `atomic/molecule/giteapi`. Completed on 2025-07-04
- Fix `guiapi` function failure split when rules regulation variable is undefined at `engine/compmgr`. Completed on 2025-07-04
- Fix `list_releases_repos` function at `atomic/molecule/giteapi`. Completed on 2025-07-07
- Fix `guiapi` function define wrong value to compname parameter when import module from controller at `engine/compmgr`. Completed on 2025-07-08
- Fix both `webnodehonojs` and `webbunjs` engine which missing `html-minifier-terser` node module. Completed on 2025-07-11.
- Fix session not store when after redirect next page at deskelectronjs engine. Completed on 2025-07-16

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
