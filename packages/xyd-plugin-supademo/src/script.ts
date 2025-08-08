// TODO: in the future better API + more typesafe

export function initSupademo(supademoId: string) {
    // Track analytics events safely
    function trackAnalytics(event: string, properties?: Record<string, any>) {
        const analytics = (window as any).analytics;
        if (typeof window !== 'undefined' && analytics?.track) {
            analytics.track(event, properties);
        }
    }

    // Listen for URL changes via custom event from React
    function setupUrlChangeTracking() {
        if (typeof window === 'undefined') return;

        window.addEventListener('xyd::pathnameChange', (event: CustomEvent) => {
            setTimeout(() => {
                Supademo(supademoId, {
                    variables: {
                        email: '',
                        name: ''
                    }
                });
            }, 300); // wait for element to render - TODO: better solution
        });
    }

    // Patch addEventListener on elements with data-supademo-demo attribute
    function patchSupademoClickElements() {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        const supademoElements = document.querySelectorAll('[data-supademo-demo]');
        
        supademoElements.forEach((element) => {
            if (element instanceof HTMLElement) {
                element.addEventListener = ((original) => function(type, listener, options) {
                    if (type === 'click') {
                        const wrappedListener = function(event: Event) {
                            trackAnalytics('supademo.loadDemo');
                            if (typeof listener === 'function') {
                                return listener.call(this, event);
                            }
                        };
                        return original.call(this, type, wrappedListener, options);
                    }
                    return original.call(this, type, listener, options);
                })(element.addEventListener);
            }
        });
    }

    // Patch the Supademo function to add analytics tracking to the returned instance
    function patchSupademoForAnalytics() {
        const originalSupademo = (window as any).Supademo;
        if (typeof window === 'undefined' || typeof originalSupademo !== 'function') return;

        (window as any).Supademo = function(...args: any[]) {
            // Call the original Supademo function
            const supademoInstance = originalSupademo.apply(this, args);
            
            // Patch the loadDemo method on the returned instance
            if (supademoInstance && typeof supademoInstance.loadDemo === 'function') {
                const originalLoadDemo = supademoInstance.loadDemo;
                supademoInstance.loadDemo = function(...loadDemoArgs: any[]) {
                    trackAnalytics('supademo.loadDemo');
                    return originalLoadDemo.apply(this, loadDemoArgs);
                };
            }
            
            return supademoInstance;
        };
    }

    // Initialize Supademo and set up analytics tracking
    function initializeSupademo() {
        // Delay is needed to wait for the Supademo script to load
        setTimeout(() => {
            // Patch Supademo before calling it
            patchSupademoForAnalytics();
            
            // Patch click elements
            patchSupademoClickElements();
            
            // Set up URL change tracking
            setupUrlChangeTracking();
            
            Supademo(supademoId, {
                variables: {
                    email: '',
                    name: ''
                }
            });
        }, 300);
    }

    // Start initialization either immediately or on window load
    if (typeof Supademo === 'function') {
        initializeSupademo();
        return
    }

    window.addEventListener('load', initializeSupademo);
}
