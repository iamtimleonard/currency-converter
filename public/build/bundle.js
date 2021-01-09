
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Components/Header.svelte generated by Svelte v3.31.2 */

    const file = "src/Components/Header.svelte";

    function create_fragment(ctx) {
    	let header;
    	let h1;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Currency Converter";
    			add_location(h1, file, 15, 2, 171);
    			attr_dev(header, "class", "svelte-iwliv");
    			add_location(header, file, 14, 0, 160);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/Components/NumberInput.svelte generated by Svelte v3.31.2 */

    const file$1 = "src/Components/NumberInput.svelte";

    function create_fragment$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			input.readOnly = /*isReadOnly*/ ctx[1];
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-171tyqa");
    			add_location(input, file$1, 12, 0, 128);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_handler*/ ctx[2], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isReadOnly*/ 2) {
    				prop_dev(input, "readOnly", /*isReadOnly*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NumberInput", slots, []);
    	let { value } = $$props;
    	let { isReadOnly } = $$props;
    	const writable_props = ["value", "isReadOnly"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NumberInput> was created with unknown prop '${key}'`);
    	});

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("isReadOnly" in $$props) $$invalidate(1, isReadOnly = $$props.isReadOnly);
    	};

    	$$self.$capture_state = () => ({ value, isReadOnly });

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("isReadOnly" in $$props) $$invalidate(1, isReadOnly = $$props.isReadOnly);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, isReadOnly, input_handler, input_input_handler];
    }

    class NumberInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { value: 0, isReadOnly: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NumberInput",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<NumberInput> was created without expected prop 'value'");
    		}

    		if (/*isReadOnly*/ ctx[1] === undefined && !("isReadOnly" in props)) {
    			console.warn("<NumberInput> was created without expected prop 'isReadOnly'");
    		}
    	}

    	get value() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isReadOnly() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isReadOnly(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/CurrencySelector.svelte generated by Svelte v3.31.2 */

    const file$2 = "src/Components/CurrencySelector.svelte";

    function create_fragment$2(ctx) {
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "USD";
    			option1 = element("option");
    			option1.textContent = "EUR";
    			option2 = element("option");
    			option2.textContent = "GBP";
    			option3 = element("option");
    			option3.textContent = "CNY";
    			option0.__value = "USD";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 12, 2, 136);
    			option1.__value = "EUR";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 13, 2, 171);
    			option2.__value = "GBP";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 14, 2, 206);
    			option3.__value = "CNY";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 15, 2, 241);
    			attr_dev(select, "class", "svelte-o3gf9t");
    			if (/*value*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[2].call(select));
    			add_location(select, file$2, 11, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			select_option(select, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*change_handler*/ ctx[1], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[2])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) {
    				select_option(select, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CurrencySelector", slots, []);
    	let { value } = $$props;
    	const writable_props = ["value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CurrencySelector> was created with unknown prop '${key}'`);
    	});

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function select_change_handler() {
    		value = select_value(this);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ value });

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, change_handler, select_change_handler];
    }

    class CurrencySelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CurrencySelector",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<CurrencySelector> was created without expected prop 'value'");
    		}
    	}

    	get value() {
    		throw new Error("<CurrencySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<CurrencySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Error.svelte generated by Svelte v3.31.2 */

    const { Error: Error_1 } = globals;
    const file$3 = "src/Components/Error.svelte";

    function create_fragment$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Please enter a number.";
    			attr_dev(div, "class", "error-message svelte-1yqc1k6");
    			add_location(div, file$3, 14, 0, 199);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Error", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Error$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Components/Button.svelte generated by Svelte v3.31.2 */

    const file$4 = "src/Components/Button.svelte";

    function create_fragment$4(ctx) {
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			button.disabled = /*notNumber*/ ctx[0];
    			attr_dev(button, "class", "svelte-1mc3oz5");
    			add_location(button, file$4, 11, 0, 108);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", prevent_default(/*click_handler*/ ctx[3]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*notNumber*/ 1) {
    				prop_dev(button, "disabled", /*notNumber*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { notNumber } = $$props;
    	const writable_props = ["notNumber"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("notNumber" in $$props) $$invalidate(0, notNumber = $$props.notNumber);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ notNumber });

    	$$self.$inject_state = $$props => {
    		if ("notNumber" in $$props) $$invalidate(0, notNumber = $$props.notNumber);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [notNumber, $$scope, slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { notNumber: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*notNumber*/ ctx[0] === undefined && !("notNumber" in props)) {
    			console.warn("<Button> was created without expected prop 'notNumber'");
    		}
    	}

    	get notNumber() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set notNumber(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/InputArea.svelte generated by Svelte v3.31.2 */

    const { Error: Error_1$1 } = globals;
    const file$5 = "src/Components/InputArea.svelte";

    // (53:6) {#if notNumber}
    function create_if_block(ctx) {
    	let error;
    	let current;
    	error = new Error$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(error.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(error, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(error.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(error.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(error, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(53:6) {#if notNumber}",
    		ctx
    	});

    	return block;
    }

    // (61:8) <Button {notNumber} on:click={() => dispatch('convert')}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("CONVERT");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(61:8) <Button {notNumber} on:click={() => dispatch('convert')}>",
    		ctx
    	});

    	return block;
    }

    // (64:8) <Button {notNumber} on:click={() => dispatch('swap')}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SWAP");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(64:8) <Button {notNumber} on:click={() => dispatch('swap')}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let section;
    	let div3;
    	let form;
    	let div0;
    	let numberinput0;
    	let updating_value;
    	let t0;
    	let currencyselector0;
    	let updating_value_1;
    	let t1;
    	let t2;
    	let div1;
    	let numberinput1;
    	let updating_value_2;
    	let t3;
    	let currencyselector1;
    	let updating_value_3;
    	let t4;
    	let div2;
    	let button0;
    	let t5;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	function numberinput0_value_binding(value) {
    		/*numberinput0_value_binding*/ ctx[6].call(null, value);
    	}

    	let numberinput0_props = { isReadOnly: false };

    	if (/*fromValue*/ ctx[0] !== void 0) {
    		numberinput0_props.value = /*fromValue*/ ctx[0];
    	}

    	numberinput0 = new NumberInput({
    			props: numberinput0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(numberinput0, "value", numberinput0_value_binding));
    	numberinput0.$on("input", /*input_handler*/ ctx[7]);

    	function currencyselector0_value_binding(value) {
    		/*currencyselector0_value_binding*/ ctx[8].call(null, value);
    	}

    	let currencyselector0_props = {};

    	if (/*fromCurrency*/ ctx[2] !== void 0) {
    		currencyselector0_props.value = /*fromCurrency*/ ctx[2];
    	}

    	currencyselector0 = new CurrencySelector({
    			props: currencyselector0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(currencyselector0, "value", currencyselector0_value_binding));
    	currencyselector0.$on("change", /*change_handler*/ ctx[9]);
    	let if_block = /*notNumber*/ ctx[4] && create_if_block(ctx);

    	function numberinput1_value_binding(value) {
    		/*numberinput1_value_binding*/ ctx[10].call(null, value);
    	}

    	let numberinput1_props = { isReadOnly: true };

    	if (/*toValue*/ ctx[1] !== void 0) {
    		numberinput1_props.value = /*toValue*/ ctx[1];
    	}

    	numberinput1 = new NumberInput({
    			props: numberinput1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(numberinput1, "value", numberinput1_value_binding));

    	function currencyselector1_value_binding(value) {
    		/*currencyselector1_value_binding*/ ctx[11].call(null, value);
    	}

    	let currencyselector1_props = {};

    	if (/*toCurrency*/ ctx[3] !== void 0) {
    		currencyselector1_props.value = /*toCurrency*/ ctx[3];
    	}

    	currencyselector1 = new CurrencySelector({
    			props: currencyselector1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(currencyselector1, "value", currencyselector1_value_binding));

    	button0 = new Button({
    			props: {
    				notNumber: /*notNumber*/ ctx[4],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[12]);

    	button1 = new Button({
    			props: {
    				notNumber: /*notNumber*/ ctx[4],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[13]);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			form = element("form");
    			div0 = element("div");
    			create_component(numberinput0.$$.fragment);
    			t0 = space();
    			create_component(currencyselector0.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");
    			create_component(numberinput1.$$.fragment);
    			t3 = space();
    			create_component(currencyselector1.$$.fragment);
    			t4 = space();
    			div2 = element("div");
    			create_component(button0.$$.fragment);
    			t5 = space();
    			create_component(button1.$$.fragment);
    			attr_dev(div0, "class", "pair svelte-qnkc34");
    			add_location(div0, file$5, 43, 6, 822);
    			attr_dev(div1, "class", "pair svelte-qnkc34");
    			add_location(div1, file$5, 55, 6, 1161);
    			attr_dev(div2, "class", "pair svelte-qnkc34");
    			add_location(div2, file$5, 59, 6, 1315);
    			attr_dev(form, "class", "svelte-qnkc34");
    			add_location(form, file$5, 42, 4, 771);
    			attr_dev(div3, "class", "form-control svelte-qnkc34");
    			add_location(div3, file$5, 41, 2, 740);
    			attr_dev(section, "class", "svelte-qnkc34");
    			add_location(section, file$5, 40, 0, 728);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, form);
    			append_dev(form, div0);
    			mount_component(numberinput0, div0, null);
    			append_dev(div0, t0);
    			mount_component(currencyselector0, div0, null);
    			append_dev(form, t1);
    			if (if_block) if_block.m(form, null);
    			append_dev(form, t2);
    			append_dev(form, div1);
    			mount_component(numberinput1, div1, null);
    			append_dev(div1, t3);
    			mount_component(currencyselector1, div1, null);
    			append_dev(form, t4);
    			append_dev(form, div2);
    			mount_component(button0, div2, null);
    			append_dev(div2, t5);
    			mount_component(button1, div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", /*submit_handler*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const numberinput0_changes = {};

    			if (!updating_value && dirty & /*fromValue*/ 1) {
    				updating_value = true;
    				numberinput0_changes.value = /*fromValue*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			numberinput0.$set(numberinput0_changes);
    			const currencyselector0_changes = {};

    			if (!updating_value_1 && dirty & /*fromCurrency*/ 4) {
    				updating_value_1 = true;
    				currencyselector0_changes.value = /*fromCurrency*/ ctx[2];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			currencyselector0.$set(currencyselector0_changes);

    			if (/*notNumber*/ ctx[4]) {
    				if (if_block) {
    					if (dirty & /*notNumber*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(form, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const numberinput1_changes = {};

    			if (!updating_value_2 && dirty & /*toValue*/ 2) {
    				updating_value_2 = true;
    				numberinput1_changes.value = /*toValue*/ ctx[1];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			numberinput1.$set(numberinput1_changes);
    			const currencyselector1_changes = {};

    			if (!updating_value_3 && dirty & /*toCurrency*/ 8) {
    				updating_value_3 = true;
    				currencyselector1_changes.value = /*toCurrency*/ ctx[3];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			currencyselector1.$set(currencyselector1_changes);
    			const button0_changes = {};
    			if (dirty & /*notNumber*/ 16) button0_changes.notNumber = /*notNumber*/ ctx[4];

    			if (dirty & /*$$scope*/ 32768) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};
    			if (dirty & /*notNumber*/ 16) button1_changes.notNumber = /*notNumber*/ ctx[4];

    			if (dirty & /*$$scope*/ 32768) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(numberinput0.$$.fragment, local);
    			transition_in(currencyselector0.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(numberinput1.$$.fragment, local);
    			transition_in(currencyselector1.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(numberinput0.$$.fragment, local);
    			transition_out(currencyselector0.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(numberinput1.$$.fragment, local);
    			transition_out(currencyselector1.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(numberinput0);
    			destroy_component(currencyselector0);
    			if (if_block) if_block.d();
    			destroy_component(numberinput1);
    			destroy_component(currencyselector1);
    			destroy_component(button0);
    			destroy_component(button1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("InputArea", slots, []);
    	let { fromValue } = $$props;
    	let { toValue } = $$props;
    	let { fromCurrency } = $$props;
    	let { toCurrency } = $$props;
    	let { notNumber } = $$props;
    	let dispatch = createEventDispatcher();
    	const writable_props = ["fromValue", "toValue", "fromCurrency", "toCurrency", "notNumber"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<InputArea> was created with unknown prop '${key}'`);
    	});

    	function numberinput0_value_binding(value) {
    		fromValue = value;
    		$$invalidate(0, fromValue);
    	}

    	const input_handler = () => dispatch("reset-value");

    	function currencyselector0_value_binding(value) {
    		fromCurrency = value;
    		$$invalidate(2, fromCurrency);
    	}

    	const change_handler = () => dispatch("change");

    	function numberinput1_value_binding(value) {
    		toValue = value;
    		$$invalidate(1, toValue);
    	}

    	function currencyselector1_value_binding(value) {
    		toCurrency = value;
    		$$invalidate(3, toCurrency);
    	}

    	const click_handler = () => dispatch("convert");
    	const click_handler_1 = () => dispatch("swap");
    	const submit_handler = () => dispatch("convert");

    	$$self.$$set = $$props => {
    		if ("fromValue" in $$props) $$invalidate(0, fromValue = $$props.fromValue);
    		if ("toValue" in $$props) $$invalidate(1, toValue = $$props.toValue);
    		if ("fromCurrency" in $$props) $$invalidate(2, fromCurrency = $$props.fromCurrency);
    		if ("toCurrency" in $$props) $$invalidate(3, toCurrency = $$props.toCurrency);
    		if ("notNumber" in $$props) $$invalidate(4, notNumber = $$props.notNumber);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		NumberInput,
    		CurrencySelector,
    		Error: Error$1,
    		Button,
    		fromValue,
    		toValue,
    		fromCurrency,
    		toCurrency,
    		notNumber,
    		dispatch
    	});

    	$$self.$inject_state = $$props => {
    		if ("fromValue" in $$props) $$invalidate(0, fromValue = $$props.fromValue);
    		if ("toValue" in $$props) $$invalidate(1, toValue = $$props.toValue);
    		if ("fromCurrency" in $$props) $$invalidate(2, fromCurrency = $$props.fromCurrency);
    		if ("toCurrency" in $$props) $$invalidate(3, toCurrency = $$props.toCurrency);
    		if ("notNumber" in $$props) $$invalidate(4, notNumber = $$props.notNumber);
    		if ("dispatch" in $$props) $$invalidate(5, dispatch = $$props.dispatch);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		fromValue,
    		toValue,
    		fromCurrency,
    		toCurrency,
    		notNumber,
    		dispatch,
    		numberinput0_value_binding,
    		input_handler,
    		currencyselector0_value_binding,
    		change_handler,
    		numberinput1_value_binding,
    		currencyselector1_value_binding,
    		click_handler,
    		click_handler_1,
    		submit_handler
    	];
    }

    class InputArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			fromValue: 0,
    			toValue: 1,
    			fromCurrency: 2,
    			toCurrency: 3,
    			notNumber: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputArea",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*fromValue*/ ctx[0] === undefined && !("fromValue" in props)) {
    			console.warn("<InputArea> was created without expected prop 'fromValue'");
    		}

    		if (/*toValue*/ ctx[1] === undefined && !("toValue" in props)) {
    			console.warn("<InputArea> was created without expected prop 'toValue'");
    		}

    		if (/*fromCurrency*/ ctx[2] === undefined && !("fromCurrency" in props)) {
    			console.warn("<InputArea> was created without expected prop 'fromCurrency'");
    		}

    		if (/*toCurrency*/ ctx[3] === undefined && !("toCurrency" in props)) {
    			console.warn("<InputArea> was created without expected prop 'toCurrency'");
    		}

    		if (/*notNumber*/ ctx[4] === undefined && !("notNumber" in props)) {
    			console.warn("<InputArea> was created without expected prop 'notNumber'");
    		}
    	}

    	get fromValue() {
    		throw new Error_1$1("<InputArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fromValue(value) {
    		throw new Error_1$1("<InputArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toValue() {
    		throw new Error_1$1("<InputArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toValue(value) {
    		throw new Error_1$1("<InputArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fromCurrency() {
    		throw new Error_1$1("<InputArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fromCurrency(value) {
    		throw new Error_1$1("<InputArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toCurrency() {
    		throw new Error_1$1("<InputArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toCurrency(value) {
    		throw new Error_1$1("<InputArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get notNumber() {
    		throw new Error_1$1("<InputArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set notNumber(value) {
    		throw new Error_1$1("<InputArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */

    function create_fragment$6(ctx) {
    	let t0;
    	let header;
    	let t1;
    	let inputarea;
    	let updating_fromValue;
    	let updating_toValue;
    	let updating_fromCurrency;
    	let updating_toCurrency;
    	let current;
    	header = new Header({ $$inline: true });

    	function inputarea_fromValue_binding(value) {
    		/*inputarea_fromValue_binding*/ ctx[9].call(null, value);
    	}

    	function inputarea_toValue_binding(value) {
    		/*inputarea_toValue_binding*/ ctx[10].call(null, value);
    	}

    	function inputarea_fromCurrency_binding(value) {
    		/*inputarea_fromCurrency_binding*/ ctx[11].call(null, value);
    	}

    	function inputarea_toCurrency_binding(value) {
    		/*inputarea_toCurrency_binding*/ ctx[12].call(null, value);
    	}

    	let inputarea_props = { notNumber: /*notNumber*/ ctx[4] };

    	if (/*fromValue*/ ctx[0] !== void 0) {
    		inputarea_props.fromValue = /*fromValue*/ ctx[0];
    	}

    	if (/*toValue*/ ctx[1] !== void 0) {
    		inputarea_props.toValue = /*toValue*/ ctx[1];
    	}

    	if (/*fromCurrency*/ ctx[2] !== void 0) {
    		inputarea_props.fromCurrency = /*fromCurrency*/ ctx[2];
    	}

    	if (/*toCurrency*/ ctx[3] !== void 0) {
    		inputarea_props.toCurrency = /*toCurrency*/ ctx[3];
    	}

    	inputarea = new InputArea({ props: inputarea_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputarea, "fromValue", inputarea_fromValue_binding));
    	binding_callbacks.push(() => bind(inputarea, "toValue", inputarea_toValue_binding));
    	binding_callbacks.push(() => bind(inputarea, "fromCurrency", inputarea_fromCurrency_binding));
    	binding_callbacks.push(() => bind(inputarea, "toCurrency", inputarea_toCurrency_binding));
    	inputarea.$on("swap", /*swapCurrencies*/ ctx[6]);
    	inputarea.$on("convert", /*convert*/ ctx[5]);
    	inputarea.$on("change", /*change*/ ctx[7]);
    	inputarea.$on("reset-value", /*resetValue*/ ctx[8]);

    	const block = {
    		c: function create() {
    			t0 = text("//key: edc1cfcda9d4ac03f79e\n");
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(inputarea.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(inputarea, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const inputarea_changes = {};
    			if (dirty & /*notNumber*/ 16) inputarea_changes.notNumber = /*notNumber*/ ctx[4];

    			if (!updating_fromValue && dirty & /*fromValue*/ 1) {
    				updating_fromValue = true;
    				inputarea_changes.fromValue = /*fromValue*/ ctx[0];
    				add_flush_callback(() => updating_fromValue = false);
    			}

    			if (!updating_toValue && dirty & /*toValue*/ 2) {
    				updating_toValue = true;
    				inputarea_changes.toValue = /*toValue*/ ctx[1];
    				add_flush_callback(() => updating_toValue = false);
    			}

    			if (!updating_fromCurrency && dirty & /*fromCurrency*/ 4) {
    				updating_fromCurrency = true;
    				inputarea_changes.fromCurrency = /*fromCurrency*/ ctx[2];
    				add_flush_callback(() => updating_fromCurrency = false);
    			}

    			if (!updating_toCurrency && dirty & /*toCurrency*/ 8) {
    				updating_toCurrency = true;
    				inputarea_changes.toCurrency = /*toCurrency*/ ctx[3];
    				add_flush_callback(() => updating_toCurrency = false);
    			}

    			inputarea.$set(inputarea_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(inputarea.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(inputarea.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(inputarea, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let notNumber;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const apiKey = {"env":{"isProd":false,"API_CLIENT_KEY":"edc1cfcda9d4ac03f79e"}}.env.API_CLIENT_KEY;
    	let fromValue = "";
    	let toValue = "";
    	let fromCurrency = "USD";
    	let toCurrency = "EUR";

    	const showError = () => {
    		return isNaN(fromValue);
    	};

    	const convert = () => {
    		const key = `${fromCurrency}_${toCurrency}`;
    		const url = `https://free.currconv.com/api/v7/convert?q=${fromCurrency}_${toCurrency}&compact=ultra&apiKey=${apiKey}`;
    		fetch(url).then(res => res.json()).then(data => $$invalidate(1, toValue = (fromValue * data[key]).toFixed(2)));
    	};

    	const swapCurrencies = () => {
    		let placeholder = toCurrency;
    		$$invalidate(3, toCurrency = fromCurrency);
    		$$invalidate(2, fromCurrency = placeholder);
    		convert();
    	};

    	const change = () => {
    		$$invalidate(0, fromValue = "");
    		$$invalidate(1, toValue = "");
    	};

    	const resetValue = () => {
    		$$invalidate(1, toValue = "");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function inputarea_fromValue_binding(value) {
    		fromValue = value;
    		$$invalidate(0, fromValue);
    	}

    	function inputarea_toValue_binding(value) {
    		toValue = value;
    		$$invalidate(1, toValue);
    	}

    	function inputarea_fromCurrency_binding(value) {
    		fromCurrency = value;
    		$$invalidate(2, fromCurrency);
    	}

    	function inputarea_toCurrency_binding(value) {
    		toCurrency = value;
    		$$invalidate(3, toCurrency);
    	}

    	$$self.$capture_state = () => ({
    		Header,
    		InputArea,
    		apiKey,
    		fromValue,
    		toValue,
    		fromCurrency,
    		toCurrency,
    		showError,
    		convert,
    		swapCurrencies,
    		change,
    		resetValue,
    		notNumber
    	});

    	$$self.$inject_state = $$props => {
    		if ("fromValue" in $$props) $$invalidate(0, fromValue = $$props.fromValue);
    		if ("toValue" in $$props) $$invalidate(1, toValue = $$props.toValue);
    		if ("fromCurrency" in $$props) $$invalidate(2, fromCurrency = $$props.fromCurrency);
    		if ("toCurrency" in $$props) $$invalidate(3, toCurrency = $$props.toCurrency);
    		if ("notNumber" in $$props) $$invalidate(4, notNumber = $$props.notNumber);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*fromValue*/ 1) {
    			 $$invalidate(4, notNumber = showError());
    		}
    	};

    	return [
    		fromValue,
    		toValue,
    		fromCurrency,
    		toCurrency,
    		notNumber,
    		convert,
    		swapCurrencies,
    		change,
    		resetValue,
    		inputarea_fromValue_binding,
    		inputarea_toValue_binding,
    		inputarea_fromCurrency_binding,
    		inputarea_toCurrency_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
