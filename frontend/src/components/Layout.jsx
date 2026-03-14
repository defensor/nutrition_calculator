import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Select from './ui/Select';
import Button from './ui/Button';
import Toast from './ui/Toast';
import CreateUserModal from './CreateUserModal';
import ConfirmDialog from './ui/ConfirmDialog';

const Layout = ({ children }) => {
  const location = useLocation();
  const { users, currentUser, setCurrentUser, handleCreateUser } = useUser();

  const navItems = [
    { label: 'Calendar', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Dishes', path: '/dishes' },
  ];

  // Also highlight Calendar if we are in diary view
  const isDiary = location.pathname.startsWith('/diary/');
  const activePath = isDiary ? '/' : location.pathname;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-blue-600">NutriTrack</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      activePath === item.path
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Selector in Header */}
            <div className="flex items-center">
                <div className="w-40 mr-2">
                    <Select
                        value={currentUser}
                        onChange={(e) => setCurrentUser(e.target.value)}
                        options={users.map(u => ({ label: u.name, value: u.id }))}
                    />
                </div>
                <Button onClick={handleCreateUser} variant="secondary" className="px-2 py-1">+</Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Toast />
      <CreateUserModal />
      <ConfirmDialog />
    </div>
  );
};

export default Layout;
