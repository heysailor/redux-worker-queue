"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const md5_1 = __importDefault(require("md5"));
const hash = (function hashConstructor() {
    const serialize = function hashObject(object) {
        // Private
        const type = typeof object;
        let serializedCode = '';
        if (type === 'object') {
            let element;
            // this grabs all protoptypes, which is what we want.
            // eslint-disable-next-line
            for (element in object) {
                serializedCode += `[${type}:${element}${serialize(object[element])}]`;
            }
        }
        else if (type === 'function') {
            serializedCode += `[${type}:${object.toString()}]`;
        }
        else {
            serializedCode += `[${type}:${object}]`;
        }
        return serializedCode.replace(/\s/g, '');
    };
    // Public, API
    return {
        value(object) {
            return md5_1.default(serialize(object));
        },
    };
})();
exports.hash = hash;
//# sourceMappingURL=hash.js.map