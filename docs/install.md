---
id: install
title: Install AdeshLang
sidebar_label: Install
description: Download AdeshLang releases directly from GitHub.
---

# Install AdeshLang

Download AdeshLang from the official
[GitHub repository](https://github.com/adeshlang/adeshlang). The documentation
website does not host installers or application packages.

<div className="row">
  <div className="col col--6">
    <div className="card margin-bottom--md">
      <div className="card__header">
        <h2>Windows</h2>
      </div>
      <div className="card__body">
        <p><strong>Available now</strong> for Windows x86_64.</p>
        <p>Open the latest GitHub release and download the Windows installer or portable ZIP.</p>
        <a
          className="button button--primary button--block"
          href="https://github.com/adeshlang/adeshlang/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download Windows build
        </a>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card margin-bottom--md">
      <div className="card__header">
        <h2>Android</h2>
      </div>
      <div className="card__body">
        <p>Download the Android APK from the GitHub release assets.</p>
        <a
          className="button button--secondary button--block"
          href="https://github.com/adeshlang/adeshlang/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download Android APK
        </a>
        <small>If the latest release has no APK asset yet, Android publishing is still pending.</small>
      </div>
    </div>
  </div>
</div>

## Platform availability

| Platform | Status | Download |
| --- | --- | --- |
| Windows x86_64 | **Available now** | [GitHub Releases](https://github.com/adeshlang/adeshlang/releases/latest) |
| Linux | Coming soon | Not available yet |
| macOS | Coming soon | Not available yet |
| Android | APK via GitHub Releases | [GitHub Releases](https://github.com/adeshlang/adeshlang/releases/latest) |

## Windows installation

1. Open the [latest GitHub release](https://github.com/adeshlang/adeshlang/releases/latest).
2. Download the Windows installer (`.exe`) or portable archive (`.zip`).
3. Run the installer, or extract the portable archive.
4. Open PowerShell and verify the installation:

   ```powershell
   adesh --version
   adesh doctor
   ```

The Windows installer manages the AdeshLang toolchain inside the AdeshLang
installation directory. It does not download the application from this
website.

## Release source

All release assets are published in
[`adeshlang/adeshlang`](https://github.com/adeshlang/adeshlang/releases).
Use GitHub's release checksums to verify a downloaded file before installing.
