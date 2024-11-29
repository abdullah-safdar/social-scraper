import express from "express";
import { getFilteredDb } from "../services/index.js";

const router = express.Router();

router.get("/get-db", getFilteredDb);

export default router;
