import { useRouter } from 'next/router';
import UserProfileForm from '../../components/UserProfileForm';

export default function UserProfilePage() {
    const router = useRouter();
    const { id } = router.query;

    return <UserProfileForm id={id} />;
}
