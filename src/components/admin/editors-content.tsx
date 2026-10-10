import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminDynamicIcon } from '@/components/AdminDynamicIcon';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import {
  useSettings, useListEditor, SectionTitle, TextField, TextArea,
  ImageUploadField, MediaUploadField, AudioUploadField, SaveButton,
} from '@/components/admin/shared';

// ---- Hero Editor ----
export function HeroEditor() {
  const { settings, update, save, saving, saveError, loaded } = useSettings('hero');

  if (!loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Hero Section" subtitle="The grand entry screen" />
      <TextField label="Title" value={settings.hero_title ?? ''} onChange={(v) => update('hero_title', v)} />
      <TextField label="Subtitle" value={settings.hero_subtitle ?? ''} onChange={(v) => update('hero_subtitle', v)} />
      <TextField label="Tagline" value={settings.hero_tagline ?? ''} onChange={(v) => update('hero_tagline', v)} />
      <ImageUploadField label="Background Image" value={settings.hero_bg_image ?? ''} onChange={(v) => update('hero_bg_image', v)} />
      <MediaUploadField label="Background Video (optional)" value={settings.hero_bg_video ?? ''} onChange={(v) => update('hero_bg_video', v)} accept="video" />
      <ImageUploadField label="Silhouette / Portrait" value={settings.hero_silhouette ?? ''} onChange={(v) => update('hero_silhouette', v)} />
      <SaveButton onSave={save} saving={saving} error={saveError} />
    </div>
  );
}

