import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyGroup extends Document {
    name: string;
    description: string;
    coverImage?: string;
    subjects?: string[];
    createdBy: mongoose.Types.ObjectId;
}

const studyGroupSchema = new Schema<IStudyGroup>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        coverImage: { type: String },
        subjects: [{ type: String }],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

export default mongoose.model<IStudyGroup>('StudyGroup', studyGroupSchema);
