import { css } from "@linaria/core";

export default {
    AtlasDecoratorHost: css`
        @layer templates {
           atlas-apiref-proptype {
                font-size: var(--xyd-font-size-xsmall);
           }

           atlas-apiref-item-showcase {
            font-size: var(--xyd-font-size-small);
           }
        }
    `
}
