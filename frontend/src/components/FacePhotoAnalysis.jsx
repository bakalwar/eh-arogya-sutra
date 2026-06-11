import { useRef } from 'react';

export default function FacePhotoAnalysis({ value, onChange }) {
  const inputRef = useRef(null);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        faceFile: file,
        face_image_base64: reader.result,
        findings: [{ sign: 'Photo uploaded', meaning: 'EH temperament via Expert engine' }],
        temperament: 'mixed',
        polarity: 'MIXED',
        face_detected: true,
        engine: 'upload'
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-eh-gold/80">
        📷 Chehre ki photo (PDF §3 — OpenCV)
      </p>
      <p className="mt-1 text-xs text-white/45">Optional — Lymphatic / Sanguine temperament</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="mt-3 w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-eh-green/30 file:px-3 file:py-2 file:text-white"
        onChange={onFile}
      />
      {value?.faceFile ? (
        <p className="mt-2 text-xs text-eh-mint">✓ {value.faceFile.name}</p>
      ) : null}
    </div>
  );
}
