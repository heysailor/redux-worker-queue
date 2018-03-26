export const nextTick: any = new Promise(resolve =>
  setTimeout(() => resolve(), 0)
);
