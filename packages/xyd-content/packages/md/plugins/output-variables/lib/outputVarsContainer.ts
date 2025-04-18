/**
* @import {Construct, State, Token, TokenizeContext, Tokenizer} from 'micromark-util-types'
*/

import { ok as assert } from 'devlop'
import { factorySpace } from 'micromark-factory-space'
import { markdownLineEnding } from 'micromark-util-character'
import { codes, constants, types } from 'micromark-util-symbol'

import { factoryAttributes } from './factoryAttributes'
import { factoryLabel } from './factoryLabel'
import { factoryName } from './factoryName'

import { PRIMARY_SYMBOL } from './const'

/** @type {Construct} */
export const outputVarsContainer = {
    tokenize: tokenizeOutputVarsContainer,
    concrete: true
}


const label = { tokenize: tokenizeLabel, partial: true }
const attributes = { tokenize: tokenizeAttributes, partial: true }
const nonLazyLine = { tokenize: tokenizeNonLazyLine, partial: true }

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeOutputVarsContainer(effects, ok, nok) {
    const self = this
    let size = 0
    const tail = self.events[self.events.length - 1]
    const initialSize =
        tail && tail[1].type === types.linePrefix
            ? tail[2].sliceSerialize(tail[1], true).length
            : 0
    let sizeOpen = 0
    /** @type {Token} */
    let previous

    return start

    /** @type {State} */
    function start(code) {
        assert(code === PRIMARY_SYMBOL, 'expected `>`')
        effects.enter('outputVarContainer')
        effects.enter('outputVarContainerFence')
        effects.enter('outputVarContainerSequence')
        return sequenceOpen(code)
    }

    /** @type {State} */
    function sequenceOpen(code) {
        if (code === PRIMARY_SYMBOL) {
            effects.consume(code)
            sizeOpen++
            return sequenceOpen
        }

        if (sizeOpen < constants.codeFencedSequenceSizeMin) {
            return nok(code)
        }

        effects.exit('outputVarContainerSequence')
        return factoryName.call(
            self,
            effects,
            afterName,
            nok,
            'outputVarContainerName'
        )(code)
    }

    /** @type {State} */
    function afterName(code) {
        return code === codes.leftSquareBracket
            ? effects.attempt(label, afterLabel, afterLabel)(code)
            : afterLabel(code)
    }

    /** @type {State} */
    function afterLabel(code) {
        return code === codes.leftCurlyBrace
            ? effects.attempt(attributes, afterAttributes, afterAttributes)(code)
            : afterAttributes(code)
    }

    /** @type {State} */
    function afterAttributes(code) {
        return factorySpace(effects, openAfter, types.whitespace)(code)
    }

    /** @type {State} */
    function openAfter(code) {
        effects.exit('outputVarContainerFence')

        if (code === codes.eof) {
            return after(code)
        }

        if (markdownLineEnding(code)) {
            if (self.interrupt) {
                return ok(code)
            }

            return effects.attempt(nonLazyLine, contentStart, after)(code)
        }

        return nok(code)
    }

    /** @type {State} */
    function contentStart(code) {
        if (code === codes.eof) {
            return after(code)
        }

        if (markdownLineEnding(code)) {
            return effects.check(
                nonLazyLine,
                emptyContentNonLazyLineAfter,
                after
            )(code)
        }

        effects.enter('outputVarContainerContent')
        return lineStart(code)
    }

    /** @type {State} */
    function lineStart(code) {
        return effects.attempt(
            { tokenize: tokenizeClosingFence, partial: true },
            afterContent,
            initialSize
                ? factorySpace(effects, chunkStart, types.linePrefix, initialSize + 1)
                : chunkStart
        )(code)
    }

    /** @type {State} */
    function chunkStart(code) {
        if (code === codes.eof) {
            return afterContent(code)
        }

        if (markdownLineEnding(code)) {
            return effects.check(nonLazyLine, chunkNonLazyStart, afterContent)(code)
        }

        return chunkNonLazyStart(code)
    }

    /** @type {State} */
    function contentContinue(code) {
        if (code === codes.eof) {
            const t = effects.exit(types.chunkDocument)
            self.parser.lazy[t.start.line] = false
            return afterContent(code)
        }

        if (markdownLineEnding(code)) {
            return effects.check(nonLazyLine, nonLazyLineAfter, lineAfter)(code)
        }

        effects.consume(code)
        return contentContinue
    }

    /** @type {State} */
    function chunkNonLazyStart(code) {
        const token = effects.enter(types.chunkDocument, {
            contentType: constants.contentTypeDocument,
            previous
        })
        if (previous) previous.next = token
        previous = token
        return contentContinue(code)
    }

    /** @type {State} */
    function emptyContentNonLazyLineAfter(code) {
        effects.enter('outputVarContainerContent')
        return lineStart(code)
    }

    /** @type {State} */
    function nonLazyLineAfter(code) {
        effects.consume(code)
        const t = effects.exit(types.chunkDocument)
        self.parser.lazy[t.start.line] = false
        return lineStart
    }

    /** @type {State} */
    function lineAfter(code) {
        const t = effects.exit(types.chunkDocument)
        self.parser.lazy[t.start.line] = false
        return afterContent(code)
    }

    /** @type {State} */
    function afterContent(code) {
        effects.exit('outputVarContainerContent')
        return after(code)
    }

    /** @type {State} */
    function after(code) {
        effects.exit('outputVarContainer')
        return ok(code)
    }

    /**
     * @this {TokenizeContext}
     * @type {Tokenizer}
     */
    function tokenizeClosingFence(effects, ok, nok) {
        let size = 0
        assert(self.parser.constructs.disable.null, 'expected `disable.null`')
        return factorySpace(
            effects,
            closingPrefixAfter,
            types.linePrefix,
            self.parser.constructs.disable.null.includes('codeIndented')
                ? undefined
                : constants.tabSize
        )

        /** @type {State} */
        function closingPrefixAfter(code) {
            effects.enter('outputVarContainerFence')
            effects.enter('outputVarContainerSequence')
            return closingSequence(code)
        }

        /** @type {State} */
        function closingSequence(code) {
            if (code === PRIMARY_SYMBOL) {
                effects.consume(code)
                size++
                return closingSequence
            }

            if (size < sizeOpen) return nok(code)
            effects.exit('outputVarContainerSequence')
            return factorySpace(effects, closingSequenceEnd, types.whitespace)(code)
        }

        /** @type {State} */
        function closingSequenceEnd(code) {
            if (code === codes.eof || markdownLineEnding(code)) {
                effects.exit('outputVarContainerFence')
                return ok(code)
            }

            return nok(code)
        }
    }
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeLabel(effects, ok, nok) {
    // Always a `[`
    return factoryLabel(
        effects,
        ok,
        nok,
        'outputVarContainerLabel',
        'outputVarContainerLabelMarker',
        'outputVarContainerLabelString',
        true
    )
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeAttributes(effects, ok, nok) {
    // Always a `{`
    return factoryAttributes(
        effects,
        ok,
        nok,
        'outputVarContainerAttributes',
        'outputVarContainerAttributesMarker',
        'outputVarContainerAttribute',
        'outputVarContainerAttributeId',
        'outputVarContainerAttributeClass',
        'outputVarContainerAttributeName',
        'outputVarContainerAttributeInitializerMarker',
        'outputVarContainerAttributeValueLiteral',
        'outputVarContainerAttributeValue',
        'outputVarContainerAttributeValueMarker',
        'outputVarContainerAttributeValueData',
        true
    )
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeNonLazyLine(effects, ok, nok) {
    const self = this

    return start

    /** @type {State} */
    function start(code) {
        assert(markdownLineEnding(code), 'expected eol')
        effects.enter(types.lineEnding)
        effects.consume(code)
        effects.exit(types.lineEnding)
        return lineStart
    }

    /** @type {State} */
    function lineStart(code) {
        return self.parser.lazy[self.now().line] ? nok(code) : ok(code)
    }
}