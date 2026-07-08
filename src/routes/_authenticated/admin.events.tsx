import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAllEvents } from "@/lib/events.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyRow, LoadingRow } from "@/components/empty-row";
import { ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import { translateError } from "@/lib/translate-error";

export const Route = createFileRoute("/_authenticated/admin/events")({
  component: AdminEventsPage,
  head: () => ({ meta: [{ title: "Eventos — Plataforma" }] }),
});

type AdminEvent = {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
  description: string | null;
  banner_url: string | null;
  external_url: string;
  status: string;
  created_at: string;
  tenant_id: string;
  tenants: { name: string | null; slug: string | null } | null;
};

function AdminEventsPage() {
  const fetchEvents = useServerFn(getAllEvents);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => fetchEvents(),
  });

  if (error) {
    toast.error(translateError(error));
  }

  const events = (data ?? []) as AdminEvent[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl">Eventos</h1>
        <p className="text-sm text-muted-foreground">
          Todos os eventos cadastrados pelas igrejas da plataforma.
        </p>
      </div>

      <Card className="overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Igreja</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <LoadingRow colSpan={6} />}
            {!isLoading && events.length === 0 && (
              <EmptyRow colSpan={6} message="Nenhum evento cadastrado." />
            )}
            {events.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {ev.banner_url && (
                      <img
                        src={ev.banner_url}
                        alt={ev.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    )}
                    <span>{ev.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {ev.tenants?.name ?? "—"}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {ev.date
                    ? new Date(ev.date).toLocaleString("pt-BR")
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {ev.location ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={ev.status === "active" ? "default" : "secondary"}>
                    {ev.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {ev.tenants?.slug && (
                      <Button asChild variant="ghost" size="icon" title="Ver página da igreja">
                        <Link
                          to="/i/$slug"
                          params={{ slug: ev.tenants.slug }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Calendar className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild title="Abrir link externo">
                      <a href={ev.external_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
