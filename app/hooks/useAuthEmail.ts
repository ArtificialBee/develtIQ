import { useEffect, useState } from "react";

interface SavedAuth {
  email: string;
}

function readSavedEmail(): string {
  const savedAuth = localStorage.getItem("develtiq-auth");
  if (!savedAuth) return "";

  const parsed: unknown = JSON.parse(savedAuth);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("email" in parsed) ||
    typeof parsed.email !== "string"
  ) {
    throw new Error("Saved sign-in information is invalid.");
  }

  return parsed.email;
}

/** Reads the demo sign-in email after mount, without accessing browser storage during SSR. */
export function useAuthEmail() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setEmail(readSavedEmail());
    } catch {
      setError("Unable to read your saved profile.");
    }
  }, []);

  return { email, error };
}
