import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Share2, Check, Sparkles, BadgeCheck, Download, MessageCircle, Instagram, ScrollText, Eye, ChevronRight } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SectionDivider } from '@/components/SectionDivider';
import { DynamicIcon } from '@/components/DynamicIcon';
import { Particles } from '@/components/Particles';
import { SIDEKICK_FALLBACK, SIDEKICK_SECTION_FALLBACK, type SidekickRole } from '@/data/content';
import { fetchSiteSettings, getSetting, fetchSidekickRoles, LEGEND_FALLBACK, HERO_FALLBACK } from '@/lib/queries';
import type { SiteSettings } from '@/lib/queries';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function fallbackMemberCode(name: string, roleSalt: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const cleanName = name.trim().toLowerCase();
  const seed = cleanName + roleSalt.toLowerCase();
  const prefix = cleanName.slice(0, 3).toUpperCase().padEnd(3, 'X');
  const segments: string[] = [];
  let hash = hashString(seed);
  for (let s = 0; s < 4; s++) {
    let seg = '';
    for (let c = 0; c < 4; c++) {
      seg += chars[hash % chars.length];
      hash = Math.floor(hash / chars.length) + hashString(seed + s + c) * 31;
    }
    segments.push(seg);
  }
  return `KK-${prefix}-${segments.join('-')}`;
}

