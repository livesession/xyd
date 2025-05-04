import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

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
