import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, socialMediaTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";
import { writeCmsData } from "../lib/cmsData";

const router = Router();

// ── Public — only enabled + visible + has URL ──────────────────────────────
router.get("/social", async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(socialMediaTable)
    .orderBy(asc(socialMediaTable.sortOrder), asc(socialMediaTable.id));

  res.json(items.filter((s) => s.enabled && s.visible && s.url.trim() !== ""));
});

// ── Admin — all platforms (including disabled/hidden) ──────────────────────
router.get("/admin/social", requireAdmin, async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(socialMediaTable)
    .orderBy(asc(socialMediaTable.sortOrder), asc(socialMediaTable.id));
  res.json(items);
});

// ── Admin — update a platform ──────────────────────────────────────────────
router.patch("/admin/social/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { url, enabled, visible } = req.body as {
    url?: unknown;
    enabled?: unknown;
    visible?: unknown;
  };

  const patch: Record<string, unknown> = {};
  if (typeof url === "string") patch.url = url;
  if (typeof enabled === "boolean") patch.enabled = enabled;
  if (typeof visible === "boolean") patch.visible = visible;

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [item] = await db
    .update(socialMediaTable)
    .set(patch)
    .where(eq(socialMediaTable.id, id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Platform not found" });
    return;
  }

  await writeCmsData();
  res.json(item);
});

export default router;
