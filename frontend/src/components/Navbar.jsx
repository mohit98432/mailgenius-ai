import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Mail, PenSquare, Clock, Settings, LogOut } from "lucide-react";
import { useAuth } from "../AuthContext";

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
    isActive ? "bg-amber/10 text-amber font-medium" : "text-slate-400 hover:bg-surface2 hover:text-white"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-border p-4 flex flex-col gap-1 min-h-screen">
      <div className="flex items-center gap-2 px-2 pb-6 text-lg font-semibold">
        <Mail size={20} className="text-amber" />
        MailGenius
      </div>
      <NavLink to="/compose" className={linkClass}>
        <PenSquare size={16} /> Compose
      </NavLink>
      <NavLink to="/scheduled" className={linkClass}>
        <Clock size={16} /> Scheduled
      </NavLink>
      <NavLink to="/settings" className={linkClass}>
        <Settings size={16} /> SMTP Settings
      </NavLink>
      <div className="mt-auto pt-4 border-t border-border">
        <div className="px-2 text-xs text-slate-500 mb-2 truncate">{user?.email}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-surface2 hover:text-white w-full"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}
