import { defineCollection } from "astro:content";

import {
  fetchStrapiContent,
  fetchStrapiSchema,
  type StrapiQueryOptions,
  type StrapiConfig
} from 'cafecito';

const config: StrapiConfig = {
  store_slug: import.meta.env.PUBLIC_STORE_SLUG,
  api_url: import.meta.env.PUBLIC_STRAPI_URL,
  sync_interval: 6000,
};

// @TODO: Find a better type to avoid excessively deep and possibly infinite errors
type Loader = any;


/**
 * Creates a Strapi content loader for Astro
 * @param contentType The Strapi content type to load
 * @param filter The filter to apply to the content &filters[store][id][$eq]=${STRAPI_STORE_ID}
 * @returns An Astro loader for the specified content type
 */
function strapiLoader(query: StrapiQueryOptions) {
  return {
    name: `strapi-${query.contentType}`,
    schema: async () => await fetchStrapiSchema(query.contentType, config.api_url),

    async load({ store, logger, meta }) {
      const lastSynced = meta.get("lastSynced");
      if (lastSynced && Date.now() - Number(lastSynced) < config.sync_interval) {
        logger.info("Skipping sync");
        return;
      }

      const posts = await fetchStrapiContent(query, config);

      store.clear();
      posts.forEach((item: any) => store.set({ id: item.id, data: item }));
      meta.set("lastSynced", String(Date.now()));
    },
  };
};

const pages = defineCollection({
  loader: strapiLoader({
    contentType: "page",
    sort: 'slug:DESC',
    filter: `filters[store][slug][$eq]=${config.store_slug}`,
    populate: 'SEO.socialImage,albums,albums.tracks,albums.cover'
  }) as Loader,
});


const store = defineCollection({
  loader: strapiLoader({
    contentType: "store",
    filter: `filters[slug][$eq]=${config.store_slug}`,
    populate: 'SEO.socialImage,Logo,URLS,Favicon,Cover'
  }) as Loader,
});

const stores = defineCollection({
  loader: strapiLoader({
    contentType: "store",
    filter: `filters[active]=true`,
    populate: 'SEO.socialImage,Logo,URLS,Favicon'
  }) as Loader,
});

const products = defineCollection({
  loader: strapiLoader({
    contentType: "product",
    filter: `filters[stores][slug][$eq]=${config.store_slug}`,
    sort: 'slug:DESC',
    populate: 'SEO,SEO.socialImage,Thumbnail,Slides,PRICES'
  }) as Loader,
});

const posts = defineCollection({
  loader: strapiLoader({
    contentType: "article",
    filter: `filters[store][slug][$eq]=${config.store_slug}`,
    populate: 'SEO.socialImage,Tags,store,cover',
    sort: 'createdAt:DESC',
    paginate: {
      limit: 100,
    }
  }) as Loader,
});

const events = defineCollection({
  loader: strapiLoader({
    contentType: "event",
    filter: `filters[stores][slug][$eq]=${config.store_slug}`,
    populate: 'SEO,SEO.socialImage,Tag,Thumbnail,Slides,stores'
  }) as Loader,
});

export const collections = { posts, pages, stores, products, events, store };
