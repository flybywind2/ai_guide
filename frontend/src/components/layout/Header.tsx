import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../common';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 glass px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-40">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/30">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <span className="font-semibold text-gray-900 text-lg">
          AI Literacy Guide
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            {user?.role && ['super_admin', 'editor'].includes(user.role) && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Register</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
