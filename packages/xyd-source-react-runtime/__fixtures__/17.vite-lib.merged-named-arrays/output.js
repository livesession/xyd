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
composer.chat.Context.__xydUniform = JSON.parse('{"title":"composer.chat.Context","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"panelTabs","type":"$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"Tab","properties":[{"name":"id","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"label","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"active","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]},{"name":"previewEngine","type":"PreviewEngineChat","description":"","properties":[{"name":"name","type":"\\"chat\\"","description":"","meta":[{"name":"required","value":"true"}]},{"name":"messages","type":"$array","description":"","properties":[],"ofProperty":{"name":"","type":"string","description":"","meta":[{"name":"required","value":"true"}]},"meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"},{"name":"nullable","value":"true"}]},{"name":"processing","type":"TabProcessing","description":"","properties":[{"name":"todos","type":"$array","description":"","properties":[],"ofProperty":{"name":"","type":"string","description":"","meta":[{"name":"required","value":"true"}]},"meta":[{"name":"required","value":"true"}]},{"name":"isProcessing","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"},{"name":"nullable","value":"true"}]}],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"history","type":"$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"HistoryItem","properties":[{"name":"id","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"prompt","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"timestamp","type":"number","description":"","meta":[{"name":"required","value":"true"}]}],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"activeTab","type":"Tab","description":"","meta":[{"name":"required","value":"true"},{"name":"nullable","value":"true"}],"properties":[{"name":"id","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"label","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"active","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]},{"name":"previewEngine","type":"PreviewEngineChat","description":"","properties":[{"name":"name","type":"\\"chat\\"","description":"","meta":[{"name":"required","value":"true"}]},{"name":"messages","type":"$array","description":"","properties":[],"ofProperty":{"name":"","type":"string","description":"","meta":[{"name":"required","value":"true"}]},"meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"},{"name":"nullable","value":"true"}]},{"name":"processing","type":"TabProcessing","description":"","properties":[{"name":"todos","type":"$array","description":"","properties":[],"ofProperty":{"name":"","type":"string","description":"","meta":[{"name":"required","value":"true"}]},"meta":[{"name":"required","value":"true"}]},{"name":"isProcessing","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"},{"name":"nullable","value":"true"}]}]},{"name":"activeTabId","type":"string","description":"","meta":[{"name":"required","value":"true"},{"name":"nullable","value":"true"}]},{"name":"children","type":"ReactNode","description":"","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  chat,
  composer
};

