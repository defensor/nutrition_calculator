import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api';
import { useNotification } from './NotificationContext';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { showNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
      if (data.length > 0 && !currentUser) {
        // Restore from localStorage or default to first
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser && data.find(u => u.id == savedUser)) {
            setCurrentUser(parseInt(savedUser));
        } else {
            setCurrentUser(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const handleCreateUser = () => {
    setIsCreateUserModalOpen(true);
  };

  const handleSetUser = (userId) => {
      setCurrentUser(parseInt(userId));
      localStorage.setItem('currentUser', userId);
  };

  const closeCreateUserModal = () => setIsCreateUserModalOpen(false);

  return (
    <UserContext.Provider value={{
        users,
        currentUser,
        setCurrentUser: handleSetUser,
        handleCreateUser,
        isCreateUserModalOpen,
        closeCreateUserModal,
        fetchUsers
    }}>
      {children}
    </UserContext.Provider>
  );
};
