// === index.js ===
import { createContext, useContext } from "react";
var myapp$1;
(function(myapp2) {
  (function(chat3) {
    chat3.Context = createContext(null);
    chat3.Context.displayName = "ChatContext";
    function useChat() {
      const ctx = useContext(chat3.Context);
      if (!ctx)
        throw new Error("useChat must be inside ChatProvider");
      return ctx;
    }
    chat3.useChat = useChat;
  })(myapp2.chat || (myapp2.chat = {}));
})(myapp$1 || (myapp$1 = {}));
const chat = myapp$1.chat;
myapp$1.chat.Context.__xydUniform = JSON.parse('{"title":"myapp.chat.Context","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"messages","type":"$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"string","properties":[],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"isLoading","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]},{"name":"sendMessage","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"text","type":"string","description":"","properties":[],"meta":[]}],"ofProperty":{"name":"","type":"unknown","description":"","meta":[]}},{"name":"clearHistory","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"unknown","description":"","meta":[]}}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
var myapp;
(function(myapp2) {
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
  })(myapp2.fs || (myapp2.fs = {}));
})(myapp || (myapp = {}));
const fs = myapp.fs;
myapp.fs.Context.__xydUniform = JSON.parse('{"title":"myapp.fs.Context","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"files","type":"$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"object","properties":[{"name":"path","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"content","type":"string","description":"","meta":[{"name":"required","value":"true"}]}],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"currentDir","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"openFile","type":"$$function","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"path","type":"string","description":"","properties":[],"meta":[]}],"ofProperty":{"name":"","type":"unknown","description":"","meta":[]}}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  chat,
  fs,
  myapp$1 as myapp
};

