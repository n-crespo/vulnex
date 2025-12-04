import { createContext, useContext } from "react";
import { useCveData } from "../hooks/useCveData";

const CveDataContext = createContext();

export function CveDataProvider({ children }) {
  const cveData = useCveData();

  return (
    <CveDataContext.Provider value={cveData}>
      {children}
    </CveDataContext.Provider>
  );
}

export function useCveDataContext() {
  return useContext(CveDataContext);
}