async function fetchMemberCode(name: string, role: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(`${supabaseUrl}/functions/v1/generate-member-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ name, role }),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  if (!data?.memberCode || typeof data.memberCode !== 'string') {
    throw new Error('Invalid response from server');
  }
  return data.memberCode;
}

function formatDateTime(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = now.getFullYear();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day} ${month} ${year} · ${time}`;
}

interface SavedCertificate {
  name: string;
  roleName: string;
  roleTitle: string;
  roleDescription: string;
  roleIcon: string;
  roleCardColor: string;
  memberCode: string;
  dateTime: string;
}

const CERT_STORAGE_KEY = 'katana_certificate';

function loadSavedCertificate(): SavedCertificate | null {
  try {
    const raw = localStorage.getItem(CERT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedCertificate;
    if (parsed && parsed.name && parsed.memberCode) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveCertificate(data: SavedCertificate) {
  try {
    localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

function clearSavedCertificate() {
  try {
    localStorage.removeItem(CERT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

const RITUAL_STEPS = [
  {
    id: 'oath',
    title: 'Take the Oath',
    subtitle: 'Swear loyalty to the Katana Gang',
    icon: ScrollText,
    action: 'Swear',
  },
  {
    id: 'seal',
    title: 'The Seal',
    subtitle: 'The Darbar seals your initiation',
    icon: Eye,
    action: 'Witness',
  },
];

const OATH_LINES = [
  'I, the undersigned, pledge allegiance to KPHB Katana',
  'I shall uphold the honour of the galli and the gang',
  'I shall never reveal the secrets of the Darbar',
  'I shall share biryani with my bhai and never back down',
  'From this day, I am Katana miya, and Katana is me',
];

export function Sidekick() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [roles, setRoles] = useState<SidekickRole[]>(SIDEKICK_FALLBACK);
  const [selectedRole, setSelectedRole] = useState<SidekickRole | null>(null);
  const [userName, setUserName] = useState('');
  const [cardGenerated, setCardGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [memberCode, setMemberCode] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [revealStep, setRevealStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [ritualStep, setRitualStep] = useState(-1);
  const [ritualOathIndex, setRitualOathIndex] = useState(0);
  const certRef = useRef<HTMLDivElement>(null);
  const [certScale, setCertScale] = useState(1);

  useEffect(() => {
    const certificate = certRef.current;
    if (!certificate) return;

    const updateScale = () => {
      const width = certificate.clientWidth;
      setCertScale(Math.min(1, Math.max(0.55, width / 800)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(certificate);
    return () => observer.disconnect();
  }, [cardGenerated, ritualStep]);

  useEffect(() => {
    fetchSiteSettings().then(setSettings).catch(() => {});
    fetchSidekickRoles().then(setRoles).catch(() => {});
  }, [cardGenerated]);

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      if (ritualStep >= 0) {
        document.body.classList.remove('katana-cursor-active');
      } else {
        document.body.classList.add('katana-cursor-active');
      }
    }

    if (ritualStep < 0) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [ritualStep]);

  // Restore saved certificate on mount
  useEffect(() => {
    const saved = loadSavedCertificate();
    if (saved) {
      const role: SidekickRole = {
        roleName: saved.roleName,
        roleTitle: saved.roleTitle,
        description: saved.roleDescription,
        icon: saved.roleIcon,
        cardColor: saved.roleCardColor,
      };
      setSelectedRole(role);
      setUserName(saved.name);
      setMemberCode(saved.memberCode);
      setDateTime(saved.dateTime);
      setCardGenerated(true);
      setRevealStep(5);
    }
  }, []);

  const heading = getSetting(settings, 'sidekick_heading', SIDEKICK_SECTION_FALLBACK.heading);
  const subheading = getSetting(settings, 'sidekick_subheading', SIDEKICK_SECTION_FALLBACK.subheading);
  const portrait = getSetting(settings, 'legend_portrait', LEGEND_FALLBACK.portrait);
  const heroBg = getSetting(settings, 'hero_bg_image', HERO_FALLBACK.bgImage);

  const isGold = selectedRole?.cardColor === 'gold';

  const handleStartRitual = async () => {
    if (!userName.trim() || !selectedRole || generating) return;
    setRitualStep(0);
    setRitualOathIndex(0);
  };

  const handleRitualAdvance = () => {
    if (ritualStep === 0) {
      if (ritualOathIndex < OATH_LINES.length - 1) {
        setRitualOathIndex(ritualOathIndex + 1);
      } else {
        setRitualStep(1);
      }
    } else if (ritualStep === 1) {
      completeRitual();
    }
  };

  const completeRitual = async () => {
    if (!userName.trim() || !selectedRole) return;
    setGenerating(true);
    setGenError(null);
    let code: string;
    try {
      code = await fetchMemberCode(userName, selectedRole.roleName);
    } catch {
      code = fallbackMemberCode(userName, selectedRole.roleName);
    }
    const dt = formatDateTime();
    setMemberCode(code);
    setDateTime(dt);
    setCardGenerated(true);
    setRitualStep(-1);
    setGenerating(false);
    setRevealStep(0);
    setTimeout(() => setRevealStep(1), 100);
    setTimeout(() => setRevealStep(2), 500);
    setTimeout(() => setRevealStep(3), 900);
    setTimeout(() => setRevealStep(4), 1300);
    setTimeout(() => setRevealStep(5), 1700);

    // Save to localStorage
    saveCertificate({
      name: userName,
      roleName: selectedRole.roleName,
      roleTitle: selectedRole.roleTitle,
      roleDescription: selectedRole.description,
      roleIcon: selectedRole.icon,
      roleCardColor: selectedRole.cardColor,
      memberCode: code,
      dateTime: dt,
    });
  };

  const handleReset = () => {
    clearSavedCertificate();
    setCardGenerated(false);
    setSelectedRole(null);
    setUserName('');
    setMemberCode('');
    setDateTime('');
    setRevealStep(0);
    setRitualStep(-1);
    setGenError(null);
  };

  const handleShare = async () => {
    if (!selectedRole || !userName) return;
    const text = `${userName} is now an official member of KPHB Katana Gang as ${selectedRole.roleTitle}! Member Code: ${memberCode}. Join the gang, miya.`;
    const url = window.location.origin;

    try {
      const pngBlob = await generateCertificatePNG();
      const shareData: ShareData = {
        title: 'KPHB Katana Gang',
        text,
        url,
      };
      if (pngBlob) {
        shareData.files = [new File([pngBlob], 'katana-certificate.png', { type: 'image/png' })];
      }
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // Fall through to clipboard
    }

    navigator.clipboard.writeText(`${text} ${url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsAppShare = () => {
    void handleShare();
  };

  async function generateCertificatePNG(): Promise<Blob | null> {
    const [portraitDataUrl, bgDataUrl] = await Promise.all([imageToDataUrl(portrait), imageToDataUrl(heroBg)]);
    const svgData = buildCertificateSVG(portraitDataUrl, bgDataUrl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1200;
          canvas.height = 850;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.fillStyle = '#0a0508';
          ctx.fillRect(0, 0, 1200, 850);
          try {
            ctx.drawImage(img, 0, 0, 1200, 850);
          } catch {
            resolve(null);
            return;
          }
          try {
            canvas.toBlob((b) => resolve(b), 'image/png');
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
      return blob;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const handleDownload = async () => {
    const [portraitDataUrl, bgDataUrl] = await Promise.all([imageToDataUrl(portrait), imageToDataUrl(heroBg)]);
    const svgData = buildCertificateSVG(portraitDataUrl, bgDataUrl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 850;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return; }
      ctx.fillStyle = '#0a0508';
      ctx.fillRect(0, 0, 1200, 850);
      try {
        ctx.drawImage(img, 0, 0, 1200, 850);
      } catch {
        URL.revokeObjectURL(url);
        downloadSVGDirectly(svgData);
        return;
      }
      try {
        canvas.toBlob((blob) => {
          if (!blob) { downloadSVGDirectly(svgData); return; }
          const dlUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = dlUrl;
          a.download = `katana-certificate-${userName.replace(/\s+/g, '-').toLowerCase()}.png`;
          a.click();
          URL.revokeObjectURL(dlUrl);
        });
      } catch {
        downloadSVGDirectly(svgData);
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      downloadSVGDirectly(svgData);
    };
    img.src = url;
  };

  function downloadSVGDirectly(svgData: string) {
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `katana-certificate-${userName.replace(/\s+/g, '-').toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(dlUrl);
  }

  async function imageToDataUrl(source: string): Promise<string> {
    if (!source) return '';
    try {
      const response = await fetch(source, { mode: 'cors', cache: 'force-cache' });
      if (!response.ok) return '';
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  }

  function buildCertificateSVG(portraitDataUrl = '', bgDataUrl = ''): string {
    if (!selectedRole) return '';
    const accent = isGold ? '#d4af37' : '#c8102e';
    const accentRgb = isGold ? '212,175,55' : '200,16,46';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0508;stop-opacity:0.98"/>
          <stop offset="50%" style="stop-color:#0f0a0d;stop-opacity:0.99"/>
          <stop offset="100%" style="stop-color:#0a0508;stop-opacity:0.98"/>
        </linearGradient>
        <radialGradient id="glowGrad" cx="50%" cy="30%" r="60%">
          <stop offset="0%" style="stop-color:rgba(${accentRgb},0.04)"/>
          <stop offset="100%" style="stop-color:rgba(${accentRgb},0)"/>
        </radialGradient>
        <pattern id="grain" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="transparent"/>
          <circle cx="1" cy="1" r="0.3" fill="${accent}" opacity="0.03"/>
        </pattern>
        <clipPath id="stampClip"><circle cx="1090" cy="85" r="28"/></clipPath>
      </defs>
      <rect width="1200" height="850" fill="url(#bgGrad)"/>
      ${bgDataUrl ? `<image href="${escapeXml(bgDataUrl)}" x="0" y="0" width="1200" height="850" preserveAspectRatio="xMidYMid slice" opacity="0.12"/>` : ''}
      <rect width="1200" height="850" fill="url(#grain)" opacity="0.25"/>
      <rect width="1200" height="850" fill="url(#glowGrad)"/>

      <rect x="18" y="18" width="1164" height="814" fill="none" stroke="${accent}" stroke-width="3" opacity="0.4" rx="2"/>
      <rect x="36" y="36" width="1128" height="778" fill="none" stroke="${accent}" stroke-width="1" opacity="0.2" rx="1"/>

      <g transform="rotate(-8 1090 85)">
        <circle cx="1090" cy="85" r="30" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>
        ${portraitDataUrl ? `<image href="${escapeXml(portraitDataUrl)}" x="1062" y="57" width="56" height="56" clip-path="url(#stampClip)" preserveAspectRatio="xMidYMid slice" opacity="0.8"/>` : `<circle cx="1090" cy="85" r="28" fill="${accent}" opacity="0.12"/>`}
        <rect x="1073" y="117" width="34" height="12" fill="${accent}" opacity="0.2" rx="1"/>
        <text x="1090" y="127" text-anchor="middle" font-family="serif" font-size="7" fill="${accent}" letter-spacing="1" opacity="0.8">OFFICIAL</text>
      </g>

      <g transform="translate(600 100)">
        <g stroke="${accent}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
          <path d="M -82 -12 L -60 10 M -60 -12 L -82 10"/>
          <path d="M -76 -6 L -84 -14 M -68 2 L -60 10 M -68 -6 L -60 -14 M -76 2 L -84 10"/>
        </g>
        <text x="15" y="4" text-anchor="middle" font-family="serif" font-size="15" fill="#e8e2d5" font-weight="bold" letter-spacing="6" opacity="0.9">KPHB KATANA GANG</text>
      </g>
      <line x1="480" y1="118" x2="720" y2="118" stroke="${accent}" stroke-width="1" opacity="0.3"/>

      <text x="600" y="165" text-anchor="middle" font-family="serif" font-size="14" fill="#9b9588" letter-spacing="4" opacity="0.6">THIS IS TO CERTIFY THAT</text>
      <text x="600" y="205" text-anchor="middle" font-family="serif" font-size="32" fill="#e8e2d5" font-weight="bold" letter-spacing="3">CERTIFICATE OF MEMBERSHIP</text>

      <text x="600" y="280" text-anchor="middle" font-family="serif" font-size="46" fill="#e8e2d5" font-weight="bold">${escapeXml(userName)}</text>
      <line x1="380" y1="300" x2="820" y2="300" stroke="${accent}" stroke-width="1" opacity="0.3"/>
      <text x="600" y="325" text-anchor="middle" font-family="serif" font-size="15" fill="#9b9588" opacity="0.5">is</text>

      <text x="600" y="365" text-anchor="middle" font-family="serif" font-size="14" fill="#9b9588" letter-spacing="3" opacity="0.6">AN OFFICIAL MEMBER OF</text>
      <text x="600" y="395" text-anchor="middle" font-family="serif" font-size="29" fill="${accent}" font-weight="bold" letter-spacing="2">KPHB KATANA GANG</text>
      <text x="600" y="422" text-anchor="middle" font-family="serif" font-size="16" fill="#9b9588" font-style="italic" opacity="0.5">aka Aditya urf Katana</text>

      <g transform="translate(553 455)" opacity="0.7">
        <path d="M -9 -5 L 9 5 M 9 -5 L -9 5 M -2 -9 L 2 9" stroke="${accent}" stroke-width="1.4" fill="none"/>
      </g>
      <text x="600" y="460" text-anchor="middle" font-family="serif" font-size="15" fill="#b8b2a5" letter-spacing="2" opacity="0.7">${escapeXml(selectedRole.roleTitle)}</text>

      <circle cx="555" cy="510" r="4" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.5"/>
      <path d="M 552 510 L 554 512 L 558 508" stroke="${accent}" stroke-width="1.5" fill="none" opacity="0.5"/>
      <text x="572" y="515" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9b9588" letter-spacing="3" opacity="0.6">MEMBER CODE</text>
      <text x="600" y="545" text-anchor="middle" font-family="monospace" font-size="23" fill="#e8e2d5" font-weight="bold" letter-spacing="2">${memberCode}</text>

      <text x="600" y="585" text-anchor="middle" font-family="serif" font-size="12" fill="#6b6560" font-style="italic" opacity="0.4">Mamalne evadra appedhi igaa, padhandi chusukundham</text>

      <text x="220" y="770" text-anchor="start" font-family="sans-serif" font-size="12" fill="#9b9588" letter-spacing="2" opacity="0.6">DATE OF ISSUE</text>
      <line x1="220" y1="785" x2="460" y2="785" stroke="${accent}" stroke-width="1" opacity="0.2"/>
      <text x="220" y="810" text-anchor="start" font-family="serif" font-size="14" fill="#e8e2d5">${escapeXml(dateTime)}</text>

      <text x="980" y="770" text-anchor="end" font-family="sans-serif" font-size="12" fill="#9b9588" letter-spacing="2" opacity="0.6">AUTHORIZED BY</text>
      <line x1="740" y1="785" x2="980" y2="785" stroke="${accent}" stroke-width="1" opacity="0.2"/>
      <text x="980" y="810" text-anchor="end" font-family="serif" font-size="14" fill="#e8e2d5" font-style="italic">Aditya urf Katana</text>
    </svg>`;
  }

  const view: 'select' | 'ritual' | 'cert' = cardGenerated ? 'cert' : ritualStep >= 0 ? 'ritual' : 'select';

  return (
    <section
      id="sidekick"
      className="relative py-24 px-4 bg-gradient-to-b from-katana-black via-katana-coal to-katana-black overflow-hidden"
    >
      <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />
      <Particles count={20} color="rgba(212,175,55,0.25)" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <ScrollReveal>
          <p className="text-center font-cinematic text-katana-gold/60 text-sm tracking-[0.4em] uppercase mb-2">
            {subheading}
          </p>
          <h2 className="text-center font-display font-700 text-katana-bone text-3xl sm:text-4xl md:text-6xl tracking-[0.05em] text-glow-crimson">
            {heading}
          </h2>
        </ScrollReveal>

        <SectionDivider label="Join the Gang" />

        <AnimatePresence mode="wait">
          {/* ── VIEW: Role selection + name input ── */}
          {view === 'select' && (
            <motion.div
              key="view-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {roles.map((role, i) => {
                  const goldCard = role.cardColor === 'gold';
                  return (
                    <ScrollReveal key={role.roleName + i} delay={i * 0.1}>
                      <motion.button
                        whileHover={{ y: -8, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedRole(role)}
                        className={`w-full h-full min-h-[200px] text-left katana-border rounded-sm p-5 bg-katana-coal/50 backdrop-blur-sm transition-all relative overflow-hidden flex flex-col ${
                          selectedRole?.roleName === role.roleName
                            ? goldCard ? 'border-katana-gold/60 bg-katana-gold/5' : 'border-katana-crimson/60 bg-katana-crimson/5'
                            : ''
                        }`}
                      >
                        {selectedRole?.roleName === role.roleName && (
                          <motion.div
                            layoutId="selected-glow"
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                              background: goldCard
                                ? 'radial-gradient(circle at 50% 0%, rgba(212,175,55,0.12), transparent 70%)'
                                : 'radial-gradient(circle at 50% 0%, rgba(200,16,46,0.12), transparent 70%)',
                            }}
                          />
                        )}
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 + 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                          className={`w-12 h-12 rounded-sm flex items-center justify-center mb-3 ${
                            goldCard ? 'bg-katana-gold/10 border border-katana-gold/30' : 'bg-katana-crimson/10 border border-katana-crimson/30'
                          }`}
                        >
                          <DynamicIcon name={role.icon} className={`w-5 h-5 ${goldCard ? 'text-katana-gold' : 'text-katana-crimson'}`} />
                        </motion.div>
                        <p className="font-display font-600 text-katana-bone text-base mb-1">{role.roleName}</p>
                        <p className="font-body text-katana-silver/50 text-xs leading-relaxed flex-1">{role.description}</p>
                      </motion.button>
                    </ScrollReveal>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedRole && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 max-w-md mx-auto text-center"
                  >
                    <p className="font-cinematic text-katana-silver/70 text-sm mb-4">
                      You chose <span className={isGold ? 'text-katana-gold' : 'text-katana-crimson'}>{selectedRole.roleName}</span>. Enter your name, miya:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStartRitual()}
                        placeholder="Your name..."
                        maxLength={30}
                        className="flex-1 px-4 py-3 bg-katana-ash/40 border border-katana-silver/15 rounded-sm text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none text-center"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartRitual}
                        disabled={!userName.trim() || generating}
                        className="px-6 py-3 bg-katana-crimson/20 border border-katana-crimson/40 text-katana-crimson rounded-sm font-display uppercase tracking-wider text-sm hover:bg-katana-crimson/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        <Swords className="w-4 h-4" /> Begin Initiation
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          </AnimatePresence>

          {/* ── VIEW: Ritual overlay (full screen, exclusive) ── */}
          {view === 'ritual' && createPortal(
            <motion.div
              key="view-ritual"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[99999] isolate min-h-screen overflow-hidden bg-[#0a0508] flex items-center justify-center p-4"
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, width: '100vw', height: '100dvh' }}
            >
              {/* Particle background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      background: isGold ? 'rgba(212,175,55,0.3)' : 'rgba(200,16,46,0.3)',
                    }}
                    animate={{ y: [0, -30, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  />
                ))}
              </div>

              <div className="relative z-10 max-h-full max-w-lg w-full overflow-y-auto text-center py-6">
                {/* Step progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-12">
                  {RITUAL_STEPS.map((step, i) => (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full transition-all duration-500 ${
                          i <= ritualStep
                            ? isGold ? 'bg-katana-gold scale-125' : 'bg-katana-crimson scale-125'
                            : 'bg-katana-silver/20'
                        }`}
                      />
                      {i < RITUAL_STEPS.length - 1 && (
                        <div className={`w-8 h-px ${i < ritualStep ? (isGold ? 'bg-katana-gold/50' : 'bg-katana-crimson/50') : 'bg-katana-silver/10'}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Ritual steps — only one visible at a time */}
                <AnimatePresence mode="wait">
                  {ritualStep === 0 && (
                    <motion.div
                      key="step-oath"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <ScrollText className={`w-16 h-16 mx-auto mb-6 ${isGold ? 'text-katana-gold/60' : 'text-katana-crimson/60'}`} />
                      <h3 className="font-display font-700 text-katana-bone text-3xl mb-3 tracking-wide">Take the Oath</h3>
                      <p className="font-cinematic text-katana-silver/40 text-xs uppercase tracking-widest mb-6">
                        Repeat after the Darbar
                      </p>
                      <div className="space-y-3 mb-8 min-h-[180px] flex flex-col justify-center">
                        {OATH_LINES.map((line, i) => (
                          <motion.p
                            key={i}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: i <= ritualOathIndex ? 1 : 0.15, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`font-cinematic text-sm transition-all duration-500 ${
                              i === ritualOathIndex
                                ? isGold ? 'text-katana-gold' : 'text-katana-crimson'
                                : i < ritualOathIndex
                                  ? 'text-katana-silver/50'
                                  : 'text-katana-silver/15'
                            }`}
                          >
                            {i === ritualOathIndex && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${isGold ? 'bg-katana-gold' : 'bg-katana-crimson'}`}
                              />
                            )}
                            "{line}"
                          </motion.p>
                        ))}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRitualAdvance}
                        className={`px-8 py-3 ${isGold ? 'bg-katana-gold/15 border-katana-gold/50 text-katana-gold' : 'bg-katana-crimson/15 border-katana-crimson/50 text-katana-crimson'} border rounded-sm font-display uppercase tracking-wider text-sm hover:bg-opacity-30 transition-all`}
                      >
                        {ritualOathIndex < OATH_LINES.length - 1 ? 'Next Line' : 'Seal the Oath'} <ChevronRight className="w-4 h-4 inline" />
                      </motion.button>
                    </motion.div>
                  )}

                  {ritualStep === 1 && (
                    <motion.div
                      key="step-seal"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-8 relative ${
                          isGold ? 'bg-katana-gold/10 border-2 border-katana-gold/50' : 'bg-katana-crimson/10 border-2 border-katana-crimson/50'
                        }`}
                      >
                        <Eye className={`w-12 h-12 ${isGold ? 'text-katana-gold' : 'text-katana-crimson'}`} />
                        <motion.div
                          className={`absolute inset-0 rounded-full border-2 ${isGold ? 'border-katana-gold/30' : 'border-katana-crimson/30'}`}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <h3 className="font-display font-700 text-katana-bone text-3xl mb-3 tracking-wide">The Seal</h3>
                      <p className="font-cinematic text-katana-silver/50 text-sm mb-2">
                        The Darbar has witnessed your initiation
                      </p>
                      <p className="font-body text-katana-silver/30 text-xs mb-8">
                        {userName}, you are about to become {isGold ? 'gold' : 'crimson'}-blooded
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRitualAdvance}
                        disabled={generating}
                        className={`px-8 py-3 ${isGold ? 'bg-katana-gold/15 border-katana-gold/50 text-katana-gold' : 'bg-katana-crimson/15 border-katana-crimson/50 text-katana-crimson'} border rounded-sm font-display uppercase tracking-wider text-sm hover:bg-opacity-30 transition-all disabled:opacity-50`}
                      >
                        {generating ? (
                          <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin inline mr-2" /> Forging...</>
                        ) : (
                          <>Claim Your Certificate <Sparkles className="w-4 h-4 inline" /></>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>,
            document.body,
          )}

          <AnimatePresence mode="wait">
            {/* ── VIEW: Certificate ── */}
            {view === 'cert' && selectedRole && (
            <motion.div
              key="view-cert"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 mx-auto"
              style={{ maxWidth: '800px', width: '100%' }}
            >
              {/* Certificate card */}
              <div
                ref={certRef}
                className={`relative w-full overflow-hidden rounded-sm ${isGold ? 'katana-border-glow' : 'katana-border'}`}
                style={{
                  background: `linear-gradient(135deg, rgba(10,5,8,0.98) 0%, rgba(15,10,13,0.99) 50%, rgba(10,5,8,0.98) 100%)`,
                  aspectRatio: '1200 / 850',
                }}
              >
                {/* Hero background image */}
                {heroBg && (
                  <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.12] pointer-events-none" />
                )}
                {/* Background pattern */}
                <div className="absolute inset-0 bg-grain opacity-25 pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: `radial-gradient(circle at 50% 30%, ${isGold ? 'rgba(212,175,55,0.04)' : 'rgba(200,16,46,0.04)'} 0%, transparent 60%)`,
                }} />

                {/* Border frame */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={revealStep >= 1 ? { scale: 1, opacity: 1 } : {}}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-[1.5%] border-2 rounded-sm pointer-events-none"
                  style={{ borderColor: isGold ? 'rgba(212,175,55,0.4)' : 'rgba(200,16,46,0.4)' }}
                >
                  <div className="absolute inset-[1.5%] border rounded-sm" style={{ borderColor: isGold ? 'rgba(212,175,55,0.2)' : 'rgba(200,16,46,0.2)' }} />
                </motion.div>

                {/* Portrait stamp in corner */}
                <motion.div
                  initial={{ scale: 0, rotate: -30, opacity: 0 }}
                  animate={revealStep >= 2 ? { scale: 1, rotate: -8, opacity: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="absolute top-[4%] right-[4%] z-20"
                >
                  <div className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 ${
                    isGold ? 'border-katana-gold/50' : 'border-katana-crimson/50'
                  } shadow-lg`}>
                    <img
                      src={portrait}
                      alt="Katana stamp"
                      className="w-full h-full object-cover grayscale opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-katana-black/40 to-transparent" />
                  </div>
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-sm text-[9px] sm:text-[8px] font-display uppercase tracking-wider ${
                    isGold ? 'bg-katana-gold/20 text-katana-gold' : 'bg-katana-crimson/20 text-katana-crimson'
                  } whitespace-nowrap`}>
                    Official
                  </div>
                </motion.div>

                {/* Content — all in normal flex flow, no absolute positioning */}
                <div
                  className="relative z-10 h-full flex flex-col items-center justify-center px-[6%] py-[5%] text-center"
                  style={{
                    width: `${100 / certScale}%`,
                    marginLeft: `${(100 - 100 / certScale) / 2}%`,
                    transform: `scale(${certScale})`,
                  }}
                >
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={revealStep >= 1 ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center gap-2 mb-1"
                  >
                    <Swords className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isGold ? 'text-katana-gold' : 'text-katana-crimson'}`} />
                    <span className="font-display font-700 text-katana-bone text-[8px] sm:text-[10px] md:text-xs uppercase tracking-[0.3em]">
                      KPHB Katana Gang
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={revealStep >= 1 ? { opacity: 1, scaleX: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className={`h-px w-20 sm:w-24 md:w-32 mb-2 sm:mb-3 ${isGold ? 'bg-katana-gold/30' : 'bg-katana-crimson/30'}`}
                  />

                  {/* Certificate title */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={revealStep >= 2 ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="font-cinematic text-katana-silver/75 text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider mb-1">This is to certify that</p>
                    <p className="font-display font-700 text-katana-bone text-sm sm:text-lg md:text-2xl tracking-[0.04em]">
                      CERTIFICATE OF MEMBERSHIP
                    </p>
                  </motion.div>

                  {/* Member name */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={revealStep >= 3 ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-2 sm:mt-3"
                  >
                    <p className="font-display font-700 text-katana-bone text-sm sm:text-xl md:text-3xl break-words px-2">{userName}</p>
                    <div className={`h-px w-32 sm:w-48 md:w-64 mx-auto mt-2 ${isGold ? 'bg-katana-gold/30' : 'bg-katana-crimson/30'}`} />
                    <p className="font-cinematic text-katana-silver/75 text-[10px] sm:text-[11px] md:text-sm mt-1">is</p>
                  </motion.div>

                  {/* Official member of */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={revealStep >= 4 ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-2 sm:mt-3"
                  >
                    <p className="font-body text-katana-silver/75 text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider mb-1">an official member of</p>
                    <p className={`font-display font-600 text-xs sm:text-base md:text-xl ${isGold ? 'text-katana-gold' : 'text-katana-crimson'}`}>
                      KPHB KATANA GANG
                    </p>
                    <p className="font-cinematic italic text-katana-silver/75 text-[10px] sm:text-[11px] md:text-sm mt-1">
                      aka Aditya urf Katana
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <DynamicIcon name={selectedRole.icon} className={`w-3 h-3 sm:w-4 sm:h-4 ${isGold ? 'text-katana-gold' : 'text-katana-crimson'}`} />
                      <span className="font-display text-katana-silver/85 text-[10px] sm:text-[10px] md:text-xs uppercase tracking-widest">
                        {selectedRole.roleTitle}
                      </span>
                    </div>
                  </motion.div>

                  {/* Member code */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={revealStep >= 5 ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="mt-3 sm:mt-4"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <BadgeCheck className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isGold ? 'text-katana-gold/60' : 'text-katana-crimson/60'}`} />
                      <p className="font-body text-katana-silver/80 text-[10px] sm:text-[9px] md:text-[10px] uppercase tracking-wider">Member Code</p>
                    </div>
                    <motion.p
                      className="font-display text-katana-bone text-[9px] sm:text-[10px] md:text-sm tracking-wider tabular-nums break-all px-2"
                      animate={{ textShadow: isGold
                        ? ['0 0 6px rgba(212,175,55,0.2)', '0 0 12px rgba(212,175,55,0.4)', '0 0 6px rgba(212,175,55,0.2)']
                        : ['0 0 6px rgba(200,16,46,0.2)', '0 0 12px rgba(200,16,46,0.4)', '0 0 6px rgba(200,16,46,0.2)']
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      {memberCode}
                    </motion.p>
                  </motion.div>

                  {/* Small text */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={revealStep >= 5 ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-2 font-cinematic italic text-katana-silver/60 text-[7px] sm:text-[8px] md:text-[10px]"
                  >
                    Mamalne evadra appedhi igaa, padhandi chusukundham
                  </motion.p>

                  {/* Footer: date + signature */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={revealStep >= 5 ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-1 sm:mt-2 w-full flex justify-between items-end px-[2%]"
                  >
                    <div className="text-left">
                      <p className="font-body text-katana-silver/80 text-[10px] sm:text-[9px] md:text-[10px] uppercase tracking-wider">Date of Issue</p>
                      <div className={`h-px w-16 sm:w-28 md:w-36 mt-1 ${isGold ? 'bg-katana-gold/20' : 'bg-katana-crimson/20'}`} />
                      <p className="font-display text-katana-bone text-[10px] sm:text-[10px] md:text-xs mt-1">{dateTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-katana-silver/80 text-[10px] sm:text-[9px] md:text-[10px] uppercase tracking-wider">Authorized by</p>
                      <div className={`h-px w-16 sm:w-28 md:w-36 mt-1 ${isGold ? 'bg-katana-gold/20' : 'bg-katana-crimson/20'}`} />
                      <p className="font-cinematic italic text-katana-bone text-[10px] sm:text-[10px] md:text-xs mt-1">Aditya urf Katana</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={revealStep >= 5 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex flex-wrap justify-center gap-3 mt-5"
              >
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 font-display uppercase tracking-wider text-sm text-katana-bone border border-katana-gold/30 bg-katana-gold/10 hover:bg-katana-gold/20 transition-all rounded-sm"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-5 py-2.5 font-display uppercase tracking-wider text-sm text-katana-bone border border-katana-silver/20 hover:border-katana-crimson/50 hover:text-katana-crimson transition-all rounded-sm"
                >
                  {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share</>}
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center gap-2 px-5 py-2.5 font-display uppercase tracking-wider text-sm text-katana-bone border border-katana-silver/20 hover:border-katana-crimson/50 hover:text-katana-crimson transition-all rounded-sm"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-5 py-2.5 font-display uppercase tracking-wider text-sm text-katana-bone border border-katana-silver/20 hover:border-katana-crimson/50 hover:text-katana-crimson transition-all rounded-sm"
                >
                  <Instagram className="w-4 h-4" /> Instagram
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 py-2.5 font-display uppercase tracking-wider text-sm text-katana-silver/40 hover:text-katana-crimson border border-katana-silver/10 hover:border-katana-crimson/30 transition-all rounded-sm"
                >
                  New Member
                </button>
              </motion.div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
  );
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
