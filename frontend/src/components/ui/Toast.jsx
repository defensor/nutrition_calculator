import React, { useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';

const Toast = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

const ToastItem = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [onClose, notification.id]);

  const bgColor = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  }[notification.type] || 'bg-gray-800';

  return (
    <div
      className={`${bgColor} text-white px-4 py-2 rounded shadow-lg flex items-center justify-between min-w-[200px] pointer-events-auto animate-in fade-in slide-in-from-right-4`}
    >
      <span>{notification.message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none font-bold"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;
