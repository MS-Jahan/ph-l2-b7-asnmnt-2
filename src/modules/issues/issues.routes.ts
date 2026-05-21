import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createIssue } from './issues.controller';

const router = Router();

router.post('/', authenticate, createIssue);

export default router;
