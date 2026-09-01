import { useState } from "react";
import { LanguageContext } from "./context";

const STORAGE_KEY = "yands.language";

/** What was chosen last time, or English on a first visit. */
function stored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "en";
  } catch {
    // Private windows and blocked site data throw rather than return null.
    return "en";
  }
}

/**
 * Holds the language the interface is read in.
 *
 * Kept in the browser rather than on the record, because it is a property of
 * the person reading and not of the firm: two people at the same desk can want
 * different languages, and neither choice belongs in the database.
 */
export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(stored);

  const setLanguage = (next) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Nothing to do: the choice still holds for this session.
    }
  };

  return (
    <LanguageContext value={{ language, setLanguage }}>
      {children}
    </LanguageContext>
  );
}
