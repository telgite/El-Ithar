/**
 * cms-data.json is the bootstrap seed for a blank database.
 *
 * Architecture:
 *  - The production PostgreSQL database is the permanent source of truth.
 *  - applyCmsData() runs ONLY on a truly fresh installation (all four CMS tables empty).
 *    After that first boot, production content lives exclusively in the database.
 *  - writeCmsData() (dev-only, no-op in production) keeps cms-data.json in sync with
 *    the dev database so that fresh dev environments still get sensible initial data.
 *
 * The file lives at artifacts/api-server/cms-data.json (repo root-relative).
 * Both dev and prod run from the workspace root, so process.cwd() resolves it correctly.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { asc, notInArray, sql } from "drizzle-orm";
import {
  db,
  activitiesTable,
  activityImagesTable,
  siteContentTable,
  galleriesTable,
  galleryImagesTable,
  socialMediaTable,
} from "@workspace/db";
import { logger } from "./logger";

// Dev:  pnpm sets CWD to the package dir → artifacts/api-server/
// Prod: deployed as `node artifacts/api-server/dist/index.mjs` from workspace root
const CMS_DATA_PATH = (() => {
  const devPath = resolve(process.cwd(), "cms-data.json");
  if (existsSync(devPath)) return devPath;
  return resolve(process.cwd(), "artifacts/api-server/cms-data.json");
})();

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CmsImage {
  id: number;
  objectPath: string;
  altText: string;
  sortOrder: number;
}

export interface CmsActivity {
  id: number;
  title: string;
  description: string;
  stat: string;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
  images: CmsImage[];
}

export interface CmsContentItem {
  key: string;
  value: string;
}

export interface CmsGallery {
  id: number;
  slug: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  images: CmsImage[];
}

export interface CmsSocialMedia {
  id: number;
  platform: string;
  name: string;
  url: string;
  enabled: boolean;
  visible: boolean;
  sortOrder: number;
}

export interface CmsData {
  version: number;
  exportedAt: string;
  content: CmsContentItem[];
  activities: CmsActivity[];
  galleries: CmsGallery[];
  socialMedia?: CmsSocialMedia[];
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function loadCmsData(): CmsData {
  const raw = readFileSync(CMS_DATA_PATH, "utf-8");
  const data = JSON.parse(raw) as CmsData;
  // Backwards compat: older files without galleries key
  if (!data.galleries) data.galleries = [];
  return data;
}

// ── Write (dev only) ──────────────────────────────────────────────────────────

/**
 * Reads the current state of the DB and writes it to cms-data.json.
 * No-op in production — the file is baked into the bundle at build time.
 */
export async function writeCmsData(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  try {
    const [activities, actImages, content, galleries, galleryImages, socialMedia] = await Promise.all([
      db
        .select()
        .from(activitiesTable)
        .orderBy(asc(activitiesTable.sortOrder), asc(activitiesTable.id)),
      db
        .select()
        .from(activityImagesTable)
        .orderBy(
          asc(activityImagesTable.activityId),
          asc(activityImagesTable.sortOrder),
          asc(activityImagesTable.id),
        ),
      db
        .select()
        .from(siteContentTable)
        .orderBy(asc(siteContentTable.id)),
      db
        .select()
        .from(galleriesTable)
        .orderBy(asc(galleriesTable.sortOrder), asc(galleriesTable.id)),
      db
        .select()
        .from(galleryImagesTable)
        .orderBy(
          asc(galleryImagesTable.galleryId),
          asc(galleryImagesTable.sortOrder),
          asc(galleryImagesTable.id),
        ),
      db
        .select()
        .from(socialMediaTable)
        .orderBy(asc(socialMediaTable.sortOrder), asc(socialMediaTable.id)),
    ]);

    const data: CmsData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      content: content.map((c) => ({ key: c.key, value: c.value })),
      socialMedia: socialMedia.map((s) => ({
        id: s.id,
        platform: s.platform,
        name: s.name,
        url: s.url,
        enabled: s.enabled,
        visible: s.visible,
        sortOrder: s.sortOrder,
      })),
      activities: activities.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        stat: a.stat,
        iconName: a.iconName,
        sortOrder: a.sortOrder,
        isActive: a.isActive,
        images: actImages
          .filter((img) => img.activityId === a.id)
          .map((img) => ({
            id: img.id,
            objectPath: img.objectPath,
            altText: img.altText,
            sortOrder: img.sortOrder,
          })),
      })),
      galleries: galleries.map((g) => ({
        id: g.id,
        slug: g.slug,
        title: g.title,
        sortOrder: g.sortOrder,
        isActive: g.isActive,
        images: galleryImages
          .filter((img) => img.galleryId === g.id)
          .map((img) => ({
            id: img.id,
            objectPath: img.objectPath,
            altText: img.altText,
            sortOrder: img.sortOrder,
          })),
      })),
    };

    writeFileSync(CMS_DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    logger.info("cms-data.json updated");
  } catch (err) {
    // Never let a file-write failure break the HTTP response
    logger.error({ err }, "Failed to write cms-data.json");
  }
}

// ── Apply (startup upsert) ────────────────────────────────────────────────────

