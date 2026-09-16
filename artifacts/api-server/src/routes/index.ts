import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import providersRouter from "./providers";
import requestsRouter from "./requests";
import reviewsRouter from "./reviews";
import favoritesRouter from "./favorites";
import messagesRouter from "./messages";
import callsRouter from "./calls";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import subscriptionsRouter from "./subscriptions";
import advertisementsRouter from "./advertisements";
import storageRouter from "./storage";
import complaintsRouter from "./complaints";
import verificationRouter from "./verification";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(providersRouter);
router.use(requestsRouter);
router.use(reviewsRouter);
router.use(favoritesRouter);
router.use(messagesRouter);
router.use(callsRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(subscriptionsRouter);
router.use(advertisementsRouter);
router.use(storageRouter);
router.use(complaintsRouter);
router.use(verificationRouter);

export default router;
