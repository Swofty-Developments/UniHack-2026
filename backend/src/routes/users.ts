import { Router } from 'express';
import * as controller from '../controllers/userController';

export const userRoutes = Router();

userRoutes.post('/', controller.createUser);
userRoutes.get('/:id', controller.getUser);
userRoutes.patch('/:id/profile', controller.updateProfile);
