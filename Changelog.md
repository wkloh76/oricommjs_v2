# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-17

### Summary

- New design for workflow engine which work close with serialize method in both frontend and backend.
- Establish webbunjs engine base on honoJS framework.

### Added

- Add `str_replacelast` method into `utils`. Completed on 2025-04-22
- webbunjs engine design majority done and can work work oricommjs_component project. Completed on 2025-04-29

### Changed

- Upgrade engine/sqlmanager dependencies modules `libsql`, `jandas` and `mariadb` to latest version. Completed on 2025-04-04
- Upgrade engine/webexpress dependencies modules `libsql` and `helmet` to latest version. Completed on 2025-04-04
- Upgrade atomic/atom/smfetch dependencies modules `got` to latest version. Completed on 2025-04-04
- `kernel.Utils` object import twice to make sure all parameters updated to apply anywhere at `app.js`. Completed on 2025-04-05
- Update workspaces in `package.json` and `package.json.example`. Completed on 2025-04-06
- Change the import sqlite module method in `sqlmanager` base on engine name because bun.js has it own built in sqlite. Completed on 2025-04-22

### Deprecated

### Removed

### Fixed

### Security

[1.0.0]: https://github.com/wkloh76/oricommjs_v2/releases/tag/1.0.0
