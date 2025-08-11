// .storybook/manager.ts
import { addons } from '@storybook/manager-api';
import theme from './theme';

addons.setConfig({
  // where to show the addon panel: 'bottom' (default) or 'right'
  panelPosition: 'right',
  // you can also tweak its size if you like:
  bottomPanelHeight: 200,  // height in px when bottom
  rightPanelWidth: 300,    // width in px when right
  // (and any other UI settings you need)

  selectedPanel: 'storybookjs/storysource/panel',
  navSize: 230,

  // Apply custom theme
  theme,
});