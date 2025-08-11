import {useEffect} from "react";

function getScrollPosition() {
    return sessionStorage.getItem('scrollPosition');
}

export function useScrollRestoration() {
    useEffect(() => {
        const saveScrollPosition = () => {
            sessionStorage.setItem('scrollPosition', window.scrollY.toString());
        };

        window.addEventListener('beforeunload', saveScrollPosition);

        return () => {
            window.removeEventListener('beforeunload', saveScrollPosition);
        };
    }, []);

    return [
        () => getScrollPosition(),
        () => {
            const scrollPosition = getScrollPosition();
            if (scrollPosition) {
                window.scrollTo(0, parseInt(scrollPosition, 10));
            }
        }
    ]
}