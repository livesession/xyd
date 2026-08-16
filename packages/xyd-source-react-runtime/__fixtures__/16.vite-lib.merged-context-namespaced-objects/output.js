// === index.js ===
import { createContext, useContext } from "react";
var composer;
(function(composer2) {
  (function(fs3) {
    fs3.Context = createContext(null);
    fs3.Context.displayName = "FileSystemContext";
    function useFileSystem() {
      const ctx = useContext(fs3.Context);
      if (!ctx)
        throw new Error("useFileSystem must be inside FileSystemProvider");
      return ctx;
    }
    fs3.useFileSystem = useFileSystem;
  })(composer2.fs || (composer2.fs = {}));
})(composer || (composer = {}));
const fs = composer.fs;
composer.fs.Context.__xydUniform = JSON.parse('{"title":"composer.fs.Context","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"vfs","type":"composer.VFS","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"readFile","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"path","type":"string","description":"","properties":[],"meta":[]}],"ofProperty":{"name":"","type":"string","description":"","meta":[]}},{"name":"writeFile","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"path","type":"string","description":"","properties":[],"meta":[]},{"name":"content","type":"string","description":"","properties":[],"meta":[]}],"ofProperty":{"name":"","type":"unknown","description":"","meta":[]}},{"name":"listFiles","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"dir","type":"string","description":"","properties":[],"meta":[]}],"ofProperty":{"name":"","type":"$$array","description":"","meta":[]}}]},{"name":"bootVolume","type":"composer.BootVolume","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"path","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"sizeBytes","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"mounted","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"currentDir","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"openFile","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"path","type":"string","description":"","properties":[],"meta":[]}],"ofProperty":{"name":"","type":"unknown","description":"","meta":[]}}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  composer,
  fs
};

