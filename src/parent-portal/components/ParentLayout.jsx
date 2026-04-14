import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Banknote, ShoppingBag, Wallet, User, LogOut, CheckCircle2, Bell } from 'lucide-react';
import { useAuth } from '../../shared/auth/AuthContext';

const ParentLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const nav = [
    { to: '/parent/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/parent/loans/history', icon: Banknote, label: 'Loans' },
    { to: '/parent/supplies/shops', icon: ShoppingBag, label: 'Supplies' },
    { to: '/parent/wallet', icon: Wallet, label: 'Wallet' },
    { to: '/parent/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/parent/login');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sky-900 text-white flex flex-col shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
             <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
             </div>
             EduBridge
          </h1>
          <p className="text-sky-200 text-sm mt-1">Parent Web Portal</p>
        </div>
        
        <nav className="flex-1 mt-6">
          <ul className="space-y-2 px-4">
            {nav.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-sky-600 text-white shadow-md transform scale-[1.02] border-l-4 border-sky-300' 
                        : 'text-sky-200 hover:bg-sky-800 hover:text-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border-l-4 border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-sky-400 group-hover:text-sky-300'}`} />
                      {link.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-sky-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-sky-200 hover:text-white px-4 py-3 w-full transition-all duration-200 font-medium text-left rounded-lg hover:bg-sky-800 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm px-8 py-3 flex items-center justify-between sticky top-0 z-10">
           <div className="flex items-center">
             <h2 className="text-xl font-bold text-gray-800">Parent Dashboard</h2>
           </div>
           
           <div className="flex items-center gap-6">
             <button className="text-gray-400 hover:text-sky-600 transition-colors relative">
               <Bell className="w-6 h-6" />
             </button>
             <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
               <div className="text-right">
                 <p className="text-sm font-bold text-gray-900 leading-none">{currentUser?.full_name || 'Parent'}</p>
                 <div className="flex items-center justify-end gap-1 mt-1">
                   {currentUser?.kyc_status === 'verified' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                   <p className="text-xs text-slate-500">{currentUser?.kyc_status === 'verified' ? 'Verified' : 'Pending KYC'}</p>
                 </div>
               </div>
               <div className="h-10 w-10 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border border-sky-200">
                 <User className="w-5 h-5" />
               </div>
             </div>
           </div>
        </header>

        {/* Dynamic Page Rendering */}
        <div className="p-8 flex-1 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ParentLayout;
