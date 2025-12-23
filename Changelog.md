# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2025-11-26

### Summary

- Focus to workflow engine design.

### Added

- Client and Server Side Event to atomic/atom complete design. Completed on 2025-11-27
- Add load components package.json content into cengine class at compmgr engine. Completed on 2025-12-07
- Add shared to both toml file in compmgr engine which allow web and desktop service to access local file (css,js and etc) like `public/assest` feature. Completed on 2025-12-11
- Design workflow engine. In progress
  ~~- Apply workflow engine for frontend. Code transfer from compmgr `assist/data/preload.html`. In progress~~
- Add arr2str function to utils. Completed on 2025-12-15
- Apply workflow engine for frontend. Code transfer from compmgr `assist/data/preload.html`. Completed on 2025-12-15
- Add auto indentify component toml file base on engine. The prefix of component name no longer to use. Completed on 2025-12-15
- Redesign queuetask method at workflow engine. In progress

### Changed

- Update all package.json dependencies. Completed on 2025-12-01
- Change the sequence in catch at app.js. Completed on 2025-12-01
- Change the frontend javascript preloading library at compmgr engine. Completed on 2025-12-12
- Workflow engine code improvement to support fronted. Completed on 2025-12-16
- queuetask method at workflow engine for backend done. Completed on 2025-12-23

### Deprecated

### Removed

### Fixed

- Bug fix in compmgr engine. Completed on 2025-11-26
- Bug fix in sse at csse atom which is no responding cause client alway reconnected. Completed on 2025-12-02
- Bug fix in deskfetch function at atom/smfetch which unable carry on the GET method to backend api. Completed on 2025-12-05
- Bug fix in regutils method at compmgr engine which unable load content due to improper path. This only happen in deskelectronjs engine. Completed on 2025-12-15
- Bug fix in mergeDeep function at utils. Completed on 2025-12-15
- Bug fix in workflow engine for frontend. Completed on 2025-12-15
- Bug fix in smfetch at `atomic/atom` which unsupport current design without prefix to identify current runtime engine. Completed on 2025-12-16

### Security

[1.1.5]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.1.5

## [1.1.4] - 2025-11-14

### Summary

- Focus to workflow engine design.

### Added

- Add new parameter to ignore default force import database at atom/startupinit if the database schema does not exist. Completed on 2025-11-18
- Add Client and Server Side Event to atomic/atom. In progress

### Changed

- Apply header from `x-forwarded-for` to get client ip from proxy (save to pino log) at both webbunjs and webnodehonojs engine. Completed on 2025-11-14
- Update window default size in deskelectronjs engine. Completed on 2025-11-14
- Standardization code in compmgr engine at assits module. The impact include webbunjs, webnodehonojs and deskelectronjs. Completed on 2025-11-18

### Deprecated

### Removed

### Fixed

- Bug fix in atomic/atom/startupinit at sqlite3 method. Completed on 2025-11-19
- Bug fix in compmgr engine. Completed on 2025-11-25
- Bug fix in deskelectronjs engine which is memory leakage cause by session frequence query and cause the entire application corrupted. Completed on 2025-11-25

### Security

[1.1.4]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.1.4

## [1.1.3] - 2025-11-07

### Summary

- Fix deskelectronjs engine auto upgrade bug.

### Added

### Changed

### Deprecated

### Removed

### Fixed

- Fix deskelectronjs engine auto upgrade failure due to casting missing `/` between url and path. Completed on 2025-11-07

### Security

[1.1.3]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.1.3

## [1.1.2] - 2025-11-06

### Summary

- Focus on deskelectronjs engine deployement and auto upgrade.

### Added

### Changed

### Deprecated

### Removed

- Remove unused file from utils. Completed on 2025-11-06

### Fixed

- Fix deskelectronjs engine cannot auto upgrade issue. Completed on 2025-11-06

### Security

[1.1.2]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.1.2

## [1.1.1] - 2025-10-30

### Summary

- Focus on developing workflow engine for frontend and backend.

### Added

- Add check if `app.js` detect argument `sudopwd` exists whill no turn on inquirer prompt and will base on sudopwd value generate encrypt data to `conf.toml` file. Completed on 2025-10-30
- ~~Redefining the deskelctronjs engine code structure similiar to webbunjs and webnodehonojs. In progress...~~
- Redefining the deskelctronjs engine code structure similiar to webbunjs and webnodehonojs. Completed on 2025-11-01
- Redirect page during render first tab in deskelectronjs engine done. Completed on 2025-11-02
- deskelectronjs engine design done and the route almost same like web. Completed on 2025-11-03

### Changed

- Redefining the code structure and flow in the web server engine (webbunjs and webnodehonojs). Completed on 2025-10-30
- In the compmgr engine, the reaction function is renamed to webaction for extension purposes. Completed on 2025-10-30
- Code optimization in both deskelectronjs and compmgr engine. Completed on 2025-11-01

### Deprecated

### Removed

- Remove unused code and file from deskelectronjs engine. Completed on 2025-11-01

