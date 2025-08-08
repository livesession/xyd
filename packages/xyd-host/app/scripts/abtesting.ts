// TODO: ts + use bunled
// TODO: custom user logic about context
(function () {
    const abTestingSettings = window.__xydAbTestingSettings;
    const abTestingProviders = abTestingSettings?.providers || {}

    // Context storage configuration
    const contextMaxAge = abTestingSettings?.contextMaxAge || 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const contextStorageKey = abTestingSettings?.contextStorageKey || "__xydABContextKey";

    // Utility functions for base64 encoding/decoding
    function isBase64(str) {
        try {
            return btoa(atob(str)) === str;
        } catch (err) {
            return false;
        }
    }

    function encodeContext(context) {
        return btoa(JSON.stringify(context));
    }

    function decodeContext(encodedContext) {
        try {
            if (!isBase64(encodedContext)) {
                return null;
            }
            return JSON.parse(atob(encodedContext));
        } catch (err) {
            return null;
        }
    }

    // Context storage functions
    function saveContext(context) {
        try {
            const encodedContext = encodeContext(context);
            localStorage.setItem(contextStorageKey, encodedContext);
        } catch (err) {
            console.debug('Error saving context to localStorage:', err);
        }
    }

    function loadContext() {
        try {
            const encodedContext = localStorage.getItem(contextStorageKey);
            if (!encodedContext) {
                return null;
            }

            const context = decodeContext(encodedContext);
            if (!context) {
                // Invalid base64, remove the corrupted data
                localStorage.removeItem(contextStorageKey);
                return null;
            }

            // Check if context is expired
            if (context.timestamp && Date.now() - context.timestamp > contextMaxAge) {
                localStorage.removeItem(contextStorageKey);
                return null;
            }

            return context;
        } catch (err) {
            console.debug('Error loading context from localStorage:', err);
            return null;
        }
    }

    const xhr = new XMLHttpRequest();
    let featuresUrl = ""

    let ctx;

    function randomId() {
        return crypto.randomUUID();
    }

    // Try to load existing context, create new one if not found or expired
    let existingContext = loadContext();
    let userId = existingContext?.userId || randomId();
    if (!existingContext?.userId) {
        // Save context with timestamp
        const contextToSave = {
            userId: userId,
            timestamp: Date.now(),
        };
        saveContext(contextToSave);
    }

    if (abTestingProviders?.growthbook) {
        if (!abTestingProviders.growthbook.clientKey) {
            console.error('GrowthBook client key is not set in settings.');
            delete window.__xydAbTestingSettings;
            return;
        }

        featuresUrl = `${'https://cdn.growthbook.io'}/api/features/${abTestingProviders?.growthbook.clientKey}`;
    }

    if (abTestingProviders?.launchdarkly) {
        if (!abTestingProviders.launchdarkly.env) {
            console.error('LaunchDarkly env is not set in settings.');
            delete window.__xydAbTestingSettings;
            return;
        }

        ctx = {
            kind: "user",
            key: userId
        }

        const ctxBase64 = btoa(JSON.stringify(ctx));

        // TODO: use sdk in the future
        featuresUrl = `https://app.launchdarkly.com/sdk/evalx/${abTestingProviders.launchdarkly.env}/contexts/${ctxBase64}`
    }

    xhr.open('GET', featuresUrl, false);
    xhr.send(null);
    if (xhr.status != 200) {
        console.error(`Error fetching feature flags: ${xhr.status} ${xhr.statusText}`);
        delete window.__xydAbTestingSettings;
        return;
    }

    try {
        const resp = JSON.parse(xhr.responseText);
        let features = {};
        let client;

        if (abTestingProviders?.growthbook) {
            // Normalize GrowthBook features: extract defaultValue from each feature
            const rawFeatures = resp.features || {};
            Object.entries(rawFeatures).forEach(([flagKey, flagData]) => {
                if (flagData && typeof flagData === 'object' && 'defaultValue' in flagData) {
                    features[flagKey] = flagData.defaultValue;
                }
            });

            // TODO: finish
            const gbContext = {
                apiHost: abTestingProviders.growthbook.apiHost || 'https://cdn.growthbook.io',
                clientKey: abTestingProviders.growthbook.clientKey,
                attributes: {
                    id: userId,
                },
            };
            /*
             * optional init options
             * @see https://docs.growthbook.io/lib/js#switching-to-init
             */
            const initOptions = {
                timeout: 2000,
                payload: resp,
                // streaming: false,
            };

            // TODO: Add proper type declarations for OpenFeature and GrowthbookProvider
            const OpenFeature = window.OpenFeature;
            const GrowthbookProvider = window.GrowthbookProvider;
            
            const ghOpenFeature = new GrowthbookProvider.GrowthbookClientProvider(gbContext, initOptions)
            if (OpenFeature && GrowthbookProvider) {
                OpenFeature.OpenFeature.setProvider(ghOpenFeature);
                client = OpenFeature.OpenFeature.getClient();
            }
        }

        if (abTestingProviders?.launchdarkly) {
            // Normalize LaunchDarkly features: extract value from each flag
            Object.entries(resp).forEach(([flagKey, flagData]) => {
                if (flagData && typeof flagData === 'object' && 'value' in flagData) {
                    features[flagKey] = flagData.value;
                }
            });

            // Reconstruct bootstrap state from API response
            const bootstrapFlags = {};
            const flagsState = {};

            // TODO: !!! USE LAUNCHDARKLY SDK !!! BUT WE NEED TO DO THIS SYNC
            Object.entries(resp).forEach(([flagKey, flagData]) => {
                if (flagData && typeof flagData === 'object' && 'value' in flagData) {
                    const flag = flagData;
                    // Set the flag value in bootstrap
                    bootstrapFlags[flagKey] = flag.value;

                    // Set the full flag state
                    flagsState[flagKey] = flag
                }
            });

            // TODO: use OpenFeature.OpenFeature.setProvider
            const OpenFeature = window.OpenFeature;
            const LaunchDarklyProvider = window.LaunchDarklyProvider;
            
            if (OpenFeature && LaunchDarklyProvider) {
                OpenFeature.OpenFeature.setProvider(
                    new LaunchDarklyProvider.LaunchDarklyClientProvider(
                        abTestingProviders.launchdarkly.env,
                        {
                            bootstrap: {
                                ...bootstrapFlags,
                                $flagsState: flagsState
                            }
                        }
                    ),
                    ctx
                );
                client = OpenFeature.OpenFeature.getClient();
            }
        }

        if (client) {
            window.openfeature = client
        }
        console.log
        const events = client.emitterAccessor()
        events.emit("PROVIDER_READY")
        events.emit("PROVIDER_CONFIGURATION_CHANGED")

        // Create dynamic CSS for feature flags
        let cssRules = [];

        // Default rule: hide all feature elements
        cssRules.push('[data-feature-flag] { display: none !important; }');

        // Generate rules for each feature flag
        // TODO: !!! FOR SOME REASON WE NEED THIS HACK EVEN IF WE EMIT THE EVENTS (maybe it's wrong used?) - BUT CHANGE THAT IN THE FUTURE !!!
        setTimeout(() => {
            Object.entries(features || {}).forEach(([featureKey, flagValue]) => {
                // Determine the type of feature flag and get its current value
                let currentValue;
                // Now features is normalized: {[flag]: value}

                // Check if it's a boolean feature
                if (typeof flagValue === 'boolean') {
                    // TODO: impl default values from markdown + navigation
                    currentValue = client.getBooleanValue(featureKey, false);
                }
                // Check if it's a string feature
                else if (typeof flagValue === 'string') {
                    currentValue = client.getStringValue(featureKey, "");
                }
                // Check if it's a number feature
                else if (typeof flagValue === 'number') {
                    currentValue = client.getNumberValue(featureKey, 0);
                }
                // For object features, use getObjectValue
                else if (typeof flagValue === 'object' && flagValue !== null) {
                    currentValue = client.getObjectValue(featureKey);
                }
                // Fallback to string evaluation for unknown types
                else {
                    currentValue = client.getStringValue(featureKey, "");
                }

                if (currentValue !== undefined) {
                    // Create rule to show elements when feature flag matches the expected value
                    cssRules.push(`[data-feature-flag="${featureKey}"][data-feature-match="${currentValue}"] { display: block !important; }`);
                }
            });

            // Apply the CSS rules
            if (cssRules.length > 0) {
                const style = document.createElement('style');
                style.textContent = cssRules.join('\n');
                document.head.appendChild(style);
            }
        })
    } catch (e) {
        console.error('Error processing feature flags:', e);
    } finally {
        delete window.__xydAbTestingSettings;
    }
})();