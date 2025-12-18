const envAllowsUnpublished = process.env.MK_INCLUDE_UNPUBLISHED === "true" || process.env.MK_INCLUDE_UNPUBLISHED === "1";

export const isPublishedEntry = (entry: { id?: string; slug?: string }) =>
  envAllowsUnpublished
    ? true
    : Boolean(entry?.slug) && !entry.slug.includes("/") && !(entry?.id?.startsWith("unpublished/") || entry?.slug?.startsWith("unpublished/"));
