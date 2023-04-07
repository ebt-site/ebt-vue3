import { default as Messages } from "../src/messages.mjs"

(async () => {
  const messages = await Messages.MESSAGES;
  const json = JSON.stringify(messages, null, 2);
  console.log('const messages = ', json);
  console.log('export default messages');
})()
