/**
 * Loader callback functions
 * @group Assets
 */
export type LoaderFunctions = {
    /**
     * The callback function in the load
     * @param receivedLength Number of bytes loaded
     * @param contentLength  Total number of bytes of resources
     * @param url resources URL
     */
    onProgress?: Function;

    /**
     * Load the completed callback function
     * @param url resources URL
     */
    onComplete?: Function;

    /**
     * The callback function for which a load error occurred
     * @param error Error object
     */
    onError?: Function;

    /**
     * The URL modification callback allows you to modify the original url and return a custom path
     * @param url Original resource URL
     * @return The new URL after modification
     */
    onUrl?: Function;

    /**
     * Customize headers, you can modify/add fetch header information
     */
    headers?: {};
};
