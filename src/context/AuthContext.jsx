import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userLoginSessionToken, setUserLoginSessionToken] = useState(null);
  const [doAuthModel, setDoAuthModel] = useState(false);

  // check local storage on mount
  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    if (token) {
      setUserLoginSessionToken(token);
    }
  }, []);

  const doLoginSuccess = (token) => {
    localStorage.setItem("sessionToken", token);
    setUserLoginSessionToken(token);
    setDoAuthModel(false);
  };

  const doLogoutAndClearSessionToken = () => {
    localStorage.removeItem("sessionToken");
    setUserLoginSessionToken(null);
  };

  const value = {
    userLoginSessionToken,
    doAuthModel,
    setDoAuthModel,
    doLoginSuccess,
    doLogoutAndClearSessionToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// custom hook for consuming the context
export function useAuthContext() {
  return useContext(AuthContext);
}
