export const nextTick: Function = () => {
  return new Promise(resolve => resolve()).then();
};
