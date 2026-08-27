import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, activitiesTable, activityImagesTable } from "@workspace/db";
import {
  CreateActivityBody,
  UpdateActivityBody,
  AddActivityImageBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";
import { writeCmsData } from "../lib/cmsData";

const router = Router();

function parseId(raw: string | string[]): number {
  const str = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(str, 10);
}

async function getActivitiesWithImages() {
  const [activities, images] = await Promise.all([
    db
      .select()
      .from(activitiesTable)
      .orderBy(asc(activitiesTable.sortOrder), asc(activitiesTable.id)),
    db
      .select()
      .from(activityImagesTable)
      .orderBy(asc(activityImagesTable.sortOrder), asc(activityImagesTable.id)),
  ]);

  return activities.map((activity) => ({
    ...activity,
    images: images.filter((img) => img.activityId === activity.id),
  }));
}

// Public — list all activities with images
router.get("/activities", async (_req, res): Promise<void> => {
  const activities = await getActivitiesWithImages();
  res.json(activities);
});

// Admin — create activity
router.post("/activities", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [activity] = await db
    .insert(activitiesTable)
    .values(parsed.data)
    .returning();

  await writeCmsData();

  res.status(201).json({ ...activity, images: [] });
});

// Public — get single activity with images
router.get("/activities/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  const [activity] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, id));
  if (!activity) {
    res.status(404).json({ error: "النشاط غير موجود" });
    return;
  }
  const images = await db
    .select()
    .from(activityImagesTable)
    .where(eq(activityImagesTable.activityId, id))
    .orderBy(asc(activityImagesTable.sortOrder));
  res.json({ ...activity, images });
});

// Admin — update activity
router.patch("/activities/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  const parsed = UpdateActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [activity] = await db
    .update(activitiesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(activitiesTable.id, id))
    .returning();
  if (!activity) {
    res.status(404).json({ error: "النشاط غير موجود" });
    return;
  }
  const images = await db
    .select()
    .from(activityImagesTable)
    .where(eq(activityImagesTable.activityId, id))
    .orderBy(asc(activityImagesTable.sortOrder));

  await writeCmsData();

  res.json({ ...activity, images });
});

// Admin — delete activity
router.delete("/activities/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  await db.delete(activitiesTable).where(eq(activitiesTable.id, id));

  await writeCmsData();

  res.sendStatus(204);
});

// Public — list images for activity
router.get("/activities/:id/images", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  const images = await db
    .select()
    .from(activityImagesTable)
    .where(eq(activityImagesTable.activityId, id))
    .orderBy(asc(activityImagesTable.sortOrder));
  res.json(images);
});

// Admin — add image to activity
router.post(
  "/activities/:id/images",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = parseId(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    const parsed = AddActivityImageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [image] = await db
      .insert(activityImagesTable)
      .values({ activityId: id, ...parsed.data })
      .returning();

    await writeCmsData();

    res.status(201).json(image);
  },
);

// Admin — delete image from activity
router.delete(
  "/activities/:activityId/images/:imageId",
  requireAdmin,
  async (req, res): Promise<void> => {
    const activityId = parseId(req.params.activityId);
    const imageId = parseId(req.params.imageId);
    if (isNaN(activityId) || isNaN(imageId)) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    await db
      .delete(activityImagesTable)
      .where(eq(activityImagesTable.id, imageId));

    await writeCmsData();

    res.sendStatus(204);
  },
);

export default router;
