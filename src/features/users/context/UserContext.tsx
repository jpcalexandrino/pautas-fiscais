import { createContext, useContext, type ReactNode } from 'react';
import { useUsers } from '../hooks/useUsers';

export interface UserContextType {
  getUsers: () => Promise<any[]>;
  createUser: (data: any) => Promise<any>;
  updateUser: (id: string | number, data: any) => Promise<any>;
  deleteUser: (id: string | number) => Promise<boolean>;
  resetUserPassword: (id: string | number) => Promise<any>;
  users: any[];
  loading: boolean;
  error: string | null;
  isError: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const hookData = useUsers();

  return (
    <UserContext.Provider value={hookData}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
}

export default UserContext;
