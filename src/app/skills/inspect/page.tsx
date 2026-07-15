import { redirect } from 'next/navigation';

/**
 * Breaking down a public skill is now part of the unified Skills search: paste
 * a GitHub URL there and it renders the same workflow. This route stays as a
 * redirect so old links keep working.
 */
export default function InspectPage() {
  redirect('/skills');
}
