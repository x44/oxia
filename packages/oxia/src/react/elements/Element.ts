import chalk from "chalk";
import { type FunctionInfo, type SlotStyleInfo, type StyleInfo } from "../../build/oxia2tsx/types.js";
import { getStyleId, registerComponentStyle, registerSlotStyle, type StyleRegistry } from "../../build/tsx2html/style-registry.js";
import { STYLE_SCOPE_ATTRIBUTE_PREFIX, STYLE_SCOPE_CLASS_PREFIX } from "../../build/tsx2html/types.js";
import { Log } from "../../util/log.js";

export type ElementProps = {
	[key: string]: any;
}

type Attribute = {
	key: string;
	val: AttributeValue;
}

type AttributeValue =
| string
| number
| boolean
| Function


/**
 * ***Render Condition "ifSlotFilled" and "ifSlotEmpty"***
 *
 * Renders elements if any slot in the component has/not has content.
 *
 * Implemented as element attributes. Available on all levels:
 * - Intrinsic elements
 * - Component root elements
 * - Fragments (must use \<fragment\>, \<\> does not allow attributes)
 *
 * @example
 * <div ifSlotFilled:more></div>
 * <div ifSlotEmpty:more></div>
 *
 * // Condition on parts of the component:
 * export default function MyComponent() {
 *     return (
 *         <>
 *             <div>This is always rendered</div>
 *             <div ifSlotFilled:more>
 *                 <div>Here is more:</div>
 *                 <div><slot name="more"/></div>
 *             </div>
 *         </>
 *     )
 * }
 *
 * // Condition on the whole component:
 * export default function MyComponent() {
 *     return (
 *         <fragment ifSlotFilled:more>
 *             <div>Here is more:</div>
 *             <div><slot name="more"/></div>
 *         </fragment>
 *     )
 * }
 *
 */
type RenderCondition = () => boolean;

const VoidTags = new Set<string>([
	"#text",
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
]);

/**
 * Note <template> is also listed here https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/head
 * but Astro moves <template> out of the head, so we also do that.
*/
const HeadChildTags = new Set<string>([
	"title",
	"base",
	"link",
	"style",
	"meta",
	"script",
	"noscript",
]);


export default class Element {
	private tag: string;
	private props: ElementProps;
	private parent: Element | undefined;
	private children: Element[] = [];

	/**
	 * The component (IE <fragment>) this element is a child of).
	 * This always is the returned (or wrapped around) <fragment> of the component function.
	 * This never is any <fragment> that lives *inside* of the component.
	 * For the component <fragment> element this is the element itself (this.component == this).
	 * All Elements that are a child of a component (except those which are components)
	 * reference the same object
	 */
	private componentFragment!: Element;

	private isVoid = false;
	private isText = false;
	private isFrag = false;
	private isSlot = false;
	private isHead = false;
	private isHeadChild = false;

	/** For tag "#text" */
	private text?: string;

	/** For tag "#func" */
	private componentFunction?: (props: any) => Element;
	private componentFunctionInfo?: FunctionInfo;
	private componentFunctionName?: string;

	private isComponent = false;

	private attributes: Attribute[] = [];

	/** Stored 'id' attribute value */
	private id: string | null = null;
	/** Stored 'name' attribute value */
	private name: string | null = null;
	/** Stored 'slot' attribute value */
	private slot: string | null = null;

	/** We use this flag to distinguish between internal and externa children when addChildren() gets called. */
	private internalChildrenAdded = false;
	/** Internal children are those which are created my an Element function. */
	private isInternalChild = true;
	/** Injected children are those which are created by the caller of an Element function. */
	private isInjectedChild = false;

	/** For <slot> only. Whether the slot's fallback content has been removed. */
	private didRemoveFallbackContent = false;

	/** Whether this element shall be rendered. */
	private renderCondition: RenderCondition = () => true;

	/** The names of this element's slots which received content. */
	private filledSlotNames?: Set<string>;

