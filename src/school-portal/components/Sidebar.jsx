import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, ReceiptText, FileText, UserCircle, LogOut, Bell, Calendar } from 'lucide-react';
import { useAuth } from '../../shared/auth/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const links = [
    { to: '/school/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/school/confirmations', icon: Users, label: 'Confirmations' },
    { to: '/school/disbursements', icon: ReceiptText, label: 'Disbursements' },
    { to: '/school/fee-schedule', icon: Calendar, label: 'Fee Schedule' },
    { to: '/school/profile', icon: UserCircle, label: 'Profile' }
  ];

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-emerald-400 tracking-tight">EduBridge</h1>
          <p className="text-slate-400 text-sm mt-1">School Admin Portal</p>
        </div>
        
        <nav className="flex-1 mt-6">
          <ul className="space-y-2 px-4">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`
                  }
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                  {link.to === '/school/confirmations' && (
                    <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      2
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={logout}
            className="flex items-center gap-3 text-slate-300 hover:text-white px-4 py-2 w-full transition-colors font-medium text-left"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
        {/* Top Header Placeholder (could hold user profile picture) */}
        <header className="bg-white shadow-sm px-8 py-3 flex items-center justify-between">
           <div className="flex items-center">
             <h2 className="text-xl font-bold text-gray-800">School Dashboard Portal</h2>
           </div>
           <div className="flex items-center gap-6">
             <button className="text-gray-400 hover:text-emerald-600 transition-colors relative">
               <Bell className="w-6 h-6" />
               <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
               <div className="text-right">
                 <p className="text-sm font-bold text-gray-900 leading-none">School Admin</p>
                 <p className="text-xs text-slate-500 mt-1">Partner School</p>
               </div>
               <div className="h-10 w-10 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                 S
               </div>
             </div>
           </div>
        </header>

        {/* Dynamic Page Rendering */}
        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
