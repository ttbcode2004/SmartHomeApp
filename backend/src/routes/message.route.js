import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages } from "../controllers/message.controller.js";

const router = Router();

router.get("/chat/:chatId", protectRoute, getMessages);

export default router;
