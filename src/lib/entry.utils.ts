// Utility helpers for posts: excerpt, image selection, related picks
export function renderExcerpt(post: any): string {
  const meta = post.data?.SEO || {};
  let excerpt = "";
  const blocks = post.data?.Content || [];
  for (const b of blocks) {
    if (b?.type === "paragraph" && Array.isArray(b.children)) {
      const t = b.children.map((c: any) => c?.text || "").join(" ").trim();
      if (t) { excerpt = t; break; }
    }
  }
  return excerpt || meta?.metaDescription || "";
}

export function imgFor(post: any): string {
  const meta = post.data?.SEO || {};
  return (
    meta?.socialImage?.formats?.large?.url ||
    meta?.socialImage?.formats?.small?.url ||
    meta?.socialImage?.url ||
    post.data?.cover?.url ||
    ""
  );
}

export function getTags(post: any): string[] {
  return (post.data?.Tags || post.data?.tags || [])
    .map((t: any) => (typeof t === "string" ? t.toLowerCase() : (t?.name || "").toLowerCase()))
    .filter(Boolean);
}

export function titleWords(post: any): string[] {
  const t = (post.data?.Title || post.data?.title || "").toLowerCase();
  return Array.from(new Set(t.split(/[^a-z0-9]+/).filter(Boolean)));
}

export function daysSince(dateLike: any): number {
  const d = new Date(dateLike || 0).getTime();
  if (!d || isNaN(d)) return 365 * 10;
  return (Date.now() - d) / (1000 * 60 * 60 * 24);
}

export function pickRelated(allPosts: any[], current: any, limit = 3) {
  const candidates = allPosts.filter((p) => p.id !== current.id);
  const tagsA = getTags(current);

  const scored = candidates.map((c) => {
    const tagsB = getTags(c);
    const tagOverlap = tagsA.filter((t: string) => tagsB.includes(t)).length;

    const wordsA = titleWords(current);
    const wordsB = titleWords(c);
    const titleOverlap = wordsA.filter((w: string) => wordsB.includes(w)).length;

    const days = daysSince((c.data as any)?.Date || (c.data as any)?.date || (c.data as any)?.publishedAt);
    const recency = Math.max(0, 1 - days / 365);

    const score = tagOverlap * 10 + titleOverlap * 2 + recency * 1;
    return { post: c, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((r) => r.post);
 }
