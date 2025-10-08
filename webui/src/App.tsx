import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from 'miaoda-auth-react';
import { supabase } from '@/db/supabase';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/common/Header';

import routes from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider client={supabase}>
        <Toaster />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
