import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { LuLogOut, LuUser, LuX } from "react-icons/lu";
import { Modal } from "~/components/Modal";
import { useAuthEmail } from "~/hooks/useAuthEmail";

/** Profile and logout actions in the account dropdown. */
export function AccountDropdown() {
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const navigate = useNavigate();
  const { email, error: emailError } = useAuthEmail();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const logout = () => {
    try {
      localStorage.removeItem("develtiq-auth");
    } catch {
      setLogoutError("Your saved sign-in could not be cleared. Please try again.");
      return;
    }

    setLogoutOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div ref={rootRef} className="relative shrink-0">
        <button
          ref={buttonRef}
          type="button"
          aria-label="Korisnički račun"
          aria-expanded={open}
          aria-controls={menuId}
          title="Korisnički račun"
          onClick={() => setOpen((value) => !value)}
          className={`relative flex size-10 items-center justify-center text-[#3B9DF8] transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] ${
            open ? "text-cyan-300" : ""
          }`}
        >
          <LuUser aria-hidden className="size-[22px]" />
        </button>
        {open && (
          <section
            id={menuId}
            aria-label="Korisnički račun"
            className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-950/15 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40"
          >
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Korisnički račun
              </h2>
              <button
                type="button"
                aria-label="Zatvori korisnički račun"
                title="Zatvori"
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200/70 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <LuX aria-hidden className="size-4" />
              </button>
            </header>
            <div className="space-y-1 p-2">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm text-gray-800 transition-colors hover:bg-[#3B9DF8]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B9DF8] dark:text-white/90"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#3B9DF8]/10 text-[#3B9DF8] ring-1 ring-[#3B9DF8]/25">
                  <LuUser aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate" title={email || emailError}>
                  {email || emailError || "Profil"}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setLogoutError("");
                  setOpen(false);
                  setLogoutOpen(true);
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm text-pink-700 transition-colors hover:bg-pink-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 dark:text-pink-300"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-pink-500/10">
                  <LuLogOut aria-hidden className="size-4" />
                </span>
                <span>Log out</span>
              </button>
            </div>
          </section>
        )}
      </div>
      <Modal
        open={logoutOpen}
        title="Log out?"
        onClose={() => setLogoutOpen(false)}
        actions={
          <>
            <button
              type="button"
              onClick={() => setLogoutOpen(false)}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-[#3B9DF8] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              Log out
            </button>
          </>
        }
      >
        <p>Are you sure you want to log out of your account?</p>
        {logoutError && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {logoutError}
          </p>
        )}
      </Modal>
    </>
  );
}
