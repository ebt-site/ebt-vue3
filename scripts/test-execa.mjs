import path from 'path';
import { execa } from 'execa';

let output = await execa('ls');
console.log(output);
