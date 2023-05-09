import { default as CmarkGfm } from 'cmark-gfm';

export default class CmarkGfmRenderer {
  async render(markdown) {
    let options = {
      unsafe: true,
      extensions: {
        table: true,
      },
    }
    return new Promise((resolve,reject) => {
      CmarkGfm.renderHtml(markdown, options)
      .then(html => resolve(html))
      .catch(error => console.error(error));
    });
  }
}