// ---- Legend Editor ----
export function LegendEditor() {
  const { settings, update, save, saving, saveError, setSavingManually, loaded } = useSettings('legend');
  const [details, setDetails] = useState<any[]>([]);
  const [detailsLoaded, setDetailsLoaded] = useState(false);

  useEffect(() => {
    supabase.from('character_details').select('*').order('sort_order').then(({ data }) => {
      setDetails(data ?? []);
      setDetailsLoaded(true);
    });
  }, []);

  const saveAll = async (): Promise<boolean> => {
    setSavingManually(true);
    const settingsSaved = await save();
    for (const d of details) {
      if (d.id) {
        await supabase.from('character_details').update({
          label: d.label, value: d.value, icon_key: d.icon_key, sort_order: d.sort_order,
        }).eq('id', d.id);
      }
    }
    setSavingManually(false);
    return settingsSaved;
  };

  if (!loaded || !detailsLoaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="The Legend" subtitle="Character profile section" />
      <TextField label="Heading Top" value={settings.legend_heading_top ?? ''} onChange={(v) => update('legend_heading_top', v)} />
      <TextField label="Heading Main" value={settings.legend_heading_main ?? ''} onChange={(v) => update('legend_heading_main', v)} />
      <TextArea label="Quote" value={settings.legend_quote ?? ''} onChange={(v) => update('legend_quote', v)} />
      <ImageUploadField label="Portrait Image" value={settings.legend_portrait ?? ''} onChange={(v) => update('legend_portrait', v)} />

      <div className="pt-4">
        <h3 className="text-sm uppercase tracking-wider text-katana-gold/60 mb-3">Character Details</h3>
        {details.map((d, i) => (
          <div key={d.id ?? i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr_auto] gap-2 mb-2">
            <input value={d.label ?? ''} onChange={(e) => { const c = [...details]; c[i] = { ...c[i], label: e.target.value }; setDetails(c); }}
              placeholder="Label" className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
            <input value={d.value ?? ''} onChange={(e) => { const c = [...details]; c[i] = { ...c[i], value: e.target.value }; setDetails(c); }}
              placeholder="Value" className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
            <div className="flex gap-1 items-center">
              <input value={d.icon_key ?? ''} onChange={(e) => { const c = [...details]; c[i] = { ...c[i], icon_key: e.target.value }; setDetails(c); }}
                placeholder="Icon" className="flex-1 px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
              <div className="flex-shrink-0 w-8 h-8 rounded bg-katana-ash/40 border border-katana-silver/15 flex items-center justify-center">
                <AdminDynamicIcon name={d.icon_key ?? ''} className="w-4 h-4 text-katana-crimson" />
              </div>
            </div>
            <button onClick={async () => {
              if (d.id) { await supabase.from('character_details').delete().eq('id', d.id); }
              setDetails(details.filter((_, j) => j !== i));
            }} className="p-2 text-katana-silver/40 hover:text-katana-crimson"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={async () => {
          const { data } = await supabase.from('character_details').insert({
            label: 'New Detail', value: '', icon_key: 'User', sort_order: details.length,
          }).select().single();
          if (data) setDetails([...details, data]);
        }} className="flex items-center gap-1 px-3 py-1.5 text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/15 rounded mt-2">
          <Plus className="w-4 h-4" /> Add Detail
        </button>
      </div>

      <SaveButton onSave={saveAll} saving={saving} />
    </div>
  );
}

// ---- Anthem Editor ----
export function AnthemEditor() {
  const { settings, update, save, saving, saveError, loaded } = useSettings('anthem');

  if (!loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Anthem" subtitle="Music player section" />
      <TextField label="Section Title" value={settings.anthem_title ?? ''} onChange={(v) => update('anthem_title', v)} />
      <TextField label="Subtitle" value={settings.anthem_subtitle ?? ''} onChange={(v) => update('anthem_subtitle', v)} />
      <TextField label="Song Title" value={settings.anthem_song_title ?? ''} onChange={(v) => update('anthem_song_title', v)} />
      <TextField label="Artist" value={settings.anthem_artist ?? ''} onChange={(v) => update('anthem_artist', v)} />
      <AudioUploadField label="Anthem Audio File" value={settings.anthem_audio_url ?? ''} onChange={(v) => update('anthem_audio_url', v)} />
      <ImageUploadField label="Album Art" value={settings.anthem_album_art ?? ''} onChange={(v) => update('anthem_album_art', v)} />
      <SaveButton onSave={save} saving={saving} error={saveError} />
    </div>
  );
}

// ---- Dialogues Editor ----
export function DialoguesEditor() {
  const { settings, update, save, saving: settingsSaving, saveError, loaded: settingsLoaded } = useSettings('dialogues');
  const { rows, loaded, deleteRow, addRow, saveRow, saving: rowSaving } = useListEditor('dialogues');

  const [localRows, setLocalRows] = useState<any[]>([]);
  useEffect(() => { if (loaded) setLocalRows(rows); }, [rows, loaded]);

  if (!settingsLoaded || !loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  const updateLocal = (i: number, value: string) => {
    setLocalRows((prev) => { const c = [...prev]; c[i] = { ...c[i], text: value }; return c; });
  };

  const saveDialogue = async (i: number) => {
    const row = localRows[i];
    if (!row?.id) return;
    await supabase.from('dialogues').update({ text: row.text }).eq('id', row.id);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Dialogues" subtitle="Mass dialogue quotes" />
      <TextField label="Section Heading" value={settings.dialogues_heading ?? ''} onChange={(v) => update('dialogues_heading', v)} />
      <SaveButton onSave={save} saving={settingsSaving} error={saveError} />

      <div className="pt-4 space-y-2">
        <h3 className="text-sm uppercase tracking-wider text-katana-gold/60">Dialogue Lines</h3>
        {localRows.map((row, i) => (
          <div key={row.id ?? i} className="flex gap-2 items-start">
            <textarea value={row.text ?? ''} onChange={(e) => updateLocal(i, e.target.value)}
              className="flex-1 px-3 py-2 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone resize-y" rows={2} />
            <button onClick={() => saveDialogue(i)} disabled={rowSaving} className="p-2 text-katana-silver/60 hover:text-katana-crimson"><Save className="w-4 h-4" /></button>
            <button onClick={() => deleteRow(i)} className="p-2 text-katana-silver/40 hover:text-katana-crimson"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => addRow({ text: 'New dialogue...' })} className="flex items-center gap-1 px-3 py-1.5 text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/15 rounded mt-2">
          <Plus className="w-4 h-4" /> Add Dialogue
        </button>
      </div>
    </div>
  );
}

// ---- Song Lyrics Editor ----
export function LyricsEditor() {
  const { rows, loaded, deleteRow, addRow } = useListEditor('song_lyrics');

  const [localRows, setLocalRows] = useState<any[]>([]);
  useEffect(() => { if (loaded) setLocalRows(rows); }, [rows, loaded]);

  if (!loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  const updateLocal = (i: number, value: string) => {
    setLocalRows((prev) => { const c = [...prev]; c[i] = { ...c[i], line: value }; return c; });
  };

  const saveLyric = async (i: number) => {
    const row = localRows[i];
    if (!row?.id) return;
    await supabase.from('song_lyrics').update({ line: row.line }).eq('id', row.id);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Song Lyrics" subtitle="Lyrics shown on the anthem and lyrics page" />

      <div className="pt-4 space-y-2">
        <h3 className="text-sm uppercase tracking-wider text-katana-gold/60">Lyrics (one line per row)</h3>
        {localRows.map((row, i) => (
          <div key={row.id ?? i} className="flex gap-2 items-start">
            <input value={row.line ?? ''} onChange={(e) => updateLocal(i, e.target.value)}
              className="flex-1 px-3 py-2 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
            <button onClick={() => saveLyric(i)} className="p-2 text-katana-silver/60 hover:text-katana-crimson"><Save className="w-4 h-4" /></button>
            <button onClick={() => deleteRow(i)} className="p-2 text-katana-silver/40 hover:text-katana-crimson"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => addRow({ line: 'New line...' })} className="flex items-center gap-1 px-3 py-1.5 text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/15 rounded mt-2">
          <Plus className="w-4 h-4" /> Add Line
        </button>
      </div>
    </div>
  );
}

// ---- Origin Editor ----
export function OriginEditor() {
  const { settings, update, save, saving: settingsSaving, saveError, loaded: settingsLoaded } = useSettings('origin');
  const { rows, loaded, deleteRow, addRow, saveRow, saving: rowSaving } = useListEditor('origin_chapters');

  const [localRows, setLocalRows] = useState<any[]>([]);
  useEffect(() => { if (loaded) setLocalRows(rows); }, [rows, loaded]);

  if (!settingsLoaded || !loaded) return <Loader2 className="w-6 h-6 animate-spin text-katana-crimson" />;

  const updateLocal = (i: number, field: string, value: string) => {
    setLocalRows((prev) => { const c = [...prev]; c[i] = { ...c[i], [field]: value }; return c; });
  };

  const saveChapter = async (i: number) => {
    const row = localRows[i];
    if (!row?.id) return;
    await supabase.from('origin_chapters').update({
      chapter: row.chapter, title: row.title, body: row.body,
    }).eq('id', row.id);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <SectionTitle title="Origin Story" subtitle="Timeline chapters" />
      <TextField label="Section Heading" value={settings.origin_heading ?? ''} onChange={(v) => update('origin_heading', v)} />
      <SaveButton onSave={save} saving={settingsSaving} error={saveError} />

      <div className="pt-4 space-y-4">
        <h3 className="text-sm uppercase tracking-wider text-katana-gold/60">Chapters</h3>
        {localRows.map((row, i) => (
          <div key={row.id ?? i} className="space-y-2 p-3 border border-katana-silver/10 rounded">
            <div className="grid grid-cols-2 gap-2">
              <input value={row.chapter ?? ''} onChange={(e) => updateLocal(i, 'chapter', e.target.value)} placeholder="Chapter 01"
                className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
              <input value={row.title ?? ''} onChange={(e) => updateLocal(i, 'title', e.target.value)} placeholder="Title"
                className="px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
            </div>
            <textarea value={row.body ?? ''} onChange={(e) => updateLocal(i, 'body', e.target.value)} placeholder="Story text"
              className="w-full px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone resize-y" rows={2} />
            <div className="flex gap-2">
              <button onClick={() => saveChapter(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-katana-silver/60 hover:text-katana-crimson"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => deleteRow(i)} className="flex items-center gap-1 px-2 py-1 text-xs text-katana-silver/40 hover:text-katana-crimson"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
        ))}
        <button onClick={() => addRow({ chapter: 'Chapter 05', title: 'New Chapter', body: 'New story...' })}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/15 rounded">
          <Plus className="w-4 h-4" /> Add Chapter
        </button>
      </div>
    </div>
  );
}
