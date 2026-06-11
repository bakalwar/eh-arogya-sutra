import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FlaskConical, 
  Calendar, 
  Hospital, 
  Search, 
  BookOpen, 
  Video, 
  CreditCard, 
  Gift, 
  LogOut, 
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';
import { getUser } from '../security/tokenManager';

function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink 
      to={to} 
      end={end}
      className={({ isActive }) => `
        flex items-center gap-3 px-6 py-3 transition-all no-underline group relative
        ${isActive 
          ? 'bg-[rgba(201,150,58,0.10)] text-[#e8c46a] border-l-2 border-[#c9963a]' 
          : 'text-white/40 hover:text-white/70 hover:bg-white/5 border-l-2 border-transparent'}
      `}
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-4 h-4 ${isActive ? 'text-[#c9963a]' : ''}`} />
          <span className="text-[12px] font-bold uppercase tracking-widest font-body">{label}</span>
          <ChevronRight className={`w-3 h-3 ml-auto transition-all ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose, logout }) {
  const user = getUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-[280px] transform transition-transform duration-300 ease-in-out
        lg:w-[240px] lg:translate-x-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)]">
          <NavLink to="/dashboard" className="flex items-center gap-3 no-underline">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center text-[var(--bg)] font-bold shadow-[0_0_15px_rgba(201,150,58,0.3)]">⚕</div>
            <div>
              <h1 className="text-sm font-heading font-bold tracking-widest uppercase text-[var(--text)]">Arogya Sutra</h1>
              <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--gold)] opacity-60">EH Practitioner</p>
            </div>
          </NavLink>
          <button onClick={onClose} className="lg:hidden p-2 text-[var(--gold)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-8">
          
          {/* Profile Summary */}
          <div className="mx-4 p-4 rounded-2xl bg-black/20 border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)] font-bold border border-[var(--gold)]/20">
                {user?.name?.charAt(0) || 'D'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-[var(--text)]">{user?.name || 'Doctor'}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--green)]">Pro Plan</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="space-y-6">
            {/* Practice Section */}
            <div className="space-y-1">
              <p className="px-6 text-[9px] font-heading font-bold uppercase tracking-[0.3em] text-[var(--gold)] opacity-40 mb-3">Practice</p>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" end />
              <NavItem to="/patient" icon={Users} label="Records" />
              <NavItem to="/prescription" icon={FileText} label="EH Prescription" />
              <NavItem to="/appointments" icon={Calendar} label="Appointments" />
              <NavItem to="/profile" icon={Hospital} label="Clinic Profile" />
            </div>

            {/* Clinical Tools Section */}
            <div className="space-y-1">
              <p className="px-6 text-[9px] font-heading font-bold uppercase tracking-[0.3em] text-[var(--gold)] opacity-40 mb-3">Clinical Tools</p>
              <NavItem to="/search" icon={Search} label="Symptom Search" />
              <NavItem to="/reports" icon={FlaskConical} label="Lab Reports" />
              <NavItem to="/books" icon={BookOpen} label="EH Library" />
              <NavItem to="/videos" icon={Video} label="Video Tutorials" />
            </div>

            {/* Account Section */}
            <div className="space-y-1">
              <p className="px-6 text-[9px] font-heading font-bold uppercase tracking-[0.3em] text-[var(--gold)] opacity-40 mb-3">Account</p>
              <NavItem to="/payment" icon={CreditCard} label="Billing" />
              <NavItem to="/referral" icon={Gift} label="Referrals" />
              {isAdmin && <NavItem to="/admin" icon={ShieldCheck} label="Admin Panel" />}
              <button 
                onClick={logout} 
                className="w-full flex items-center gap-3 px-6 py-3 text-[var(--red)]/60 hover:text-[var(--red)] hover:bg-[var(--red)]/5 border-l-2 border-transparent transition-all group"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-[12px] font-bold uppercase tracking-widest font-body">Logout</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="p-3 rounded-xl bg-[var(--gold)]/5 border border-[var(--gold)]/10">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--gold)] opacity-60 mb-2">System Status</p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase text-[var(--text)] opacity-80">EH Engine</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                <span className="text-[9px] font-bold text-[var(--green)] uppercase">Active</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
