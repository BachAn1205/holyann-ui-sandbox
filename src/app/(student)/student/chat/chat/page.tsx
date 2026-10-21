import { redirect } from 'next/navigation';

export default function ChatPage() {
  // Redirect to new chat route
  redirect('/dashboard/chat');
}
