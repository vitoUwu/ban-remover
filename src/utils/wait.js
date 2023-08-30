/**
 *
 * @param {number} ms
 * @returns
 */
export function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
