import { Router } from 'express';
import { authenticate, requireMaintainer } from '../../middleware/auth';
import {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
} from './issues.controller';

const router = Router();

router.get('/', getAllIssues);
router.get('/:id', getSingleIssue);
router.post('/', authenticate, createIssue);
router.patch('/:id', authenticate, updateIssue);
router.delete('/:id', authenticate, requireMaintainer, deleteIssue);

export default router;
