import { createContext, useContext } from 'react';

const UserContext = createContext<any>(null);

export const useUserContext = () => useContext(UserContext);

export default UserContext;