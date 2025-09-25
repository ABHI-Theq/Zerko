"use client"
import { useEffect, useState, createContext, useContext } from "react"

const ThemeContext = createContext<{theme: string, toggle: () => void}>({theme: "dark", toggle: () => {}})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("dark")
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])
  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark")
  return (
    <ThemeContext.Provider value={{theme, toggle}}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
