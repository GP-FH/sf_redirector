const bcrypt = require("bcrypt");
const command_line_args = require("command-line-args");

const option_definitions = [ {
    name: 'password',
    alias: 'p',
    type: String,
    defaultValue:null
  }
];
const options = command_line_args(option_definitions);
const password_to_hash = options.password;

main();

async function main (){
  const hash = await bcrypt.hash(password_to_hash, 10);
  console.log(hash);
}
