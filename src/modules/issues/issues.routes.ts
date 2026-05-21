import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
} from './issues.controller';

const router = Router();

router.get('/', getAllIssues);
router.get('/:id', getSingleIssue);
router.post('/', authenticate, createIssue);
router.patch('/:id', authenticate, updateIssue);

export default router;
