// "interface" describes the fields an object must have.
// "export" lets other files import it.
export interface Friend {
  id: number;
  username: string;
  status: 'online' | 'offline'; // only these two exact strings are allowed
}



export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}