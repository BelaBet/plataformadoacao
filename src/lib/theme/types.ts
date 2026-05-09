// Theme engine — types shared across tenants (multi-igreja)

export interface TenantBrandSource {
  /** Tenant slug or id, used to scope theme cache */
  tenantId: string;
  /** Optional logo URL — used as primary palette source */
  logoUrl?: string | null;
  /** Optional cover/hero image — used as secondary palette source */
  coverUrl?: string | null;
  /** Manual overrides set in the manager dashboard */
  overrides?: Partial<ChurchTheme>;
  /** Manual fallbacks (e.g. tenants.primary_color) when no image is available */
  fallbackPrimary?: string | null;
  fallbackAccent?: string | null;
}

export interface ChurchTheme {
  // Primary scale
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySoft: string;

  // Accent scale
  accent: string;
  accentLight: string;
  accentDark: string;
  accentSoft: string;

  // Surfaces
  background: string;
  surface: string;
  surfaceMuted: string;

  // Text
  text: string;
  textMuted: string;
  textOnPrimary: string;
  textOnAccent: string;

  // States
  border: string;
  borderStrong: string;
  hover: string;
  ring: string;

  // Composed
  gradientPrimary: string;
  gradientAccent: string;
  gradientHero: string;

  // Meta
  isDark: boolean;
  source: "extracted" | "fallback" | "override" | "default";
}
