import express from "express";
import {
    getKaryawans,
    getKaryawansById,
    createKaryawan,
    updateKaryawan,
    deleteKaryawan
} from "../controllers/Karyawans.js"
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";

const router = express.Router();

router.get('/karyawans', verifyUser, adminOnly, getKaryawans);
router.get('/karyawans/:id', verifyUser, adminOnly, getKaryawansById);
router.post('/karyawans', verifyUser, adminOnly, createKaryawan);
router.patch('/karyawans/:id', verifyUser, adminOnly, updateKaryawan);
router.delete('/karyawans/:id', verifyUser, adminOnly, deleteKaryawan);

export default router;