"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const getProfile = async (req, res) => {
    const user = await User_1.default.findById(req.user?.id);
    if (user) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            profile: user.profile
        });
    }
    else {
        res.status(404).json({ message: 'User not found' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const user = await User_1.default.findById(req.user?.id);
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
    }
    else {
        res.status(404).json({ message: 'User not found' });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=userController.js.map