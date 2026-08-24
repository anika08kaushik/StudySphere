"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const groupController_1 = require("../controllers/groupController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.route('/')
    .post(auth_1.protect, groupController_1.createGroup)
    .get(auth_1.protect, groupController_1.getMyGroups);
router.post('/join', auth_1.protect, groupController_1.joinGroup);
router.get('/:id', auth_1.protect, groupController_1.getGroupById);
exports.default = router;
//# sourceMappingURL=groupRoutes.js.map