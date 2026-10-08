import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { LuArrowRight, LuLockKeyhole, LuMail } from "react-icons/lu";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = ({ email }: LoginFormValues) => {
    setMessage("");

    try {
      localStorage.setItem(
        "develtiq-auth",
        JSON.stringify({ email, signedInAt: new Date().toISOString() }),
      );
    } catch {
      setMessage("Unable to save your sign-in. Please allow local storage and try again.");
      return;
    }

    navigate("/home", { replace: true });
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,157,248,0.16),transparent_55%)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#3B9DF8] text-xl font-bold text-white shadow-lg shadow-blue-500/25">
            d
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            develt<span className="text-[#3B9DF8]">IQ</span>
          </span>
        </div>

        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/30 sm:p-9">
          <div className="mb-8 text-center">
            <p className="mb-2 text-sm font-medium text-[#3B9DF8]">Welcome back</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Enter your details to continue to your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email address
              </label>
              <div className="relative">
                <LuMail
                  aria-hidden
                  className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-950 dark:text-white ${
                    errors.email
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-200 focus:border-[#3B9DF8] dark:border-slate-700"
                  }`}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <LuLockKeyhole
                  aria-hidden
                  className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-950 dark:text-white ${
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-200 focus:border-[#3B9DF8] dark:border-slate-700"
                  }`}
                />
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B9DF8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-wait disabled:opacity-70"
            >
              Sign in
              <LuArrowRight aria-hidden className="size-4" />
            </button>
            <p role="status" aria-live="polite" className="min-h-5 text-center text-sm text-slate-500 dark:text-slate-400">
              {message}
            </p>
          </form>
        </section>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link
            to="/home"
            className="font-medium text-slate-600 transition hover:text-[#3B9DF8] dark:text-slate-300"
          >
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
