import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, History, CreditCard, UserCircle, LogOut, Bell, Store } from 'lucide-react';
import { useAuth } from '../../shared/auth/AuthContext';

const MerchantLayout = () => {
  const { logout, currentUser } = useAuth();

  const links = [
    { to: '/merchant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/merchant/transaction/new', icon: ShoppingCart, label: 'New Transaction' },
    { to: '/merchant/transactions', icon: History, label: 'Transaction History' },
    { to: '/merchant/disbursements', icon: CreditCard, label: 'Disbursements' },
    { to: '/merchant/profile', icon: UserCircle, label: 'Shop Profile' }
  ];

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">EduBridge</h1>
              <p className="text-amber-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Merchant Portal</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 mt-6">
          <ul className="space-y-1.5 px-4">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isActive 
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 text-slate-400 hover:text-red-400 px-4 py-3 w-full transition-colors font-semibold text-sm text-left rounded-xl hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
           <div className="flex items-center">
             <h2 className="text-lg font-bold text-gray-800 tracking-tight">
               {links.find(l => window.location.pathname.includes(l.to))?.label || 'Merchant Portal'}
             </h2>
           </div>
           <div className="flex items-center gap-6">
             <button className="text-gray-400 hover:text-amber-500 transition-colors relative p-2 rounded-lg hover:bg-gray-50">
               <Bell className="w-6 h-6" />
               <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
               <div className="text-right">
                 <p className="text-sm font-bold text-gray-900 leading-none">{currentUser?.name || 'Shop Manager'}</p>
                 <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-tighter">{currentUser?.shop_name || 'Partner Shop'}</p>
               </div>
               <div className="h-10 w-10 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner ring-2 ring-gray-50 ring-offset-2 ring-offset-white">
                 {(currentUser?.shop_name || 'S').charAt(0).toUpperCase()}
               </div>
             </div>
           </div>
        </header>

        {/* Dynamic Page Rendering */}
        <div className="p-8 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MerchantLayout;