### Fixed

### Security

[1.1.1]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.1.1

## [1.1.0] - 2025-10-29

### Summary

- Focus on developing workflow engine for frontend and backend.

### Added

### Changed

### Deprecated

### Removed

### Fixed

- Bug fix from compmgr engine which is file handler inproper cause the request from frontend html no responding. File type which in binary like png and so on. Completed on 2025-10-29

- Bug fix from compmgr which is `less.js` embeded the url no respoding during from frontend request. Completed on 2025-10-29

### Security

[1.1.0]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.1.0

## [1.0.9] - 2025-10-20

### Summary

- Focus on developing workflow engine for frontend and backend.

### Added

- Apply html module to utils. Completed on 2025-10-20
- Implement utils/html module to webbunjs engine reaction module. Completed on 2025-10-20
- Add `rtn["compname"] = compname` into compmgr engine to declare the function binding from which components. Completed on 2025-10-21
- Add `jpointer.js` to utils which is part of utils function (jptr) instead `@sagold/json-pointer` module. Completed on 2025-10-22
- Add feature at compmgr engine which provide static server route to support honojs. Completed 2025-10-22
- Add module loading method which support both frontend and backend. Utils selected modules will apply it. Completed 2025-10-25
- Implement `honoassist` module to webnodehonojs engine instead curent render method. COmpleted on 2025-10-26
- The repetitive modules from both webbunjs and webnodehonojs engine move to compmgr/hono to standardise the web render procedure. Completed on 2025-10-26

### Changed

- Remove entires module export promise base from utils. Completed on 2025-10-20
- Split some functions from `utils.js` which will direct access system I/O. Completed on 2025-10-22
- Change webbunjs engine dependencies `utils\html.js` to `compmgr\honoassist.js`. Completed on 2025-10-25
- Rename `honoassist.js` to `assist.js` and The `assist` folder becomes the parent folder of the `hono`. Completed on 2025-10-27
- Rename `hono` folder to `web`. Completed on 2025-10-27
- Rename `webserver.js` to `server.js` in both webbunjs and webnodehonojs engine. Completed on 2025-10-27
- Update missing dependencies in package.json.example. Completed on 2025-10-29

### Deprecated

### Removed

- Remove duplicate code from onrequest function as `reaction.js` in webbunjs and webnodehonojs engine. Completed on 2025-10-22
- Remove `@sagold/json-pointer` dependencies from main package.json. Completed on 2025-10-22
- Remove `jptr` the module from global sysmodule at `app.js`. Completed on 2025-10-22
- Remove unused function and code from webbunjs engine. Completed on 2025-10-26

### Fixed

- Fix inproper define module exports method in `jpointer.js` at utils. Completed on 2025-10-26
- Fix less unaable import js variable issue. Completed on 2025-10-28

### Security

[1.0.9]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.9

## [1.0.8] - 2025-10-09

### Summary

- Focus on developing the deskelectronjs engine to make it more powerful.

### Added

- Apply log module to keep requested data and save to log file. Completed on 2025-10-13
- Apply the sessionMiddleware in deskelectronjs. Completed on 2025-10-15
- Add aes-256 encrypt and decrypt function to utils. Completed on 2025-10-16
- Implement encrypt user password and save the filename `conf.toml` to user home at app.js. Completed on 2025-10-16
- Implement decrypt user password from file `conf.toml` at deskelectronjs engine autoupadate. Completed on 2025-10-16

### Changed

- The deskelectronjs engine handles session data relying on sqlite files and memory types. Completed on 2025-10-14
- Both webbunjs and webnodehonojs engine handles session data relying on sqlite files and memory types. Completed on 2025-10-14

### Deprecated

### Removed

- Remove unused `pino` dependencies from deskelectronjs, webbunjs and webnodehonojs engine. Completed on 2025-10-13

### Fixed

- Bug fix bodyLimit at webnodehonojs engine. Completed on 2025-10-09
- Bug fix deskelectronjs engine no responding when the first page loading not found. Completed on 2025-10-13
- Bug fix for webbunjs, webnodehonojs and deskelectronjs engine which failure create project profile folder to user home directory when first run the program. Completed on 2025-10-16

### Security

[1.0.8]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.8

## [1.0.7] - 2025-10-07

### Summary

- Focus on developing the deskelectronjs engine to make it more powerful.
- Add auto create locally session folder if not exists to both webbunjs and webnonohonojs engine. Completed on 2025-10-08

### Added

- Add pool connection feature to sqlmanger engine for mariadb module. Completed on 2025-10-08
- Add sudopwd argument to app.js. Completed on 2025-10-12

### Changed

### Deprecated

### Removed

### Fixed

- Fix write `route.json` file permission issue cause entire service corrupted in app.js. Completed on 2025-10-07
- Fix out of control the create new mariadb classs in sqlmanager engine. Completed on 2025-10-08
- Fix mariadb connection unable to handler destroy issue. Completed on 2025-10-08

### Security

[1.0.7]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.7

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
