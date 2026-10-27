import { useEffect, useState } from 'react';

function Glyph({ children }: { children: string }) {
  return <span className="install-cmd__glyph" aria-hidden="true">{children}</span>;
}

type OS = 'windows' | 'macos' | 'linux' | 'android';

const RELEASE = 'v0.3.1';
const MOBILE_RELEASE = 'mobile-v0.3.0';
const BASE = `https://github.com/adeshlang/adeshlang/releases/download/${RELEASE}`;
const MOBILE_BASE = `https://github.com/adeshlang/adeshlang/releases/download/${MOBILE_RELEASE}`;

const TARGETS: Record<
  OS,
  {
    label: string;
    icon: string;
    prompt: string;
    command: string;
    downloadUrl: string;
    downloadLabel: string;
    note: string;
  }
> = {
  windows: {
    label: 'Windows',
    icon: '🪟',
    prompt: 'PS >',
    command: `irm ${BASE}/AdeshLang-0.3.0-x86_64-windows-setup.exe -OutFile adesh-setup.exe; start ./adesh-setup.exe -Wait`,
    downloadUrl: `${BASE}/AdeshLang-0.3.0-x86_64-windows-setup.exe`,
    downloadLabel: 'Setup .exe (x86_64)',
    note: 'Run in PowerShell. Adds adesh to PATH; ARM64 builds are listed on the install page.',
  },
  macos: {
    label: 'macOS',
    icon: '🍏',
    prompt: '$',
    command: `curl -LO ${BASE}/AdeshLang-0.3.0-aarch64-macos.pkg && sudo installer -pkg AdeshLang-0.3.0-aarch64-macos.pkg -target /`,
    downloadUrl: `${BASE}/AdeshLang-0.3.0-aarch64-macos.pkg`,
    downloadLabel: 'PKG (Apple Silicon)',
    note: 'Apple Silicon build. On Intel, swap aarch64 for x86_64 in both file names.',
  },
  linux: {
    label: 'Linux',
    icon: '🐧',
    prompt: '$',
    command: `curl -LO ${BASE}/adeshlang_0.3.0_amd64.deb && sudo dpkg -i adeshlang_0.3.0_amd64.deb && sudo apt-get install -f`,
    downloadUrl: `${BASE}/adeshlang_0.3.0_amd64.deb`,
    downloadLabel: 'DEB (amd64)',
    note: 'Debian/Ubuntu. Needs glibc 2.35+; RPM and universal tarball are on the install page.',
  },
  android: {
    label: 'Android',
    icon: '📱',
    prompt: '$',
    command: `curl -LO ${MOBILE_BASE}/AdeshLang-mobile-0.3.0-arm64-v8a.apk && adb install AdeshLang-mobile-0.3.0-arm64-v8a.apk`,
    downloadUrl: `${MOBILE_BASE}/AdeshLang-mobile-0.3.0-arm64-v8a.apk`,
    downloadLabel: 'ARM64 APK',
    note: 'Installs over ADB. Without a computer, open the APK directly on the device.',
  },
};

const DEFAULT_ORDER: OS[] = ['windows', 'macos', 'linux', 'android'];

function detectOS(): OS | null {
  if (typeof navigator === 'undefined') return null;
  const data = (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData;
  const hint = `${data?.platform ?? ''} ${navigator.platform ?? ''} ${navigator.userAgent}`.toLowerCase();
  if (/android/.test(hint)) return 'android';
  if (/win/.test(hint)) return 'windows';
  if (/mac|iphone|ipad|ipod/.test(hint)) return 'macos';
  if (/linux/.test(hint)) return 'linux';
  return null;
}

interface Props {
  variant?: 'hero' | 'page';
}

export default function InstallCommand({ variant = 'page' }: Props) {
  const [detected, setDetected] = useState<OS | null>(null);
  const [active, setActive] = useState<OS>('windows');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const os = detectOS();
    if (!os) return;
    setDetected(os);
    setActive(os);
  }, []);

  const order = detected
    ? [detected, ...DEFAULT_ORDER.filter((os) => os !== detected)]
    : DEFAULT_ORDER;

  const target = TARGETS[active];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(target.command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`install-cmd install-cmd--${variant}`}>
      <div className="install-cmd__tabs" role="tablist" aria-label="Choose your platform">
        {order.map((os) => (
          <button
            key={os}
            type="button"
            role="tab"
            aria-selected={active === os}
            className={`install-cmd__tab${active === os ? ' install-cmd__tab--active' : ''}`}
            onClick={() => setActive(os)}
          >
            <Glyph>{TARGETS[os].icon}</Glyph>
            {TARGETS[os].label}
            {detected === os && <span className="install-cmd__dot" title="Detected your platform" />}
          </button>
        ))}
      </div>

      <div className="install-cmd__field">
        <span className="install-cmd__prompt">{target.prompt}</span>
        <code className="install-cmd__command">{target.command}</code>
        <button
          type="button"
          className="install-cmd__copy"
          onClick={copy}
          aria-label={copied ? 'Copied install command' : 'Copy install command'}
          title={copied ? 'Copied' : 'Copy'}
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            {copied ? 'check' : 'content_copy'}
          </span>
        </button>
      </div>

      <div className="install-cmd__foot">
        <p className="install-cmd__note">
          <span className="material-symbols-rounded" aria-hidden="true">
            info
          </span>
          {target.note}
        </p>
        <a
          className="install-cmd__download"
          href={target.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            download
          </span>
          {target.downloadLabel}
        </a>
      </div>
    </div>
  );
}
