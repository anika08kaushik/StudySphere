import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createGroup: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMyGroups: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getGroupById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const joinGroup: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=groupController.d.ts.map