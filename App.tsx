import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Employees from './pages/Employees';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import Treasury from './pages/Treasury';
import Returns from './pages/Returns';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user immediately
    try {
      const savedUser = localStorage.getItem('alashwal_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Storage error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (user: User) => {
    localStorage.setItem('alashwal_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('alashwal_user');
    setCurrentUser(null);
  };

  if (loading) return null;

  return (
    <Router>
      {!currentUser ? (
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      ) : (
        <Layout user={currentUser} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard user={currentUser} />} />
            <Route path="/sales" element={<Sales user={currentUser} />} />
            <Route path="/products" element={<Products user={currentUser} />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/returns" element={<Returns />} />
            {currentUser.role === UserRole.ADMIN && (
              <>
                <Route path="/treasury" element={<Treasury />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/reports" element={<Reports />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
};

export default App;