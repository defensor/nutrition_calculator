import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState('');

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

  const handleCreateUser = async () => {
    const name = prompt("Enter new user name:");
    if (name) {
      try {
        const newUser = await api.createUser(name);
        setUsers([...users, newUser]);
        setCurrentUser(newUser.id);
      } catch (error) {
        alert("Failed to create user: " + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleSetUser = (userId) => {
      setCurrentUser(userId);
      localStorage.setItem('currentUser', userId);
  };

  return (
    <UserContext.Provider value={{ users, currentUser, setCurrentUser: handleSetUser, handleCreateUser }}>
      {children}
    </UserContext.Provider>
  );
};
