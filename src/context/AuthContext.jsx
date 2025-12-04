import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

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

  // Wrap in useCallback to keep the function reference stable
  const doLoginSuccess = useCallback((token) => {
    localStorage.setItem("sessionToken", token);
    setUserLoginSessionToken(token);
    setDoAuthModel(false);
  }, []);

  // Wrap in useCallback
  const doLogoutAndClearSessionToken = useCallback(() => {
    localStorage.removeItem("sessionToken");
    setUserLoginSessionToken(null);
  }, []);

  // Wrap the context value in useMemo
  // It only updates if userLoginSessionToken or doAuthModel changes
  const value = useMemo(
    () => ({
      userLoginSessionToken,
      doAuthModel,
      setDoAuthModel,
      doLoginSuccess,
      doLogoutAndClearSessionToken,
    }),
    [
      userLoginSessionToken,
      doAuthModel,
      doLoginSuccess,
      doLogoutAndClearSessionToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// custom hook for consuming the context
export function useAuthContext() {
  return useContext(AuthContext);
}
