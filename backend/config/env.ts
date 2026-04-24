import dotenv from "dotenv";

dotenv.config();

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  metaAccessToken: process.env.META_ACCESS_TOKEN || process.env.META_ADS_ACCESS_TOKEN || "",
  metaGraphVersion: process.env.META_GRAPH_VERSION || "v19.0",
  metaAppId: process.env.META_APP_ID || "",
  metaAppSecret: process.env.META_APP_SECRET || "",
  metaRedirectUri: process.env.META_REDIRECT_URI || "http://localhost:3000/api/meta/callback",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  reportsDir: process.env.REPORTS_DIR || "generated-reports",
};

