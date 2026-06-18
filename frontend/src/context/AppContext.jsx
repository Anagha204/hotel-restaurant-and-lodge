import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [mode, setMode] = useState("lodge"); // lodge or restaurant

  const toggleMode = () => {
    setMode((prev) => (prev === "lodge" ? "restaurant" : "lodge"));
  };

  return (
    <AppContext.Provider value={{ mode, toggleMode }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);