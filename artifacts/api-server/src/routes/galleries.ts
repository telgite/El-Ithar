import { Router } from "express";
import { and, eq, asc, inArray, sql } from "drizzle-orm";
import { db, galleriesTable, galleryImagesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";
import { writeCmsData } from "../lib/cmsData";

const router = Router();

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

function slugify(title: string, id: number): string {
  const base = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");
  return base || `gallery-${id}`;
}

async function getGalleriesWithImages() {
  const [galleries, images] = await Promise.all([
    db.select().from(galleriesTable).orderBy(asc(galleriesTable.sortOrder), asc(galleriesTable.id)),
    db.select().from(galleryImagesTable).orderBy(
      asc(galleryImagesTable.galleryId),
      asc(galleryImagesTable.sortOrder),
      asc(galleryImagesTable.id),
    ),
  ]);
  return galleries.map((g) => ({
    ...g,
    images: images.filter((img) => img.galleryId === g.id),
  }));
}

// ── Public ────────────────────────────────────────────────────────────────────

router.get("/galleries", async (_req, res): Promise<void> => {
  const galleries = await getGalleriesWithImages();
  res.json(galleries);
});

router.get("/galleries/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const [gallery] = await db.select().from(galleriesTable).where(eq(galleriesTable.id, id));
  if (!gallery) { res.status(404).json({ error: "المعرض غير موجود" }); return; }

  const images = await db
    .select()
    .from(galleryImagesTable)
    .where(eq(galleryImagesTable.galleryId, id))
    .orderBy(asc(galleryImagesTable.sortOrder), asc(galleryImagesTable.id));

  res.json({ ...gallery, images });
});

// ── Admin ─────────────────────────────────────────────────────────────────────

router.post("/galleries", requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) { res.status(400).json({ error: "العنوان مطلوب" }); return; }

  const explicitSlug = typeof body.slug === "string" ? body.slug.trim() : "";
  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;

  const [gallery] = await db
    .insert(galleriesTable)
    .values({ title, slug: explicitSlug || `temp-${Date.now()}`, sortOrder })
    .returning();

  if (!explicitSlug) {
    const [updated] = await db
      .update(galleriesTable)
      .set({ slug: slugify(title, gallery.id) })
      .where(eq(galleriesTable.id, gallery.id))
      .returning();
    await writeCmsData();
    res.status(201).json({ ...updated, images: [] });
    return;
  }

  await writeCmsData();
  res.status(201).json({ ...gallery, images: [] });
});

router.patch("/galleries/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const body = req.body as Record<string, unknown>;
  const update: {
    title?: string; slug?: string; sortOrder?: number; isActive?: boolean; updatedAt: Date;
  } = { updatedAt: new Date() };

  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body.slug === "string" && body.slug.trim()) update.slug = body.slug.trim();
  if (typeof body.sortOrder === "number") update.sortOrder = body.sortOrder;
  if (typeof body.isActive === "boolean") update.isActive = body.isActive;

  const [gallery] = await db
    .update(galleriesTable)
    .set(update)
    .where(eq(galleriesTable.id, id))
    .returning();

  if (!gallery) { res.status(404).json({ error: "المعرض غير موجود" }); return; }

  const images = await db
    .select()
    .from(galleryImagesTable)
    .where(eq(galleryImagesTable.galleryId, id))
    .orderBy(asc(galleryImagesTable.sortOrder));

  await writeCmsData();
  res.json({ ...gallery, images });
});

router.delete("/galleries/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  await db.delete(galleriesTable).where(eq(galleriesTable.id, id));
  await writeCmsData();
  res.sendStatus(204);
});

