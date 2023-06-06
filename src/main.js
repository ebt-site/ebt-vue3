import { default as EbtMain } from './ebt-main.mjs';
import { default as EbtConfig } from "../ebt-config.mjs";

EbtMain.main({
  config: EbtConfig,
});
