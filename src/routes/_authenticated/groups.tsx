import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/groups")({
  component: GroupsPage,
});

type Group = { id: string; name: string; description: string | null; created_at: string };

function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    setGroups((data ?? []) as Group[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Grupos</h1>
          <p className="text-sm text-muted-foreground">Comunidades dentro do seu tenant</p>
        </div>
      </div>


      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : groups.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhum grupo ainda.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <Link key={g.id} to="/groups/$groupId" params={{ groupId: g.id }}>
              <Card className="p-4 hover:border-primary transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{g.name}</h3>
                    {g.description && <p className="text-sm text-muted-foreground line-clamp-2">{g.description}</p>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
