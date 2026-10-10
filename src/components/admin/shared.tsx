import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/upload';
import { AdminDynamicIcon } from '@/components/AdminDynamicIcon';
import {
  Save, Loader2, Check, Image as ImageIcon, Music, X, FileUp, Video, Upload,
} from 'lucide-react';

// ---- Types ----
export interface TextRow { id: string; [key: string]: any }
export interface SettingItem { key: string; value: string; category: string }

// ---- Shared UI helpers ----

export function SaveButton({ onSave, saving, error }: {
  onSave: () => void | boolean | Promise<void | boolean>;
  saving: boolean;
  error?: string | null;
}) {
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaved(false);
    const result = await onSave();
    if (result !== false) setSaved(true);
  };

  return (
    <div>
      <button
        onClick={() => void handleSave()}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-katana-crimson/15 border border-katana-crimson/40 text-katana-crimson rounded text-sm font-body font-semibold hover:bg-katana-crimson/25 hover:border-katana-crimson/60 transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved' : 'Save Changes'}
      </button>
      {error && <p className="text-katana-crimson text-xs mt-2">{error}</p>}
      {saved && !error && <p className="text-katana-gold text-xs mt-2">Saved successfully. These changes are now stored and live on the site.</p>}
    </div>
  );
}

export function TextField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-katana-gold/60 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none"
      />
    </div>
  );
}

export function TextArea({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-katana-gold/60 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none resize-y"
      />
    </div>
  );
}

export function MediaUploadField({
  label, value, onChange, accept = 'image', folder = 'images',
}: { label: string; value: string; onChange: (url: string) => void; accept?: 'image' | 'video' | 'both'; folder?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptAttr = accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : 'image/*,video/*';
  const uploadFolder = accept === 'video' ? 'videos' : folder;

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    const { url, error: uploadError } = await uploadFile(file, uploadFolder);
    setUploading(false);
    if (uploadError) {
      setError(uploadError);
    } else {
      onChange(url);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const isVideo = value && (value.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i) || false);

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-katana-gold/60 mb-1">{label}</label>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer ${
          dragging ? 'border-katana-crimson bg-katana-crimson/10' : 'border-katana-silver/15 hover:border-katana-crimson/40 bg-katana-ash/30'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={acceptAttr} onChange={onInputChange} className="hidden" />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-katana-crimson" />
            <span className="text-sm text-katana-silver/50">Uploading...</span>
          </div>
        ) : dragging ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <FileUp className="w-5 h-5 text-katana-crimson" />
            <span className="text-sm text-katana-crimson">Drop to upload</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2">
            {accept === 'video' ? <Video className="w-5 h-5 text-katana-silver/40" /> : <ImageIcon className="w-5 h-5 text-katana-silver/40" />}
            <span className="text-sm text-katana-silver/40">Drag & drop or click to upload {accept === 'video' ? 'video' : accept === 'both' ? 'image/video' : 'image'}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 items-start mt-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste URL here..."
          className="flex-1 px-3 py-2 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none"
        />
        {value && (
          <button onClick={() => onChange('')} className="p-2 text-katana-silver/40 hover:text-katana-crimson transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {value && !isVideo && (
        <div className="mt-2 relative inline-block">
          <img src={value} alt="Preview" className="h-24 rounded border border-katana-silver/15 object-cover" />
        </div>
      )}
      {value && isVideo && (
        <video controls src={value} className="mt-2 w-full max-h-40 rounded border border-katana-silver/15 object-cover" />
      )}
      {error && <p className="text-katana-crimson text-xs mt-1">{error}</p>}
    </div>
  );
}

export function ImageUploadField({
  label, value, onChange,
}: { label: string; value: string; onChange: (url: string) => void }) {
  return <MediaUploadField label={label} value={value} onChange={onChange} accept="image" folder="images" />;
}

export function VideoUploadField({
  label, value, onChange,
}: { label: string; value: string; onChange: (url: string) => void }) {
  return <MediaUploadField label={label} value={value} onChange={onChange} accept="video" folder="videos" />;
}

