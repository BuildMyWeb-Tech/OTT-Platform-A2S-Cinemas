import express from "express";
import { getVersionConfig } from "../controllers/appConfigController.js";

const router = express.Router();

router.get("/version", getVersionConfig);

export default router;
