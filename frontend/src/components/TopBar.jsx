import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';
import { getUser } from '../security/tokenManager';

export default function TopBar({ onMenuClick, title }) {
  const { i18n } = useTranslation();
  const user = getUser();

  function toggleLang() {
    setLanguage(i18n.language === 'hi' ? 'en' : 'hi');
  }

  return (
    <header className="sticky top-0 z-40 h-[56px] bg-[rgba(8,15,9,0.95)] backdrop-blur-[12px] border-b border-[rgba(201,150,58,0.15)] px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger + Logo */}
        <div className="flex lg:hidden items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="w-[40px] h-[40px] flex items-center justify-center text-[var(--gold)] hover:bg-[var(--gold)]/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <NavLink to="/dashboard" className="flex items-center no-underline">
            <div className="w-7 h-7 rounded bg-[var(--gold)] flex items-center justify-center text-[var(--bg)] font-bold text-xs">⚕</div>
          </NavLink>
        </div>
        
        <h2 className="text-[14px] font-heading font-bold uppercase tracking-[2px] text-[var(--gold)] truncate max-w-[150px] md:max-w-none">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Language Toggle */}
        <button 
          onClick={toggleLang}
          className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/5 text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors"
        >
          <Globe className="w-3 h-3" />
          <span className="hidden xs:inline">{i18n.language === 'hi' ? 'HI' : 'EN'}</span>
        </button>

        {/* Notifications */}
        <button className="p-2 text-[var(--muted)] hover:text-[var(--gold)] transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--red)] rounded-full border border-[var(--bg)]" />
        </button>

        {/* Doctor Avatar */}
        <div className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold2)] flex items-center justify-center text-[var(--bg)] font-bold text-[10px] shadow-lg border border-white/10">
          {user?.name?.charAt(0) || 'D'}
        </div>
      </div>
    </header>
  );
}
