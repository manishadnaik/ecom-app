import { Router } from "express";
import { search } from "../controllers/search.js";
import { validate } from "../middlewares/validate.js";
import { searchQuerySchema } from "../validators/search.js";
import { queryLimiter } from "../middlewares/rate-limit.js";
const router = Router();

router.route('/')
  .post(queryLimiter, validate(searchQuerySchema), search)

export default router;