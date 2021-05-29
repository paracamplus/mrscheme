// light JQUERY

//import { jQuery as _jQuery } from 'jquery';
//export const jQuery = _jQuery;

import { installJCanvas } from './jcanvas.mjs';

export function jQuery (s) {
    if ( typeof s === 'string') {
        if ( s.match(/^#/) ) {
            const elem = window.document.getElementById(s.substring(1));
            if ( elem ) {
                return new JQueryObject(elem);
            } else {
                return elem;
            }
        } else {
            const elements = window.document.getElementsByTagName(s);
            if ( elements.length === 1 ) {
                return new JQueryObject(elements.item(0));
            } else {
                throw new Error("Ambiguous", s);
            }
        }
    } else if ( s instanceof HTMLElement ) {
        const jq = new JQueryObject(s);
        return jq;
    } else {
        throw new Error('tobedone', s);
    }
}
jQuery.browser = { msie: false };

class JQueryObject {
    constructor (elem) {
        this.elem = elem;
        this[0] = elem;
        this.length = 1;
    }
    getElement () {
        return this.elem;
    }
    getCanvas () {
        // should check canvas!
        const canvas = this.elem;
        if ( ! jQuery.jCanvas ) {
            installJCanvas(jQuery);
        }
        for ( const key of Object.keys(jQuery.fn) ) {
            this[key] = jQuery.fn[key].bind(this);
        }
        return this;
    }
    attr (key, value) {
        this.elem.setAttribute(key, value);
        return this;
    }
    html (s) {
        this.elem.innerHTML = s;
    }
    appendTo (container) {
        if ( container instanceof HTMLElement ) {
            container.appendChild(this.elem);
        } else if ( container instanceof JQueryObject ) {
            container.elem.appendChild(this.elem);
        } else {
            throw new Error('appendTo', container);
        }
        return this;
    }
    append (child) {
        if ( child instanceof HTMLElement ) {
            this.elem.appendChild(child);
        } else if ( child instanceof JQueryObject ) {
            this.elem.appendChild(child.elem);
        } else if ( typeof child === 'string' ) {
            const elts = jQuery.string2elements(child);
            while ( elts.length > 0 ) {
                const elt = elts.item(0);
                this.elem.appendChild(elt);
            }
        } else {
            throw new Error('append', child);
        }
        return this;
    }
    empty () {
        const children = this.elem.childNodes;
        for ( const child of children ) {
            this.elem.removeChild(child);
        }
        return this;
    }
    css (s) {
        let style = '';
        for ( const key of Object.keys(s) ) {
            const value = s[key];
            style += `${key}: ${value};`;
        }
        this.elem.setAttribute('style', style);
        return this;
    }
}
jQuery.createElement = function (tagname, attrs) {
    const elem = window.document.createElement(tagname);
    for ( const key of Object.keys(attrs) ) {
        const value = attrs[key];
        elem.setAttribute(key, value);
    }
    return elem;
};
jQuery.string2elements = function (s) {
    const div = jQuery.createElement('div', {});
    div.innerHTML = s;
    return div.children;
};

// end of jquerylight.mjs
