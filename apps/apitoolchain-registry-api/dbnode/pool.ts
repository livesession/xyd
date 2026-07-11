import pg from "pg";
import { config } from "../config";

/** Shared pg pool. sqlc-generated query functions accept this as `Client`. */
export const pool = new pg.Pool({ connectionString: config.databaseUrl });
