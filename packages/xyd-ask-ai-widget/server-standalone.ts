import { startServer } from "./src/index";
import { loadSetting } from "./src/utils";

loadSetting().then(startServer).catch(console.error);
