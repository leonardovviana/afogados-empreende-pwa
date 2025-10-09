import { supabase } from "@/integrations/supabase/client";
import type {
    RegistrationSettingsInsert as RegistrationSettingsInsertDb,
    RegistrationSettingsRow as RegistrationSettingsRowDb,
    RegistrationSettingsUpdate as RegistrationSettingsUpdateDb,
} from "@/integrations/supabase/types";
import type { PostgrestError } from "@supabase/supabase-js";

export const REGISTRATION_SETTINGS_SINGLETON_ID = 1;

export interface RegistrationSettings {
	launchPricingEnabled: boolean;
	salesClosed: boolean;
}

export class RegistrationSettingsNotProvisionedError extends Error {
	constructor(message = "Registration settings table is missing or inaccessible.") {
		super(message);
		this.name = "RegistrationSettingsNotProvisionedError";
	}
}

const mapRowToSettings = (row: RegistrationSettingsRowDb | null): RegistrationSettings => ({
	launchPricingEnabled: row?.launch_pricing_enabled ?? true,
	salesClosed: row?.sales_closed ?? false,
});

const isPostgrestError = (error: unknown): error is PostgrestError =>
	typeof error === "object" && error !== null && "code" in error && "message" in error;

const isTableMissingError = (error: unknown): boolean =>
	isPostgrestError(error) &&
	(error.code === "42P01" ||
		error.code === "PGRST205" ||
		/Could not find the table .* schema cache/i.test(error.message));

const isPermissionDeniedError = (error: unknown): boolean =>
	isPostgrestError(error) && error.code === "42501";

const isColumnMissingError = (error: unknown): boolean =>
	isPostgrestError(error) && (error.code === "42703" || /column .* does not exist/i.test(error.message));

const wrapAndThrowIfSchemaMissing = (error: unknown): never => {
	if (isTableMissingError(error) || isPermissionDeniedError(error) || isColumnMissingError(error)) {
		throw new RegistrationSettingsNotProvisionedError();
	}

	throw error as Error;
};

export const fetchRegistrationSettings = async (): Promise<RegistrationSettings> => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const client = supabase as any;
	const { data, error } = await client
		.from("registration_settings")
		.select("id, launch_pricing_enabled, sales_closed")
		.eq("id", REGISTRATION_SETTINGS_SINGLETON_ID)
		.maybeSingle();

	if (error) {
		wrapAndThrowIfSchemaMissing(error);
	}

	return mapRowToSettings((data ?? null) as RegistrationSettingsRowDb | null);
};

export const upsertRegistrationSettings = async (
	settings: RegistrationSettings
): Promise<void> => {
	const updatePayload: RegistrationSettingsUpdateDb = {
		launch_pricing_enabled: settings.launchPricingEnabled,
		sales_closed: settings.salesClosed,
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const client = supabase as any;

	const updateAttempt = await client
		.from("registration_settings")
		.update(updatePayload)
		.eq("id", REGISTRATION_SETTINGS_SINGLETON_ID)
		.select("id")
		.maybeSingle();

	if (updateAttempt.error) {
		if (
			isTableMissingError(updateAttempt.error) ||
			isPermissionDeniedError(updateAttempt.error) ||
			isColumnMissingError(updateAttempt.error)
		) {
			throw new RegistrationSettingsNotProvisionedError();
		}

		throw updateAttempt.error;
	}

	if (updateAttempt.data) {
		return;
	}

	const insertPayload: RegistrationSettingsInsertDb = {
		id: REGISTRATION_SETTINGS_SINGLETON_ID,
		launch_pricing_enabled: settings.launchPricingEnabled,
		sales_closed: settings.salesClosed,
	};

	const insertAttempt = await client
		.from("registration_settings")
		.insert([insertPayload])
		.select("id")
		.maybeSingle();

	if (insertAttempt.error) {
		if (
			isTableMissingError(insertAttempt.error) ||
			isPermissionDeniedError(insertAttempt.error) ||
			isColumnMissingError(insertAttempt.error)
		) {
			throw new RegistrationSettingsNotProvisionedError();
		}

		throw insertAttempt.error;
	}
};
