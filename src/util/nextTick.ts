export const nextTick: Function = () => {
  return new Promise(resolve => setTimeout(() => resolve(), 0));
};
