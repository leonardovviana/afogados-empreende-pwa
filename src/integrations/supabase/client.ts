import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type TypedSupabaseClient = SupabaseClient<Database>;

const PLACEHOLDER_VALUES = new Set([
	"COLOQUE_A_CHAVE_ANON_DO_SUPABASE_AQUI",
	"COLOQUE_A_CHAVE_ANON_DO_SUPABASE_AQUI".toLowerCase(),
	"YOUR_SUPABASE_ANON_KEY",
	"YOUR_SUPABASE_URL",
	"INSIRA_SUA_CHAVE_AQUI",
]);

const STORAGE_KEYS = {
	url: "afogados-empreende:supabaseUrl",
	anonKey: "afogados-empreende:supabaseAnonKey",
} as const;

const sanitizeConfigValue = (value: string | undefined | null): string | undefined => {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (trimmed.length === 0) return undefined;
	if (PLACEHOLDER_VALUES.has(trimmed)) return undefined;
	return trimmed;
};

const readBrowserStorage = (): { url?: string; anonKey?: string } => {
	if (typeof window === "undefined") {
		return {};
	}

	try {
		const storedUrl = sanitizeConfigValue(window.localStorage.getItem(STORAGE_KEYS.url));
		const storedAnonKey = sanitizeConfigValue(window.localStorage.getItem(STORAGE_KEYS.anonKey));
		return {
			url: storedUrl,
			anonKey: storedAnonKey,
		};
	} catch (error) {
		console.warn("Não foi possível ler as configurações do Supabase salvas no navegador:", error);
		return {};
	}
};

const resolveSupabaseConfig = (): { url?: string; anonKey?: string; source: "env" | "storage" | "mixed" | "none" } => {
	const envUrl = sanitizeConfigValue(import.meta.env.VITE_SUPABASE_URL);
	const envAnonKey = sanitizeConfigValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

	let url = envUrl;
	let anonKey = envAnonKey;
	let source: "env" | "storage" | "mixed" | "none" = "none";

	if (envUrl && envAnonKey) {
		source = "env";
	}

	if (!url || !anonKey) {
		const stored = readBrowserStorage();
		if (!url && stored.url) {
			url = stored.url;
		}
		if (!anonKey && stored.anonKey) {
			anonKey = stored.anonKey;
		}
		if ((stored.url || stored.anonKey) && source === "none") {
			source = "storage";
		} else if (stored.url || stored.anonKey) {
			source = "mixed";
		}
	}

	if (!url && !anonKey) {
		source = "none";
	}

	return { url, anonKey, source };
};

const createUnavailableProxy = <T extends object>(serviceName: string): T =>
	new Proxy(
		{},
		{
			get() {
				throw new Error(
					`[Supabase] ${serviceName} não está disponível porque as variáveis obrigatórias não foram definidas. ` +
						`Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e reinicie o servidor.`
				);
			},
			apply() {
				throw new Error(
					`[Supabase] ${serviceName} não está disponível porque as variáveis obrigatórias não foram definidas. ` +
						`Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e reinicie o servidor.`
				);
			},
		}
	) as T;

const buildSupabaseClient = (): TypedSupabaseClient | null => {
	const { url, anonKey } = resolveSupabaseConfig();
	const missingKeys = [
		!url ? "VITE_SUPABASE_URL" : null,
		!anonKey ? "VITE_SUPABASE_ANON_KEY" : null,
	].filter(Boolean) as string[];

	if (missingKeys.length > 0) {
		console.error(
			`Supabase configuration is incomplete. Missing keys: ${missingKeys.join(", ")}. ` +
				"Set the VITE_SUPABASE_* environment variables (replace any placeholder text) or salve os valores no navegador para inicializar corretamente."
		);
		return null;
	}

	return createClient<Database>(url!, anonKey!, {
		auth: {
			persistSession: true,
			storageKey: "afogados-empreende-supabase",
		},
	});
};

const toSupabaseExport = (client: TypedSupabaseClient | null) =>
	(client ?? createUnavailableProxy<TypedSupabaseClient>("Supabase")) satisfies TypedSupabaseClient;

let supabaseClient = buildSupabaseClient();
export let supabase = toSupabaseExport(supabaseClient);

export const refreshSupabaseClient = (): TypedSupabaseClient | null => {
	supabaseClient = buildSupabaseClient();
	supabase = toSupabaseExport(supabaseClient);
	return supabaseClient;
};

export const isSupabaseConfigured = (): boolean => supabaseClient !== null;

export const getSupabaseConfigSnapshot = () => {
	const { url, anonKey, source } = resolveSupabaseConfig();
	return {
		url: url ?? "",
		anonKey: anonKey ?? "",
		source,
	};
};

export const persistSupabaseBrowserConfig = (config: { url: string; anonKey: string }) => {
	if (typeof window === "undefined") {
		throw new Error("A configuração do Supabase só pode ser salva no navegador.");
	}

	const sanitizedUrl = sanitizeConfigValue(config.url);
	const sanitizedAnonKey = sanitizeConfigValue(config.anonKey);

	if (!sanitizedUrl || !sanitizedAnonKey) {
		throw new Error("URL e chave anon do Supabase são obrigatórias e não podem conter placeholders.");
	}

	window.localStorage.setItem(STORAGE_KEYS.url, sanitizedUrl);
	window.localStorage.setItem(STORAGE_KEYS.anonKey, sanitizedAnonKey);
	refreshSupabaseClient();
};

export const clearSupabaseBrowserConfig = () => {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.removeItem(STORAGE_KEYS.url);
	window.localStorage.removeItem(STORAGE_KEYS.anonKey);
	refreshSupabaseClient();
};
