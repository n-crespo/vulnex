import { createContext, useContext, useEffect } from "react";
import { useUserData } from "../hooks/useUserData";
import { useAuthContext } from "./AuthContext";

const UserDataContext = createContext();

export function UserDataProvider({ children }) {
  const userData = useUserData();
  const { userLoginSessionToken } = useAuthContext();

  // Automatically fetch user data when they log in
  useEffect(() => {
    if (userLoginSessionToken) {
      userData.refreshUserData();
    }
  }, [userLoginSessionToken]); 

  return (
    <UserDataContext.Provider value={userData}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserDataContext() {
  return useContext(UserDataContext);
}