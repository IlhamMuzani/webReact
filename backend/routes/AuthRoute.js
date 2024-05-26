import express from "express";
import {Login, logOut, Me, registerWithKodeUser} from "../controllers/Auth.js";

const router = express.Router();

router.post('/register', registerWithKodeUser);
router.post('/login', Login);
router.get('/me', Me);
router.delete('/logout', logOut);

export default router;