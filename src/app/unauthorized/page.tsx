"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-6xl font-bold tracking-tight text-red-500">403</h1>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Access Denied
        </h2>
        <p className="text-slate-400">
          You do not have the required permissions to view this dashboard. If you believe this is an error, please contact your HR administrator.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition-all duration-200"
          >
            Return to Login
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
