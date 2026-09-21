#!/usr/bin/env python3
"""
AdeshLang Docs Website Release Updater
=====================================
Fetches the latest GitHub releases for `adeshlang/adeshlang` (including core,
mobile, and vscode releases), computes/validates SHA-256 checksums and file sizes,
and automatically updates documentation download links, installation commands,
release tables, and installer manifests across the repository.

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


def get_target_tag_for_filename(filename: str, core_tag: str, mobile_tag: str, vscode_tag: str) -> str:
    """Routes an asset filename to its proper release tag."""
    if filename.startswith("adesh-vscode-") or filename.endswith(".vsix"):
        return vscode_tag
    if filename.startswith("AdeshLang-mobile-") or "SHA256SUMS-mobile" in filename:
        return mobile_tag
    return core_tag


def fix_all_download_urls(content: str, repo: str, core_tag: str, mobile_tag: str, vscode_tag: str) -> str:
    """
    Scans content for any GitHub release download URL and rewrites it with
    the proper tag based on the asset filename.
    """
    def _repl(match):
        filename = match.group(1)
        tag = get_target_tag_for_filename(filename, core_tag, mobile_tag, vscode_tag)
        return f"https://github.com/{repo}/releases/download/{tag}/{filename}"

    pattern = re.compile(
        r"https://github\.com/[^/]+/[^/]+/releases/download/[^/]+/([a-zA-Z0-9_\.\-]+)"
    )
    return pattern.sub(_repl, content)


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

    # Separate releases by type
    core_candidates = []
    mobile_candidates = []
    vscode_candidates = []

    for rel in releases:
        tag = rel.get("tag_name", "")
        if tag.startswith("mobile-"):
            mobile_candidates.append(rel)
        elif tag.startswith("vscode-"):
            vscode_candidates.append(rel)
        else:
            core_candidates.append(rel)

    core_release = None
    mobile_release = None
    vscode_release = None

    if target_tag:
        if target_tag.startswith("vscode-"):
            for r in vscode_candidates:
                if r.get("tag_name") == target_tag:
                    vscode_release = r
                    break
        elif target_tag.startswith("mobile-"):
            for r in mobile_candidates:
                if r.get("tag_name") == target_tag:
                    mobile_release = r
                    break
        else:
            for r in core_candidates:
                if r.get("tag_name") == target_tag:
                    core_release = r
                    break

    if not core_release and core_candidates:
        core_release = core_candidates[0]
    if not mobile_release and mobile_candidates:
        mobile_release = mobile_candidates[0]
    if not vscode_release and vscode_candidates:
        vscode_release = vscode_candidates[0]

    if not core_release:
        # Fallback if no release without prefix was found
        core_release = releases[0]

    core_tag = core_release.get("tag_name", "v0.3.0")
    core_version = core_tag.lstrip("v")
    mobile_tag = mobile_release.get("tag_name", f"mobile-{core_tag}") if mobile_release else f"mobile-{core_tag}"
    vscode_tag = vscode_release.get("tag_name", f"vscode-{core_tag}") if vscode_release else f"vscode-{core_tag}"

    print(f"Active Releases:")
    print(f"  • Core   : {core_tag} (version {core_version})")
    print(f"  • Mobile : {mobile_tag}")
    print(f"  • VSCode : {vscode_tag}")

    # Gather all assets with their appropriate release tag
    assets = []
    for rel, rtag in [(core_release, core_tag), (mobile_release, mobile_tag), (vscode_release, vscode_tag)]:
        if not rel:
            continue
        for a in rel.get("assets", []):
            name = a.get("name", "")
            download_url = f"https://github.com/{repo}/releases/download/{rtag}/{name}"
            size = a.get("size", 0)
            assets.append({
                "name": name,
                "url": download_url,
                "size": size,
                "tag": rtag,
            })

    # Download SHA256SUMS from core and mobile releases if present
    sha256_map = {}
    for a in assets:
        if a["name"] in ("SHA256SUMS", "SHA256SUMS.txt", "SHA256SUMS-mobile.txt"):
            try:
                req = Request(a["url"], headers=get_headers())
                with urlopen(req, timeout=30) as resp:
                    lines = resp.read().decode("utf-8").splitlines()
                    for line in lines:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        parts = line.split()
                        if len(parts) >= 2:
                            sha = parts[0]
                            fname = parts[1].lstrip("*").lstrip("./")
                            sha256_map[fname] = sha
                print(f"Loaded checksums from {a['name']}")
            except Exception as e:
                print(f"Warning: Could not fetch {a['name']}: {e}")

    # Process all assets for checksums and formatted sizes
    asset_rows = []
    asset_size_dict = {}
    asset_sha_dict = {}
    for a in assets:
        name = a["name"]
        url = a["url"]
        size_bytes = a["size"]
        size_str = format_size(size_bytes)
        sha = sha256_map.get(name)
        if not sha:
            print(f"Fetching sha256 for {name}...")
            try:
                sha, real_size = compute_sha256_and_size(url)
                if not size_bytes:
                    size_bytes = real_size
                    size_str = format_size(real_size)
            except Exception as e:
                print(f"  Warning: could not compute sha256 for {name}: {e}")
                sha = "pending"
        desc = get_platform_desc(name)
        asset_size_dict[name] = size_str
        asset_sha_dict[name] = sha
        asset_rows.append({
            "name": name,
            "desc": desc,
            "size": size_str,
            "size_bytes": size_bytes,
            "sha256": sha,
            "url": url,
        })

    # Find docs root directory
    script_dir = Path(__file__).resolve().parent
    docs_root = script_dir.parent
    repo_root = docs_root.parent

    # 1. Update docs-website/docs/install.md
    install_md = docs_root / "docs" / "install.md"
    if install_md.is_file():
        content = install_md.read_text(encoding="utf-8")

        # Fix all release download URLs across the entire file
        content = fix_all_download_urls(content, repo, core_tag, mobile_tag, vscode_tag)

        # Update core version mentions (e.g. AdeshLang v0.3.0)
        content = re.sub(
            r"AdeshLang v\d+\.\d+\.\d+",
            f"AdeshLang {core_tag}",
            content
        )
        content = re.sub(
            r"Direct Downloads \(v\d+\.\d+\.\d+\)",
            f"Direct Downloads ({core_tag})",
            content
        )

        # Update button size labels if present
        def _btn_sub(match):
            prefix = match.group(1)
            fname = match.group(2)
            suffix = match.group(3)
            size = asset_size_dict.get(fname, "")
            if size:
                return f"{prefix}{fname}{suffix} — {size}"
            return match.group(0)

        # Build new markdown table for assets
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

        # Fix specific button size annotations in install.md
        setup_exe = f"AdeshLang-{core_version}-x86_64-windows-setup.exe"
        if setup_exe in asset_size_dict:
            content = re.sub(
                r"Download Windows Setup \(\.exe\)(?: — [^\n<]+)?",
                f"Download Windows Setup (.exe) — {asset_size_dict[setup_exe]}",
                content
            )
        win_zip_x86 = f"AdeshLang-{core_version}-x86_64-windows-portable.zip"
        if win_zip_x86 in asset_size_dict:
            content = re.sub(
                r"Portable x86_64 \(\.zip\)(?: — [^\n<]+)?",
                f"Portable x86_64 (.zip) — {asset_size_dict[win_zip_x86]}",
                content
            )
        win_zip_arm = f"AdeshLang-{core_version}-aarch64-windows-portable.zip"
        if win_zip_arm in asset_size_dict:
            content = re.sub(
                r"Portable ARM64 \(\.zip\)(?: — [^\n<]+)?",
                f"Portable ARM64 (.zip) — {asset_size_dict[win_zip_arm]}",
                content
            )
        mac_pkg_arm = f"AdeshLang-{core_version}-aarch64-macos.pkg"
        if mac_pkg_arm in asset_size_dict:
            content = re.sub(
                r"Apple Silicon Installer \(\.pkg\)(?: — [^\n<]+)?",
                f"Apple Silicon Installer (.pkg) — {asset_size_dict[mac_pkg_arm]}",
                content
            )
        mac_dmg_arm = f"AdeshLang-{core_version}-aarch64-macos.dmg"
        if mac_dmg_arm in asset_size_dict:
            content = re.sub(
                r"Apple Silicon \(\.dmg\)(?: — [^\n<]+)?",
                f"Apple Silicon (.dmg) — {asset_size_dict[mac_dmg_arm]}",
                content
            )
        mac_pkg_x86 = f"AdeshLang-{core_version}-x86_64-macos.pkg"
        if mac_pkg_x86 in asset_size_dict:
            content = re.sub(
                r"Intel \(\.pkg\)(?: — [^\n<]+)?",
                f"Intel (.pkg) — {asset_size_dict[mac_pkg_x86]}",
                content
            )
        mac_dmg_x86 = f"AdeshLang-{core_version}-x86_64-macos.dmg"
        if mac_dmg_x86 in asset_size_dict:
            content = re.sub(
                r"Intel \(\.dmg\)(?: — [^\n<]+)?",
                f"Intel (.dmg) — {asset_size_dict[mac_dmg_x86]}",
                content
            )
        deb_x86 = f"adeshlang_{core_version}_amd64.deb"
        if deb_x86 in asset_size_dict:
            content = re.sub(
                r"Debian/Ubuntu x86_64 \(\.deb\)(?: — [^\n<]+)?",
                f"Debian/Ubuntu x86_64 (.deb) — {asset_size_dict[deb_x86]}",
                content
            )
        deb_arm = f"adeshlang_{core_version}_arm64.deb"
        if deb_arm in asset_size_dict:
            content = re.sub(
                r"Debian/Ubuntu ARM64 \(\.deb\)(?: — [^\n<]+)?",
                f"Debian/Ubuntu ARM64 (.deb) — {asset_size_dict[deb_arm]}",
                content
            )
        rpm_x86 = f"adeshlang-{core_version}-1.x86_64.rpm"
        if rpm_x86 in asset_size_dict:
            content = re.sub(
                r"Fedora/RPM x86_64(?: — [^\n<]+)?",
                f"Fedora/RPM x86_64 — {asset_size_dict[rpm_x86]}",
                content
            )
        tar_x86 = f"AdeshLang-{core_version}-x86_64-linux-gnu.tar.xz"
        if tar_x86 in asset_size_dict:
            content = re.sub(
                r"Universal Tarball \(\.tar\.xz\)(?: — [^\n<]+)?",
                f"Universal Tarball (.tar.xz) — {asset_size_dict[tar_x86]}",
                content
            )

        if not dry_run:
            install_md.write_text(content, encoding="utf-8")
            print(f"✓ Updated {install_md}")

    # 2. Update docs-website/learn/getting-started/installation.md
    learn_install_md = docs_root / "learn" / "getting-started" / "installation.md"
    if learn_install_md.is_file():
        content = learn_install_md.read_text(encoding="utf-8")
        content = fix_all_download_urls(content, repo, core_tag, mobile_tag, vscode_tag)
        content = re.sub(
            r"https://github\.com/[^/]+/[^/]+/releases/tag/(?:vscode-|mobile-)?v\d+\.\d+\.\d+",
            f"https://github.com/{repo}/releases/tag/{core_tag}",
            content
        )
        content = re.sub(
            r"AdeshLang v\d+\.\d+\.\d+ Release",
            f"AdeshLang {core_tag} Release",
            content
        )
        content = re.sub(
            r"Pre-built Packages \(v\d+\.\d+\.\d+\)",
            f"Pre-built Packages ({core_tag})",
            content
        )
        if not dry_run:
            learn_install_md.write_text(content, encoding="utf-8")
            print(f"✓ Updated {learn_install_md}")

    # 3. Update docs-website/src/pages/index.tsx
    index_tsx = docs_root / "src" / "pages" / "index.tsx"
    if index_tsx.is_file():
        content = index_tsx.read_text(encoding="utf-8")
        content = fix_all_download_urls(content, repo, core_tag, mobile_tag, vscode_tag)

        # Update button labels with exact sizes in index.tsx
        setup_exe = f"AdeshLang-{core_version}-x86_64-windows-setup.exe"
        if setup_exe in asset_size_dict:
            content = re.sub(
                r"downloadLabel:\s*'Setup \.exe \([^\)]+\)'",
                f"downloadLabel: 'Setup .exe ({asset_size_dict[setup_exe]})'",
                content
            )
        mobile_apk = f"AdeshLang-mobile-{core_version}-arm64-v8a.apk"
        if mobile_apk in asset_size_dict:
            content = re.sub(
                r"downloadLabel:\s*'ARM64 APK \([^\)]+\)'",
                f"downloadLabel: 'ARM64 APK ({asset_size_dict[mobile_apk]})'",
                content
            )

        if not dry_run:
            index_tsx.write_text(content, encoding="utf-8")
            print(f"✓ Updated {index_tsx}")

    # 4. Update docs-website/docs/tools/als.md
    als_md = docs_root / "docs" / "tools" / "als.md"
    if als_md.is_file():
        content = als_md.read_text(encoding="utf-8")
        content = fix_all_download_urls(content, repo, core_tag, mobile_tag, vscode_tag)
        vsix_file = f"adesh-vscode-{core_version}.vsix"
        if vsix_file in asset_size_dict:
            content = re.sub(
                r"\*\*\[adesh-vscode-[^\]]+\]\([^\)]+\)\*\*\s*\([^\)]+\)",
                f"**[{vsix_file}](https://github.com/{repo}/releases/download/{vscode_tag}/{vsix_file})** ({asset_size_dict[vsix_file]})",
                content
            )
        if not dry_run:
            als_md.write_text(content, encoding="utf-8")
            print(f"✓ Updated {als_md}")

    # 5. Update installer/manifests/release-stable.json
    manifest_file = repo_root / "installer" / "manifests" / "release-stable.json"
    if manifest_file.is_file():
        try:
            m_data = json.loads(manifest_file.read_text(encoding="utf-8"))
            m_data["version"] = core_version
            for comp_name, comp_info in m_data.get("components", {}).items():
                url = comp_info.get("url", "")
                if url:
                    fname = url.split("/")[-1]
                    tag = get_target_tag_for_filename(fname, core_tag, mobile_tag, vscode_tag)
                    comp_info["url"] = f"https://github.com/{repo}/releases/download/{tag}/{fname}"
                    comp_info["version"] = core_version
                    if fname in asset_sha_dict and asset_sha_dict[fname] != "pending":
                        comp_info["sha256"] = asset_sha_dict[fname]
                    # Update size in bytes if available from rows
                    for r in asset_rows:
                        if r["name"] == fname and r.get("size_bytes"):
                            comp_info["size"] = r["size_bytes"]
                            break
            if not dry_run:
                manifest_file.write_text(json.dumps(m_data, indent=2) + "\n", encoding="utf-8")
                print(f"✓ Updated {manifest_file}")
        except Exception as e:
            print(f"! Warning: could not update {manifest_file}: {e}")

    print("All documentation files and manifests updated successfully!")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update AdeshLang docs with latest release assets and checksums")
    parser.add_argument("--repo", default=DEFAULT_REPO, help="GitHub repository (owner/name)")
    parser.add_argument("--tag", default=None, help="Target release tag (e.g. v0.3.0)")
    parser.add_argument("--dry-run", action="store_true", help="Perform checks without writing files")
    args = parser.parse_args()

    success = update_docs(repo=args.repo, target_tag=args.tag, dry_run=args.dry_run)
    sys.exit(0 if success else 1)
