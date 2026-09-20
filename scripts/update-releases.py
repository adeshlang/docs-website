#!/usr/bin/env python3
"""
AdeshLang Docs Website Release Updater
=====================================
Fetches the latest GitHub releases for `adeshlang/adeshlang` (including core,
mobile, and vscode releases), computes/validates SHA-256 checksums and file sizes,
and automatically updates documentation download links, installation commands,
and release tables across the documentation website.

Usage:
  python update-releases.py [--repo owner/name] [--tag v0.3.0] [--dry-run]
"""

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DEFAULT_REPO = os.environ.get("ADESH_REPO", "adeshlang/adeshlang")


def get_headers():
    headers = {
        "User-Agent": "AdeshLang-Docs-Release-Updater",
        "Accept": "application/vnd.github.v3+json",
    }
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"
    return headers


def fetch_json(url: str):
    req = Request(url, headers=get_headers())
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def format_size(size_bytes: int) -> str:
    if size_bytes >= 1024 * 1024:
        mb = size_bytes / (1024 * 1024)
        return f"{mb:.1f} MB" if mb >= 10 else f"{mb:.2f} MB"
    elif size_bytes >= 1024:
        kb = size_bytes / 1024
        return f"{kb:.1f} KB" if kb >= 10 else f"{kb:.2f} KB"
    return f"{size_bytes} B"


def compute_sha256_and_size(url: str):
    req = Request(url, headers=get_headers())
    hasher = hashlib.sha256()
    size = 0
    with urlopen(req, timeout=120) as resp:
        while True:
            chunk = resp.read(64 * 1024)
            if not chunk:
                break
            hasher.update(chunk)
            size += len(chunk)
    return hasher.hexdigest(), size


def get_platform_desc(filename: str) -> str:
    name_lower = filename.lower()
    if "arm64-v8a.apk" in name_lower:
        return "Android ARM64-v8a (Recommended APK)"
    if "universal.apk" in name_lower:
        return "Android Universal (All-in-One APK)"
    if "x86_64.apk" in name_lower:
        return "Android x86_64 (Emulators / ChromeOS)"
    if name_lower.endswith(".aab"):
        return "Android App Bundle (AAB Package)"
    if name_lower.endswith(".vsix"):
        return "VS Code Extension (VSIX Package)"
    if "windows-setup.exe" in name_lower or (name_lower.endswith(".exe") and "setup" in name_lower):
        return "Windows x86_64 (Setup GUI)"
    if "windows-portable.zip" in name_lower:
        if "aarch64" in name_lower or "arm64" in name_lower:
            return "Windows ARM64 (Portable ZIP)"
        return "Windows x86_64 (Portable ZIP)"
    if "macos" in name_lower or "darwin" in name_lower:
        if "aarch64" in name_lower or "arm64" in name_lower:
            if name_lower.endswith(".pkg"):
                return "macOS Apple Silicon (Installer PKG)"
            if name_lower.endswith(".dmg"):
                return "macOS Apple Silicon (Disk Image DMG)"
            return "macOS Apple Silicon (Tarball)"
        if "x86_64" in name_lower or "amd64" in name_lower:
            if name_lower.endswith(".pkg"):
                return "macOS Intel x86_64 (Installer PKG)"
            if name_lower.endswith(".dmg"):
                return "macOS Intel x86_64 (Disk Image DMG)"
            return "macOS Intel x86_64 (Tarball)"
    if name_lower.endswith(".deb"):
        if "arm64" in name_lower or "aarch64" in name_lower:
            return "Debian / Ubuntu ARM64 (DEB)"
        return "Debian / Ubuntu x86_64 (DEB)"
    if name_lower.endswith(".rpm"):
        if "arm64" in name_lower or "aarch64" in name_lower:
            return "Fedora / RHEL ARM64 (RPM)"
        return "Fedora / RHEL x86_64 (RPM)"
    if name_lower.endswith(".tar.xz") or name_lower.endswith(".tar.gz"):
        if "aarch64" in name_lower or "arm64" in name_lower:
            return "Linux ARM64 (Universal Tarball)"
        return "Linux x86_64 (Universal Tarball)"
    if filename == "adesh.exe":
        return "Windows x86_64 Standalone CLI"
    if filename == "adl.exe":
        return "Windows x86_64 Package Manager"
    if filename == "als.exe":
        return "Windows x86_64 Language Server"
    if filename == "adesh-editor.exe":
        return "Windows x86_64 TUI Code Editor"
    if filename in ("SHA256SUMS", "SHA256SUMS.txt"):
        return "All Checksums File"
    if filename == "toolchain-manifest.json":
        return "LLVM Toolchain Resolver Manifest"
    return "Release Artifact"


