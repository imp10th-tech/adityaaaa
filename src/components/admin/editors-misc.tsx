import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminDynamicIcon } from '@/components/AdminDynamicIcon';
import { Loader2, Plus, Trash2, Save, X, Calendar, Rocket } from 'lucide-react';
import {
  useSettings, useListEditor, SectionTitle, TextField, TextArea,
  ImageUploadField, SaveButton,
} from '@/components/admin/shared';

// ---- Hyderabad Editor ----
export function HyderabadEditor() {
  const { settings, update, save, saving, saveError, loaded } = useSettings('hyderabad');

  if (!loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Hyderabad" subtitle="Territory section" />
      <TextField label="Heading Top" value={settings.hyderabad_heading_top ?? ''} onChange={(v) => update('hyderabad_heading_top', v)} />
      <TextField label="Heading Main" value={settings.hyderabad_heading_main ?? ''} onChange={(v) => update('hyderabad_heading_main', v)} />
      <TextField label="Tagline" value={settings.hyderabad_tagline ?? ''} onChange={(v) => update('hyderabad_tagline', v)} />
      <ImageUploadField label="Background Image" value={settings.hyderabad_bg_image ?? ''} onChange={(v) => update('hyderabad_bg_image', v)} />
      <SaveButton onSave={save} saving={saving} error={saveError} />
    </div>
  );
}

