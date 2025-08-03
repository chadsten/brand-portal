import { assetRouter } from "~/server/api/routers/asset";
import { assetApiRouter } from "~/server/api/routers/assetApi";
import { downloadRouter } from "~/server/api/routers/download";
import { metadataRouter } from "~/server/api/routers/metadata";
import { postRouter } from "~/server/api/routers/post";
import { storageRouter } from "~/server/api/routers/storage";
import { uploadRouter } from "~/server/api/routers/upload";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	post: postRouter,
	storage: storageRouter,
	upload: uploadRouter,
	download: downloadRouter,
	asset: assetRouter,
	assetApi: assetApiRouter,
	metadata: metadataRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
