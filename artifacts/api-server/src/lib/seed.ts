import bcryptjs from "bcryptjs";
import { sql } from "drizzle-orm";
import {
  db,
  adminUsersTable,
  activitiesTable,
  galleriesTable,
  galleryImagesTable,
  siteContentTable,
  socialMediaTable,
} from "@workspace/db";
import { logger } from "./logger";
import { loadCmsData, applyCmsData } from "./cmsData";

export async function seedDatabase(): Promise<void> {
  try {
    // ── Session table (connect-pg-simple bundling strips the SQL file) ──────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);

    // ── Galleries tables ─────────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "galleries" (
        "id" serial PRIMARY KEY,
        "slug" text NOT NULL UNIQUE,
        "title" text NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "gallery_images" (
        "id" serial PRIMARY KEY,
        "gallery_id" integer NOT NULL REFERENCES "galleries"("id") ON DELETE CASCADE,
        "object_path" text NOT NULL,
        "alt_text" text NOT NULL DEFAULT '',
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ── Social media table ───────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "social_media" (
        "id" serial PRIMARY KEY,
        "platform" text NOT NULL UNIQUE,
        "name" text NOT NULL,
        "url" text NOT NULL DEFAULT '',
        "enabled" boolean NOT NULL DEFAULT false,
        "visible" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0
      )
    `);

    // ── Default admin user ───────────────────────────────────────────────────
    const existingAdmins = await db
      .select({ id: adminUsersTable.id })
      .from(adminUsersTable)
      .limit(1);

    if (existingAdmins.length === 0) {
      const hash = await bcryptjs.hash("ithar@2024", 12);
      await db
        .insert(adminUsersTable)
        .values({ username: "admin", passwordHash: hash });
      logger.info("Created default admin user — username: admin, password: ithar@2024");
    }

    // ── Bootstrap from cms-data.json ONLY on a truly fresh installation ──────
    // All four CMS tables must be empty before we seed. If any table already
    // has data the database has been initialised before and we must not
    // overwrite it — the production DB is the permanent source of truth.
    const [actCount, galCount, galImgCount, contentCount] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(activitiesTable),
      db.select({ n: sql<number>`count(*)::int` }).from(galleriesTable),
      db.select({ n: sql<number>`count(*)::int` }).from(galleryImagesTable),
      db.select({ n: sql<number>`count(*)::int` }).from(siteContentTable),
    ]);

    const isFreshInstall =
      actCount[0].n === 0 &&
      galCount[0].n === 0 &&
      galImgCount[0].n === 0 &&
      contentCount[0].n === 0;

    if (isFreshInstall) {
      logger.info(
        "Fresh installation detected — bootstrapping from cms-data.json",
      );
      await applyCmsData(loadCmsData());
    } else {
      logger.info(
        `Database already initialised (activities=${actCount[0].n}, galleries=${galCount[0].n}, gallery_images=${galImgCount[0].n}, site_content=${contentCount[0].n}) — skipping bootstrap`,
      );
    }

    // ── Social media — always seed if the table is empty ─────────────────────
    // This handles both fresh installs (after bootstrap) and existing DBs being
    // upgraded to include social media management for the first time.
    const [smCount] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(socialMediaTable);

    if (smCount.n === 0) {
      await db.insert(socialMediaTable).values([
        { platform: "facebook",  name: "Facebook",  url: "", enabled: true,  visible: true,  sortOrder: 0 },
        { platform: "instagram", name: "Instagram", url: "", enabled: false, visible: false, sortOrder: 1 },
        { platform: "twitter",   name: "Twitter",   url: "", enabled: false, visible: false, sortOrder: 2 },
        { platform: "youtube",   name: "YouTube",   url: "", enabled: false, visible: false, sortOrder: 3 },
        { platform: "tiktok",    name: "TikTok",    url: "", enabled: false, visible: false, sortOrder: 4 },
        { platform: "telegram",  name: "Telegram",  url: "", enabled: false, visible: false, sortOrder: 5 },
        { platform: "whatsapp",  name: "WhatsApp",  url: "", enabled: false, visible: false, sortOrder: 6 },
        { platform: "linkedin",  name: "LinkedIn",  url: "", enabled: false, visible: false, sortOrder: 7 },
      ]);
      logger.info("Seeded 8 social media platforms");
    }
  } catch (err) {
    logger.error({ err }, "Error seeding database");
  }
}
