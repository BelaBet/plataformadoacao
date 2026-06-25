import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { loading, isPlatformAdmin } = useAuth();
  if (loading) return null;
  return (
    <SidebarProvider className="min-h-0">
      <div className="relative flex min-h-[calc(100vh-4rem)] w-full -mx-6 -my-8 [transform:translateZ(0)]">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center justify-between gap-3 border-b bg-card/60 px-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              {isPlatformAdmin && (
                <span className="text-xs font-medium uppercase tracking-wider text-amber-600">
                  Plataforma
                </span>
              )}
            </div>
            {isPlatformAdmin && <TenantSwitcher />}
          </header>
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
