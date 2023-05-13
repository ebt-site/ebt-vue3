import { default as cmark } from 'cmark-gfm';

export default class CmarkGfmRenderer {
  async render(markdown) {
    let options = {
      unsafe: true,
      extensions: {
        table: true,
      },
    }
    return new Promise((resolve,reject) => {
      cmark.renderHtml(markdown, options)
      .then(html => resolve(html))
      .catch(error => console.error(error));
    });
  }
}
