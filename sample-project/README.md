# Sample Project — TrackAll Loan Maintenance

This folder contains the sample legacy codebase used to illustrate the RE Agent Pack pipeline.
It is a representative slice of a real VC++ / MFC thick-client application that manages
Lender-Placed Insurance (LPI) on mortgage portfolios — narrowed to the **Loan Maintenance** subdomain
(loan search, premium rating, and 14E EDI dispatch).

The pipeline reads these files, extracts business rules and dependencies, and produces
the governed artifacts in `../artifacts/`.

---

## What's here

| Folder | Contents |
|---|---|
| `src/` | VC++ MFC source — Loan Search dialog, business rules, gateway adapters |
| `tandem/` | HP NonStop Tandem server programs (COBOL) and SQL/MP schema DDL |
| `vs-project/` | Visual Studio 2022 solution and project files |

## Running the application in Visual Studio

The application requires Visual Studio 2022 on Windows with the MFC component installed.

1. Open `vs-project/TrackAllClientManagerLegacy.sln` in Visual Studio 2022
2. Build x64 Debug and run

The VS project uses relative paths — `vs-project/` and `src/` are siblings, so no path
configuration is needed after opening the solution.
