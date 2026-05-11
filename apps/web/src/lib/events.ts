import type {
  AnalyticsEventName,
  JsonValue,
} from "@ornava/shared";
import { getPool } from "./db";

type EventPropertiesInput = Record<string, JsonValue | undefined>;

export function compactEventProperties(properties: EventPropertiesInput = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  ) as Record<string, JsonValue>;
}

export async function logAnalyticsEvent(input: {
  userId?: string | null;
  name: AnalyticsEventName;
  properties?: EventPropertiesInput;
}) {
  await getPool().query(
    `
      insert into events (user_id, event_name, properties)
      values ($1, $2, $3::jsonb)
    `,
    [
      input.userId ?? null,
      input.name,
      JSON.stringify(compactEventProperties(input.properties)),
    ],
  );
}

export async function logAnalyticsEventSafe(input: {
  userId?: string | null;
  name: AnalyticsEventName;
  properties?: EventPropertiesInput;
}) {
  try {
    await logAnalyticsEvent(input);
  } catch (error) {
    console.error("[events]", error);
  }
}
