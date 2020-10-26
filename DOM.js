const $ = (selector, node = document) => {

    switch(selector[0]) {
        case ".": return node.getElementsByClassName(selector.slice(1));
        case "#": return node.getElementById(selector.slice(1));
        default: return node.getElementsByTagName(selector);
    }
}; 
$.css_get = (val, node = document.body) => 
    getComputedStyle(node).getPropertyValue(val);