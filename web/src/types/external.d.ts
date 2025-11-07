declare module "openai" {
  export default class OpenAI {
    constructor(config: Record<string, unknown>);
    chat: {
      completions: {
        create(args: any): Promise<any>;
      };
    };
  }
}

declare module "openai/resources/chat/completions" {
  export type ChatCompletionMessageParam = any;
}

declare module "envalid" {
  export function cleanEnv<T>(env: NodeJS.ProcessEnv, validators: Record<string, unknown>, options?: Record<string, unknown>): T;
  export function str(options?: Record<string, unknown>): unknown;
  export function num(options?: Record<string, unknown>): unknown;
}

declare module "axios" {
  export interface AxiosInstance {
    get(url: string, config?: any): Promise<{ data: unknown }>;
    post?(url: string, data?: any, config?: any): Promise<{ data: unknown }>;
    [key: string]: any;
  }
  const axios: {
    create(config?: any): AxiosInstance;
  };
  export default axios;
}

declare module "pino" {
  export interface Logger {
    info(obj: any, msg?: string): void;
    warn(obj: any, msg?: string): void;
    error(obj: any, msg?: string): void;
  }
  const pino: (options?: any) => Logger;
  export default pino;
}

declare module "uuid" {
  export function v4(): string;
}

declare module "swr" {
  import type { ReactNode } from "react";
  export function SWRConfig(props: { value: Record<string, unknown>; children: ReactNode }): JSX.Element;
  export default function useSWR<T = unknown>(
    key: any,
    fetcher?: any
  ): { data: T | undefined; error: unknown; isLoading?: boolean };
}
