import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  LogOut, Image as ImageIcon, Music, Settings, MessageSquare, Users,
  MapPin, Mic, Swords, Home, Loader2, BarChart3, IdCard, Rocket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---- Lazy-loaded editor groups ----
const HeroEditor = lazy(() => import('@/components/admin/editors-content').then(m => ({ default: m.HeroEditor })));
const LegendEditor = lazy(() => import('@/components/admin/editors-content').then(m => ({ default: m.LegendEditor })));
const AnthemEditor = lazy(() => import('@/components/admin/editors-content').then(m => ({ default: m.AnthemEditor })));
const DialoguesEditor = lazy(() => import('@/components/admin/editors-content').then(m => ({ default: m.DialoguesEditor })));
const LyricsEditor = lazy(() => import('@/components/admin/editors-content').then(m => ({ default: m.LyricsEditor })));
const OriginEditor = lazy(() => import('@/components/admin/editors-content').then(m => ({ default: m.OriginEditor })));

const DarbarEditor = lazy(() => import('@/components/admin/editors-members').then(m => ({ default: m.DarbarEditor })));
const SidekickEditor = lazy(() => import('@/components/admin/editors-members').then(m => ({ default: m.SidekickEditor })));
const GalleryEditor = lazy(() => import('@/components/admin/editors-members').then(m => ({ default: m.GalleryEditor })));

const LaunchEditor = lazy(() => import('@/components/admin/editors-misc').then(m => ({ default: m.LaunchEditor })));
const CharStatsEditor = lazy(() => import('@/components/admin/editors-misc').then(m => ({ default: m.CharStatsEditor })));
const HyderabadEditor = lazy(() => import('@/components/admin/editors-misc').then(m => ({ default: m.HyderabadEditor })));
const SiteTextEditor = lazy(() => import('@/components/admin/editors-misc').then(m => ({ default: m.SiteTextEditor })));

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'launch', label: 'Launch Control', icon: Rocket },
  { id: 'hero', label: 'Hero Section', icon: Home },
  { id: 'legend', label: 'The Legend', icon: Swords },
  { id: 'anthem', label: 'Anthem', icon: Music },
  { id: 'stats', label: 'Char Stats', icon: BarChart3 },
  { id: 'dialogues', label: 'Dialogues', icon: MessageSquare },
  { id: 'lyrics', label: 'Song Lyrics', icon: Mic },
  { id: 'origin', label: 'Origin Story', icon: MapPin },
  { id: 'darbar', label: 'Darbar', icon: Users },
  { id: 'sidekick', label: 'Gang Members', icon: IdCard },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'hyderabad', label: 'Hyderabad', icon: MapPin },
  { id: 'settings', label: 'Site Text', icon: Settings },
];

function EditorLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <Swords className="w-7 h-7 text-katana-crimson" />
      </motion.div>
    </div>
  );
}

export function AdminApp() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('launch');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeTabInfo = TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-katana-black text-katana-bone flex flex-col md:flex-row relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-katana-crimson/3 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-katana-gold/3 rounded-full blur-[100px]" />
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2.5 bg-katana-coal/80 backdrop-blur-md border border-katana-crimson/20 rounded text-katana-bone"
      >
        <motion.div animate={{ rotate: sidebarOpen ? 90 : 0 }}>
          <Swords className="w-5 h-5 text-katana-crimson" />
        </motion.div>
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-[55] bg-katana-black/80 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ x: sidebarOpen ? 0 : undefined }}
        className={`md:w-64 bg-gradient-to-b from-katana-coal to-katana-black border-r border-katana-crimson/20 md:min-h-screen flex-shrink-0 md:sticky md:top-0 md:h-screen relative z-[56] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } transition-transform duration-300 fixed inset-y-0 left-0 w-64 md:relative`}
      >
        {/* Header */}
        <div className="p-4 border-b border-katana-crimson/20 relative overflow-hidden">
          <motion.div
            className="absolute -inset-x-full -top-1/2 h-full bg-gradient-to-r from-transparent via-katana-crimson/5 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <div className="flex items-center gap-2 relative">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-9 h-9 rounded-sm bg-katana-crimson/10 border border-katana-crimson/30 flex items-center justify-center flex-shrink-0"
            >
              <Swords className="w-5 h-5 text-katana-crimson" />
            </motion.div>
            <div>
              <h1 className="font-display font-700 text-katana-crimson text-base tracking-[0.1em] leading-tight">
                KATANA ADMIN
              </h1>
              <p className="text-katana-silver/30 text-[10px] font-cinematic">Control panel, miya</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto md:flex-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                whileHover={{ x: 2 }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-body transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'bg-gradient-to-r from-katana-crimson/15 to-transparent text-katana-crimson border-l-2 border-katana-crimson'
                    : 'text-katana-silver/50 hover:text-katana-bone hover:bg-katana-ash/20 border-l-2 border-transparent'
                }`}
              >
                <tab.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-katana-crimson' : ''}`} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full bg-katana-crimson"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-katana-crimson/10 space-y-1">
          <motion.button
            onClick={signOut}
            whileHover={{ x: 2 }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-katana-silver/50 hover:text-katana-crimson transition-colors w-full rounded whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" /> Sign Out
          </motion.button>
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-katana-silver/50 hover:text-katana-crimson transition-colors rounded whitespace-nowrap"
          >
            <Home className="w-4 h-4 flex-shrink-0" /> View Site
          </a>
        </div>
      </motion.aside>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden relative z-10">
        {/* Content header */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto mb-6 flex items-center gap-3"
        >
          {activeTabInfo && (
            <div className="w-10 h-10 rounded-sm bg-katana-crimson/10 border border-katana-crimson/30 flex items-center justify-center flex-shrink-0">
              <activeTabInfo.icon className="w-5 h-5 text-katana-crimson" />
            </div>
          )}
          <div>
            <h1 className="font-display font-600 text-xl text-katana-bone tracking-wide">
              {activeTabInfo?.label}
            </h1>
            <p className="text-katana-silver/30 text-xs font-cinematic">Katana Control Panel</p>
          </div>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Suspense fallback={<EditorLoader />}>
            {activeTab === 'launch' && <LaunchEditor />}
            {activeTab === 'hero' && <HeroEditor />}
            {activeTab === 'legend' && <LegendEditor />}
            {activeTab === 'anthem' && <AnthemEditor />}
            {activeTab === 'stats' && <CharStatsEditor />}
            {activeTab === 'dialogues' && <DialoguesEditor />}
            {activeTab === 'lyrics' && <LyricsEditor />}
            {activeTab === 'origin' && <OriginEditor />}
            {activeTab === 'darbar' && <DarbarEditor />}
            {activeTab === 'sidekick' && <SidekickEditor />}
            {activeTab === 'gallery' && <GalleryEditor />}
            {activeTab === 'hyderabad' && <HyderabadEditor />}
            {activeTab === 'settings' && <SiteTextEditor />}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