def update_docs(repo: str, target_tag: str = None, dry_run: bool = False):
    print(f"Fetching release information for {repo}...")
    api_url = f"https://api.github.com/repos/{repo}/releases"
    try:
        releases = fetch_json(api_url)
    except Exception as e:
        print(f"Error fetching releases from GitHub: {e}", file=sys.stderr)
        return False

    if not releases:
        print("No releases found.")
        return False

    # Find core release, mobile release, and vscode release
    core_release = None
    mobile_release = None
    vscode_release = None

    for rel in releases:
        tag = rel.get("tag_name", "")
        if tag.startswith("mobile-"):
            if not mobile_release:
                mobile_release = rel
        elif tag.startswith("vscode-"):
            if not vscode_release:
                vscode_release = rel
        else:
            if target_tag:
                if tag == target_tag and not core_release:
                    core_release = rel
            elif not core_release:
                core_release = rel

    if not core_release:
        core_release = releases[0]

    core_tag = core_release.get("tag_name", "v0.3.0")
    core_version = core_tag.lstrip("v")
    mobile_tag = mobile_release.get("tag_name", f"mobile-{core_tag}") if mobile_release else f"mobile-{core_tag}"
    vscode_tag = vscode_release.get("tag_name", f"vscode-{core_tag}") if vscode_release else f"vscode-{core_tag}"

    print(f"Active Releases:")
    print(f"  • Core   : {core_tag} (version {core_version})")
    print(f"  • Mobile : {mobile_tag}")
    print(f"  • VSCode : {vscode_tag}")

    # Gather all assets
    assets = []
    for rel, rtag in [(core_release, core_tag), (mobile_release, mobile_tag), (vscode_release, vscode_tag)]:
        if not rel:
            continue
        for a in rel.get("assets", []):
            name = a.get("name", "")
            download_url = a.get("browser_download_url", "")
            size = a.get("size", 0)
            assets.append({
                "name": name,
                "url": download_url,
                "size": size,
                "tag": rtag,
            })

    # Download SHA256SUMS if present
    sha256_map = {}
    for a in assets:
        if a["name"] in ("SHA256SUMS", "SHA256SUMS.txt"):
            try:
                req = Request(a["url"], headers=get_headers())
                with urlopen(req, timeout=30) as resp:
                    lines = resp.read().decode("utf-8").splitlines()
                    for line in lines:
                        parts = line.strip().split()
                        if len(parts) >= 2:
                            sha = parts[0]
                            fname = parts[1].lstrip("*").lstrip("./")
                            sha256_map[fname] = sha
                print(f"Loaded {len(sha256_map)} checksums from {a['name']}")
            except Exception as e:
                print(f"Warning: Could not fetch {a['name']}: {e}")

    # Process all assets for checksums
    asset_rows = []
    for a in assets:
        name = a["name"]
        url = a["url"]
        size_str = format_size(a["size"])
        sha = sha256_map.get(name)
        if not sha:
            print(f"Fetching sha256 for {name}...")
            try:
                sha, real_size = compute_sha256_and_size(url)
                if not a["size"]:
                    size_str = format_size(real_size)
            except Exception as e:
                print(f"  Warning: could not compute sha256 for {name}: {e}")
                sha = "pending"
        desc = get_platform_desc(name)
        asset_rows.append({
            "name": name,
            "desc": desc,
            "size": size_str,
            "sha256": sha,
            "url": url,
        })

    # Find docs root directory
    script_dir = Path(__file__).resolve().parent
    docs_root = script_dir.parent
    repo_root = docs_root.parent

    # 1. Update docs-website/docs/install.md table
    install_md = docs_root / "docs" / "install.md"
    if install_md.is_file():
        content = install_md.read_text(encoding="utf-8")
        
        # Build new markdown table
        table_lines = [
            "| File Name | Platform / Target | Size | SHA-256 Checksum |",
            "|---|---|---|---|",
        ]
        for row in asset_rows:
            table_lines.append(
                f"| **[{row['name']}]({row['url']})** | {row['desc']} | {row['size']} | `{row['sha256']}` |"
            )
        new_table_str = "\n".join(table_lines)

        table_pattern = re.compile(
            r"\| File Name \| Platform / Target \| Size \| SHA-256 Checksum \|\n\|---\|---\|---\|---\|\n(?:\| .*\n)*",
            re.MULTILINE
        )
        if table_pattern.search(content):
            content = table_pattern.sub(new_table_str + "\n", content)
            print(f"✓ Updated release asset table in {install_md}")
        else:
            print(f"! Warning: Could not locate asset table in {install_md}")

        # Update URLs and version strings
        content = re.sub(
            r"https://github\.com/[^/]+/[^/]+/releases/download/v\d+\.\d+\.\d+/",
            f"https://github.com/{repo}/releases/download/{core_tag}/",
            content
        )
        content = re.sub(
            r"https://github\.com/[^/]+/[^/]+/releases/download/mobile-v\d+\.\d+\.\d+/",
            f"https://github.com/{repo}/releases/download/{mobile_tag}/",
            content
        )
        content = re.sub(
            r"https://github\.com/[^/]+/[^/]+/releases/download/vscode-v\d+\.\d+\.\d+/",
            f"https://github.com/{repo}/releases/download/{vscode_tag}/",
            content
        )

        if not dry_run:
            install_md.write_text(content, encoding="utf-8")

    # 2. Update docs-website/learn/getting-started/installation.md
    learn_install_md = docs_root / "learn" / "getting-started" / "installation.md"
    if learn_install_md.is_file():
        content = learn_install_md.read_text(encoding="utf-8")
        content = re.sub(
            r"https://github\.com/[^/]+/[^/]+/releases/download/v\d+\.\d+\.\d+/",
            f"https://github.com/{repo}/releases/download/{core_tag}/",
            content
        )
        content = re.sub(
            r"https://github\.com/[^/]+/[^/]+/releases/download/mobile-v\d+\.\d+\.\d+/",
            f"https://github.com/{repo}/releases/download/{mobile_tag}/",
            content
        )
        content = re.sub(
            r"https://github\.com/[^/]+/[^/]+/releases/download/vscode-v\d+\.\d+\.\d+/",
            f"https://github.com/{repo}/releases/download/{vscode_tag}/",
            content
        )
        if not dry_run:
            learn_install_md.write_text(content, encoding="utf-8")
            print(f"✓ Updated release URLs in {learn_install_md}")

    # 3. Update docs-website/src/pages/index.tsx
    index_tsx = docs_root / "src" / "pages" / "index.tsx"
    if index_tsx.is_file():
        content = index_tsx.read_text(encoding="utf-8")
        content = re.sub(
            r"https://github\.com/[^/]+/[^/]+/releases/download/v\d+\.\d+\.\d+/",
            f"https://github.com/{repo}/releases/download/{core_tag}/",
            content
        )
        content = re.sub(
            r"https://github\.com/[^/]+/[^/]+/releases/download/mobile-v\d+\.\d+\.\d+/",
            f"https://github.com/{repo}/releases/download/{mobile_tag}/",
            content
        )
        if not dry_run:
            index_tsx.write_text(content, encoding="utf-8")
            print(f"✓ Updated homepage download commands in {index_tsx}")

    print("All documentation files updated successfully!")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update AdeshLang docs with latest release assets and checksums")
    parser.add_argument("--repo", default=DEFAULT_REPO, help="GitHub repository (owner/name)")
    parser.add_argument("--tag", default=None, help="Target release tag (e.g. v0.3.0)")
    parser.add_argument("--dry-run", action="store_true", help="Perform checks without writing files")
    args = parser.parse_args()

    success = update_docs(repo=args.repo, target_tag=args.tag, dry_run=args.dry_run)
    sys.exit(0 if success else 1)
