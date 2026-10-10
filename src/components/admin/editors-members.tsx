import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminDynamicIcon } from '@/components/AdminDynamicIcon';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import {
  useSettings, useListEditor, SectionTitle, TextField, SaveButton, ImageUploadInline,
} from '@/components/admin/shared';

// ---- Darbar Editor ----
export function DarbarEditor() {
  const { settings, update, save, saving: settingsSaving, saveError, loaded: settingsLoaded } = useSettings('darbar');
  const { rows, loaded, deleteRow, addRow } = useListEditor('darbar_members');

  const [localRows, setLocalRows] = useState<any[]>([]);
  useEffect(() => { if (loaded) setLocalRows(rows); }, [rows, loaded]);

  if (!settingsLoaded || !loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  const updateLocal = (i: number, field: string, value: string) => {
    setLocalRows((prev) => { const c = [...prev]; c[i] = { ...c[i], [field]: value }; return c; });
  };

  const saveMember = async (i: number) => {
    const row = localRows[i];
    if (!row?.id) return;
    await supabase.from('darbar_members').update({
      nickname: row.nickname, title: row.title, description: row.description, icon_key: row.icon_key, image_url: row.image_url,
    }).eq('id', row.id);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Darbar" subtitle="Friends section" />
      <TextField label="Section Heading" value={settings.darbar_heading ?? ''} onChange={(v) => update('darbar_heading', v)} />
      <SaveButton onSave={save} saving={settingsSaving} error={saveError} />

      <div className="pt-4 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-katana-gold/60">Members</h3>
        {localRows.map((row, i) => (
          <div key={row.id ?? i} className="space-y-2 p-3 border border-katana-silver/10 rounded">
            <div className="grid grid-cols-3 gap-2">
              <input value={row.nickname ?? ''} onChange={(e) => updateLocal(i, 'nickname', e.target.value)} placeholder="Nickname"
                className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
              <input value={row.title ?? ''} onChange={(e) => updateLocal(i, 'title', e.target.value)} placeholder="Title"
                className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
            <div className="flex gap-1 items-center">
              <input value={row.icon_key ?? ''} onChange={(e) => updateLocal(i, 'icon_key', e.target.value)} placeholder="Icon key"
                className="flex-1 px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
              <div className="flex-shrink-0 w-8 h-8 rounded bg-katana-ash/40 border border-katana-silver/15 flex items-center justify-center">
                <AdminDynamicIcon name={row.icon_key ?? ''} className="w-4 h-4 text-katana-crimson" />
              </div>
            </div>
            </div>
            <ImageUploadInline
              value={row.image_url ?? ''}
              onChange={(url) => { updateLocal(i, 'image_url', url); }}
            />
            <textarea value={row.description ?? ''} onChange={(e) => updateLocal(i, 'description', e.target.value)} placeholder="Description"
              className="w-full px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone resize-y" rows={2} />
            <MemberStatsEditor memberId={row.id} />
            <div className="flex gap-2">
              <button onClick={() => saveMember(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-katana-silver/60 hover:text-katana-crimson"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => deleteRow(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-katana-silver/40 hover:text-katana-crimson"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow({ nickname: 'New Bhai', title: 'New Role', description: 'Description...', icon_key: 'shield' })}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/15 rounded">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>
    </div>
  );
}

// ---- Gallery Editor ----
export function GalleryEditor() {
  const { settings, update, save, saving: settingsSaving, saveError, loaded: settingsLoaded } = useSettings('gallery');
  const { rows, loaded, deleteRow, addRow } = useListEditor('gallery_items');

  const [localRows, setLocalRows] = useState<any[]>([]);
  useEffect(() => { if (loaded) setLocalRows(rows); }, [rows, loaded]);

  if (!settingsLoaded || !loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  const updateLocal = (i: number, field: string, value: string) => {
    setLocalRows((prev) => { const c = [...prev]; c[i] = { ...c[i], [field]: value }; return c; });
  };

  const saveItem = async (i: number) => {
    const row = localRows[i];
    if (!row?.id) return;
    await supabase.from('gallery_items').update({ image_url: row.image_url, caption: row.caption }).eq('id', row.id);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Gallery" subtitle="Meme gallery images" />
      <TextField label="Heading Top" value={settings.gallery_heading_top ?? ''} onChange={(v) => update('gallery_heading_top', v)} />
      <TextField label="Heading Main" value={settings.gallery_heading_main ?? ''} onChange={(v) => update('gallery_heading_main', v)} />
      <SaveButton onSave={save} saving={settingsSaving} error={saveError} />

      <div className="pt-4 space-y-3">
        <h3 className="text-sm uppercase tracking-wider text-katana-gold/60">Images</h3>
        {localRows.map((row, i) => (
          <div key={row.id ?? i} className="space-y-2 p-3 border border-katana-silver/10 rounded">
            {row.image_url && <img src={row.image_url} alt="" className="h-20 rounded object-cover" />}
            <ImageUploadInline
              value={row.image_url ?? ''}
              onChange={(url) => { updateLocal(i, 'image_url', url); }}
            />
            <input value={row.caption ?? ''} onChange={(e) => updateLocal(i, 'caption', e.target.value)} placeholder="Caption"
              className="w-full px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
            <div className="flex gap-2">
              <button onClick={() => saveItem(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-katana-silver/60 hover:text-katana-crimson"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => deleteRow(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-katana-silver/40 hover:text-katana-crimson"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow({ image_url: '', caption: 'New caption...' })}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/15 rounded">
          <Plus className="w-4 h-4" /> Add Image
        </button>
      </div>
    </div>
  );
}

// ---- Sidekick Editor ----
export function SidekickEditor() {
  const { settings, update, save, saving: settingsSaving, saveError, loaded: settingsLoaded } = useSettings('sidekick');
  const { rows, loaded, deleteRow, addRow } = useListEditor('sidekick_roles');

  const [localRows, setLocalRows] = useState<any[]>([]);
  useEffect(() => { if (loaded) setLocalRows(rows); }, [rows, loaded]);

  if (!settingsLoaded || !loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  const updateLocal = (i: number, field: string, value: string) => {
    setLocalRows((prev) => { const c = [...prev]; c[i] = { ...c[i], [field]: value }; return c; });
  };

  const saveRole = async (i: number) => {
    const row = localRows[i];
    if (!row?.id) return;
    await supabase.from('sidekick_roles').update({
      role_name: row.role_name, role_title: row.role_title, description: row.description, icon_key: row.icon_key, card_color: row.card_color,
    }).eq('id', row.id);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Gang Members" subtitle="Crew membership roles" />
      <TextField label="Section Heading" value={settings.sidekick_heading ?? ''} onChange={(v) => update('sidekick_heading', v)} />
      <TextField label="Subheading" value={settings.sidekick_subheading ?? ''} onChange={(v) => update('sidekick_subheading', v)} />
      <SaveButton onSave={save} saving={settingsSaving} error={saveError} />

      <div className="pt-4 space-y-3">
        <h3 className="text-sm uppercase tracking-wider text-katana-gold/60">Roles</h3>
        {localRows.map((row, i) => (
          <div key={row.id ?? i} className="space-y-2 p-3 border border-katana-silver/10 rounded">
            <input value={row.role_name ?? ''} onChange={(e) => updateLocal(i, 'role_name', e.target.value)} placeholder="Role Name"
              className="w-full px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
            <input value={row.role_title ?? ''} onChange={(e) => updateLocal(i, 'role_title', e.target.value)} placeholder="Role Title (on card)"
              className="w-full px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
            <textarea value={row.description ?? ''} onChange={(e) => updateLocal(i, 'description', e.target.value)} placeholder="Description"
              className="w-full px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone resize-y" rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-1 items-center">
                <input value={row.icon_key ?? ''} onChange={(e) => updateLocal(i, 'icon_key', e.target.value)} placeholder="Icon"
                  className="flex-1 px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
                <div className="flex-shrink-0 w-8 h-8 rounded bg-katana-ash/40 border border-katana-silver/15 flex items-center justify-center">
                  <AdminDynamicIcon name={row.icon_key ?? ''} className="w-4 h-4 text-katana-crimson" />
                </div>
              </div>
              <select value={row.card_color ?? 'crimson'} onChange={(e) => updateLocal(i, 'card_color', e.target.value)}
                className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone">
                <option value="crimson">Crimson</option>
                <option value="gold">Gold</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveRole(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-katana-silver/60 hover:text-katana-crimson"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => deleteRow(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-katana-silver/40 hover:text-katana-crimson"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow({ role_name: 'New Role', role_title: 'New Title', description: 'Description...', icon_key: 'Users', card_color: 'crimson' })}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/15 rounded">
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>
    </div>
  );
}

// ---- Member Stats Editor (inline within Darbar) ----
export function MemberStatsEditor({ memberId }: { memberId: string }) {
  const [stats, setStats] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('darbar_member_stats').select('*').eq('member_id', memberId).order('sort_order').then(({ data }) => {
      setStats(data ?? []);
      setLoaded(true);
    });
  }, [memberId]);

  const updateLocal = (i: number, field: string, value: string | number) => {
    setStats((prev) => { const c = [...prev]; c[i] = { ...c[i], [field]: value }; return c; });
  };

  const saveStat = async (i: number) => {
    const row = stats[i];
    if (!row?.id) return;
    await supabase.from('darbar_member_stats').update({
      stat_name: row.stat_name, stat_value: Number(row.stat_value), stat_max: Number(row.stat_max),
    }).eq('id', row.id);
  };

  const addStat = async () => {
    const { data } = await supabase.from('darbar_member_stats').insert({
      member_id: memberId, stat_name: 'New Stat', stat_value: 50, stat_max: 100, sort_order: stats.length,
    }).select().single();
    if (data) setStats([...stats, data]);
  };

  const deleteStat = async (i: number) => {
    const row = stats[i];
    if (row?.id) await supabase.from('darbar_member_stats').delete().eq('id', row.id);
    setStats(stats.filter((_, j) => j !== i));
  };

  if (!loaded) return null;

  return (
    <div className="pt-2">
      <p className="text-[10px] uppercase tracking-wider text-katana-gold/50 mb-1">Member Stats</p>
      {stats.map((row, i) => (
        <div key={row.id ?? i} className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_auto] gap-1 mb-1">
          <input value={row.stat_name ?? ''} onChange={(e) => updateLocal(i, 'stat_name', e.target.value)} placeholder="Stat"
            className="px-2 py-1 bg-katana-ash/40 border border-katana-silver/10 rounded text-xs text-katana-bone" />
          <input type="number" value={row.stat_value ?? 0} onChange={(e) => updateLocal(i, 'stat_value', e.target.value)}
            className="px-2 py-1 bg-katana-ash/40 border border-katana-silver/10 rounded text-xs text-katana-bone w-16" />
          <input type="number" value={row.stat_max ?? 100} onChange={(e) => updateLocal(i, 'stat_max', e.target.value)}
            className="px-2 py-1 bg-katana-ash/40 border border-katana-silver/10 rounded text-xs text-katana-bone w-16" />
          <div className="flex">
            <button onClick={() => saveStat(i)} className="p-1 text-katana-silver/50 hover:text-katana-crimson"><Save className="w-3 h-3" /></button>
            <button onClick={() => deleteStat(i)} className="p-1 text-katana-silver/30 hover:text-katana-crimson"><Trash2 className="w-3 h-3" /></button>
          </div>
        </div>
      ))}
      <button onClick={addStat} className="text-xs text-katana-silver/40 hover:text-katana-crimson mt-1">+ Add Stat</button>
    </div>
  );
}
