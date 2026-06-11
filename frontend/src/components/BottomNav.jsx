import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Users, 
  FileText, 
  Settings 
} from 'lucide-react';

export default function BottomNav({ onMenuClick }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[60px] bg-white border-t border-[#e2e8f0] flex items-center justify-around">
      <NavLink 
        to="/dashboard" 
        className={({ isActive }) => `
          flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative
          ${isActive ? 'text-[#1a56db] border-t-2 border-[#1a56db]' : 'text-[#64748b] border-t-2 border-transparent'}
        `}
      >
        <Home className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
      </NavLink>

      <NavLink 
        to="/search" 
        className={({ isActive }) => `
          flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative
          ${isActive ? 'text-[#1a56db] border-t-2 border-[#1a56db]' : 'text-[#64748b] border-t-2 border-transparent'}
        `}
      >
        <Search className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Search</span>
      </NavLink>

      <NavLink 
        to="/patient" 
        className={({ isActive }) => `
          flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative
          ${isActive ? 'text-[#1a56db] border-t-2 border-[#1a56db]' : 'text-[#64748b] border-t-2 border-transparent'}
        `}
      >
        <Users className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Patients</span>
      </NavLink>

      <NavLink 
        to="/prescription" 
        className={({ isActive }) => `
          flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative
          ${isActive ? 'text-[#1a56db] border-t-2 border-[#1a56db]' : 'text-[#64748b] border-t-2 border-transparent'}
        `}
      >
        <FileText className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Rx</span>
      </NavLink>

      <button 
        onClick={onMenuClick}
        className="flex flex-col items-center justify-center gap-1 w-full h-full text-[#64748b] border-t-2 border-transparent"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-widest">More</span>
      </button>
    </nav>
  );
}
