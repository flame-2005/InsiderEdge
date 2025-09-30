/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as bseInsiderTrading from "../bseInsiderTrading.js";
import type * as nseInsiderTrading from "../nseInsiderTrading.js";
import type * as schema_bseInsider from "../schema/bseInsider.js";
import type * as schema_nseInsider from "../schema/nseInsider.js";
import type * as schema_unifiedInsider from "../schema/unifiedInsider.js";
import type * as schema_user from "../schema/user.js";
import type * as unifiedInsiderTrading from "../unifiedInsiderTrading.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  bseInsiderTrading: typeof bseInsiderTrading;
  nseInsiderTrading: typeof nseInsiderTrading;
  "schema/bseInsider": typeof schema_bseInsider;
  "schema/nseInsider": typeof schema_nseInsider;
  "schema/unifiedInsider": typeof schema_unifiedInsider;
  "schema/user": typeof schema_user;
  unifiedInsiderTrading: typeof unifiedInsiderTrading;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
