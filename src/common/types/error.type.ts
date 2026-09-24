export interface CustomDatabaseError extends Error {
  // Prisma properties
  code?: string;
  meta?: {
    target?: string[] | string;
    field_name?: string;
    modelName?: string;
    cause?: string;
    [key: string]: unknown;
  };
  clientVersion?: string;

  // Legacy/Other ORM properties
  original?: { message?: string };
  parent?: { message?: string };
  sql?: string;
  fields?: Record<string, unknown>;
}
