// import {highlightSync} from "@code-hike/lighter";
import { Pre } from "codehike/code"
// import { abc } from "../test";

import { highlight } from "@xyd-js/components/coder"
import { Text } from "@primer/react-brand";
// import theme from "@xyd-js/components/coder/themes/cosmo-light"

import cn from './Terminal2.module.css';

const CODE = `import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { projectFiles } from './project-files.ts';

async function main() {
  // First we boot a WebContainer
  const webcontainer = await WebContainer.boot();
  
  // After booting the container we copy all of our project files
  // into the container's file system
  await webcontainer.mount(projectFiles);
    
  // Once the files have been mounted, we install the project's
  // dependencies by spawning \`npm install\`
  const install = await webcontainer.spawn('npm', ['i']);
  
  await install.exit;
    
  // Once all dependencies have been installed, we can spawn \`npm\`
  // to run the \`dev\` script from the project's \`package.json\`
  await webcontainer.spawn('npm', ['run', 'dev']);
}`

export function Terminal2({ header = true, code = CODE, lang = "typescript" }: { header?: boolean, code?: string, lang?: string }) {
    const highlighted = highlight(
        {
            meta: lang,
            lang,
            value: code,
        },
        "material-default",
        "typescript"
    );

    return <div
        className={cn.Editor}
        aria-hidden="true"
    >
        {
            header && <div className={cn.EditorHeading}>
                <Text className={cn.Selected}>
                    hello-world.ts
                </Text>
                <Text className={cn.EditorHeadingItem}>
                    project-files.ts
                </Text>
            </div>
        }
        <div className={cn.EditorContent}>
            <Pre code={highlighted} lang={lang} />
        </div>
    </div>

}