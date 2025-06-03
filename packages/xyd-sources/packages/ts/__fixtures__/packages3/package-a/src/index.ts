// #region MetaTags
/**
 * Interface representing all possible meta tags that can be used in HTML documents.
 * This includes standard meta tags, Open Graph tags, Twitter cards, and various other
 * specialized meta tags for different content types.
 * 
 */
export interface MetaTags {
    //
    // Standard
    //

    /** Standard meta tag for controlling search engine crawling and indexing
     * @example "index, follow"
     * @example "noindex, nofollow"
     */
    robots: string;

    /** Character encoding for the document
     * @example "UTF-8"
     */
    charset: string;

    /** Viewport settings for responsive design
     * @example "width=device-width, initial-scale=1"
     * @example "width=device-width, initial-scale=1, maximum-scale=1"
     */
    viewport: string;

    /** Brief description of the page content
     * @example "A comprehensive guide to web development"
     */
    description: string;

    /** Keywords relevant to the page content
     * @example "web development, javascript, typescript"
     */
    keywords: string;

    /** Author of the page content
     * @example "John Doe"
     */
    author: string;

    /** Google-specific crawling instructions
     * @example "index, follow"
     * @example "noarchive"
     */
    googlebot: string;

    /** Google-specific settings
     * @example "notranslate"
     */
    google: string;

    /** Google Search Console verification token
     * @example "verification_token"
     */
    "google-site-verification": string;

    /** Software used to generate the page
     * @example "Next.js"
     * @example "WordPress"
     */
    generator: string;

    /** Theme color for browser UI
     * @example "#ffffff"
     * @example "#000000"
     */
    "theme-color": string;

    /** Color scheme preference
     * @example "light dark"
     * @example "light"
     */
    "color-scheme": string;

    /** Format detection settings
     * @example "telephone=no"
     * @example "date=no"
     */
    "format-detection": string;

    /** Referrer policy
     * @example "origin"
     * @example "no-referrer"
     */
    referrer: string;

    /** Page refresh settings
     * @example "0;url=https://example.com"
     */
    refresh: string;

    /** Content rating
     * @example "general"
     * @example "mature"
     */
    rating: string;

    /** Crawl frequency suggestion
     * @example "7 days"
     */
    "revisit-after": string;

    /** Page language
     * @example "en-US"
     * @example "fr-FR"
     */
    language: string;

    /** Copyright information
     * @example "Copyright 2024"
     */
    copyright: string;

    /** Reply-to email address
     * @example "contact@example.com"
     */
    "reply-to": string;

    /** Content distribution scope
     * @example "global"
     */
    distribution: string;

    /** Content coverage area
     * @example "Worldwide"
     */
    coverage: string;

    /** Content category
     * @example "Technology"
     */
    category: string;

    /** Target audience
     * @example "all"
     */
    target: string;

    /** Mobile device compatibility
     * @example "true"
     */
    HandheldFriendly: string;

    /** Mobile optimization settings
     * @example "width"
     */
    MobileOptimized: string;

    //
    // Apple
    //

    /** iOS web app capability
     * @example "yes"
     */
    "apple-mobile-web-app-capable": string;

    /** iOS status bar style
     * @example "black"
     * @example "black-translucent"
     */
    "apple-mobile-web-app-status-bar-style": string;

    /** iOS web app title
     * @example "App Name"
     */
    "apple-mobile-web-app-title": string;

    /** Web application name
     * @example "My App"
     */
    "application-name": string;

    //
    // Windows
    //

    /** Windows tile color
     * @example "#2b5797"
     */
    "msapplication-TileColor": string;

    /** Windows tile image
     * @example "/mstile-144x144.png"a
     */
    "msapplication-TileImage": string;

    /** Windows browser config
     * @example "/browserconfig.xml"
     */
    "msapplication-config": string;

    //
    // Open Graph
    //

    /** Open Graph title
     * @example "Page Title"
     */
    "og:title": string;

    /** Open Graph content type
     * @example "website"
     * @example "article"
     */
    "og:type": string;

    /** Open Graph URL
     * @example "https://example.com"
     */
    "og:url": string;

    /** Open Graph image
     * @example "https://example.com/image.jpg"
     */
    "og:image": string;

    /** Open Graph description
     * @example "A brief description for social media"
     */
    "og:description": string;

    /** Open Graph site name
     * @example "Site Name"
     */
    "og:site_name": string;

