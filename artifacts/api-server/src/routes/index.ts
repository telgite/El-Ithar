import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import activitiesRouter from "./activities";
import contentRouter from "./content";
import storageRouter from "./storage";
import galleriesRouter from "./galleries";
import socialRouter from "./social";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(activitiesRouter);
router.use(contentRouter);
router.use(storageRouter);
router.use(galleriesRouter);
router.use(socialRouter);

export default router;