	/** The name of the slot this element (and all of it's children) got slotted to. */
	private slottedName?: string;

	/** Style scoping - the styles this element uses. */
	private styles: StyleInfo[] = [];

	/** Style scoping slot style - the slot styles this element uses. Key: slotName */
	private slotStylesMap?: Map<string, SlotStyleInfo>;

	/** The style UUID of the registered, unresolved scope style */
	private styleUuid?: string;
	/** The style of the resolved scope style */
	private styleId?: string;

	constructor(tag: string, props: ElementProps) {
		this.tag = tag;
		this.props = props;
		this.isVoid = VoidTags.has(this.tag);
		this.isFrag = tag === "fragment";
		this.isSlot = tag === "slot";
		this.isHead = tag === "head";
		this.isHeadChild = HeadChildTags.has(tag);

		this.storePropsAsAttributes(this.props);

		this.validateSlotNames();
	}

	/**
	 * Important: After invoking this method the cloned element's component reference
	 * and all of the cloned element's child elements' component references must be updated!
	 * Call clonedElement.initComponentReferences()
	 *
	 * @returns The cloned Element
	 */
	private clone(): Element {
		// Note that we pass empty props to the ctor, since we assign our props to the clone
		const clone = new Element(this.tag, {});
		clone.attributes = this.attributes;

		clone.tag = this.tag;
		clone.isVoid = this.isVoid;
		clone.isText = this.isText;
		clone.isFrag = this.isFrag;
		clone.isSlot = this.isSlot;
		clone.text = this.text;

		clone.isComponent = this.isComponent;
		clone.componentFunction = this.componentFunction;
		clone.componentFunctionInfo = this.componentFunctionInfo;
		clone.componentFunctionName = this.componentFunctionName;

		clone.id = this.id;
		clone.name = this.name;
		clone.slot = this.slot;

		clone.isInternalChild = this.isInternalChild;
		clone.isInjectedChild = this.isInjectedChild;

		clone.didRemoveFallbackContent = this.didRemoveFallbackContent;

		clone.renderCondition = this.renderCondition;

		clone.filledSlotNames = this.filledSlotNames;

		clone.styles = this.styles;
		clone.styleUuid = this.styleUuid;
		clone.slotStylesMap = this.slotStylesMap;

		for (let i = 0; i < this.children.length; ++i) {
			const childClone = this.children[i].clone();
			clone.children.push(childClone);
			childClone.parent = clone;
		}
		return clone;
	}

	private storePropsAsAttributes(props: ElementProps) {

		// Props to filter:
		// ifSlotFilled:<slotName>
		// ifSlotEmpty:<slotName>

		const keys = Object.keys(props);
		for (const key of keys) {

			// Filter special props
			if (key.startsWith("ifSlotFilled:") || key.startsWith("ifSlotEmpty:")) {

				const slotName = this.toSlotName(key.substring(key.indexOf(":") + 1));
				const negate = key.startsWith("ifSlotEmpty:");

				this.addRenderCondition(() => {
					return this.ifSlotFilledContent(slotName, negate);
				});

				delete props.key;
				continue;
			}

			const val = props[key];
			this.attributes.push({
				key,
				val,
			});

			if (key === "id") {
				this.id = val;
			} else
			if (key === "name") {
				this.name = val;
			} else
			if (key === "slot") {
				this.slot = val;
			}
		}
	}

	private addAttribute(key: string, val: AttributeValue) {
		const ind = this.attributes.findIndex(a => a.key === key);
		if (ind !== -1)	{
			this.attributes[ind].val = val;
		} else {
			this.attributes.push({key, val});
		}

		if (typeof val === "string") {
			if (key === "id") {
				this.id = val;
			} else
			if (key === "name") {
				this.name = val;
			} else
			if (key === "slot") {
				this.slot = val;
			}
		}
	}

