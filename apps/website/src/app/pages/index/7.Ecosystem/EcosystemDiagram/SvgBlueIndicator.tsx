import styles from "./HeroDiagram.module.css"

export function SvgBlueIndicator({active}: { active: boolean }) {
    return <>
        <svg
            width={166}
            height={196}
            viewBox="0 0 166 196"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${styles.BlueIndicator} ${active ? styles.BlueIndicator__active : ''}`}
        >
            <g filter="url(#filter0_i_7_274)">
                <path
                    d="M12.1972 142.65L12.1972 176.262C12.1972 180.926 15.9786 184.707 20.6432 184.707H54.2581C58.9227 184.707 62.7041 180.926 62.7041 176.262V142.65C62.7041 137.986 58.9227 134.205 54.2581 134.205H20.6432C15.9786 134.205 12.1972 137.986 12.1972 142.65Z"
                    fill="#1F1F1F"
                />
            </g>
            <path
                d="M12.1972 142.65L12.1972 176.262C12.1972 180.926 15.9786 184.707 20.6432 184.707H54.2581C58.9227 184.707 62.7041 180.926 62.7041 176.262V142.65C62.7041 137.986 58.9227 134.205 54.2581 134.205H20.6432C15.9786 134.205 12.1972 137.986 12.1972 142.65Z"
                stroke="#2C2C2C"
                strokeOpacity={0.4}
                strokeWidth={3.75141}
            />
            <g filter="url(#filter1_f_7_274)">
                <path
                    d="M22.9771 164.601C22.9771 163.493 23.8749 162.596 24.9822 162.596H33.0027C34.1101 162.596 35.0079 163.493 35.0079 164.601V172.62C35.0079 173.728 34.1101 174.625 33.0027 174.625H24.9822C23.8749 174.625 22.9771 173.728 22.9771 172.62V164.601Z"
                    fill="#41D1FF"
                />
                <path
                    d="M22.9691 147.227C22.9691 146.12 23.8668 145.222 24.9741 145.222H32.9946C34.1021 145.222 34.9998 146.12 34.9998 147.227V155.247C34.9998 156.354 34.1021 157.252 32.9946 157.252H24.9741C23.8668 157.252 22.9691 156.354 22.9691 155.247V147.227Z"
                    fill="#41D1FF"
                />
                <path
                    d="M41 165.005C41 163.898 41.8978 163 43.0052 163H51.0257C52.1332 163 53.0308 163.898 53.0308 165.005V173.025C53.0308 174.132 52.1332 175.03 51.0257 175.03H43.0052C41.8978 175.03 41 174.132 41 173.025V165.005Z"
                    fill="#41D1FF"
                />
                <path
                    d="M41 147.005C41 145.898 41.8978 145 43.0052 145H51.0257C52.1332 145 53.0308 145.898 53.0308 147.005V155.025C53.0308 156.132 52.1332 157.03 51.0257 157.03H43.0052C41.8978 157.03 41 156.132 41 155.025V147.005Z"
                    fill="#41D1FF"
                />
            </g>
            <path
                d="M52.5915 165.115V171.51C52.5915 172.358 52.2546 173.171 51.6549 173.771C51.0552 174.37 50.2418 174.707 49.3937 174.707H42.9979V171.51C42.9979 170.662 42.661 169.848 42.0612 169.249C41.4615 168.649 40.6481 168.312 39.8 168.312C38.9519 168.312 38.1385 168.649 37.5387 169.249C36.939 169.848 36.6021 170.662 36.6021 171.51V174.707H30.2063C29.3582 174.707 28.5448 174.37 27.9451 173.771C27.3454 173.171 27.0084 172.358 27.0084 171.51V165.115H23.8106C22.9624 165.115 22.149 164.778 21.5493 164.178C20.9496 163.578 20.6127 162.765 20.6127 161.917C20.6127 161.069 20.9496 160.256 21.5493 159.656C22.149 159.056 22.9624 158.72 23.8106 158.72H27.0084V152.324C27.0084 150.566 28.4475 149.127 30.2063 149.127H36.6021V145.929C36.6021 145.081 36.939 144.268 37.5387 143.668C38.1385 143.069 38.9519 142.732 39.8 142.732C40.6481 142.732 41.4615 143.069 42.0612 143.668C42.661 144.268 42.9979 145.081 42.9979 145.929V149.127H49.3937C50.2418 149.127 51.0552 149.464 51.6549 150.063C52.2546 150.663 52.5915 151.476 52.5915 152.324V158.72H49.3937C48.5455 158.72 47.7321 159.056 47.1324 159.656C46.5327 160.256 46.1958 161.069 46.1958 161.917C46.1958 162.765 46.5327 163.578 47.1324 164.178C47.7321 164.778 48.5455 165.115 49.3937 165.115H52.5915Z"
                fill="white"
                fillOpacity={0.5}
            />
            <g opacity={0.2} filter="url(#filter2_d_7_274)">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M63.4764 162.817L133.026 162.817C143.549 162.817 152.081 154.329 152.081 143.86L152.081 5.47403L148.27 5.47403L148.27 143.86C148.27 152.235 141.445 159.025 133.026 159.025L63.4764 159.025L63.4764 162.817Z"
                    fill="#0D0D0D"
                />
                <path
                    d="M63.4764 163.29L63 163.29L63 162.817L63 159.025L63 158.552L63.4764 158.552L133.026 158.552C141.182 158.552 147.793 151.973 147.793 143.86L147.793 5.47402L147.793 5L148.269 5L152.081 5L152.557 5L152.557 5.47402L152.557 143.86C152.557 154.592 143.812 163.29 133.026 163.29L63.4764 163.29Z"
                    stroke="#404040"
                    strokeWidth={0.577083}
                />
            </g>
            <defs>
                <filter
                    id="filter0_i_7_274"
                    x={12.1972}
                    y={134.205}
                    width={50.5069}
                    height={50.5018}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix"/>
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset/>
                    <feGaussianBlur stdDeviation={2.30833}/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1}/>
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.85 0"
                    />
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow_7_274"/>
                </filter>
                <filter
                    id="filter1_f_7_274"
                    x={5.36674}
                    y={127.398}
                    width={65.2663}
                    height={65.2342}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix"/>
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />
                    <feGaussianBlur
                        stdDeviation={8.80116}
                        result="effect1_foregroundBlur_7_274"
                    />
                </filter>
                <filter
                    id="filter2_d_7_274"
                    x={58.0948}
                    y={2.40313}
                    width={99.3672}
                    height={168.1}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix"/>
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset dy={2.30833}/>
                    <feGaussianBlur stdDeviation={2.30833}/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.65 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_7_274"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_7_274"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
        <div className={`${styles.BlueGlow} ${active ? styles.BlueGlow__active : ''}`}/>
    </>

}