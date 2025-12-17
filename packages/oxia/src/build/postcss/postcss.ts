import postcss from "postcss";
import combineDuplicateSelectors from "postcss-combine-duplicated-selectors";
import discardComments from "postcss-discard-comments";
import selectorParser from "postcss-selector-parser";
import type { ScopedStyleStrategy } from "../../config/types.js";
import { STYLE_SCOPE_ATTRIBUTE_PREFIX, STYLE_SCOPE_CLASS_PREFIX } from "../tsx2html/types.js";

const scopeAttributesPlugin = (scopeId: string) => {
	const scopeAttribute = `${STYLE_SCOPE_ATTRIBUTE_PREFIX}${scopeId}`;

	return {
		postcssPlugin: "scope-attributes",
		Once(root: any) {
			root.walkRules((rule: any) => {
				rule.selector = selectorParser(selectors => {
					const selectorTagsAndClasses: (selectorParser.Tag | selectorParser.ClassName)[] = [];

					selectors.walk(selector => {
						if (selectorParser.isTag(selector) || selectorParser.isClassName(selector)) {
							selectorTagsAndClasses.push(selector);
						}
					});

					selectorTagsAndClasses.forEach(selector => {
					selector.parent!.insertAfter(selector, selectorParser.attribute({ attribute: scopeAttribute, value: undefined, raws: {} }));
					});
				}).processSync(rule.selector, { lossless: false });
			});
		}
	};
};

const scopeClassPlugin = (scopeId: string) => {
	const className = `${STYLE_SCOPE_CLASS_PREFIX}${scopeId}`;

	return {
		postcssPlugin: "scope-class",
		Once(root: any) {
			root.walkRules((rule: any) => {
				rule.selector = selectorParser(selectors => {
					const selectorTagsAndClasses: (selectorParser.Tag | selectorParser.ClassName)[] = [];

					selectors.walk(selector => {
						if (selectorParser.isTag(selector) || selectorParser.isClassName(selector)) {
							selectorTagsAndClasses.push(selector);
						}
					});

					selectorTagsAndClasses.forEach(selector => {
					selector.parent!.insertAfter(selector, selectorParser.className({ value: className }));
					});
				}).processSync(rule.selector, { lossless: false });
			});
		}
	};
};

const scopeWherePlugin = (scopeId: string) => {
	const where = `:where(.${STYLE_SCOPE_CLASS_PREFIX}${scopeId})`;

	return {
		postcssPlugin: "scope-where",
		Once(root: any) {
			root.walkRules((rule: any) => {
				rule.selector = selectorParser(selectors => {
					const selectorTagsAndClasses: (selectorParser.Tag | selectorParser.ClassName)[] = [];

					selectors.walk(selector => {
						if (selectorParser.isTag(selector) || selectorParser.isClassName(selector)) {
							selectorTagsAndClasses.push(selector);
						}
					});

					selectorTagsAndClasses.forEach(selector => {
					selector.parent!.insertAfter(selector, selectorParser.combinator({ value: where }));
					});
				}).processSync(rule.selector, { lossless: false });
			});
		}
	};
};

export function processScopedCss(scopedStyleStrategy: ScopedStyleStrategy, srcFilePath: string, css: string, scopeId: string) {
	const scopePlugin = scopedStyleStrategy === "attribute"
		? scopeAttributesPlugin
		: scopedStyleStrategy === "class"
			? scopeClassPlugin
			: scopeWherePlugin;

	let out = css;
	out = postcss([
		scopePlugin(scopeId),
		combineDuplicateSelectors({ removeDuplicatedProperties: true }),
		discardComments(),
	]).process(out, { from: srcFilePath }).css;
	return out;
}

export function processGlobalCss(srcFilePath: string, css: string) {
	let out = css;
	out = postcss([
		combineDuplicateSelectors({ removeDuplicatedProperties: true }),
		discardComments(),
	]).process(out, { from: srcFilePath }).css;
	return out;
}
