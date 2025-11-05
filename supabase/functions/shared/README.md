# Shared utilities for Supabase Edge Functions

This directory contains small utilities that are imported by multiple Edge
Functions that run on Supabase's Deno-based runtime. They provide thin wrappers
around environment access, Supabase client creation, typed responses, and the
generated database types so that each function can stay focused on its own
business logic.

## File overview

### `env.ts`
Exports `requireEnv`, a helper that reads environment variables from the Deno
runtime. The function throws a clear error when a required variable is missing,
which prevents edge functions from starting without the secrets they rely on.

### `client.ts`
Defines `createServiceRoleClient`, a factory that builds a Supabase client using
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The client opts out of session
persistence and auto-refresh so it is safe to use in short-lived server contexts
such as Edge Functions.

### `response.ts`
Provides helpers for returning consistent HTTP responses:

- `jsonResponse` wraps arbitrary payloads in a JSON response with the CORS
  headers expected by the frontend.
- `emptyResponse` builds an empty response (defaults to HTTP 204) with the same
  CORS configuration.
- `errorResponse` standardises error bodies by returning a JSON payload that
  includes a message, status, and optional diagnostic details.

### `types.ts`
Contains the TypeScript definitions for the public schema of the Supabase
PostgreSQL database. The exported helpers (`Tables`, `TablesRow`, `TablesInsert`,
and `TablesUpdate`) make it easy to infer strongly typed rows and mutations for
any table when writing database queries.

### `index.ts`
Acts as a barrel file that re-exports the utilities above. Importing from this
single module keeps Edge Functions decoupled from the internal directory
structure while still providing access to the environment, client, response, and
typed database helpers.
