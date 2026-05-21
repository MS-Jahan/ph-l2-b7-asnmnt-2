import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createIssue, getAllIssues } from './issues.controller';

const router = Router();

router.get('/', getAllIssues);
router.post('/', authenticate, createIssue);

export default router;
