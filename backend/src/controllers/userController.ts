import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.user?.id);

    if (user) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            profile: user.profile
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.user?.id);

    if (user) {
        user.name = req.body.name || user.name;
        if (req.body.profile) {
            user.profile = { ...user.profile, ...req.body.profile };
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            profile: updatedUser.profile
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};
