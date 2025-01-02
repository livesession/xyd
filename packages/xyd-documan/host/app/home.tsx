import {
    GuideCard,

    IconCode,
} from "@xyd/components/writer"
import {Button, Footer, CTABanner} from "@xyd/components/brand"
import {HomeView} from "@xyd/components/views"
import {Nav} from "@xyd/ui2";

import "virtual:xyd-theme/index.css"

export default function Home() {
    return <HomeView
        header={<$Nav/>}
        body={<HomeView.Body>
            <$Hero/>
            <$Cards/>
        </HomeView.Body>}
        footer={<$Footer/>}
    />
}

function $Logo(props: any) {
    return <svg
        viewBox="0 0 182 178"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M37.1469 43.9727C17.5816 37.2727 16.4708 9.06273 36.7393 1.53273C39.3887 0.546062 43.6686 0.0460618 49.579 0.0327285C64.4635 -0.00727151 79.3481 -0.010607 94.2327 0.0227263C100.313 0.0427263 104.681 0.539391 107.337 1.51272C127.331 8.84272 126.638 37.0327 106.726 43.9827C104.158 44.8827 100.551 45.3394 95.9038 45.3527C80.1429 45.3927 64.3854 45.3927 48.6313 45.3527C43.6381 45.3461 39.8099 44.8861 37.1469 43.9727Z"
            fill="#5D6A7D"
        />
        <path
            d="M37.1469 43.9727C17.5816 37.2727 16.4708 9.06273 36.7393 1.53273C39.3887 0.546062 43.6686 0.0460618 49.579 0.0327285C64.4635 -0.00727151 79.3481 -0.010607 94.2327 0.0227263C100.313 0.0427263 104.681 0.539391 107.337 1.51272C127.331 8.84272 126.638 37.0327 106.726 43.9827C104.158 44.8827 100.551 45.3394 95.9038 45.3527C80.1429 45.3927 64.3854 45.3927 48.6313 45.3527C43.6381 45.3461 39.8099 44.8861 37.1469 43.9727Z"
            stroke="#5D6A7D"
        />
        <path
            d="M14.1866 79.0425C16.7755 73.4043 20.8723 69.5817 26.477 67.5747C29.4115 66.5183 34.718 65.9935 42.3965 66.0001C57.7535 66.0133 73.1105 66.0826 88.4675 66.208C98.1724 66.2873 105.17 70.2914 109.46 78.2206C115.905 90.144 109.541 105.405 96.5188 109.643C93.7469 110.548 88.8402 111 81.7988 111C66.5705 110.993 51.3423 110.99 36.1141 110.99C18.7917 110.99 6.88763 94.9272 14.1866 79.0425Z"
            fill="#5D6A7D"
        />
        <path
            d="M14.1866 79.0425C16.7755 73.4043 20.8723 69.5817 26.477 67.5747C29.4115 66.5183 34.718 65.9935 42.3965 66.0001C57.7535 66.0133 73.1105 66.0826 88.4675 66.208C98.1724 66.2873 105.17 70.2914 109.46 78.2206C115.905 90.144 109.541 105.405 96.5188 109.643C93.7469 110.548 88.8402 111 81.7988 111C66.5705 110.993 51.3423 110.99 36.1141 110.99C18.7917 110.99 6.88763 94.9272 14.1866 79.0425Z"
            stroke="#5D6A7D"
        />
        <path
            d="M144.997 66.3814C158.72 64.1668 172.02 71.9309 172 81.0132C171.987 85.8465 171.944 90.6798 171.872 95.5132C171.773 102.24 167.406 106.959 158.77 109.67C147.04 113.342 132.705 109.071 128.538 101.03C127.623 99.259 127.169 96.4271 127.176 92.5341C127.18 91.3415 127.136 90.0714 127.091 88.7693C126.941 84.437 126.779 79.7498 128.35 76.3798C130.806 71.1115 136.354 67.7787 144.997 66.3814Z"
            fill="#5D6A7D"
        />
        <path
            d="M144.997 66.3814C158.72 64.1668 172.02 71.9309 172 81.0132C171.987 85.8465 171.944 90.6798 171.872 95.5132C171.773 102.24 167.406 106.959 158.77 109.67C147.04 113.342 132.705 109.071 128.538 101.03C127.623 99.259 127.169 96.4271 127.176 92.5341C127.18 91.3415 127.136 90.0714 127.091 88.7693C126.941 84.437 126.779 79.7498 128.35 76.3798C130.806 71.1115 136.354 67.7787 144.997 66.3814Z"
            stroke="#5D6A7D"
        />
        <path
            d="M138.803 133H21.1972C9.49029 133 0 142.797 0 154.883V156.117C0 168.203 9.49029 178 21.1972 178H138.803C150.51 178 160 168.203 160 156.117V154.883C160 142.797 150.51 133 138.803 133Z"
            fill="#5D6A7D"
        />
        <path
            d="M138.803 133H21.1972C9.49029 133 0 142.797 0 154.883V156.117C0 168.203 9.49029 178 21.1972 178H138.803C150.51 178 160 168.203 160 156.117V154.883C160 142.797 150.51 133 138.803 133Z"
            stroke="#5D6A7D"
        />
        <circle cx={160} cy={23} r={22} fill="#5D6A7D"/>
        <circle cx={160} cy={23} r={22} stroke="#5D6A7D"/>
    </svg>
}

