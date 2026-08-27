// Admin API client — typed fetch helpers for the admin dashboard

export type Activity = {
  id: number;
  title: string;
  description: string;
  stat: string;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
  images: ActivityImage[];
};

export type ActivityImage = {
  id: number;
  activityId: number;
  objectPath: string;
  altText: string;
  sortOrder: number;
};

export type ContentItem = {
  id: number;
  key: string;
  value: string;
};

export type AdminUser = {
  id: number;
  username: string;
};

export type UploadUrlResult = {
  uploadURL: string;
  objectPath: string;
};

export type SocialMedia = {
  id: number;
  platform: string;
  name: string;
  url: string;
  enabled: boolean;
  visible: boolean;
  sortOrder: number;
};

export type Gallery = {
  id: number;
  slug: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  images: GalleryImage[];
};

export type GalleryImage = {
  id: number;
  galleryId: number;
  objectPath: string;
  altText: string;
  sortOrder: number;
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  if (!res.ok) {
    const message = json?.error ?? json?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

export const adminApi = {
  // Auth
  me: () => apiFetch<AdminUser>("/auth/me"),
  login: (username: string, password: string) =>
    apiFetch<AdminUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),

  // Activities
  listActivities: () => apiFetch<Activity[]>("/activities"),
  createActivity: (data: Partial<Omit<Activity, "id" | "images">>) =>
    apiFetch<Activity>("/activities", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateActivity: (
    id: number,
    data: Partial<Omit<Activity, "id" | "images">>,
  ) =>
    apiFetch<Activity>(`/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteActivity: (id: number) =>
    apiFetch<void>(`/activities/${id}`, { method: "DELETE" }),

  // Activity images
  addImage: (activityId: number, objectPath: string, altText = "") =>
    apiFetch<ActivityImage>(`/activities/${activityId}/images`, {
      method: "POST",
      body: JSON.stringify({ objectPath, altText }),
    }),
  deleteImage: (activityId: number, imageId: number) =>
    apiFetch<void>(`/activities/${activityId}/images/${imageId}`, {
      method: "DELETE",
    }),

  // Social media
  listSocial: () => apiFetch<SocialMedia[]>("/admin/social"),
  updateSocial: (id: number, data: Partial<Pick<SocialMedia, "url" | "enabled" | "visible">>) =>
    apiFetch<SocialMedia>(`/admin/social/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Content
  listContent: () => apiFetch<ContentItem[]>("/content"),
  updateContent: (key: string, value: string) =>
    apiFetch<ContentItem>(`/content/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    }),

  // Galleries
  listGalleries: () => apiFetch<Gallery[]>("/galleries"),
  getGallery: (id: number) => apiFetch<Gallery>(`/galleries/${id}`),
  createGallery: (data: { title: string; slug?: string; sortOrder?: number }) =>
    apiFetch<Gallery>("/galleries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateGallery: (id: number, data: Partial<Omit<Gallery, "id" | "images">>) =>
    apiFetch<Gallery>(`/galleries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteGallery: (id: number) =>
    apiFetch<void>(`/galleries/${id}`, { method: "DELETE" }),

  // Gallery images
  addGalleryImage: (galleryId: number, objectPath: string, altText = "") =>
    apiFetch<GalleryImage>(`/galleries/${galleryId}/images`, {
      method: "POST",
      body: JSON.stringify({ objectPath, altText }),
    }),
  updateGalleryImage: (galleryId: number, imageId: number, data: { objectPath?: string; altText?: string }) =>
    apiFetch<GalleryImage>(`/galleries/${galleryId}/images/${imageId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteGalleryImage: (galleryId: number, imageId: number) =>
    apiFetch<void>(`/galleries/${galleryId}/images/${imageId}`, { method: "DELETE" }),
  reorderGalleryImages: (galleryId: number, orderedIds: number[]) =>
    apiFetch<GalleryImage[]>(`/galleries/${galleryId}/images/order`, {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    }),
};

// ---------------------------------------------------------------------------
// Upload a file server-side (API → GCS) — avoids browser CORS on GCS PUT.
// ---------------------------------------------------------------------------
export async function uploadImageFile(
  file: File,
): Promise<{ objectPath: string }> {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("نوع الملف غير مدعوم — استخدم JPG أو PNG أو WebP");
  }

  const res = await fetch("/api/storage/uploads", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type,
      "X-Content-Type": file.type,
    },
    body: file,
  });

  if (!res.ok) {
    let message = `فشل رفع الصورة (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  return res.json();
}

// Build the serving URL from an objectPath stored in the DB
export function imageUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}
