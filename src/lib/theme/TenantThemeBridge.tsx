// Bridges TenantProvider data into ChurchThemeProvider.
// Keeps current visuals identical when no tenant logo/colors are set.

import { ChurchThemeProvider } from "@/lib/theme";
import { useTenant } from "@/lib/tenant-context";
import type { ReactNode } from "react";

export function TenantThemeBridge({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  return (
    <ChurchThemeProvider
      source={{
        tenantId: tenant?.id ?? "default",
        logoUrl: tenant?.logo_url ?? null,
        // Preserve current visual: fallback to existing brand colors / mock palette.
        fallbackPrimary: tenant?.primary_color ?? "#33396B",
        fallbackAccent: tenant?.secondary_color ?? "#D99A3D",
      }}
    >
      {children}
    </ChurchThemeProvider>
  );
}
