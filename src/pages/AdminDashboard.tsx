import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LogOut, Download, Search, Filter } from "lucide-react";
import logo from "@/assets/logo.png";

interface Registration {
  id: string;
  cpf_cnpj: string;
  company_name: string;
  responsible_name: string;
  phone: string;
  company_size: string;
  business_segment: string;
  stands_quantity: number;
  payment_method: string;
  status: "Pendente" | "Aprovado" | "Recusado";
  created_at: string;
}

const AdminDashboard = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchRegistrations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [registrations, search, statusFilter, sizeFilter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin");
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("exhibitor_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
    } catch (error) {
      console.error("Erro ao buscar cadastros:", error);
      toast.error("Erro ao carregar cadastros");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...registrations];

    if (search) {
      filtered = filtered.filter(
        (reg) =>
          reg.company_name.toLowerCase().includes(search.toLowerCase()) ||
          reg.cpf_cnpj.includes(search) ||
          reg.responsible_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((reg) => reg.status === statusFilter);
    }

    if (sizeFilter !== "all") {
      filtered = filtered.filter((reg) => reg.company_size === sizeFilter);
    }

    setFilteredRegistrations(filtered);
  };

  const updateStatus = async (id: string, status: "Pendente" | "Aprovado" | "Recusado") => {
    try {
      const { error } = await supabase
        .from("exhibitor_registrations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast.success("Status atualizado com sucesso!");
      fetchRegistrations();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const exportToCSV = () => {
    const headers = [
      "CPF/CNPJ",
      "Empresa",
      "Responsável",
      "Telefone",
      "Porte",
      "Segmento",
      "Stands",
      "Pagamento",
      "Status",
      "Data",
    ];

    const rows = filteredRegistrations.map((reg) => [
      reg.cpf_cnpj,
      reg.company_name,
      reg.responsible_name,
      reg.phone,
      reg.company_size,
      reg.business_segment,
      reg.stands_quantity,
      reg.payment_method,
      reg.status,
      new Date(reg.created_at).toLocaleDateString("pt-BR"),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cadastros_feira_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "bg-secondary/20 text-secondary";
      case "Recusado":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-accent/20 text-accent";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sand">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold font-['Poppins']">Painel Administrativo</h1>
                <p className="text-sm text-primary-foreground/80">8ª Feira do Empreendedor</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-primary">
            <div className="text-3xl font-bold text-primary mb-1 font-['Poppins']">
              {registrations.length}
            </div>
            <div className="text-sm text-muted-foreground">Total de Cadastros</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-secondary">
            <div className="text-3xl font-bold text-secondary mb-1 font-['Poppins']">
              {registrations.filter((r) => r.status === "Aprovado").length}
            </div>
            <div className="text-sm text-muted-foreground">Aprovados</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-accent">
            <div className="text-3xl font-bold text-accent mb-1 font-['Poppins']">
              {registrations.filter((r) => r.status === "Pendente").length}
            </div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-primary">
            <div className="text-3xl font-bold text-destructive mb-1 font-['Poppins']">
              {registrations.filter((r) => r.status === "Recusado").length}
            </div>
            <div className="text-sm text-muted-foreground">Recusados</div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-card rounded-xl shadow-elegant p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por empresa, CPF/CNPJ ou responsável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Recusado">Recusado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Porte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Portes</SelectItem>
                <SelectItem value="MEI">MEI</SelectItem>
                <SelectItem value="ME">ME</SelectItem>
                <SelectItem value="EPP">EPP</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Grande">Grande</SelectItem>
                <SelectItem value="Autônomo informal">Autônomo informal</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
              <Download size={16} />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl shadow-elegant overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Porte</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Stands</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum cadastro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.company_name}</TableCell>
                      <TableCell>{registration.responsible_name}</TableCell>
                      <TableCell>{registration.phone}</TableCell>
                      <TableCell>{registration.company_size}</TableCell>
                      <TableCell>{registration.business_segment}</TableCell>
                      <TableCell>{registration.stands_quantity}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                          {registration.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={registration.status}
                          onValueChange={(value: any) => updateStatus(registration.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Aprovado">Aprovado</SelectItem>
                            <SelectItem value="Recusado">Recusado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;