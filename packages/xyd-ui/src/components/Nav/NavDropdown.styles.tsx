import { css } from "@linaria/core";

/** The inline `<xyd-nav-dropdown>` host + its trigger (styled like a nav item). */
export const DropdownHost = css`
    @layer defaults {
        position: relative;
        display: inline-flex;
        align-items: center;

        [part="dropdown-trigger"] {
            /* targeted button reset (not \`all: unset\`, which resets the inherited
               \`cursor\` and can clobber the \`cursor: pointer\` below) */
            appearance: none;
            background: none;
            border: none;
            outline: none;
            margin: 0;
            font: inherit;
            box-sizing: border-box;
            cursor: pointer;
            position: relative;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--xyd-nav-item-color);
            padding: var(--xyd-nav-item-padding-y) var(--xyd-nav-item-padding);
            border-radius: var(--xyd-border-radius-medium, 8px);

            &:hover,
            &[data-state="open"] {
                color: var(--xyd-nav-item-color--active);
            }

            &[data-active] {
                font-weight: var(--xyd-font-weight-semibold, 600);
                color: var(--xyd-nav-item-color--active);
            }

            /* The trigger's own icon. Left unstyled the span stays a block and its
               inline <svg> sits on the TEXT BASELINE, landing the glyph a couple of
               pixels above the label's optical centre. The trigger being a centered
               flex row does not help: it centers the span, not the baseline-aligned
               box inside it. Menu items already get this, in DropdownList below. */
            [part="dropdown-icon"] {
                flex: none;
                display: inline-flex;
                align-items: center;
            }
        }

        [part="dropdown-chevron"] {
            flex: none;
            transition: transform 0.15s ease;
        }

        /* Chevron rotation on open. Override the angle (e.g. \`90deg\`, or \`0deg\`
           to disable) via \`--xyd-nav-dropdown-chevron-rotate\`. */
        [part="dropdown-trigger"][data-state="open"] [part="dropdown-chevron"] {
            transform: rotate(var(--xyd-nav-dropdown-chevron-rotate, 180deg));
        }
    }
`;

/** The portaled menu panel (`DropdownMenu.Content` / `SubContent`) + its items. */
export const DropdownList = css`
    @layer defaults {
        z-index: 50;
        min-width: 180px;
        max-height: min(70vh, 480px);
        /* \`overflow: hidden\` (not just -y) so full-bleed item backgrounds are
           clipped to the panel's rounded corners when padding/gap are set to 0. */
        overflow: hidden auto;
        display: flex;
        flex-direction: column;
        /* Set \`--xyd-nav-dropdown-padding\` + \`--xyd-nav-dropdown-gap\` to \`0\` for
           edge-to-edge hovered-item backgrounds (touching all four sides). */
        gap: var(--xyd-nav-dropdown-gap, 2px);
        padding: var(--xyd-nav-dropdown-padding, 6px);

        /* A custom panel component (segment.component) controls its own padding +
           width and may be tall — drop the list padding and give it more room. */
        &[data-panel] {
            padding: 0;
            max-height: min(85vh, 760px);
        }

        /* Multi-column menu (\`itemsPerColumn\`): fill column-first — N rows down,
           then the next column (e.g. 12 items with 7/column → 7 + 5). */
        &[data-columns] {
            display: grid;
            grid-auto-flow: column;
            grid-template-rows: repeat(var(--xyd-nav-dropdown-rows, 7), auto);
            column-gap: 8px;
            max-height: none;
        }
        background: var(--xyd-nav-dropdown-bgcolor, var(--xyd-content-bgcolor, var(--white, #fff)));
        color: var(--xyd-nav-item-color);
        border: 1px solid var(--xyd-nav-dropdown-border-color, var(--color-header-border, var(--dark12, rgba(0, 0, 0, 0.08))));
        border-radius: var(--xyd-border-radius-medium, 8px);
        box-shadow: var(--xyd-nav-dropdown-shadow, 0 8px 24px rgba(0, 0, 0, 0.12));

        /* Leaf links wrap the item element (link = navigation, custom element =
           the styled row). \`display: contents\` lets the item behave as a direct
           full-width child of the menu. */
        & > a {
            display: contents;
            text-decoration: none;
            color: inherit;
        }

        [part="dropdown-item"] {
            /* targeted reset (avoid \`all: unset\` — it wipes the inherited cursor) */
            appearance: none;
            background: none;
            border: none;
            outline: none;
            font: inherit;
            box-sizing: border-box;
            cursor: pointer;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: var(--xyd-nav-dropdown-item-padding, 6px 8px);
            /* Set \`--xyd-nav-dropdown-item-radius: 0\` for square, edge-to-edge rows. */
            border-radius: var(--xyd-nav-dropdown-item-radius, var(--xyd-border-radius-small, 4px));
            color: var(--xyd-nav-item-color);
            text-decoration: none;
            white-space: nowrap;

            &:hover,
            &[data-highlighted],
            &[data-state="open"] {
                background: var(--xyd-nav-dropdown-item-bgcolor--hover, var(--xyd-sidebar-item-bgcolor--active, rgba(0, 0, 0, 0.05)));
                color: var(--xyd-nav-item-color--active);
            }

            &[data-active] {
                font-weight: var(--xyd-font-weight-semibold, 600);
                color: var(--xyd-nav-item-color--active);
            }
        }

        /* The router link wrapping each leaf item IS the Radix menuitem — Radix
           moves focus to it on hover, so the browser draws a focus outline on the
           <a> (not on [part="dropdown-item"], which already resets it). Kill it; the
           row background is the hover affordance. */
        a {
            outline: none;
        }

        [part="dropdown-icon"] {
            flex: none;
            display: inline-flex;
            align-items: center;
        }

        [part="dropdown-label-group"] {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
        }

        [part="dropdown-label"] {
            font-size: var(--xyd-font-size-small, 14px);
        }

        [part="dropdown-description"] {
            font-size: var(--xyd-font-size-xsmall, 12px);
            opacity: 0.7;
        }

        [part="dropdown-submenu-indicator"] {
            margin-inline-start: auto;
            display: inline-flex;
            align-items: center;
            opacity: 0.7;
        }
    }
`;