/**
 * Upserts all data from cms-data.json into the DB.
 * Runs on every startup in both dev and production so the DB always
 * reflects the committed JSON file.
 */
export async function applyCmsData(data: CmsData): Promise<void> {
  const { content, activities, galleries = [], socialMedia = [] } = data;

  // ── Activities ──────────────────────────────────────────────────────────────

  for (const activity of activities) {
    await db
      .insert(activitiesTable)
      .values({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        stat: activity.stat,
        iconName: activity.iconName,
        sortOrder: activity.sortOrder,
        isActive: activity.isActive,
      })
      .onConflictDoUpdate({
        target: activitiesTable.id,
        set: {
          title: activity.title,
          description: activity.description,
          stat: activity.stat,
          iconName: activity.iconName,
          sortOrder: activity.sortOrder,
          isActive: activity.isActive,
          updatedAt: new Date(),
        },
      });
  }

  const activityIds = activities.map((a) => a.id);
  if (activityIds.length > 0) {
    await db.delete(activitiesTable).where(notInArray(activitiesTable.id, activityIds));
  } else {
    await db.delete(activitiesTable);
  }

  const allActImages = activities.flatMap((a) =>
    a.images.map((img) => ({ ...img, activityId: a.id })),
  );
  for (const img of allActImages) {
    await db
      .insert(activityImagesTable)
      .values({
        id: img.id,
        activityId: img.activityId,
        objectPath: img.objectPath,
        altText: img.altText,
        sortOrder: img.sortOrder,
      })
      .onConflictDoUpdate({
        target: activityImagesTable.id,
        set: { objectPath: img.objectPath, altText: img.altText, sortOrder: img.sortOrder },
      });
  }

  const actImageIds = allActImages.map((img) => img.id);
  if (actImageIds.length > 0) {
    await db.delete(activityImagesTable).where(notInArray(activityImagesTable.id, actImageIds));
  } else {
    await db.delete(activityImagesTable);
  }

  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('activities', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 0) FROM activities) + 1, 1)
    )
  `);
  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('activity_images', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 0) FROM activity_images) + 1, 1)
    )
  `);

  // ── Galleries ───────────────────────────────────────────────────────────────

  for (const gallery of galleries) {
    await db
      .insert(galleriesTable)
      .values({
        id: gallery.id,
        slug: gallery.slug,
        title: gallery.title,
        sortOrder: gallery.sortOrder,
        isActive: gallery.isActive,
      })
      .onConflictDoUpdate({
        target: galleriesTable.id,
        set: {
          slug: gallery.slug,
          title: gallery.title,
          sortOrder: gallery.sortOrder,
          isActive: gallery.isActive,
          updatedAt: new Date(),
        },
      });
  }

  const galleryIds = galleries.map((g) => g.id);
  if (galleryIds.length > 0) {
    await db.delete(galleriesTable).where(notInArray(galleriesTable.id, galleryIds));
  } else {
    await db.delete(galleriesTable);
  }

  const allGalleryImages = galleries.flatMap((g) =>
    g.images.map((img) => ({ ...img, galleryId: g.id })),
  );
  for (const img of allGalleryImages) {
    await db
      .insert(galleryImagesTable)
      .values({
        id: img.id,
        galleryId: img.galleryId,
        objectPath: img.objectPath,
        altText: img.altText,
        sortOrder: img.sortOrder,
      })
      .onConflictDoUpdate({
        target: galleryImagesTable.id,
        set: { objectPath: img.objectPath, altText: img.altText, sortOrder: img.sortOrder },
      });
  }

  const galleryImageIds = allGalleryImages.map((img) => img.id);
  if (galleryImageIds.length > 0) {
    await db.delete(galleryImagesTable).where(notInArray(galleryImagesTable.id, galleryImageIds));
  } else {
    await db.delete(galleryImagesTable);
  }

  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('galleries', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 0) FROM galleries) + 1, 1)
    )
  `);
  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('gallery_images', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 0) FROM gallery_images) + 1, 1)
    )
  `);

  // ── Social Media ─────────────────────────────────────────────────────────────

  for (const sm of socialMedia) {
    await db
      .insert(socialMediaTable)
      .values({
        id: sm.id,
        platform: sm.platform,
        name: sm.name,
        url: sm.url,
        enabled: sm.enabled,
        visible: sm.visible,
        sortOrder: sm.sortOrder,
      })
      .onConflictDoUpdate({
        target: socialMediaTable.platform,
        set: {
          name: sm.name,
          url: sm.url,
          enabled: sm.enabled,
          visible: sm.visible,
          sortOrder: sm.sortOrder,
        },
      });
  }

  // ── Site Content ────────────────────────────────────────────────────────────

  for (const item of content) {
    await db
      .insert(siteContentTable)
      .values({ key: item.key, value: item.value })
      .onConflictDoUpdate({
        target: siteContentTable.key,
        set: { value: item.value, updatedAt: new Date() },
      });
  }

  const contentKeys = content.map((c) => c.key);
  if (contentKeys.length > 0) {
    await db.delete(siteContentTable).where(notInArray(siteContentTable.key, contentKeys));
  } else {
    await db.delete(siteContentTable);
  }

  logger.info("cms-data.json applied to database");
}
