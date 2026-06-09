import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type Env = Record<string, string>;

const env = {
  ...loadEnvFile(".env.local"),
  ...process.env,
} as Env;

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const firstEmail = env.SUPABASE_TEST_EMAIL_1;
const firstPassword = env.SUPABASE_TEST_PASSWORD_1;
const secondEmail = env.SUPABASE_TEST_EMAIL_2;
const secondPassword = env.SUPABASE_TEST_PASSWORD_2;

if (!supabaseUrl || !anonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local.");
}

const restUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
const authUrl = `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;

async function main() {
  const anonResult = await getWorkoutLogs();
  if (anonResult.ok) {
    throw new Error("Anon role unexpectedly read workout_logs. Check grants/RLS before app integration.");
  }

  console.log(`Anon blocked as expected (${anonResult.status}).`);

  if (!firstEmail || !firstPassword || !secondEmail || !secondPassword) {
    console.log("Authenticated checks skipped. Add SUPABASE_TEST_EMAIL_1/2 and SUPABASE_TEST_PASSWORD_1/2 to .env.local.");
    return;
  }

  const firstToken = await signIn(firstEmail, firstPassword);
  const secondToken = await signIn(secondEmail, secondPassword);

  await assertAuthenticatedWorkoutRead("first user", firstToken);
  await assertAuthenticatedWorkoutRead("second user", secondToken);
}

async function assertAuthenticatedWorkoutRead(label: string, token: string) {
  const result = await getWorkoutLogs(token);
  if (!result.ok) {
    throw new Error(`${label} could not read workout_logs: ${result.status} ${result.body}`);
  }

  const rows = JSON.parse(result.body) as { title?: string }[];
  const hasTestWorkout = rows.some((row) => row.title === "Supabase Test Workout");
  if (!hasTestWorkout) {
    throw new Error(`${label} read workout_logs but did not see Supabase Test Workout.`);
  }

  console.log(`${label} can read shared workout_logs.`);
}

async function getWorkoutLogs(accessToken?: string) {
  const response = await fetch(`${restUrl}/workout_logs?select=title`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${accessToken || anonKey}`,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.text(),
  };
}

async function signIn(email: string, password: string) {
  const response = await fetch(`${authUrl}/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`Sign-in failed for ${email}: ${JSON.stringify(body)}`);
  }

  return body.access_token as string;
}

function loadEnvFile(filename: string): Env {
  const path = resolve(filename);
  if (!existsSync(path)) return {};

  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .reduce<Env>((values, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return values;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return values;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      values[key] = value;
      return values;
    }, {});
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
