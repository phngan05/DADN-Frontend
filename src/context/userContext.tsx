import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import { User } from '@/src/types/user';
import { Notification } from '@/src/types/noti';

type UserContextValue = {
	userData: User;
	setUserData: Dispatch<SetStateAction<User>>;
	updateUserData: (nextUser?: User) => Promise<boolean>;
	loading: boolean;
	error: string | null;
	refreshUser: () => Promise<User | null>;
	notifications: Notification[];
	updateRead: () => Promise<boolean>;
};

const UserContext = createContext<UserContextValue | null>(null);

export const useUserContext = () => {
	const ctx = useContext(UserContext);
	if (!ctx) {
		throw new Error("useUserContext must be used within UserContext.Provider");
	}
	return ctx;
};

export default UserContext;