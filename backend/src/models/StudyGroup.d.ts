import mongoose, { Document } from 'mongoose';
export interface IStudyGroup extends Document {
    name: string;
    description: string;
    coverImage?: string;
    subjects?: string[];
    createdBy: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IStudyGroup, {}, {}, {}, Document<unknown, {}, IStudyGroup, {}, mongoose.DefaultSchemaOptions> & IStudyGroup & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IStudyGroup>;
export default _default;
//# sourceMappingURL=StudyGroup.d.ts.map