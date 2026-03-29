/** Публичные файлы объекта на elitka.kg: /uploads/object/{id}/{filename} */

const ELITKA_ORIGIN = "https://elitka.kg";

export function elitkaObjectFileUrl(objectId: number, filename: string): string {
  const f = filename.trim();
  if (!f) return `${ELITKA_ORIGIN}/`;
  if (/^https?:\/\//i.test(f)) return f;
  return `${ELITKA_ORIGIN}/uploads/object/${objectId}/${encodeURIComponent(f)}`;
}

/** Галерея: main первым, затем остальные уникальные имена файлов. */
export function elitkaObjectImageUrls(
  objectId: number,
  mainFilename: string | null | undefined,
  gallery: unknown,
  limit = 12,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (name: unknown) => {
    if (typeof name !== "string") return;
    const t = name.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(elitkaObjectFileUrl(objectId, t));
  };
  push(mainFilename);
  if (Array.isArray(gallery)) {
    for (const x of gallery) push(x);
  }
  return out.slice(0, limit);
}

export function elitkaObjectPageUrl(slug: string): string {
  const s = slug.trim();
  return s ? `${ELITKA_ORIGIN}/ru/object/${encodeURIComponent(s)}` : ELITKA_ORIGIN;
}
