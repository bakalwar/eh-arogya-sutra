import { useState } from 'react';
import PreviewNotice from '../components/PreviewNotice';

const categories = ['All', 'EH Basics', 'Case Studies', 'Medicines', 'Diagnosis'];

const demoVideos = [
  { id: 1, title: 'Electro Homoeopathy Introduction', category: 'EH Basics', duration: '18:32', views: '1.2k', thumb: '🎬' },
  { id: 2, title: 'Polarity Law — Positive & Negative', category: 'EH Basics', duration: '24:15', views: '890', thumb: '⚡' },
  { id: 3, title: 'S1 Scrofoloso — Complete Guide', category: 'Medicines', duration: '12:44', views: '654', thumb: '🌿' },
  { id: 4, title: 'Lymphatic Case — Live Demo', category: 'Case Studies', duration: '31:08', views: '432', thumb: '🔬' },
  { id: 5, title: 'Blood Test Report Reading — EH Style', category: 'Diagnosis', duration: '20:55', views: '789', thumb: '🩸' },
  { id: 6, title: 'Count Mattei History & Philosophy', category: 'EH Basics', duration: '45:00', views: '2.1k', thumb: '📜' },
];

export default function VideoLibrary() {
  const [active, setActive] = useState('All');
  const [playing, setPlaying] = useState(null);

  const filtered = active === 'All' ? demoVideos : demoVideos.filter((v) => v.category === active);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <PreviewNotice>वीडियो स्ट्रीमिंग (R2) जल्द — अभी डेमो कार्ड।</PreviewNotice>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-eh-gold/80">Learning Center</p>
        <h1 className="mt-1 font-display text-xl font-semibold text-white">Video Library</h1>
        <p className="mt-1 text-sm text-white/45">EH practice ke liye educational videos</p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition"
            style={{
              background: active === cat ? 'rgba(74,155,84,0.2)' : 'rgba(255,255,255,0.04)',
              border: active === cat ? '1px solid rgba(74,155,84,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: active === cat ? 'white' : 'rgba(255,255,255,0.45)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="group cursor-pointer overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] transition hover:border-white/[0.14]"
            onClick={() => setPlaying(v.id === playing ? null : v.id)}
          >
            {/* Thumbnail */}
            <div
              className="flex h-40 items-center justify-center text-5xl"
              style={{ background: 'linear-gradient(135deg,#0b1a0d,#1a3d1c)' }}
            >
              {playing === v.id ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
                  ⏸
                </div>
              ) : (
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 transition group-hover:bg-white/20">
                  <span>{v.thumb}</span>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full">
                    <span className="text-2xl opacity-0 transition group-hover:opacity-100">▶</span>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <p className="text-[10px] text-eh-gold/70 uppercase tracking-wider mb-1">{v.category}</p>
              <p className="text-sm font-medium text-white/85 leading-snug">{v.title}</p>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-white/30">
                <span>⏱ {v.duration}</span>
                <span>👁 {v.views} views</span>
              </div>
            </div>

            {/* Fake player */}
            {playing === v.id && (
              <div className="border-t border-white/[0.06] px-4 py-3">
                <div className="h-1 rounded-full bg-white/10">
                  <div className="h-1 w-1/3 rounded-full bg-gradient-to-r from-eh-sage to-eh-mint" />
                </div>
                <p className="mt-2 text-center text-[10px] text-white/30">
                  Video streaming — Cloudflare R2 (coming soon)
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-white/[0.07] py-16 text-center">
          <p className="text-3xl mb-3">🎥</p>
          <p className="text-sm text-white/40">Is category mein abhi koi video nahi hai</p>
        </div>
      )}
    </div>
  );
}
