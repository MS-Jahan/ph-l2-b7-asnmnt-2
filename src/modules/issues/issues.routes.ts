import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createIssue, getAllIssues, getSingleIssue } from './issues.controller';

const router = Router();

router.get('/', getAllIssues);
router.get('/:id', getSingleIssue);
router.post('/', authenticate, createIssue);

export default router;
