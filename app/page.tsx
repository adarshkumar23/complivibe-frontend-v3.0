"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

const CSRF_COOKIE_NAME = "cv_csrf";

function hasSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${CSRF_COOKIE_NAME}=`));
}

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasSession() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Logo size="lg" className="animate-float-slow" />
    </div>
  );
}
