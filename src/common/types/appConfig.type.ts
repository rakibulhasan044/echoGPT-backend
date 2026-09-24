export type AppConfig = {
  nodeEnv: string;
  name: string;
  apiUrl?: string;
  workingDirectory: string;
  frontendDomain?: string;
  backendDomain: string;
  port: number;
  apiPrefix: string;
  swaggerPath?: string;
};
