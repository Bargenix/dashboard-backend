import { Router } from "express";
import {getCompanyByUserId} from '../controllers/company.controller.js'
const router = Router();


router.get('/companies/:userId', getCompanyByUserId);


export default router