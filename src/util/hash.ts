import md5 from 'md5';

const hash = (function hashConstructor() {
  const serialize = function hashObject(object: any) {
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
    } else if (type === 'function') {
      serializedCode += `[${type}:${object.toString()}]`;
    } else {
      serializedCode += `[${type}:${object}]`;
    }

    return serializedCode.replace(/\s/g, '');
  };

  // Public, API
  return {
    value(object: any): string {
      return md5(serialize(object));
    },
  };
})();

export { hash };