	private getAttribute(key: string) {
		const attribute = this.attributes.find(a => a.key === key);
		return  attribute ? attribute.val : null;
	}

	private removeAttribute(key: string) {
		const ind = this.attributes.findIndex(a => a.key === key);
		if (ind !== -1) {
			this.attributes.splice(ind, 1);
		}

		if (key === "id") {
			this.id = null;
		} else
		if (key === "name") {
			this.name = null;
		} else
		if (key === "slot") {
			this.slot = null;
		}
	}

	private validateSlotNames() {
		if (this.isSlot) this.validateSlotName(this.name);
		this.validateSlotName(this.slot);
	}

	private validateSlotName(slotName: string | null) {
		slotName = this.toSlotName(slotName);
		// Must not start with a digit
		// Must only contain letters, digits, '-', '_'
		if (slotName[0] >= "0" && slotName[0] <= "9") {
			throw new Error(`Invalid slot name '${slotName}'. Must not start with a digit.`);
		}

		if (!/^[a-zA-Z0-9_-]+$/.test(slotName)) {
			throw new Error(`Invalid slot name '${slotName}'. May only contain letters, digits, underscore and hyphen.`);
		}
	}

	setText(text: string) {
		this.text = text;
		this.isText = true;
	}

	getComponentFunction() {
		return this.componentFunction;
	}

	setComponentFunction(func: (props: any) => Element, functionInfo: FunctionInfo) {
		this.componentFunction = func;
		this.componentFunctionInfo = functionInfo;
		this.componentFunctionName = functionInfo.name;
		this.componentFragment = this;
		this.isComponent = true;

		if (!this.isText) {
			this.styles = functionInfo.styles;
			this.slotStylesMap = functionInfo.slotStyles;
		}
	}

	private getStyles() {
		return this.componentFragment ? this.componentFragment.styles : undefined;
	}

	private getSlotStylesMap() {
		return this.componentFragment ? this.componentFragment.slotStylesMap : undefined;
	}

	private getSlotStyle(slotName: string) {
		const slotStylesMap = this.getSlotStylesMap();
		if (!slotStylesMap) return undefined;
		return slotStylesMap.get(slotName);
	}

	getTag() {
		return this.tag;
	}

	isFragment() {
		return this.isFrag;
	}

	addChildren(children: (string | Element)[]) {
		const childrenAreInternal = !this.internalChildrenAdded;
		this.internalChildrenAdded = true;

		// if (childrenAreInternal) {
		// 	info(`${this.tag} adds internal ${children.length} children`);
		// } else {
		// 	info(`${this.tag} adds external ${children.length} children`);
		// }

		if (!children.length) return;

		if (this.isVoid) {
			const msg = `${this.isText ? this.tag : "<" + this.tag + ">"} must not have children`;
			Log.error(msg);
			throw new Error(msg);
		}

		for (const child of children) {

			const element = this.toElement(child);

			if (!element) continue;
			element.isInternalChild = childrenAreInternal;
			element.isInjectedChild = !childrenAreInternal;

			this.children.push(element);
			element.parent = this;
		}
	}

	private toElement(child: any): Element | undefined {
		if (child instanceof Element) {
			return child;
		}

		if (!child) {
			return undefined;
		}

		if (typeof child === "function") {
			child = (child as () => any)();
			return this.toElement(child);
		}

		child = child.toString();

		if (typeof child === "string") {
			const text = new Element("#text", {});
			text.setText(child);
			return text;
		}

		return undefined;
	}

	initComponentReferences(componentFragment = this) {
		this.componentFragment = componentFragment;

		for (let i = 0; i < this.children.length; ++i) {
			const child = this.children[i];
			if (child.isComponent) {
				// The child is a component, init all the child component's children with the child component itself.
				child.initComponentReferences(child);
			} else {
				// The child lives in the current component, init child with the component
				child.initComponentReferences(componentFragment);
			}
		}
		// DEBUG
		// this.addAttribute("COMPONENT", this.component.toDumpString());
	}

