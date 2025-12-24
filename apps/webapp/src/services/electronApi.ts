/**
 * Electron IPC API wrapper for renderer process
 */

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

/**
 * Fetch from OpenVSX API via Electron IPC (avoids CORS)
 */
export async function fetchViaElectron(url: string): Promise<Response> {
    if (!isElectron) {
        // Fallback to direct fetch if not in Electron
        return fetch(url);
    }

    try {
        const result = await window.electronAPI.openvsx.fetch(url);

        if (!result.success) {
            throw new Error(result.error || `HTTP ${result.status}: ${result.statusText}`);
        }

        // Create a Response-like object
        return {
            ok: true,
            status: result.status || 200,
            statusText: 'OK',
            json: async () => result.data,
            text: async () => JSON.stringify(result.data),
        } as Response;
    } catch (error) {
        console.error('Electron IPC fetch error:', error);
        throw error;
    }
}
