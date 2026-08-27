import { Readable } from 'stream';
import { raw, Router, type IRouter, type Request, type Response } from 'express';
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from '@workspace/api-zod';

import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

function isAdminSession(req: Request): boolean {
  return !!(req.session as unknown as Record<string, unknown>)?.['userId'];
}

// ---------------------------------------------------------------------------
// POST /storage/uploads
//
// Receives a raw image body from the admin frontend, signs a GCS PUT URL
// server-side, uploads the file to GCS (no browser CORS required), and
// returns the objectPath to store in the DB.
// ---------------------------------------------------------------------------
router.post(
  '/storage/uploads',
  raw({ type: '*/*', limit: '25mb' }),
  async (req: Request, res: Response) => {
    if (!isAdminSession(req)) {
      res.status(401).json({ error: 'غير مصرح بالوصول' });
      return;
    }

    const contentType =
      (req.headers['x-content-type'] as string) ||
      (req.headers['content-type'] as string) ||
      'application/octet-stream';

    // Strip boundary/params from content-type so GCS accepts it
    const mimeType = contentType.split(';')[0].trim();

    // Validate it looks like an image
    if (!mimeType.startsWith('image/')) {
      res.status(400).json({ error: 'نوع الملف غير مدعوم — JPG، PNG أو WebP فقط' });
      return;
    }

    try {
      // Generate a presigned GCS PUT URL (sidecar call — server side only)
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      // Upload the file buffer directly to GCS — no browser CORS needed
      const gcsRes = await fetch(uploadURL, {
        method: 'PUT',
        body: req.body as Buffer,
        headers: { 'Content-Type': mimeType },
        signal: AbortSignal.timeout(30_000),
      });

      if (!gcsRes.ok) {
        const text = await gcsRes.text().catch(() => '');
        req.log.error({ status: gcsRes.status, body: text }, 'GCS upload failed');
        res.status(502).json({ error: 'فشل رفع الصورة إلى التخزين' });
        return;
      }

      res.json({ objectPath });
    } catch (error) {
      req.log.error({ err: error }, 'Error uploading to object storage');
      res.status(500).json({ error: 'فشل رفع الصورة — حاول مرة أخرى' });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /storage/uploads/request-url  (kept for backward-compat, not used)
//
// Returns a presigned GCS URL. Browser-side PUT to GCS requires CORS on the
// bucket, so prefer the /storage/uploads endpoint above instead.
// ---------------------------------------------------------------------------
router.post(
  '/storage/uploads/request-url',
  async (req: Request, res: Response) => {
    if (!isAdminSession(req)) {
      res.status(401).json({ error: 'غير مصرح بالوصول' });
      return;
    }

    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'بيانات غير صحيحة' });
      return;
    }

    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath =
        objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'فشل توليد رابط الرفع' });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /storage/public-objects/*
// ---------------------------------------------------------------------------
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'الملف غير موجود' });
        return;
      }
      const response = await objectStorageService.downloadObject(file);
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'فشل خدمة الملف' });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /storage/objects/*
// ---------------------------------------------------------------------------
router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile =
      await objectStorageService.getObjectEntityFile(objectPath);

    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: 'الملف غير موجود' });
      return;
    }
    req.log.error({ err: error }, 'Error serving object');
    res.status(500).json({ error: 'فشل خدمة الملف' });
  }
});

export default router;
