import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

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
        gender?: 'male' | 'female' | 'neutral';
    };
    matchPassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        profile: {
            department: String,
            semester: String,
            skills: [String],
            bio: String,
            gender: { type: String, enum: ['male', 'female', 'neutral'], default: 'neutral' }
        }
    },
    { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export default mongoose.model<IUser>('User', userSchema);
