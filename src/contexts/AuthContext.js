import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useDisclosure } from '@chakra-ui/react';

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { sha256 } from 'js-sha256';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from '@/lib/firebase';

import useRequest from '@/hooks/useRequest';

const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
    const [userData, setUserData] = useState(null);
    const [roleId, setRoleId] = useState(0);
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);
    const [user, loading, error] = useAuthState(auth);
    const request = useRequest();

    const { isOpen: isAuthOpen, onOpen: onAuthOpen, onClose: onAuthClose } = useDisclosure();

    const refreshUser = useCallback(() => {
        if (user) {
            request('/api/me', {
                method: 'GET'
            })
                .then((data) => {
                    setUserData(data);
                    setRoleId(data.type);
                })
                .catch((err) => {});
        } else {
            setUserData(null);
            setRoleId(0);
        }
    }, [user, request]);

    function login(gtid) {
        return new Promise((resolve, reject) => {
            console.log('logging in');

            const hash = sha256(gtid);
            const email = `${hash}@hive.com`;
            const password = hash;
            // setPersistence(auth, browserSessionPersistence)
            //     .then(() => {
            console.log('ye');
            signInWithEmailAndPassword(auth, email, password)
                .then((result) => {
                    resolve(result);
                })
                .catch((error) => {
                    console.log(error);
                    reject(error);
                });
            // })
            // .catch((error) => {
            //     console.log(error);
            //     reject(error);
            // })
            // .finally(() => {
            //     console.log('something went really wrong');
            // });
        });
    }

    function logout() {
        signOut(auth);
        setUserData(null);
        setRoleId(0);
    }

    async function waitForAuthInit() {
        let unsubscribe = null;
        await new Promise((resolve) => {
            unsubscribe = auth.onAuthStateChanged((_) => resolve());
        });
        await unsubscribe();
    }

    useEffect(() => {
        setIsAuthLoaded(false);
        async function checkUser() {
            // Wait for auth to initialize before checking if the user is logged in (thanks for this pete)
            await waitForAuthInit().then(async () => {
                setIsAuthLoaded(true);
            });
        }
        checkUser();
    }, [user]);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const values = {
        login,
        logout,
        user,
        userData,
        loading,
        roleId,

        onAuthOpen,
        isAuthOpen,
        onAuthClose
    };

    return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider };
