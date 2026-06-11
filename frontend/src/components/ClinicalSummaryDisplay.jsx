import React from 'react';

// DESIGN TOKENS (Match with global theme)
const C = {
  bg:      '#080f09', // Dark Forest
  bgCard:  '#0c160d',
  bgBox:   'rgba(201, 150, 58, 0.05)',
  border:  'rgba(201, 150, 58, 0.1)',
  green:   '#4a9b54',
  gold:    '#c9963a',
  orange:  '#e67e22',
  red:     '#e74c3c',
  blue:    '#5dade2',
  purple:  '#a569bd',
  gray:    'rgba(255, 255, 255, 0.5)',
  white:   '#ffffff',
  dim:     'rgba(255, 255, 255, 0.3)',
};

function Line({ text }) {
  const t = text || '';

  // Header lines
  if (t.includes('EH AROGYA SUTRA')) return (
    <div style={{
      textAlign:'center', color:C.gold,
      fontWeight:800, fontSize:16,
      letterSpacing:4, padding:'10px 0',
      fontFamily: 'Cinzel, serif',
      textTransform: 'uppercase'
    }}>{t}</div>
  );

  // Divider ═══
  if (/^═+$/.test(t.trim())) return (
    <div style={{
      borderTop:`1px solid ${C.gold}`,
      margin:'12px 0', opacity:0.2
    }}/>
  );

  // Box top/bottom ┌ └
  if (t.includes('┌') || t.includes('└')) return (
    <div style={{ color:C.border, fontSize:11, opacity: 0.5 }}>{t}</div>
  );

  // Box separator ├
  if (t.includes('├')) return (
    <div style={{
      borderTop:`1px solid ${C.border}`,
      margin:'4px 0', opacity: 0.5
    }}/>
  );

  // Box line │ with formula
  if (t.trim().startsWith('│')) {
    const inner = t.replace(/│/g,'').trim();

    // Formula line
    if (inner.startsWith('Formula')) return (
      <div style={{
        background: 'rgba(74, 155, 84, 0.05)',
        border:`1px solid rgba(74, 155, 84, 0.2)`,
        borderRadius:8, padding:'8px 15px',
        margin:'5px 10px',
        color: C.green, fontWeight:700,
        fontSize:14,
        fontFamily: 'Fira Code, monospace'
      }}>{inner}</div>
    );

    // MIXTURE header
    if (inner.startsWith('MIXTURE') || inner.startsWith('OIL')) return (
      <div style={{
        color:C.gold, fontWeight:800,
        fontSize:15, padding:'6px 12px',
        background:'rgba(201, 150, 58, 0.08)', borderRadius:6,
        margin:'4px 10px',
        fontFamily: 'Cinzel, serif',
        letterSpacing: 1
      }}>{inner}</div>
    );

    // Labels
    if (inner.startsWith('Timing') ||
        inner.startsWith('Dose') ||
        inner.startsWith('Frequency') ||
        inner.startsWith('Method') ||
        inner.startsWith('Water') ||
        inner.startsWith('Apply') ||
        inner.startsWith('Note')) return (
      <div style={{
        color:C.blue, fontSize:12,
        padding:'3px 20px',
        fontWeight: 500
      }}>{inner}</div>
    );

    // IMPORTANT warning
    if (inner.startsWith('IMPORTANT')) return (
      <div style={{
        color:C.orange, fontWeight:700,
        fontSize:12, padding:'4px 20px',
        background: 'rgba(230, 126, 34, 0.05)',
        borderRadius: 4,
        margin: '2px 10px'
      }}>⚠ {inner}</div>
    );

    // Separator ────
    if (/^─+$/.test(inner)) return (
      <div style={{
        borderTop:`1px dashed ${C.border}`,
        margin:'5px 10px',
        opacity: 0.3
      }}/>
    );

    // Action text (inside box)
    if (inner && inner.length > 10) return (
      <div style={{
        color:C.gray, fontSize:12,
        padding:'2px 20px', lineHeight:1.7,
      }}>{inner}</div>
    );

    return <div style={{height:6}}/>;
  }

  // Patient info lines
  if (t.trim().startsWith('Patient') ||
      t.trim().startsWith('Date') ||
      t.trim().startsWith('BP') ||
      t.trim().startsWith('Systems')) return (
    <div style={{
      color:C.white, fontSize:13,
      padding:'3px 0',
      display: 'flex',
      gap: '8px'
    }}>
      <span style={{color:C.dim, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1, minWidth: 80}}>{t.split(':')[0]}:</span>
      <span style={{color:C.white,fontWeight:600}}>{t.split(':').slice(1).join(':')}</span>
    </div>
  );

  // ELEVATED / WARNING
  if (t.includes('ELEVATED') || t.includes('⚠')) return (
    <div style={{color:C.red,fontSize:12,padding:'4px 0', fontWeight: 600}}>{t}</div>
  );

  // Stage headers
  if (t.trim().startsWith('STAGE')) return (
    <div style={{
      color:C.gold, fontWeight:800,
      fontSize:14, marginTop:15,
      marginBottom: 8,
      borderLeft:`4px solid ${C.gold}`,
      paddingLeft:12,
      fontFamily: 'Cinzel, serif',
      letterSpacing: 2
    }}>{t.trim()}</div>
  );

  // Schedule lines (MORNING / AFTERNOON etc.)
  if (t.trim().match(/^(MORNING|AFTERNOON|EVENING|NIGHT|BEDTIME)/)) return (
    <div style={{
      display:'flex', gap:12,
      color:C.white, fontSize:13,
      padding:'4px 0',
      alignItems: 'center'
    }}>
      <span style={{
        color:C.gold, fontWeight:800,
        minWidth:120,
        fontSize: 11,
        letterSpacing: 1
      }}>{t.split('→')[0]}</span>
      <span style={{color:C.green, opacity: 0.5}}>→</span>
      <span style={{color:C.white, fontWeight: 500}}>{t.split('→')[1]}</span>
    </div>
  );

  // Eat ✓
  if (t.trim().startsWith('✓')) return (
    <div style={{
      color:C.green, fontSize:12,
      padding:'2px 12px',
      fontWeight: 500
    }}>{t}</div>
  );

  // Avoid ✗
  if (t.trim().startsWith('✗')) return (
    <div style={{
      color:C.red, fontSize:12,
      padding:'2px 12px',
      fontWeight: 500
    }}>{t}</div>
  );

  // Bullet •
  if (t.trim().startsWith('•')) return (
    <div style={{
      color:C.gray, fontSize:12,
      padding:'2px 12px',
      lineHeight: 1.6
    }}>{t}</div>
  );

  // Arrow →
  if (t.trim().startsWith('→')) return (
    <div style={{
      color:C.blue, fontSize:12,
      padding:'2px 12px',
      fontWeight: 500
    }}>{t}</div>
  );

  // Warning ⚠
  if (t.trim().startsWith('⚠')) return (
    <div style={{
      color:C.orange, fontSize:12,
      padding:'6px 15px',
      background:'rgba(230, 126, 34, 0.08)',
      borderRadius:8, margin:'5px 0',
      fontWeight: 600
    }}>{t}</div>
  );

  // GOLDEN RULE
  if (t.includes('GOLDEN RULE') || t.includes('AGGRAVATION')) return (
    <div style={{
      color:C.orange, fontWeight:800,
      fontSize:13, padding:'8px 0',
      textTransform: 'uppercase',
      letterSpacing: 1
    }}>{t}</div>
  );

  // Safety SAFE
  if (t.includes('SAFE')) return (
    <div style={{
      color:C.green, fontWeight:800,
      fontSize:13,
      textTransform: 'uppercase',
      letterSpacing: 1
    }}>{t}</div>
  );

  // POSITIVE / NEGATIVE / MIXED
  if (t.includes('POSITIVE') || t.includes('NEGATIVE')) return (
    <div style={{
      color: t.includes('POSITIVE') ? C.orange : C.blue,
      fontSize:13, padding:'4px 0',
      fontWeight: 700,
      letterSpacing: 1
    }}>{t}</div>
  );

  // Temperament / Polarity / Potency labels
  if (t.trim().startsWith('Temperament') ||
      t.trim().startsWith('Polarity') ||
      t.trim().startsWith('Potency')) return (
    <div style={{
      color:C.white, fontSize:13,
      padding:'4px 0',
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    }}>
      <span style={{color:C.dim, minWidth:120, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1}}>
        {t.split(':')[0]}:
      </span>
      <span style={{color:C.gold, fontWeight:700, fontSize: 14, fontFamily: 'Cinzel, serif'}}>
        {t.split(':').slice(1).join(':')}
      </span>
    </div>
  );

  // Default text
  if (t.trim()) return (
    <div style={{
      color:C.gray, fontSize:12,
      padding:'2px 0', lineHeight:1.7,
    }}>{t}</div>
  );

  return <div style={{height:6}}/>;
}

export default function ClinicalSummaryDisplay({ summary }) {
  if (!summary) return null;

  const lines = summary.split('\n');

  return (
    <div style={{
      background:   C.bg,
      border:       `1px solid ${C.border}`,
      borderRadius: 24,
      padding:      '30px',
      fontFamily:   'DM Sans, sans-serif',
      marginTop:    12,
      overflowX:    'auto',
      boxShadow:    'inset 0 0 40px rgba(0,0,0,0.5)'
    }}>
      {lines.map((line, i) => (
        <Line key={i} text={line}/>
      ))}
    </div>
  );
}
