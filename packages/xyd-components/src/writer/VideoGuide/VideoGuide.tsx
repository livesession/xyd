import React from "react";

import cn from "./VideoGuide.module.css";

export function VideoGuide() {
    return null
};

interface VideoGuideMiniatureProps {
    videoSrc?: string;
    description?: string;
    className?: string;
}

VideoGuide.Miniature = function VideoGuideMiniature(props: VideoGuideMiniatureProps) {
    const {
        videoSrc,
        description = "Watch the video guide"
    } = props;

    return <div
        data-element="xyd-videoguide-miniature"
        className={`${cn.VideoPlayerHost} ${props.className || ""}`}
    >
        <div data-part="shape" >
            <div data-part="frame" >
                <iframe
                    width="100%"
                    height="100%"
                    allow="autoplay; fullscreen"
                    src={videoSrc}
                />
                <div data-part="thumbnail" />
            </div>

            <div data-part="cover">
                <div data-part="controls">
                    <button data-part="button" type="button">
                        <div
                            aria-hidden="true"
                            data-part="icon"
                        >
                            <$PlayIcon />
                        </div>

                        <div data-part="description-container" >
                            <span data-part="description" >
                                {description}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>
};


function $PlayIcon() {
    return <svg
        aria-hidden="true"
        height={32}
        width={32}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 14.25A6.25 6.25 0 0 0 14.25 8 6.242 6.242 0 0 0 8 1.75 6.25 6.25 0 0 0 1.75 8 6.25 6.25 0 0 0 8 14.25ZM8 16a8 8 0 0 0 8-8c0-4.419-3.57-8-8-8a8 8 0 0 0-8 8 8 8 0 0 0 8 8Z"
        />
        <path
            d="M10.817 7.659A.415.415 0 0 1 11 8a.415.415 0 0 1-.183.341L7.242 10.91c-.305.218-.742.02-.742-.34V5.431c0-.36.437-.56.742-.341l3.575 2.568Z" />
    </svg>
}