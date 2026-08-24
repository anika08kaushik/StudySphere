import { Response } from 'express';
import StudyGroup from '../models/StudyGroup';
import Membership from '../models/Membership';
import { AuthRequest } from '../middleware/auth';

export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, description } = req.body;

    if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    const group = await StudyGroup.create({
        name,
        description,
        createdBy: req.user.id
    });

    // Creator is automatically a leader
    await Membership.create({
        user: req.user.id,
        group: group.id,
        role: 'leader'
    });

    res.status(201).json(group);
};

export const getMyGroups = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    const memberships = await Membership.find({ user: req.user.id }).populate('group');
    const groups = memberships.map(m => m.group);
    
    res.json(groups);
};

export const getGroupById = async (req: AuthRequest, res: Response): Promise<void> => {
    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }

    // Check membership
    if (req.user) {
        const membership = await Membership.findOne({ user: req.user.id, group: group.id });
        if (!membership) {
            res.status(403).json({ message: 'Not a member of this group' });
            return;
        }
    }

    const members = await Membership.find({ group: group.id }).populate('user', 'name email profile');

    res.json({ group, members });
};

export const joinGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    const { groupId } = req.body;

    if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    const group = await StudyGroup.findById(groupId);
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }

    const existingMembership = await Membership.findOne({ user: req.user.id, group: groupId });
    if (existingMembership) {
        res.status(400).json({ message: 'Already a member' });
        return;
    }

    const membership = await Membership.create({
        user: req.user.id,
        group: groupId,
        role: 'student' // default role
    });

    res.status(201).json(membership);
};
