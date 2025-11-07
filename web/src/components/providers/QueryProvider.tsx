"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

export const AppQueryProvider = ({ children }: { children: ReactNode }) => (
  <SWRConfig
    value={{
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      fetcher: (resource: string, init?: RequestInit) => fetch(resource, init).then((res) => {
        if (!res.ok) {
          throw new Error("Request failed");
        }
        return res.json();
      }),
    }}
  >
    {children}
  </SWRConfig>
);

export default AppQueryProvider;
