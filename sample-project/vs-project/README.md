# Visual Studio Project Files

This folder contains the Visual Studio 2022 project files for the sample legacy VC++ / MFC application.

These files are here so the legacy application can be opened and run in Visual Studio.
They are intentionally hidden from the VS Code workspace view — all reverse-engineering pipeline work happens in VS Code.

## How to open in Visual Studio

1. Open `TrackAllClientManagerLegacy.sln` in Visual Studio 2022
2. Make sure you have the **Desktop development with C++** workload installed, including the **MFC** component
3. Build and run (x64 Debug is the recommended configuration)

## What you will see

The application opens with a Client Search dialog.
You can search for clients, open a client maintenance record, edit fields, trigger the Quote Required gateway path, and save changes.
All data is in-memory — there is no real database connection.

## Important notes

- The source code lives in the sibling folder (`../src/`) — relative paths inside the `.vcxproj` use `../src/`
- Build output (`bin/`, `obj/`) will be created in this folder when you build in Visual Studio — these are excluded from VS Code and git
- Do not move these project files out of this folder without updating the relative paths inside the `.vcxproj`
