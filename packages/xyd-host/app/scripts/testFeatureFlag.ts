(function () {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://cdn.growthbook.io/api/features/sdk-k5zXBj4EjEi1SI', false);
    xhr.send(null);
    if (xhr.status === 200) {
        try {
            const resp = JSON.parse(xhr.responseText);
            const features = resp.features || {};

            // Create dynamic CSS for feature flags
            let cssRules = [];

            // Default rule: hide all feature elements
            cssRules.push('feature[data-feature] { display: none !important; }');

            // Generate rules for each feature flag
            Object.entries(features).forEach(([featureKey, featureData]) => {
                if (featureData && typeof featureData === 'object') {
                    // Get the current value of the feature flag
                    const currentValue = featureData.defaultValue;

                    if (currentValue !== undefined) {
                        // Create rule to show elements when feature flag matches the expected value
                        cssRules.push(`feature[data-feature="${featureKey}"][data-match="${currentValue}"] { display: block !important; }`);
                    }
                }
            });

            // Apply the CSS rules
            if (cssRules.length > 0) {
                const style = document.createElement('style');
                style.textContent = cssRules.join('\n');
                document.head.appendChild(style);
            }
        } catch (e) {
            console.error('Error processing feature flags:', e);
        }
    }
})();