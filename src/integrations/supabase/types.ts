export type RegistrationStatus =
	| "Pendente"
	| "Aguardando pagamento"
	| "Participação confirmada"
	| "Cancelado";

export type PaymentMethod =
	| "R$ 700,00 No lançamento"
	| "R$ 850,00 Após o lançamento"
	| "R$ 750,00 Dois ou mais stands";

export type CompanySize =
	| "MEI"
	| "ME"
	| "EPP"
	| "Médio"
	| "Grande"
	| "Autônomo informal";

export interface ExhibitorRegistrationRow {
	id: string;
	cpf_cnpj: string;
	company_name: string;
	responsible_name: string;
	phone: string;
	company_size: CompanySize;
	business_segment: string;
	stands_quantity: number;
	payment_method: PaymentMethod;
	status: RegistrationStatus;
	boleto_path: string | null;
	boleto_uploaded_at: string | null;
	payment_proof_path: string | null;
	payment_proof_uploaded_at: string | null;
	total_amount: number;
	created_at: string;
	updated_at: string;
}

export type ExhibitorRegistrationInsert = {
	id?: string;
	cpf_cnpj: string;
	company_name: string;
	responsible_name: string;
	phone: string;
	company_size: CompanySize;
	business_segment: string;
	stands_quantity: number;
	payment_method: PaymentMethod;
	status?: RegistrationStatus;
	boleto_path?: string | null;
	boleto_uploaded_at?: string | null;
	payment_proof_path?: string | null;
	payment_proof_uploaded_at?: string | null;
	total_amount?: number;
	cpf_cnpj_normalized?: string | null;
};

export type ExhibitorRegistrationUpdate = Partial<
	Omit<ExhibitorRegistrationRow, "id" | "created_at" | "updated_at">
> & {
	updated_at?: string;
};

export interface RegistrationSettingsRow {
	id: number;
	launch_pricing_enabled: boolean;
	created_at: string;
	updated_at: string;
}

export type RegistrationSettingsInsert = {
	id?: number;
	launch_pricing_enabled: boolean;
	created_at?: string;
	updated_at?: string;
};

export type RegistrationSettingsUpdate = Partial<
	Omit<RegistrationSettingsRow, "id" | "created_at" | "updated_at">
> & {
	id?: number;
	updated_at?: string;
};

export type PushSubscriptionStatus = "active" | "revoked";

export interface WebPushSubscriptionRow {
	id: string;
	registration_id: string | null;
	cpf_hash: string;
	endpoint: string;
	subscription: PushSubscriptionJSON;
	status: PushSubscriptionStatus;
	last_status: RegistrationStatus | null;
	company_name: string | null;
	created_at: string;
	updated_at: string;
}

export type WebPushSubscriptionInsert = {
	id?: string;
	registration_id?: string | null;
	cpf_hash: string;
	endpoint: string;
	subscription: PushSubscriptionJSON;
	status?: PushSubscriptionStatus;
	last_status?: RegistrationStatus | null;
	company_name?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type WebPushSubscriptionUpdate = Partial<
	Omit<WebPushSubscriptionRow, "id" | "created_at" | "updated_at">
> & {
	updated_at?: string;
};

export interface AdminProfileRow {
	id: string;
	user_id: string;
	full_name: string;
	email: string | null;
	is_approved: boolean;
	created_at: string;
}

export type AdminProfileInsert = {
	user_id: string;
	full_name: string;
	email?: string | null;
	is_approved?: boolean;
};

export type AdminProfileUpdate = Partial<
	Omit<AdminProfileRow, "id" | "user_id" | "created_at">
>;

export type Database = {
	public: {
		Tables: {
			exhibitor_registrations: {
				Row: ExhibitorRegistrationRow;
				Insert: ExhibitorRegistrationInsert;
				Update: ExhibitorRegistrationUpdate;
			};
			web_push_subscriptions: {
				Row: WebPushSubscriptionRow;
				Insert: WebPushSubscriptionInsert;
				Update: WebPushSubscriptionUpdate;
			};
			admin_profiles: {
				Row: AdminProfileRow;
				Insert: AdminProfileInsert;
				Update: AdminProfileUpdate;
			};
			registration_settings: {
				Row: RegistrationSettingsRow;
				Insert: RegistrationSettingsInsert;
				Update: RegistrationSettingsUpdate;
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: {
			registration_status: RegistrationStatus;
			payment_method: PaymentMethod;
			company_size: CompanySize;
		};
	};
};

export const REGISTRATION_STATUSES: RegistrationStatus[] = [
	"Pendente",
	"Aguardando pagamento",
	"Participação confirmada",
	"Cancelado",
];