	addDebugInfo() {
		if (this.isComponent) {
			this.addAttribute("_func", `${this.componentFunctionName}()`);
		}

		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].addDebugInfo();
		}
	}

	registerStyles(styleRegistry: StyleRegistry) {
		if (this.isComponent) {
			const styles = this.getStyles();
			if (styles && styles.length) {
				const styleUuid = registerComponentStyle(styleRegistry, styles);
				this.initStyleRegistryReferences(styleUuid);
			}
		}

		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].registerStyles(styleRegistry);
		}
	}

	/** Sets the styleUuid on all non-component children of this element. */
	private initStyleRegistryReferences(styleUuid: string) {
		if (!this.isText) {
			this.styleUuid = styleUuid;
		}
		for (let i = 0; i < this.children.length; ++i) {
			const child = this.children[i];
			if (!child.isComponent) {
				child.initStyleRegistryReferences(styleUuid);
			}
		}
	}

	slotify(styleRegistry: StyleRegistry) {
		if (this.isVoid || this.isText) {
			return this;
		}

		if (!this.isSlot) {
			let slotMap: Map<string, Element[]> | undefined = undefined;

			for (let i = 0; i < this.children.length; ++i) {
				const child = this.children[i];
				if (!child.isInjectedChild) continue;

				if (!slotMap) {
					slotMap = new Map<string, Element[]>();
					this.getAvailableSlots(slotMap);
				}

				const slotName = this.toSlotName(child.slot);

				const slots = slotMap.get(slotName);

				if (slots && slots.length) {
					// important(`${this.toDumpString()} found ${slots.length} slot(s) for slotName '${slotName}'`);
					// important(`${this.toDumpString()} adding to slot '${slotName}': ${child.toDumpString()}`);
					// slots.forEach(slot => slot.addAttribute("FOUNDBY", `${slot.getAttribute("FOUNDBY") ? slot.getAttribute("FOUNDBY") + "," : ""}${this.componentFunctionName}`));

					// We found slots for the child to be slotted.
					// Add child (clones) to *each* found slot
					this.addChildToSlots(styleRegistry, child, slots);

					// Remove the child
					child.parent = undefined;
					this.children.splice(i, 1);
					--i;
				} else {
					Log.warn(`${this.toLogString()} has no slot '${slotName}' to add ${child.toLogString()}`);
					// Remove the child
					child.parent = undefined;
					this.children.splice(i, 1);
					--i;
				}
			}
		}

		for (let i = 0; i < this.children.length; ++i) {
			const child = this.children[i];
			child.slotify(styleRegistry);
		}

		return this;
	}

	private getAvailableSlots(slotMap: Map<string, Element[]>, recurse = true, onlySlotsWithSlotAttribute = false) {
		this.storeSlotChildren(slotMap, onlySlotsWithSlotAttribute);

		if (!recurse) return;

		for (let i = 0; i < this.children.length; ++i) {
			const child = this.children[i];

			if (child.isInternalChild && !child.isSlot) {
				// On component boundaries only check the direct children of the component
				// and only allow slots that have a slot attribute - for slot drilling.
				const recurse = !child.isComponent;
				const onlySlotsWithSlotAttribute = child.isComponent;
				child.getAvailableSlots(slotMap, recurse, onlySlotsWithSlotAttribute);
			}
		}
	}

	private storeSlotChildren(slotMap: Map<string, Element[]>, onlySlotsWithSlotAttribute: boolean) {
		for (let i = 0; i < this.children.length; ++i) {
			const child = this.children[i];
			if (child.isSlot) {

				// Slot drilling
				if (onlySlotsWithSlotAttribute && child.slot === null) continue;

				const slotName = this.toSlotName(child.name);
				let slotList = slotMap.get(slotName);
				if (!slotList) {
					slotList = [];
					slotMap.set(slotName, slotList);
				}
				slotList.push(child);
			}
		}
	}

	private addChildToSlots(styleRegistry: StyleRegistry, child: Element, slots: Element[]) {
		// Clone child for each slot, also for the first slot!
		// We afterwards remove the original child!
		for (let si = 0; si < slots.length; ++si) {
			const slot = slots[si];
			if (slot === child) {
				continue;
			}
			const clone = child.clone();
			this.addChildToSlot(styleRegistry, clone, slot);
		}
	}

	private addChildToSlot(styleRegistry: StyleRegistry, child: Element, slot: Element) {
		// If this is the first child that we add to the slot,
		// then remove the slot fallback content.
		if (!slot.didRemoveFallbackContent) {
			slot.didRemoveFallbackContent = true;
			for (let i = 0; i < slot.children.length; ++i) {
				slot.children[i].parent = undefined;
			}
			slot.children = [];
		}

		slot.children.push(child);
		child.parent = slot;

		child.removeAttribute("slot");

		// The child now lives in this component
		if (!this.isComponent) {
			// Sanity check that this also is the component
			throw new Error("!!! this IS NOT THE COMPONENT, MUST ASSIGN this.component !!!");
		}

		// Init the cloned child's component references
		child.initComponentReferences(child.isComponent ? child : this)

		// Slot filled
		const slotName = this.toSlotName(slot.name);
		// important(`adding filledSlotName '${slotName}' on element ${this.toDumpString()}`);
		if (!this.filledSlotNames) {
			this.filledSlotNames = new Set<string>();
		}
		this.filledSlotNames.add(slotName);

		// Slot style
		if (!child.isVoid && !child.isText && !child.isHead && !child.isHeadChild) {
			const slotStyle = this.getSlotStyle(slotName);
			if (slotStyle) {
				const childName = child.componentFunctionInfo ? `${child.componentFunctionInfo.name}()` : `<${child.tag}>`;
				const styleScopeId = registerSlotStyle(styleRegistry, this.getStyles(), child.getStyles(), slotStyle, childName);
				// Assign final style scope ID to the slotted child and all it's non-component children
				child.initStyleRegistryReferences(styleScopeId);
			}
		}

		child.setSlottedName(slotName);
	}

	private setSlottedName(slotName: string) {
		this.slottedName = slotName;
		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].setSlottedName(slotName);
		}
	}

	private toSlotName(slotName: string | null | undefined) {
		if (slotName === null || slotName === undefined || slotName === "") return "default";
		return slotName;
	}

	render() {
		if (!this.renderCondition()) {
			return undefined;
		}

		for (let i = 0; i < this.children.length; ++i) {
			const child = this.children[i];
			if (!child.render()) {
				child.parent = undefined;
				this.children.splice(i, 1);
				--i;
			}
		}

		return this;
	}

	private addRenderCondition(renderCondition: RenderCondition) {
		// For now we only implement one render condition
		this.renderCondition = renderCondition;
	}

	private ifSlotFilledContent(slotName: string, negate: boolean) {
		// important(`CHECKING ifSlotFilledContent '${slotName}' on element ${this.toDumpString()}`);

		// Use the filledSlotNames of the component this element lives in!
		const filledSlotNames = this.componentFragment.filledSlotNames;
		const result = filledSlotNames !== undefined && filledSlotNames.has(slotName);
		return negate ? !result : result;
	}

	/**
	 * Restructure elements to their final shape by
	 * - Replacing fragments with their children
	 * - Replacing slots with their children
	 *
	 * Note that the root fragment is not replaced.
	 * This is ok, since we ignore it when rendering the HTML.
	 * If we were to also replace the root fragment
	 * we would have to return an array here.
	 */
	flatify(replaceFragments = true, replaceSlots = true) {
		if (!replaceFragments && !replaceSlots) {
			return this;
		}

		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].flatify(replaceFragments, replaceSlots);
		}

		const newChildren: Element[] = [];
		for (let i = 0; i < this.children.length; ++i) {
			const child = this.children[i];
			if ((child.isFrag && replaceFragments) || (child.isSlot && replaceSlots)) {
				for (let j = 0; j < child.children.length; ++j) {
					newChildren.push(child.children[j]);
				}
			} else {
				newChildren.push(child);
			}
		}
		this.children = newChildren;
		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].parent = this;
		}

		return this;
	}

	setRouteCss(html: Element | undefined, head: Element | undefined, body: Element | undefined, css: string) {
		if (!css.length) return;

		const styleElement = new Element("style", {});
		const styleText = new Element("#text", {});
		styleText.setText(css);
		styleElement.children.push(styleText);
		styleText.parent = styleElement;

		if (head) {
			head.children.push(styleElement);
			styleElement.parent = head;
		} else
		if (body) {
			body.children.unshift(styleElement);
			styleElement.parent = body;
		} else
		if (html) {
			html.children.unshift(styleElement);
			styleElement.parent = html;
		} else {
			// Note that 'this' is the root fragment
			this.children.unshift(styleElement);
			styleElement.parent = this;
		}

		// Just to keep it nice and clean
		styleElement.componentFragment = styleElement.parent.componentFragment;
		styleText.componentFragment = styleElement.parent.componentFragment;
	}

	finalize(html: Element | undefined, head: Element | undefined, body: Element | undefined) {
		if (head) {
			// Move illegal <head> children to either
			// - Start of <body>
			// - Behind <head>
			if (body) {
				for (let i = head.children.length - 1; i >= 0; --i) {
					const headChild = head.children[i];
					if (!HeadChildTags.has(headChild.tag)) {
						head.children.splice(i, 1);
						body.children.unshift(headChild);
						headChild.parent = body;
					}
				}
			} else {
				const headParent = head.parent!;
				const headIndex = headParent.children.indexOf(head);
				for (let i = head.children.length - 1; i >= 0; --i) {
					const headChild = head.children[i];
					if (!HeadChildTags.has(headChild.tag)) {
						head.children.splice(i, 1);
						headParent.children.splice(headIndex + 1, 0, headChild);
						headChild.parent = headParent;
					}
				}
			}
		}

		return this;
	}

	resolveStyles(styleRegistry: StyleRegistry) {
		if (!this.isHead && !this.isHeadChild && this.styleUuid) {
			// Resolve styleUuid to actual style scope ID
			this.styleId = getStyleId(styleRegistry, this.styleUuid);
		}

		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].resolveStyles(styleRegistry);
		}
	}

	private attributeToHtml(attribute: Attribute): string {
		let key = attribute.key;
		let val = this.attributeValueToStringOrBoolean(attribute.val);
		if (typeof val === "boolean") {
			return val ? key : "";
		}
		return `${key}="${val}"`;
	}

	private attributeValueToStringOrBoolean(val: AttributeValue) {
		if (typeof val === "function") {
			val = val();
		} // no else here!
		if (val === undefined) {
			return "undefined";
		} else
		if (val === null) {
			return "null";
		} else
		if (typeof val === "boolean") {
			return val;
		} else
		if (typeof val === "number") {
			return val.toString();
		}
		return val;
	}

	private mergeAttributes(attributes: Attribute[]) {
		const out: Attribute[] = [];
		let classAttribute: Attribute | undefined = undefined;
		for (let i = 0; i < attributes.length; ++i) {
			let attribute = attributes[i];
			if (attribute.key === "class" || attribute.key === "className") {
				const val = this.attributeValueToStringOrBoolean(attribute.val);
				if (typeof val === "string") {
					attribute = createOrAppendClassName(val);
				} else {
					continue;
				}
			}
			out.push(attribute);
		}

		function createOrAppendClassName(className: string) {
			if (!classAttribute) {
				classAttribute = {
					key: "class",
					val: className,
				};
			} else {
				classAttribute.val += ` ${className}`;
			}
			return classAttribute;
		}

		return out;
	}

	private attributesToHtml(styleRegistry: StyleRegistry) {

		const attributes = this.mergeAttributes(this.attributes);

		// Add style scope
		if (this.styleId) {
			if (styleRegistry.scopedStyleStrategy === "attribute") {
				// Add style scope attribute
				const styleScopeAttribute = `${STYLE_SCOPE_ATTRIBUTE_PREFIX}${this.styleId}`;
				attributes.push({
					key: styleScopeAttribute,
					val: true,
				});
			} else {
				// Add style scope class attribute (scopedStyleStrategy "class" | "where")
				// Note that since we called mergeAttributes we know that...
				// - The "class" and "className" attributes are now merged to the "class" attribute
				// - The "class" attribute value is a string
				const styleScopeClass = `${STYLE_SCOPE_CLASS_PREFIX}${this.styleId}`;
				const classAttribute = attributes.find(attribute => attribute.key === "class"); // see note above
				if (!classAttribute) {
					attributes.push({
						key: "class",
						val: styleScopeClass,
					});
				} else {
					let val = classAttribute.val as string; // see note above
					if (val.length) val += " ";
					val += styleScopeClass;
					classAttribute.val = val;
				}
			}
		}

		const a = attributes.map(attribute => this.attributeToHtml(attribute));
		return a.length
			? ` ${a.join(" ")}`
			: "";
	}

	toHtml(styleRegistry: StyleRegistry, out: string = "", includeFragments = false): string {
		if (this.isText) {
			return out + this.text;
		}

		if (!this.isFrag || includeFragments) {
			out += `<${this.tag}${this.attributesToHtml(styleRegistry)}>`;
		}

		if (this.isVoid) return out;

		for (const child of this.children) {
			out = child.toHtml(styleRegistry, out, includeFragments);
		}

		if (!this.isFrag || includeFragments) {
			out += `</${this.tag}>`;
		}

		return out;
	}

	toLogString() {
		if (this.isComponent) {
			return `Component ${this.componentFunctionName}()`;
		}
		return `Element <${this.tag}>`
	}

	toDumpString() {
		const relation = this.isInternalChild ? "internal " : "injected ";
		if (this.isText) {
			return `${relation}#text '${this.text}'`;
		}
		// const attrStr = (this.attributes.length > 0 ? " " : "") + this.attributes.map(a => `${a.key}="${a.val}"`).join(" ");
		const attrStr = this.argumentsToDumpString();
		const funcStr = this.componentFunctionName ? ` ${this.componentFunctionName}()` : "";
		return `${relation}<${this.tag}${attrStr}>${funcStr}`;
	}

	private argumentsToDumpString() {
		const a = this.attributes.map(attribute => this.attributeToHtml(attribute));
		return a.length
			? ` ${a.join(" ")}`
			: "";
	}

	dump(indent = 0) {
		Log.writeln(chalk.blue(`${"    ".repeat(indent)}${this.toDumpString()}`));
		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].dump(indent + 1);
		}
	}

	private toDebugString() {
		let str;
		if (this.isComponent) {
			str = `Component <${this.tag}> ${this.componentFunctionName}()`;
		} else {
			str = `Element <${this.tag}>`
		}
		if (this.id) {
			str += ` [id="${this.id}"]`;
		}
		return str;
	}

	debug(indent = 0) {
		if (!this.componentFragment) {
			Log.writeln(chalk.red(`${"    ".repeat(indent)}${this.toDebugString()} - Component: !!! NONE !!!}`));
		} else {
			Log.writeln(chalk.blue(`${"    ".repeat(indent)}${this.toDebugString()} - Component: ${this.componentFragment === this ? "SELF" : this.componentFragment.toDebugString()}`));
		}
		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].debug(indent + 1);
		}
	}
}
