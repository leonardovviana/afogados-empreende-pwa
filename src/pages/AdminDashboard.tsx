import icon from "@/assets/icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { firebaseAuth, firebaseFirestore, firebaseStorage } from "@/integrations/firebase/client";
import { calculateTotalAmount, formatCurrencyBRL } from "@/lib/pricing";
import { buildBoletoFilePath } from "@/lib/storage";
import { Download, Loader2, LogOut, Search, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { onAuthStateChanged, signOut } from "firebase/auth";

const statusOptions = [
  "Pendente",
  "Aguardando pagamento",
  "Participação confirmada",
  "Cancelado",
] as const;

type RegistrationStatus = (typeof statusOptions)[number];

const STATUS_BADGE_VARIANTS: Record<RegistrationStatus, string> = Object.freeze({
  "Pendente": "bg-accent/20 text-accent",
  "Aguardando pagamento": "bg-amber-100 text-amber-700",
  "Participação confirmada": "bg-secondary/20 text-secondary",
  "Cancelado": "bg-destructive/20 text-destructive",
});

const STATUS_NORMALIZATION_MAP: Record<string, RegistrationStatus> = {
  pendente: "Pendente",
  "aguardando pagamento": "Aguardando pagamento",
  "aprovado aguardando pagamento": "Aguardando pagamento",
  "participacao confirmada": "Participação confirmada",
  "stand confirmado": "Participação confirmada",
  aprovado: "Participação confirmada",
  recusado: "Cancelado",
  cancelado: "Cancelado",
};

const normalizeStatusKey = (value: string | null | undefined): string | null => {
  if (!value) return null;

  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const normalizeStatus = (status: string): RegistrationStatus => {
  const key = normalizeStatusKey(status);
  if (!key) {
    return "Pendente";
  }

  return STATUS_NORMALIZATION_MAP[key] ?? "Pendente";
};

const normalizePaymentMethod = (method: string): string => {
  switch (method) {
    case "À vista":
    case "PIX":
      return "R$ 700,00 No lançamento";
    case "Parcelado":
      return "R$ 850,00 Após o lançamento";
    case "Boleto":
      return "R$ 750,00 Dois ou mais stands";
    default:
      return method;
  }
};

const isRegistrationStatus = (value: string): value is RegistrationStatus =>
  (statusOptions as readonly string[]).includes(value);

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
  status: RegistrationStatus;
  boleto_path: string | null;
  boleto_uploaded_at: string | null;
  payment_proof_path: string | null;
  payment_proof_uploaded_at: string | null;
  created_at: string;
  total_amount: number;
}

type FirestoreRegistration = {
  cpf_cnpj: string;
  cpf_cnpj_normalized?: string;
  company_name: string;
  responsible_name: string;
  phone: string;
  company_size: string;
  business_segment: string;
  stands_quantity: number;
  payment_method: string;
  status: string;
  boleto_path?: string | null;
  boleto_uploaded_at?: string | null;
  payment_proof_path?: string | null;
  payment_proof_uploaded_at?: string | null;
  total_amount?: number;
  created_at?: string;
  updated_at?: string;
};

const parseRegistrationDoc = (
  docSnap: QueryDocumentSnapshot<DocumentData>
): Registration => {
  const data = docSnap.data() as FirestoreRegistration;
  const paymentMethod = normalizePaymentMethod(String(data.payment_method ?? ""));
  const standsQuantity = Number(data.stands_quantity ?? 1) || 1;
  const fallbackTotal = calculateTotalAmount(standsQuantity, paymentMethod);
  const storedTotal = Number(data.total_amount ?? 0);
  const createdAt = data.created_at ?? new Date().toISOString();

  return {
    id: docSnap.id,
    cpf_cnpj: String(data.cpf_cnpj ?? ""),
    company_name: String(data.company_name ?? ""),
    responsible_name: String(data.responsible_name ?? ""),
    phone: String(data.phone ?? ""),
    company_size: String(data.company_size ?? ""),
    business_segment: String(data.business_segment ?? ""),
    stands_quantity: standsQuantity,
    payment_method: paymentMethod,
    status: normalizeStatus(String(data.status ?? "")),
    boleto_path: data.boleto_path ?? null,
    boleto_uploaded_at: data.boleto_uploaded_at ?? null,
    payment_proof_path: data.payment_proof_path ?? null,
    payment_proof_uploaded_at: data.payment_proof_uploaded_at ?? null,
    created_at: createdAt,
    total_amount: storedTotal > 0 ? storedTotal : fallbackTotal,
  };
};

const AdminDashboard = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RegistrationStatus>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingProofId, setViewingProofId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const navigate = useNavigate();

  const filteredRegistrations = useMemo(() => {
    if (!registrations.length) {
      return [];
    }

    const normalizedSearch = search.trim().toLowerCase();
    const numericSearch = normalizedSearch.replace(/[^0-9]/g, "");
    const hasSearch = normalizedSearch.length > 0;

    return registrations.filter((registration) => {
      const matchesSearch = !hasSearch
        ? true
        : registration.company_name.toLowerCase().includes(normalizedSearch) ||
          registration.responsible_name.toLowerCase().includes(normalizedSearch) ||
          registration.cpf_cnpj.toLowerCase().includes(normalizedSearch) ||
          (numericSearch
            ? registration.cpf_cnpj.replace(/[^0-9]/g, "").includes(numericSearch)
            : false);

      const matchesStatus =
        statusFilter === "all" ? true : registration.status === statusFilter;

      const matchesSize =
        sizeFilter === "all" ? true : registration.company_size === sizeFilter;

      return matchesSearch && matchesStatus && matchesSize;
    });
  }, [registrations, search, sizeFilter, statusFilter]);

  const filteredSummary = useMemo(() => {
    const total = filteredRegistrations.reduce((acc, registration) => acc + registration.total_amount, 0);
    const proofs = filteredRegistrations.reduce(
      (acc, registration) => acc + (registration.payment_proof_path ? 1 : 0),
      0
    );

    return {
      count: filteredRegistrations.length,
      total,
      proofs,
    };
  }, [filteredRegistrations]);

  const dashboardSummary = useMemo(() => {
    const counts: Record<RegistrationStatus, number> = {
      "Pendente": 0,
      "Aguardando pagamento": 0,
      "Participação confirmada": 0,
      "Cancelado": 0,
    };

    let totalAmount = 0;

    for (const registration of registrations) {
  counts[registration.status] += 1;
  totalAmount += registration.total_amount;
    }

    return {
      total: registrations.length,
      counts,
      totalAmount,
    };
  }, [registrations]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(firebaseFirestore, "exhibitorRegistrations"));
      const parsed = snapshot.docs.map(parseRegistrationDoc);

      const sorted = parsed.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      setRegistrations(sorted);
    } catch (error) {
      console.error("Erro ao carregar dados do painel:", error);
      toast.error("Erro ao carregar dados do painel. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        toast.error("Faça login para acessar o painel.");
        navigate("/admin");
        return;
      }

      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (authChecked) {
      void fetchDashboardData();
    }
  }, [authChecked, fetchDashboardData]);

  const updateStatus = async (id: string, status: RegistrationStatus) => {
    try {
      const nowIso = new Date().toISOString();
      await updateDoc(doc(firebaseFirestore, "exhibitorRegistrations", id), {
        status,
        updated_at: nowIso,
      });

      toast.success("Status atualizado com sucesso!");
      setRegistrations((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Não foi possível atualizar o status. Tente novamente.");
    }
  };

  const triggerFileSelection = (registrationId: string) => {
    fileInputRefs.current[registrationId]?.click();
  };

  const handleBoletoUpload = async (registrationId: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

  const fileNameLower = file.name.toLowerCase();
  const hasPdfExtension = fileNameLower.endsWith(".pdf");
  const isPdfMime = file.type === "application/pdf";

    if (!hasPdfExtension && !isPdfMime) {
      toast.error("Envie o boleto em formato PDF.");
      return;
    }

    setUploadingId(registrationId);

    try {
      const relativePath = buildBoletoFilePath(registrationId, file.name);
      const storedPath = `boletos/${relativePath}`;
      const storageRef = ref(firebaseStorage, storedPath);
      const nowIso = new Date().toISOString();

      await uploadBytes(storageRef, file, {
        contentType: "application/pdf",
      });

      await updateDoc(doc(firebaseFirestore, "exhibitorRegistrations", registrationId), {
        boleto_path: storedPath,
        boleto_uploaded_at: nowIso,
        updated_at: nowIso,
      });

      toast.success("Boleto anexado com sucesso!");
      setRegistrations((current) =>
        current.map((item) =>
          item.id === registrationId
            ? { ...item, boleto_path: storedPath, boleto_uploaded_at: nowIso }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao anexar boleto:", error);
      toast.error("Não foi possível anexar o boleto. Tente novamente.");
    } finally {
      setUploadingId(null);
      if (fileInputRefs.current[registrationId]) {
        fileInputRefs.current[registrationId]!.value = "";
      }
    }
  };

  const handleViewBoleto = async (registration: Registration) => {
    if (!registration.boleto_path) {
      toast.error("Nenhum boleto disponível para este cadastro.");
      return;
    }

    setViewingId(registration.id);
    try {
      const storageRef = ref(firebaseStorage, registration.boleto_path);
      const downloadUrl = await getDownloadURL(storageRef);

      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Erro ao gerar link do boleto:", error);
      toast.error("Não foi possível abrir o boleto. Tente novamente.");
    } finally {
      setViewingId(null);
    }
  };

  const handleViewPaymentProof = async (registration: Registration) => {
    if (!registration.payment_proof_path) {
      toast.error("Nenhum comprovante disponível para este cadastro.");
      return;
    }

    setViewingProofId(registration.id);
    try {
      const storageRef = ref(firebaseStorage, registration.payment_proof_path);
      const downloadUrl = await getDownloadURL(storageRef);

      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Erro ao gerar link do comprovante:", error);
      toast.error("Não foi possível abrir o comprovante. Tente novamente.");
    } finally {
      setViewingProofId(null);
    }
  };

  const handleLogout = async () => {
    await signOut(firebaseAuth);
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
      "Forma de pagamento",
      "Valor total (R$)",
      "Status",
      "Boleto enviado?",
      "Comprovante enviado?",
      "Data do comprovante",
      "Data de cadastro",
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
  formatCurrencyBRL(reg.total_amount),
      reg.status,
      reg.boleto_path ? "Sim" : "Não",
      reg.payment_proof_path ? "Sim" : "Não",
      reg.payment_proof_uploaded_at
        ? new Date(reg.payment_proof_uploaded_at).toLocaleString("pt-BR")
        : "",
      new Date(reg.created_at).toLocaleDateString("pt-BR"),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = `${cell ?? ""}`.replace(/"/g, '""');
            return `"${value}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cadastros_feira_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-sand">
      <header className="bg-primary text-primary-foreground shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={icon} alt="Logo" className="h-10 w-10 rounded-xl" />
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-primary md:col-span-2">
            <div className="text-3xl font-bold text-primary mb-1 font-['Poppins']">
              {dashboardSummary.total}
            </div>
            <div className="text-sm text-muted-foreground">Total de Cadastros</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-secondary md:col-span-2">
            <div className="text-3xl font-bold text-secondary mb-1 font-['Poppins']">
              {dashboardSummary.counts["Participação confirmada"]}
            </div>
            <div className="text-sm text-muted-foreground">Participações confirmadas</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-accent md:col-span-2">
            <div className="text-3xl font-bold text-accent mb-1 font-['Poppins']">
              {dashboardSummary.counts["Pendente"]}
            </div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-secondary md:col-span-2">
            <div className="text-3xl font-bold text-amber-600 mb-1 font-['Poppins']">
              {dashboardSummary.counts["Aguardando pagamento"]}
            </div>
            <div className="text-sm text-muted-foreground">Aguardando pagamento</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-primary md:col-span-2">
            <div className="text-3xl font-bold text-destructive mb-1 font-['Poppins']">
              {dashboardSummary.counts["Cancelado"]}
            </div>
            <div className="text-sm text-muted-foreground">Cancelados</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-elegant md:col-span-2">
            <div className="text-3xl font-bold text-primary mb-1 font-['Poppins']">
              {formatCurrencyBRL(dashboardSummary.totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Valor previsto em vendas</div>
          </div>
        </div>

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

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (value === "all" || isRegistrationStatus(value)) {
                  setStatusFilter(value);
                }
              }}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aguardando pagamento">Aguardando pagamento</SelectItem>
                <SelectItem value="Participação confirmada">
                  Participação confirmada
                </SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
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
          <div className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              {filteredSummary.count === 1
                ? "1 cadastro encontrado"
                : `${filteredSummary.count} cadastros encontrados`}
            </span>
            <span>
              Comprovantes recebidos: {filteredSummary.proofs}
            </span>
            <span className="font-semibold text-primary">
              Valor previsto nesta visão: {formatCurrencyBRL(filteredSummary.total)}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-elegant overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Porte</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Stands</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Total previsto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Boleto</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                      Nenhum cadastro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.company_name}</TableCell>
                      <TableCell>{registration.cpf_cnpj}</TableCell>
                      <TableCell>{registration.responsible_name}</TableCell>
                      <TableCell>{registration.phone}</TableCell>
                      <TableCell>{registration.company_size}</TableCell>
                      <TableCell>{registration.business_segment}</TableCell>
                      <TableCell>{registration.stands_quantity}</TableCell>
                      <TableCell>{registration.payment_method}</TableCell>
                      <TableCell>{formatCurrencyBRL(registration.total_amount)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_BADGE_VARIANTS[registration.status] ?? STATUS_BADGE_VARIANTS["Pendente"]
                          }`}
                        >
                          {registration.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <input
                          ref={(element) => {
                            fileInputRefs.current[registration.id] = element;
                          }}
                          type="file"
                          accept="application/pdf"
                          aria-label="Selecionar boleto em PDF"
                          className="hidden"
                          onChange={(event) => handleBoletoUpload(registration.id, event.target.files)}
                        />
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2"
                            onClick={() => triggerFileSelection(registration.id)}
                            disabled={uploadingId === registration.id}
                          >
                            {uploadingId === registration.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <UploadCloud className="h-4 w-4" />
                                {registration.boleto_path ? "Atualizar boleto" : "Anexar boleto"}
                              </>
                            )}
                          </Button>

                          {registration.boleto_path ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start gap-2 text-secondary"
                              onClick={() => handleViewBoleto(registration)}
                              disabled={viewingId === registration.id}
                            >
                              {viewingId === registration.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Abrindo...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4" />
                                  Ver boleto
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nenhum boleto enviado</span>
                          )}
                          {registration.boleto_uploaded_at && (
                            <span className="text-[11px] text-muted-foreground">
                              Atualizado em {new Date(registration.boleto_uploaded_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {registration.payment_proof_path ? (
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start gap-2 text-primary"
                              onClick={() => handleViewPaymentProof(registration)}
                              disabled={viewingProofId === registration.id}
                            >
                              {viewingProofId === registration.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Abrindo...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4" />
                                  Ver comprovante
                                </>
                              )}
                            </Button>
                            {registration.payment_proof_uploaded_at && (
                              <span className="text-[11px] text-muted-foreground">
                                Enviado em {new Date(registration.payment_proof_uploaded_at).toLocaleString("pt-BR")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nenhum comprovante enviado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(registration.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={registration.status}
                          onValueChange={(value) => {
                            if (isRegistrationStatus(value)) {
                              updateStatus(registration.id, value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Aguardando pagamento">
                              Aguardando pagamento
                            </SelectItem>
                            <SelectItem value="Participação confirmada">
                              Participação confirmada
                            </SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
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