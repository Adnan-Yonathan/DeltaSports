import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 items-center justify-center py-16">{children}</div>;
}
