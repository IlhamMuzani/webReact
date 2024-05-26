import express from "express";
import {
    getPelanggans,
    getPelanggansById,
    createPelanggan,
    updatePelanggan,
    deletePelanggan
} from "../controllers/Pelanggans.js"
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";

const router = express.Router();

router.get('/pelanggans', verifyUser, adminOnly, getPelanggans);
router.get('/pelanggans/:id', verifyUser, adminOnly, getPelanggansById);
router.post('/pelanggans', verifyUser, adminOnly, createPelanggan);
router.patch('/pelanggans/:id', verifyUser, adminOnly, updatePelanggan);
router.delete('/pelanggans/:id', verifyUser, adminOnly, deletePelanggan);

export default router;