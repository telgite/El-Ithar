import { Router } from "express";
import { db, siteContentTable } from "@workspace/db";
import { UpdateContentBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";
import { writeCmsData } from "../lib/cmsData";

const router = Router();

// Public — list all site content
router.get("/content", async (_req, res): Promise<void> => {
  const items = await db.select().from(siteContentTable);
  res.json(items);
});

// Admin — upsert a content item by key
router.patch("/content/:key", requireAdmin, async (req, res): Promise<void> => {
  const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;

  const parsed = UpdateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .insert(siteContentTable)
    .values({ key, value: parsed.data.value })
    .onConflictDoUpdate({
      target: siteContentTable.key,
      set: { value: parsed.data.value, updatedAt: new Date() },
    })
    .returning();

  // Persist change to cms-data.json (no-op in production)
  await writeCmsData();

  res.json(item);
});

export default router;