    /** Open Graph locale
     * @example "en_US"
     */
    "og:locale": string;

    /** Open Graph video
     * @example "https://example.com/video.mp4"
     */
    "og:video": string;

    /** Open Graph audio
     * @example "https://example.com/audio.mp3"
     */
    "og:audio": string;

    //
    // Twitter
    //

    /** Twitter card type
     * @example "summary_large_image"
     * @example "summary"
     */
    "twitter:card": string;

    /** Twitter site handle
     * @example "@username"
     */
    "twitter:site": string;

    /** Twitter creator handle
     * @example "@author"
     */
    "twitter:creator": string;

    /** Twitter title
     * @example "Page Title"
     */
    "twitter:title": string;

    /** Twitter description
     * @example "A brief description for Twitter"
     */
    "twitter:description": string;

    /** Twitter image
     * @example "https://example.com/image.jpg"
     */
    "twitter:image": string;

    /** Twitter image alt text
     * @example "Image description"
     */
    "twitter:image:alt": string;

    /** Twitter player URL
     * @example "https://example.com/player"
     */
    "twitter:player": string;

    /** Twitter player width
     * @example "480"
     */
    "twitter:player:width": string;

    /** Twitter player height
     * @example "480"
     */
    "twitter:player:height": string;

    /** Twitter iOS app name
     * @example "App Name"
     */
    "twitter:app:name:iphone": string;

    /** Twitter iOS app ID
     * @example "123456789"
     */
    "twitter:app:id:iphone": string;

    /** Twitter iOS app URL
     * @example "app://"
     */
    "twitter:app:url:iphone": string;

    //
    // Article
    //

    /** Article publication time
     * @example "2024-03-20T12:00:00Z"
     */
    "article:published_time": string;

    /** Article modification time
     * @example "2024-03-21T15:30:00Z"
     */
    "article:modified_time": string;

    /** Article expiration time
     * @example "2024-04-20T12:00:00Z"
     */
    "article:expiration_time": string;

    /** Article author
     * @example "John Doe"
     */
    "article:author": string;

    /** Article section
     * @example "Technology"
     */
    "article:section": string;

    /** Article tags
     * @example "Web Development"
     */
    "article:tag": string;

    //
    // Book
    //

    /** Book author
     * @example "Jane Smith"
     */
    "book:author": string;

    /** Book ISBN
     * @example "978-3-16-148410-0"
     */
    "book:isbn": string;

    /** Book release date
     * @example "2024-01-01"
     */
    "book:release_date": string;

    /** Book tags
     * @example "Fiction"
     */
    "book:tag": string;

    //
    // Profile
    //

    /** Profile first name
     * @example "John"
     */
    "profile:first_name": string;

    /** Profile last name
     * @example "Doe"
     */
    "profile:last_name": string;

    /** Profile username
     * @example "johndoe"
     */
    "profile:username": string;

    /** Profile gender
     * @example "male"
     */
    "profile:gender": string;

    //
    // Music
    //

    /** Music duration in seconds
     * @example "180"
     */
    "music:duration": string;

    /** Music album name
     * @example "Album Name"
     */
    "music:album": string;

    /** Music album disc number
     * @example "1"
     */
    "music:album:disc": string;

    /** Music album track number
     * @example "1"
     */
    "music:album:track": string;

    /** Music musician/artist
     * @example "Artist Name"
     */
    "music:musician": string;

    /** Music song name
     * @example "Song Name"
     */
    "music:song": string;

    /** Music song disc number
     * @example "1"
     */
    "music:song:disc": string;

    /** Music song track number
     * @example "1"
     */
    "music:song:track": string;

    //
    // Video
    //

    /** Video actor name
     * @example "Actor Name"
     */
    "video:actor": string;

    /** Video actor role
     * @example "Character Name"
     */
    "video:actor:role": string;

    /** Video director
     * @example "Director Name"
     */
    "video:director": string;

    /** Video writer
     * @example "Writer Name"
     */
    "video:writer": string;

    /** Video duration in seconds
     * @example "120"
     */
    "video:duration": string;

    /** Video release date
     * @example "2024-01-01"
     */
    "video:release_date": string;

    /** Video tags
     * @example "Action"
     */
    "video:tag": string;

    /** Video series name
     * @example "Series Name"
     */
    "video:series": string;
}
// #endregion MetaTags

