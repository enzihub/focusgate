// profile/page.tsx

import { getSubscription } from '../pricing/_services/subscription-service';
import ProfileContent from './_components/profile-content';

export default async function ProfilePage() {
  const [subscription] = await Promise.all([getSubscription()]);

  return <ProfileContent subscription={subscription} />;
}
