"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const protect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            if (!token) {
                res.status(401).json({ message: 'Not authorized, no token' });
                return;
            }
            const secret = process.env.JWT_SECRET || 'fallback_secret';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            const user = await User_1.default.findById(decoded.id).select('-passwordHash');
            if (user) {
                req.user = user;
                next();
            }
            else {
                res.status(401).json({ message: 'Not authorized, user not found' });
            }
        }
        catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
exports.protect = protect;
//# sourceMappingURL=auth.js.map