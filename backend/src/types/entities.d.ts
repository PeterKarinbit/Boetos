declare module '../entities/ChatMessage' {
  import { Entity } from 'typeorm';
  
  @Entity()
  class ChatMessage {
    id: string;
    // Add other properties as needed
  }
  
  export default ChatMessage;
}
