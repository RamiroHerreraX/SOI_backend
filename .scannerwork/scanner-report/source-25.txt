const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");


/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints de login, verificación y recuperación
 */

router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/send-reset", authController.sendResetLink);
router.post("/reset/:token", authController.resetPassword);
router.post("/send-reset-link", authController.sendResetLink);


module.exports = router;
