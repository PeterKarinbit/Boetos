import { EntitySchema } from 'typeorm';

export const ChatMessage = new EntitySchema({
  name: 'ChatMessage',
  tableName: 'chat_messages',
  columns: {
    id: { primary: true, type: 'uuid', generated: 'uuid' },
    user_id: { type: 'uuid' },
    content: { type: 'text' },
    sender: { type: 'varchar' }, // 'user' or 'assistant'
    created_at: { type: 'timestamp', createDate: true },
    session_id: { type: 'uuid', nullable: true }, // for grouping messages into sessions
  },
});

export default ChatMessage; 