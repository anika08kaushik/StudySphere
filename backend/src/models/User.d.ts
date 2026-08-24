import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    profile: {
        department?: string;
        semester?: string;
        skills?: string[];
        bio?: string;
    };
    matchPassword(password: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IUser>;
export default _default;
//# sourceMappingURL=User.d.ts.map