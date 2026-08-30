import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


export type ChatDocument = Chat & Document;

@Schema({ timestamps: true})
export class Chat {
    @Prop({ required: true})
    userEmail: string // We will use their Google Login email to tie the chat to them

    @Prop({ required: true })
    title: string; // E.g., "Research SpaceX"

    // This defines an array of messages (role: "user" | "assistant", content: "hello")
    @Prop({ type: [{ role: String, content: String }], default: [] })
    messages: { role: string; content: string }[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);