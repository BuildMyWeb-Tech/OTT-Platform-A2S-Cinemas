import express from "express";
import { checkLicense, getMyLicenses, getAllLicenses, revokeLicense, extendLicense } from "../controllers/licenseController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.get("/my", protect, getMyLicenses);
router.get("/check/:movieId", protect, checkLicense);
router.get("/all", protect, authorize("admin"), getAllLicenses);
router.patch("/:id/revoke", protect, authorize("admin"), revokeLicense);
router.patch("/:id/extend", protect, authorize("admin"), extendLicense);
export default router;