import {useEffect, useState} from "react";

export function useActiveSection() {
    const [activeSection, setActiveSection] = useState('home');

    useEffect(() => {
        const sections = document.querySelectorAll('div[id]');
        let currentSection = 'home';

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    if (id !== currentSection) {
                        currentSection = id;
                        setActiveSection(id);
                    }
                }
            });
        }, {
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        });

        sections.forEach(section => {
            observer.observe(section);
        });

        // Handle hash changes
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1) || 'home';
            currentSection = hash;
            setActiveSection(hash);
        };

        // Set initial section based on hash
        handleHashChange();

        window.addEventListener('hashchange', handleHashChange);
        return () => {
            observer.disconnect();
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    return activeSection;
}