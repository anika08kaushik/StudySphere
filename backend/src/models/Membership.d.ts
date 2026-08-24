import mongoose, { Document } from 'mongoose';
export interface IMembership extends Document {
    user: mongoose.Types.ObjectId;
    group: mongoose.Types.ObjectId;
    role: 'student' | 'leader';
}
declare const _default: mongoose.Model<IMembership, {}, {}, {}, Document<unknown, {}, IMembership, {}, mongoose.DefaultSchemaOptions> & IMembership & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMembership>;
export default _default;
//# sourceMappingURL=Membership.d.ts.map