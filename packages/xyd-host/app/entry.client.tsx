import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// TODO: !!! BETTER !!! - needed cuz issues with rerender in react-router hash change
(() => {
  var _wr = function (type: 'pushState' | 'replaceState') {
    var orig = history[type];
    return function (data: any, unused: string, url?: string | URL | null) {
      var rv = orig.call(history, data, unused, url);
      var e = new Event(type);
      (e as any).arguments = arguments;
      window.dispatchEvent(e);
      return rv;
    };
  };
  history.replaceState = _wr('replaceState')
})()

console.log(`+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                             |
|                                                                                              dddddddd                       |
|               ///////                                                                        d::::::d                       |
|              /:::::/                                                                         d::::::d          >>>>>>>      |
|             /:::::/                                                                          d::::::d           >:::::>     |
|            /:::::/                                                                           d::::::d             >:::::>   |
|           /:::::/         xxxxxxx      xxxxxxx     yyyyyyy           yyyyyyy         ddddddddd:::::d              >:::::>   |
|          /:::::/           x:::::x    x:::::x       y:::::y         y:::::y        dd::::::::::::::d               >:::::>  |
|         /:::::/             x:::::x  x:::::x         y:::::y       y:::::y        d::::::::::::::::d                >:::::> |
|        /:::::/               x:::::xx:::::x           y:::::y     y:::::y        d:::::::ddddd:::::d                 >:::::>|
|       /:::::/                 x::::::::::x             y:::::y   y:::::y         d::::::d    d:::::d                >:::::> |
|      /:::::/                   x::::::::x               y:::::y y:::::y          d:::::d     d:::::d               >:::::>  |
|     /:::::/                    x::::::::x                y:::::y:::::y           d:::::d     d:::::d              >:::::>   |
|    /:::::/                    x::::::::::x                y:::::::::y            d:::::d     d:::::d             >:::::>    |
|   /:::::/                    x:::::xx:::::x                y:::::::y             d::::::ddddd::::::dd           >:::::>     |
|  /:::::/                    x:::::x  x:::::x                y:::::y               d:::::::::::::::::d          >>>>>>>      |
| /:::::/                    x:::::x    x:::::x              y:::::y                 d:::::::::ddd::::d                       |
|///////                    xxxxxxx      xxxxxxx            y:::::y                   ddddddddd   ddddd                       |
|                                                          y:::::y                                                            |
|                                                         y:::::y                                                             |
|                                                        y:::::y                                                              |
|                                                       y:::::y                                                               |
|                                                      yyyyyyy                                                                |
|                                                                                                                             |
|                                                                                                                             |
| Check out https://github.com/livesession/xyd                                                                                |
+-----------------------------------------------------------------------------------------------------------------------------+
`)


startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