router.post("/galleries/:id/images", requireAdmin, async (req, res): Promise<void> => {
  const galleryId = parseId(req.params.id);
  if (isNaN(galleryId)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  // Verify gallery exists
  const [gallery] = await db.select({ id: galleriesTable.id }).from(galleriesTable).where(eq(galleriesTable.id, galleryId));
  if (!gallery) { res.status(404).json({ error: "المعرض غير موجود" }); return; }

  const body = req.body as Record<string, unknown>;
  const objectPath = typeof body.objectPath === "string" ? body.objectPath.trim() : "";
  if (!objectPath) { res.status(400).json({ error: "مسار الصورة مطلوب" }); return; }

  const result = await db.execute(
    sql`SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM gallery_images WHERE gallery_id = ${galleryId}`
  );
  const nextSort = Number((result.rows[0] as Record<string, unknown>).next ?? 1);

  const [image] = await db
    .insert(galleryImagesTable)
    .values({
      galleryId,
      objectPath,
      altText: typeof body.altText === "string" ? body.altText.trim() : "",
      sortOrder: nextSort,
    })
    .returning();

  await writeCmsData();
  res.status(201).json(image);
});

// PUT order must come before /:imgId to avoid route conflict
router.put("/galleries/:id/images/order", requireAdmin, async (req, res): Promise<void> => {
  const galleryId = parseId(req.params.id);
  if (isNaN(galleryId)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const { orderedIds } = req.body as { orderedIds?: unknown };
  if (!Array.isArray(orderedIds) || orderedIds.some((x) => typeof x !== "number")) {
    res.status(400).json({ error: "orderedIds يجب أن تكون مصفوفة من الأرقام" }); return;
  }

  // Validate all IDs belong to this gallery
  if (orderedIds.length > 0) {
    const owned = await db
      .select({ id: galleryImagesTable.id })
      .from(galleryImagesTable)
      .where(
        and(
          eq(galleryImagesTable.galleryId, galleryId),
          inArray(galleryImagesTable.id, orderedIds as number[]),
        ),
      );
    if (owned.length !== orderedIds.length) {
      res.status(400).json({ error: "بعض المعرّفات لا تنتمي لهذا المعرض" }); return;
    }
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(galleryImagesTable)
      .set({ sortOrder: i + 1 })
      .where(
        and(
          eq(galleryImagesTable.id, orderedIds[i] as number),
          eq(galleryImagesTable.galleryId, galleryId),
        ),
      );
  }

  await writeCmsData();

  const images = await db
    .select()
    .from(galleryImagesTable)
    .where(eq(galleryImagesTable.galleryId, galleryId))
    .orderBy(asc(galleryImagesTable.sortOrder));

  res.json(images);
});

router.patch("/galleries/:id/images/:imgId", requireAdmin, async (req, res): Promise<void> => {
  const galleryId = parseId(req.params.id);
  const imgId = parseId(req.params.imgId);
  if (isNaN(galleryId) || isNaN(imgId)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const body = req.body as Record<string, unknown>;
  const update: { objectPath?: string; altText?: string } = {};
  if (typeof body.objectPath === "string" && body.objectPath.trim()) update.objectPath = body.objectPath.trim();
  if (typeof body.altText === "string") update.altText = body.altText.trim();

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "لا توجد حقول للتحديث" }); return;
  }

  // Scope update to both galleryId AND imgId
  const [image] = await db
    .update(galleryImagesTable)
    .set(update)
    .where(
      and(
        eq(galleryImagesTable.id, imgId),
        eq(galleryImagesTable.galleryId, galleryId),
      ),
    )
    .returning();

  if (!image) { res.status(404).json({ error: "الصورة غير موجودة في هذا المعرض" }); return; }

  await writeCmsData();
  res.json(image);
});

router.delete("/galleries/:id/images/:imgId", requireAdmin, async (req, res): Promise<void> => {
  const galleryId = parseId(req.params.id);
  const imgId = parseId(req.params.imgId);
  if (isNaN(galleryId) || isNaN(imgId)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  // Scope delete to both galleryId AND imgId
  const [deleted] = await db
    .delete(galleryImagesTable)
    .where(
      and(
        eq(galleryImagesTable.id, imgId),
        eq(galleryImagesTable.galleryId, galleryId),
      ),
    )
    .returning({ id: galleryImagesTable.id });

  if (!deleted) { res.status(404).json({ error: "الصورة غير موجودة في هذا المعرض" }); return; }

  await writeCmsData();
  res.sendStatus(204);
});

export default router;
