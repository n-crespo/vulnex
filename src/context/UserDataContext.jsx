import { createContext, useContext } from "react";
import { useUserData } from "../hooks/useUserData";

const UserDataContext = createContext();

export function UserDataProvider({ children }) {
  const userData = useUserData();

  return (
    <UserDataContext.Provider value={userData}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserDataContext() {
  return useContext(UserDataContext);
}