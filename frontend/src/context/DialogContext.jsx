import React, { createContext, useContext, useState, useCallback } from 'react';

const DialogContext = createContext();

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState(null);

  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      setDialogConfig({
        ...config,
        resolve: (value) => {
          setDialogConfig(null);
          resolve(value);
        },
      });
    });
  }, []);

  return (
    <DialogContext.Provider value={{ confirm, dialogConfig }}>
      {children}
    </DialogContext.Provider>
  );
};
