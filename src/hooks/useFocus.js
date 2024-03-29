'use client';

import { useEffect, useState } from 'react';

export default function useFocus() {
    // get the initial state
    const [focus, setFocus] = useState(true);

    useEffect(() => {
        // helper functions to update the status
        const onFocus = () => setFocus(true);
        const onBlur = () => setFocus(false);

        // assign the listener
        // update the status on the event
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);

        // remove the listener
        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
        };
    }, []);

    // return the status
    return focus;
}