export function AudioUploadField({
  label, value, onChange,
}: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    const { url, error: uploadError } = await uploadFile(file, 'audio');
    setUploading(false);
    if (uploadError) {
      setError(uploadError);
    } else {
      onChange(url);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-katana-gold/60 mb-1">{label}</label>
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer ${
          dragging ? 'border-katana-crimson bg-katana-crimson/10' : 'border-katana-silver/15 hover:border-katana-crimson/40 bg-katana-ash/30'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-katana-crimson" />
            <span className="text-sm text-katana-silver/50">Uploading...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2">
            <Music className="w-5 h-5 text-katana-silver/40" />
            <span className="text-sm text-katana-silver/40">Drag & drop or click to upload audio</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 items-start mt-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste URL here..."
          className="flex-1 px-3 py-2 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none"
        />
        {value && <button onClick={() => onChange('')} className="p-2 text-katana-silver/40 hover:text-katana-crimson"><X className="w-4 h-4" /></button>}
      </div>
      {value && <audio controls src={value} className="mt-2 h-8 w-full" />}
      {error && <p className="text-katana-crimson text-xs mt-1">{error}</p>}
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-katana-silver/10">
      <h2 className="font-display font-600 text-2xl text-katana-bone tracking-wide">{title}</h2>
      {subtitle && <p className="text-katana-silver/40 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

// ---- Icon input with live preview ----
export function IconInputField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-katana-gold/60 mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Car, Heart, Crown..."
          className="flex-1 px-3 py-2 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none"
        />
        <div className="flex-shrink-0 w-10 h-10 rounded bg-katana-ash/40 border border-katana-silver/15 flex items-center justify-center">
          <AdminDynamicIcon name={value} className="w-5 h-5 text-katana-crimson" />
        </div>
      </div>
      <p className="text-katana-silver/30 text-xs mt-1">Type any Lucide icon name (e.g. Car, Zap, Music)</p>
    </div>
  );
}

export function ImageUploadInline({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url } = await uploadFile(file, 'gallery');
    if (url) onChange(url);
    setUploading(false);
  };
  return (
    <div className="flex gap-2">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL or upload"
        className="flex-1 px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone" />
      <label className="cursor-pointer flex items-center gap-1 px-2 py-1.5 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-silver">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
    </div>
  );
}

// ---- useSettings hook ----
export function useSettings(category: string) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('key, value').eq('category', category).then(({ data }) => {
      const map: Record<string, string> = {};
      (data as SettingItem[])?.forEach((r) => { map[r.key] = r.value; });
      setSettings(map);
      setLoaded(true);
    });
  }, [category]);

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    const upserts = Object.entries(settings).map(([key, value]) => ({ key, value, category }));
    const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return false;
    }
    return true;
  };

  const setSavingManually = (v: boolean) => setSaving(v);

  return { settings, update, save, saving, saveError, setSavingManually, loaded };
}

// ---- Generic list editor hook ----
export function useListEditor(table: string, orderKey = 'sort_order') {
  const [rows, setRows] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    supabase.from(table).select('*').order(orderKey).then(({ data }) => {
      setRows(data ?? []);
      setLoaded(true);
    });
  }, [table, orderKey]);

  useEffect(() => { load(); }, [load]);

  const updateRow = (i: number, changes: Record<string, any>) => {
    setRows((prev) => { const c = [...prev]; c[i] = { ...c[i], ...changes }; return c; });
  };

  const addRow = async (defaults: Record<string, any>) => {
    const { data } = await supabase.from(table).insert({ ...defaults, [orderKey]: rows.length }).select().single();
    if (data) setRows([...rows, data]);
  };

  const deleteRow = async (i: number) => {
    const row = rows[i];
    if (row?.id) await supabase.from(table).delete().eq('id', row.id);
    setRows(rows.filter((_, j) => j !== i));
  };

  const saveRow = async (i: number) => {
    const row = rows[i];
    if (!row?.id) return;
    setSaving(true);
    const { id, created_at, ...updates } = row;
    await supabase.from(table).update(updates).eq('id', id);
    setSaving(false);
  };

  return { rows, loaded, saving, updateRow, addRow, deleteRow, saveRow, reload: load };
}
