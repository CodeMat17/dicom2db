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
import type * as achievements from "../achievements.js";
import type * as achievementsStat from "../achievementsStat.js";
import type * as collaborators from "../collaborators.js";
import type * as events from "../events.js";
import type * as heroSlides from "../heroSlides.js";
import type * as statements from "../statements.js";
import type * as storage from "../storage.js";
import type * as teamMembers from "../teamMembers.js";
import type * as testimonials from "../testimonials.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  achievementsStat: typeof achievementsStat;
  collaborators: typeof collaborators;
  events: typeof events;
  heroSlides: typeof heroSlides;
  statements: typeof statements;
  storage: typeof storage;
  teamMembers: typeof teamMembers;
  testimonials: typeof testimonials;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
