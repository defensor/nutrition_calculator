import React, { useState } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import { useUser } from '../context/UserContext';
import { useNotification } from '../context/NotificationContext';
import * as api from '../api';

const CreateUserModal = () => {
  const { isCreateUserModalOpen, closeCreateUserModal, fetchUsers, setCurrentUser } = useUser();
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const newUser = await api.createUser(name);
      await fetchUsers();
      setCurrentUser(newUser.id);
      showNotification('User created successfully', 'success');
      setName('');
      closeCreateUserModal();
    } catch (error) {
      showNotification("Failed to create user: " + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateUserModalOpen}
      onClose={closeCreateUserModal}
      title="Create New User"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="User Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder="Enter name..."
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={closeCreateUserModal} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;
