/**
 * Sigma Tracker — Cloudflare Workers
 *
 * REST API for BKT + SM-2 learning tracking.
 * Replaces the MCP server — called via WebFetch from Claude Code skills.
 *
 * Auth: Bearer token in Authorization header
 *   - Token is hashed to derive userId (multi-user isolation)
 *   - Set via: wrangler secret put SIGMA_SECRET
 *     or use per-user tokens if deploying for others
 *
 * Routes:
 *   POST  /record           record_learning
 *   GET   /progress         get_progress?topic=&period=
 *   GET   /review-plan      get_review_plan?limit=&include_future=
 *   GET   /mastery/:topic   assess_mastery?threshold=
 *   POST  /topics           manage_topics (action in body)
 *   POST  /prerequisites    set_prerequisites (action in body)
 *   GET   /health           健康检查
 */

import { KVStore } from "./kv/store";
import { handleRecord } from "./handlers/record";
import { handleProgress } from "./handlers/progress";
import { handleReviewPlan } from "./handlers/review";
import { handleMastery } from "./handlers/mastery";
import { handleTopics } from "./handlers/topics";
import { handlePrerequisites } from "./handlers/prerequisites";

export interface Env {
  KV: KVNamespace;
  SIGMA_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // ── CORS preflight ───────────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // ── Health check（无需鉴权）──────────────────────────────────────────
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ status: "ok", version: "1.0.0" });
    }

    // ── Auth ─────────────────────────────────────────────────────────────
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token || token !== env.SIGMA_SECRET) {
      return json({ error: "Unauthorized" }, 401);
    }

    // userId = token 摘要前8位，用于 KV key 隔离
    // 如果你想支持多用户，改为从 JWT 或独立 token 表中派生
    const userId = await shortHash(token);
    const store = new KVStore(env.KV, userId);

    try {
      // ── Routes ────────────────────────────────────────────────────────
      const path = url.pathname;

      // POST /record
      if (path === "/record" && request.method === "POST") {
        const body = await request.json();
        const result = await handleRecord(body, store);
        return json(result);
      }

      // GET /progress
      if (path === "/progress" && request.method === "GET") {
        const topic = url.searchParams.get("topic");
        const period = url.searchParams.get("period") ?? "all";
        const result = await handleProgress(topic, period, store);
        return json(result);
      }

      // GET /review-plan
      if (path === "/review-plan" && request.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") ?? "20");
        const includeFuture = url.searchParams.get("include_future") === "true";
        const result = await handleReviewPlan(limit, includeFuture, store);
        return json(result);
      }

      // GET /mastery/:topic  (e.g. /mastery/Python%2F装饰器)
      if (path.startsWith("/mastery/") && request.method === "GET") {
        const topic = decodeURIComponent(path.replace("/mastery/", ""));
        const threshold = parseFloat(url.searchParams.get("threshold") ?? "0.6");
        const result = await handleMastery(topic, threshold, store);
        return json(result);
      }

      // POST /topics
      if (path === "/topics" && request.method === "POST") {
        const body = await request.json();
        const result = await handleTopics(body, store);
        return json(result);
      }

      // POST /prerequisites
      if (path === "/prerequisites" && request.method === "POST") {
        const body = await request.json();
        const result = await handlePrerequisites(body, store);
        return json(result);
      }

      return json({ error: `Not found: ${request.method} ${path}` }, 404);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return json({ error: message }, 400);
    }
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}

async function shortHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 8);
}
