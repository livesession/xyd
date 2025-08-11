/**
 * @import {Extension} from 'micromark-util-types'
 */

import { codes } from 'micromark-util-symbol'

import { outputVarsContainer } from './outputVarsContainer'
import { PRIMARY_SYMBOL } from './const'

/**
 * Create an extension for `micromark` to enable output vars syntax.
 *
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions`, to
 *   enable output vars syntax.
 */
export function outputVars() {
  return {
    flow: { [PRIMARY_SYMBOL]: [outputVarsContainer] }
  }
}