// ---- Launch Control Editor ----
export function LaunchEditor() {
  const { settings, update, save, saving, saveError, loaded } = useSettings('launch');

  if (!loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  const launchDateStr = settings.launch_date ?? '';
  const isActive = launchDateStr && new Date(launchDateStr).getTime() > Date.now();

  const clearLaunch = async () => {
    update('launch_date', '');
    await supabase.from('site_settings').delete().eq('key', 'launch_date');
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <SectionTitle title="Launch Control" subtitle="Set a countdown timer. The site will show 'Coming Soon' until the launch time, then automatically switch to the full site." />

      {/* Status badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body ${
        isActive
          ? 'bg-katana-gold/10 border border-katana-gold/30 text-katana-gold'
          : 'bg-katana-silver/10 border border-katana-silver/20 text-katana-silver/50'
      }`}>
        <Rocket className="w-4 h-4" />
        {isActive ? 'Countdown Active' : 'No Active Countdown'}
      </div>

      {/* Launch date/time picker */}
      <div className="katana-border rounded-sm p-5 bg-katana-coal/40">
        <label className="block text-xs uppercase tracking-wider text-katana-gold/60 mb-2">Launch Date & Time</label>
        <input
          type="datetime-local"
          value={launchDateStr ? launchDateStr.slice(0, 16) : ''}
          onChange={(e) => update('launch_date', e.target.value)}
          className="w-full px-4 py-3 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none"
        />
        <p className="text-katana-silver/30 text-xs mt-2">
          Pick the exact date and time when the website should go live. Visitors will see a countdown timer until then.
        </p>
      </div>

      {/* Countdown text customization */}
      <TextField label="Countdown Title" value={settings.launch_title ?? ''} onChange={(v) => update('launch_title', v)} placeholder="KPHB KATANA" />
      <TextField label="Countdown Subtitle" value={settings.launch_subtitle ?? ''} onChange={(v) => update('launch_subtitle', v)} placeholder="The Legend is Coming Soon..." />
      <TextArea label="Countdown Message" value={settings.launch_message ?? ''} onChange={(v) => update('launch_message', v)} placeholder="Arey miya, Katana aa raha hai..." />

      <div className="flex gap-3 items-center">
        <SaveButton onSave={save} saving={saving} error={saveError} />
        {isActive && (
          <button
            onClick={clearLaunch}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-katana-silver/50 hover:text-katana-crimson border border-katana-silver/15 hover:border-katana-crimson/30 rounded transition-all"
          >
            <X className="w-4 h-4" /> Remove Countdown
          </button>
        )}
      </div>

      {isActive && (
        <div className="katana-border rounded-sm p-4 bg-katana-crimson/5 border-katana-crimson/20">
          <p className="text-katana-crimson/80 text-sm font-body">
            <Calendar className="w-4 h-4 inline mr-2" />
            Site will launch on {new Date(launchDateStr).toLocaleString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
}

// ---- Site Text Editor (footer, nav, misc) ----
export function SiteTextEditor() {
  const { settings, update, save, saving, saveError, setSavingManually, loaded } = useSettings('footer');

  // Also load nav category
  const [navBrand, setNavBrand] = useState('');
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'nav_brand').maybeSingle().then(({ data }) => {
      if (data) setNavBrand(data.value);
    });
  }, []);

  const saveAll = async () => {
    setSavingManually(true);
    await save();
    await supabase.from('site_settings').upsert({ key: 'nav_brand', value: navBrand, category: 'nav' }, { onConflict: 'key' });
    setSavingManually(false);
  };

  if (!loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Site Text" subtitle="Footer, navigation, and misc" />
      <TextField label="Nav Brand" value={navBrand} onChange={setNavBrand} />
      <TextArea label="Footer Quote" value={settings.footer_quote ?? ''} onChange={(v) => update('footer_quote', v)} />
      <TextField label="Footer Text" value={settings.footer_text ?? ''} onChange={(v) => update('footer_text', v)} />
      <TextField label="Footer Copyright" value={settings.footer_copyright ?? ''} onChange={(v) => update('footer_copyright', v)} />
      <TextField label="Instagram Handle" value={settings.footer_instagram ?? ''} onChange={(v) => update('footer_instagram', v)} placeholder="@kphb.katana" />
      <ImageUploadField label="Favicon (browser tab icon)" value={settings.site_favicon ?? ''} onChange={(v) => update('site_favicon', v)} />
      <SaveButton onSave={saveAll} saving={saving} />
    </div>
  );
}

// ---- Character Stats Editor ----
export function CharStatsEditor() {
  const { settings, update, save, saving: settingsSaving, saveError, loaded: settingsLoaded } = useSettings('stats');
  const { rows, loaded, deleteRow, addRow } = useListEditor('character_stats');

  const [localRows, setLocalRows] = useState<any[]>([]);
  useEffect(() => { if (loaded) setLocalRows(rows); }, [rows, loaded]);

  if (!settingsLoaded || !loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  const updateLocal = (i: number, field: string, value: string | number) => {
    setLocalRows((prev) => { const c = [...prev]; c[i] = { ...c[i], [field]: value }; return c; });
  };

  const saveStat = async (i: number) => {
    const row = localRows[i];
    if (!row?.id) return;
    await supabase.from('character_stats').update({
      stat_name: row.stat_name, stat_value: Number(row.stat_value), stat_max: Number(row.stat_max), icon_key: row.icon_key,
    }).eq('id', row.id);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Character Stats" subtitle="Katana's RPG-style ability stats" />
      <TextField label="Section Heading" value={settings.stats_heading ?? ''} onChange={(v) => update('stats_heading', v)} />
      <TextField label="Subheading" value={settings.stats_subheading ?? ''} onChange={(v) => update('stats_subheading', v)} />
      <SaveButton onSave={save} saving={settingsSaving} error={saveError} />

      <div className="pt-4 space-y-3">
        <h3 className="text-sm uppercase tracking-wider text-katana-gold/60">Stats</h3>
        {localRows.map((row, i) => (
          <div key={row.id ?? i} className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center p-2 border border-katana-silver/10 rounded">
            <input value={row.stat_name ?? ''} onChange={(e) => updateLocal(i, 'stat_name', e.target.value)} placeholder="Stat Name"
              className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
            <input type="number" value={row.stat_value ?? 0} onChange={(e) => updateLocal(i, 'stat_value', e.target.value)} placeholder="Value"
              className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone w-20" />
            <input type="number" value={row.stat_max ?? 100} onChange={(e) => updateLocal(i, 'stat_max', e.target.value)} placeholder="Max"
              className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone w-20" />
            <div className="flex gap-1 items-center">
              <input value={row.icon_key ?? ''} onChange={(e) => updateLocal(i, 'icon_key', e.target.value)} placeholder="Icon"
                className="flex-1 px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
              <div className="flex-shrink-0 w-8 h-8 rounded bg-katana-ash/40 border border-katana-silver/15 flex items-center justify-center">
                <AdminDynamicIcon name={row.icon_key ?? ''} className="w-4 h-4 text-katana-crimson" />
              </div>
            </div>
            <div className="flex">
              <button onClick={() => saveStat(i)} className="p-1.5 text-katana-silver/60 hover:text-katana-crimson"><Save className="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteRow(i)} className="p-1.5 text-katana-silver/40 hover:text-katana-crimson"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow({ stat_name: 'New Stat', stat_value: 50, stat_max: 100, icon_key: 'Zap' })}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/15 rounded">
          <Plus className="w-4 h-4" /> Add Stat
        </button>
      </div>
    </div>
  );
}
