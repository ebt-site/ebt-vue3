
export default class Utils {
  static assignTyped(dst, src, initial=src) {
    let keys = Object.keys(initial);
    keys.forEach(k=>{
      let value = src[k];
      if (value !== undefined) {
        let type = typeof initial[k];
        if (type === 'number') {
          dst[k] = Number(value);
        } else if (initial[k] instanceof Date) {
          dst[k] = new Date(value);
        } else if (type === 'boolean') {
          dst[k] = `${value}` !== 'false' && value != null;
        } else {
          dst[k] = `${value}`;
        }
      }
    });
    return dst;
  }
}
