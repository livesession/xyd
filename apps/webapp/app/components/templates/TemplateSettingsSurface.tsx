import { Heading, Surface, SurfaceHeader, SurfaceScroll, SurfaceNavigation } from "~/components"

interface TemplateSettingsSurfaceProps {
    id: string;
    title: string;
    description: string | React.ReactElement;
    icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    children: React.ReactElement;

    heading: React.ReactElement;
    headingDescription?: React.ReactElement;

    navigationAction?: React.ReactElement;
}
export function TemplateSettingsSurface(props: TemplateSettingsSurfaceProps) {
    const { id, title, description, icon, heading, headingDescription, children, navigationAction } = props;

    return <Surface surface={id}>
        <SurfaceHeader
            title={title}
            description={description}
            icon={icon}
        />
        <SurfaceScroll>
            <SurfaceNavigation right={navigationAction}>
                <Heading
                    size="medium"
                    as="h3"
                    description={headingDescription}
                >
                    {heading}
                </Heading>
            </SurfaceNavigation>

            {children}
        </SurfaceScroll>
    </Surface>
}

