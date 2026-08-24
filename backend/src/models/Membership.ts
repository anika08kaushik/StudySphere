import mongoose, { Document, Schema } from 'mongoose';

export interface IMembership extends Document {
    user: mongoose.Types.ObjectId;
    group: mongoose.Types.ObjectId;
    role: 'student' | 'leader';
}

const membershipSchema = new Schema<IMembership>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        group: { type: Schema.Types.ObjectId, ref: 'StudyGroup', required: true },
        role: { type: String, enum: ['student', 'leader'], default: 'student' }
    },
    { timestamps: true }
);

// Prevent a user from having multiple memberships in the same group
membershipSchema.index({ user: 1, group: 1 }, { unique: true });

export default mongoose.model<IMembership>('Membership', membershipSchema);
