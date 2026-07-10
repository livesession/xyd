// === index.js ===
import { createContext, useContext } from "react";
var composer;
(function(composer2) {
  (function(chat3) {
    chat3.Context = createContext(null);
    chat3.Context.displayName = "ComposerChatContext";
    function useChat() {
      const ctx = useContext(chat3.Context);
      if (!ctx)
        throw new Error("useChat must be inside ChatProvider");
      return ctx;
    }
    chat3.useChat = useChat;
  })(composer2.chat || (composer2.chat = {}));
})(composer || (composer = {}));
const chat = composer.chat;
(function(composer2) {
  (function(fs3) {
    fs3.Context = createContext({
      files: [],
      currentDir: "/",
      openFile: () => {
      }
    });
    fs3.Context.displayName = "FileSystemContext";
    function useFileSystem() {
      return useContext(fs3.Context);
    }
    fs3.useFileSystem = useFileSystem;
  })(composer2.fs || (composer2.fs = {}));
})(composer || (composer = {}));
const fs = composer.fs;
composer.chat.Context.__xydUniform = JSON.parse('{"title":"composer.chat.Context","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"messages","type":"$$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"string","properties":[],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"isLoading","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]},{"name":"mode","type":"$$xor","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"auto","type":"string","description":""},{"name":"plan","type":"string","description":""},{"name":"manual","type":"string","description":""},{"name":"ask","type":"string","description":""}]},{"name":"setMode","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"mode","type":"$$xor","description":"","properties":[{"name":"auto","type":"string","description":""},{"name":"plan","type":"string","description":""},{"name":"manual","type":"string","description":""},{"name":"ask","type":"string","description":""}],"meta":[]}],"ofProperty":{"name":"","type":"unknown","description":"","meta":[]}},{"name":"model","type":"$$xor","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"claude","type":"string","description":""},{"name":"gpt-4","type":"string","description":""},{"name":"gemini","type":"string","description":""}]},{"name":"setModel","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"model","type":"$$xor","description":"","properties":[{"name":"claude","type":"string","description":""},{"name":"gpt-4","type":"string","description":""},{"name":"gemini","type":"string","description":""}],"meta":[]}],"ofProperty":{"name":"","type":"unknown","description":"","meta":[]}},{"name":"sendMessage","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"text","type":"string","description":"","properties":[],"meta":[]}],"ofProperty":{"name":"","type":"unknown","description":"","meta":[]}}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
composer.fs.Context.__xydUniform = JSON.parse('{"title":"composer.fs.Context","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"files","type":"$$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"object","properties":[{"name":"path","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"content","type":"string","description":"","meta":[{"name":"required","value":"true"}]}],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"currentDir","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"openFile","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"path","type":"string","description":"","properties":[],"meta":[]}],"ofProperty":{"name":"","type":"unknown","description":"","meta":[]}}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  chat,
  composer,
  fs
};

