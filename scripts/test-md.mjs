import { default as MarkdownIt } from 'markdown-it';
import fs from 'fs';

class NuxtMarkdown {
  static #allowConstructor = false;

  constructor() {
    if (!NuxtMarkdown.#allowConstructor) {
      throw new Error("Constructor is private. Use NustMarkdown.fromFile() instead");
    }
  }

  static fromFile(fname) {
    const msg = `loadFile(${fname}) `;
    let data = fs.readFileSync(fname).toString();
    let lines = data.split('\n');

    NuxtMarkdown.#allowConstructor = true;
    let nmd = new NuxtMarkdown();
    NuxtMarkdown.#allowConstructor = false;

    if (lines[0] === '---') {
      let iLine;
      for (iLine = 1; iLine < lines.length; iLine++) {
        let line = lines[iLine];
        if (line === '---') {
          lines = lines.splice(iLine+1);
          break;
        }
        let [key, ...value] = line.split(/:[ \t]*/);
        nmd[key] = value.join(': ');
      }
    }

    var md = new MarkdownIt();
    nmd.html = md.render(lines.join('\n'));
    return nmd;
  }

}

let nmd = NuxtMarkdown.fromFile('./content/wiki/welcome.md');

console.log(nmd.html);


