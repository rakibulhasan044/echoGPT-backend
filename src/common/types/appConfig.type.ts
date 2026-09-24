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
  healthCheckEnabled?: boolean;
  performanceWarningThreshold?: string;

  // JWT
  jwtAccessSecret?: string;
  jwtAccessExpiresIn?: string;
  jwtRefreshExpiresInDays?: string;

  // Mail
  mailPass?: string;
  mailHost?: string;
  mailPort?: number;
  mailUser?: string;
  mailFrom?: string;

  // OTP
  otpSecret?: string;
  otpMaxAttempt?: number;
  otpExpiresInMins?: number;
};
