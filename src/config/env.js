const required = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"];

export function getEnv() {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const row = Number(process.env.ROW ?? 10);

  return {
    port: Number(process.env.PORT ?? 3000),
    row: Number.isInteger(row) && row > 0 ? row : 10,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY
  };
}
