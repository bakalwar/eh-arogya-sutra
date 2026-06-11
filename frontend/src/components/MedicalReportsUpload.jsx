import { useRef } from 'react';

export default function MedicalReportsUpload({ value, onChange }) {
  const inputRef = useRef(null);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({
      uploads: [{ sourceFile: file, name: file.name }],
      combined: { raw_text: '', fileName: file.name }
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-eh-gold/80">
        📄 Medical report PDF / image (PDF §4 — OCR)
      </p>
      <p className="mt-1 text-xs text-white/45">Tesseract + SciSpaCy — blood values & pathology</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="mt-3 w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-eh-green/30 file:px-3 file:py-2 file:text-white"
        onChange={onFile}
      />
      {value?.uploads?.[0]?.name ? (
        <p className="mt-2 text-xs text-eh-mint">✓ {value.uploads[0].name}</p>
      ) : null}
    </div>
  );
}
