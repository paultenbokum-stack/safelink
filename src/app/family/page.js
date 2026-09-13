import { redirect } from 'next/navigation';

// Keep old invitation bookmarks working while using the standard Home flow.
export default function FamilyHome() {
  redirect('/dashboard');
}
