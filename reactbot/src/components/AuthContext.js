import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authcode, setAuthcode] = useState(localStorage.getItem('authcode') || null);
  const [adoauthcode, setAdoAuthcode] = useState(localStorage.getItem('adoauthcode') || null);

  const updateAuthcode = (code) => {
    setAuthcode(code);
    localStorage.setItem('authcode', code);
  };

  const updateAdoAuthcode = (code) => {
    setAdoAuthcode(code);
    localStorage.setItem('adoauthcode', code);
  };

  return (
    <AuthContext.Provider value={{ authcode, updateAuthcode, adoauthcode, updateAdoAuthcode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