function $Nav() {
    return <Nav
        logo={
            <$Logo
                style={{
                    marginLeft: 210
                }}
                width={24}
            />
        }
        kind="middle"
    >
        <Nav.Item value="build" href="/build">
            Build
        </Nav.Item>
        <Nav.Item value="design" href="/design">
            Design
        </Nav.Item>
        <Nav.Item value="launch" href="/launch">
            Launch
        </Nav.Item>
    </Nav>
}

function $Hero() {
    return <CTABanner>
        <CTABanner.Heading
            title="XYD"
            subtitle={<>
                Build documentation websites <br/>
                <strong>better</strong>
            </>}
            headingEffect
        />
        <CTABanner.ButtonGroup>
            <Button kind="primary">
                What is XYD?
            </Button>
            <Button>
                Quickstart
            </Button>
            <Button>
                GitHub
            </Button>
        </CTABanner.ButtonGroup>
    </CTABanner>
}

function $Cards() {
    return <div
        className="xyd_view-comp-homeview-cards"
        style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 500px)",
            justifyContent: "center",
            gap: 30,
        }}>
        <GuideCard
            href="#"
            title="Developer Eperience"
            kind="secondary"
            size="md"
            icon={<IconCode/>}
        >
            Designed to be easy to use, with a focus on developer experience.
            Just put content files and XYD will do the rest.
        </GuideCard>

        <GuideCard
            href="#"
            title="Customization"
            kind="secondary"
            size="md"
            icon={<svg
                width="1em"
                viewBox="0 0 24 24"
            >
                <path
                    fill="currentColor"
                    d="M13 21V11h8v10h-8zM3 13V3h8v10H3zm6-2V5H5v6h4zM3 21v-6h8v6H3zm2-2h4v-2H5v2zm10 0h4v-6h-4v6zM13 3h8v6h-8V3zm2 2v2h4V5h-4z"
                />
            </svg>}
        >
            Customize every part of your documentation. From the layout, to the colors, to the custom logic. <br/>
            XYD was built to be flexible.
        </GuideCard>

        <GuideCard
            href="#"
            title="Built-in Standards"
            kind="secondary"
            size="md"
            icon={"📚"}

        >
            Content management, components, integrations and much more are built-in with a seamless API you can access.
        </GuideCard>

        <GuideCard
            href="#"
            title="Ecosystem"
            kind="secondary"
            size="md"
            icon="🌱"
        >
            Modern documentation websites are more than just a collection of pages.
            They are a living ecosystem of content, tools, and integrations.
        </GuideCard>
    </div>
}


function $Footer() {
    return <Footer>
        <>
            <p>
                Released under the MIT License.
            </p>
            <p>
                Copyright © 2025-present LiveSession
            </p>
        </>
    </Footer>
}

