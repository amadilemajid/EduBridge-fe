import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SchoolPortalRoutes from './school-portal/index';
import MerchantPortalRoutes from './merchant-portal/index';
import InternalPortalRoutes from './admin-portal/index';
import ParentPortalRoutes from './parent-portal/index';
import BNPLTestPage from './BNPLTestPage';
import BNPLPurchaseFlow from './BNPLPurchaseFlow';
import MerchantBNPLTest from './MerchantBNPLTest';
import AdminBNPLTest from './AdminBNPLTest';

function App() {
  return (
    <Router>
      <div className="min-h-screen font-sans bg-gray-100 flex flex-col">
        {/*
          Global navigation or wrappers could go here.
          Since the portals are highly distinct, we let each portal handle its own layout component.
        */}
        <Routes>
          {/* Default → redirect to BNPL test page */}
          <Route path="/" element={<Navigate to="/bnpl-test" replace />} />

          {/* BNPL Test Pages */}
          <Route path="/bnpl-test" element={<BNPLTestPage />} />
          <Route path="/bnpl-purchase" element={<BNPLPurchaseFlow />} />
          <Route path="/merchant-bnpl" element={<MerchantBNPLTest />} />
          <Route path="/admin-bnpl" element={<AdminBNPLTest />} />

          {/* PORTAL 1: Parent Web Interface */}
          <Route path="/parent/*" element={<ParentPortalRoutes />} />

          {/* PORTAL 2: School Admin Dashboard */}
          <Route path="/school/*" element={<SchoolPortalRoutes />} />

          {/* PORTAL 3: Merchant Portal */}
          <Route path="/merchant/*" element={<MerchantPortalRoutes />} />

          {/* PORTAL 4: Internal Admin Portal */}
          <Route path="/admin/*" element={<InternalPortalRoutes />} />
          
          {/* Fallback 404 Route */}
          <Route path="*" element={
            <div className="flex bg-white items-center justify-center p-8 h-screen w-full flex-col">
              <h1 className="text-6xl font-black text-gray-800 mb-2">404</h1>
              <p className="text-gray-500">Page not found</p>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
