import { Suspense } from "react";
import ScanResultClient from "./ScanResultClient";

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ScanResultClient />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
      <div className="max-w-md w-full rounded-3xl bg-white border border-slate-200 shadow-lg p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 animate-pulse" />
        <div className="mt-4 h-4 bg-slate-100 rounded animate-pulse" />
        <div className="mt-2 h-4 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
