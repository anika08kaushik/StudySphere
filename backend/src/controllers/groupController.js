"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinGroup = exports.getGroupById = exports.getMyGroups = exports.createGroup = void 0;
const StudyGroup_1 = __importDefault(require("../models/StudyGroup"));
const Membership_1 = __importDefault(require("../models/Membership"));
const createGroup = async (req, res) => {
    const { name, description } = req.body;
    if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }
    const group = await StudyGroup_1.default.create({
        name,
        description,
        createdBy: req.user.id
    });
    // Creator is automatically a leader
    await Membership_1.default.create({
        user: req.user.id,
        group: group.id,
        role: 'leader'
    });
    res.status(201).json(group);
};
exports.createGroup = createGroup;
const getMyGroups = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }
    const memberships = await Membership_1.default.find({ user: req.user.id }).populate('group');
    const groups = memberships.map(m => m.group);
    res.json(groups);
};
exports.getMyGroups = getMyGroups;
const getGroupById = async (req, res) => {
    const group = await StudyGroup_1.default.findById(req.params.id);
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }
    // Check membership
    if (req.user) {
        const membership = await Membership_1.default.findOne({ user: req.user.id, group: group.id });
        if (!membership) {
            res.status(403).json({ message: 'Not a member of this group' });
            return;
        }
    }
    const members = await Membership_1.default.find({ group: group.id }).populate('user', 'name email profile');
    res.json({ group, members });
};
exports.getGroupById = getGroupById;
const joinGroup = async (req, res) => {
    const { groupId } = req.body;
    if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }
    const group = await StudyGroup_1.default.findById(groupId);
    if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
    }
    const existingMembership = await Membership_1.default.findOne({ user: req.user.id, group: groupId });
    if (existingMembership) {
        res.status(400).json({ message: 'Already a member' });
        return;
    }
    const membership = await Membership_1.default.create({
        user: req.user.id,
        group: groupId,
        role: 'student' // default role
    });
    res.status(201).json(membership);
};
exports.joinGroup = joinGroup;
//# sourceMappingURL=groupController.js.map