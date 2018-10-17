/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * bulk_upload_product_images.js: This script allows you to bulk upload product images to Trade
 * Gecko.
 *
 * Arguments:
 * -l | --list: path to csv file with list of products and accompanying bulk_upload_product_images
 *   FORMAT: 2 columns - Variant + Image
 *
 * -b | --bucket: digitalocean space with the images to upload (named the same as the spreadsheet)
 * 
 * Limitations:
 * - image file names must not have spaces in them
 * - path to csv must be absolute
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


const dotenv = require("dotenv");
dotenv.config( {
  path: '/home/dev/redirect_node/current/config/config.env'
} );
const csv = require("csvtojson");
const command_line_args = require("command-line-args");

const trade_gecko = require("../libs/lib_tradegecko");

const option_definitions = [ {
    name: 'list',
    alias: 'l',
    type: String,
    defaultValue:null
  },
  {
    name: 'bucket',
    alias: 'b',
    type: String,
    defaultValue: null,
  },
  {
    name: 'verbose',
    alias: 'v',
    type: Boolean,
    defaultOption: false
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    defaultValue: false
  }
];
const options = command_line_args(option_definitions);
const verbose = options.verbose;
const bucket_base_url = options.bucket;
const list_file = options.list;
const help = options.help;
let parsed_list = [];

if (help){
  console.log(`


    ################## TradeGecko Image Bulk Uploader ##################

    This script uploads a bunch of product images to Trade TradeGecko

    **Pre-requisites**
    - An online accessible place that the images are stored. An s3 bucket or DO space is ideal.
    - A spreadsheet with the product variant names (as they are in TG) and the image file names (as they are in your online storage)
      FORMAT: 2 columns - Variant + Image

    **Arguments**
    -l | --list: path to csv file with list of products and accompanying bulk_upload_product_images.
    -b | --bucket: bucket/folder url where the images are stored e.g https://tg-product-images.sgp1.digitaloceanspaces.com/
    -v | --verbose: gets you some extra logging along the way
    -h | --help: gets you this message


    `);


    process.exit(0);
}

if (!bucket_base_url || !list_file){
  console.log("Missing list or bucket parameters. These are very much needed for this whole thing to work.");
  process.exit(1);
}

main();


async function main(){

  try{
    parsed_list = await parse_list(list_file);
    const variations = await trade_gecko.tradegecko_get_product_variants();
    await match_ids_to_products(variations, parsed_list);
    const results = await upload_images(parsed_list, bucket_base_url);

    console.log("################# Script Complete #################");
    console.log(`

      Total requests attempted: ${results.total}
      Request failures: ${results.failures.length}
      Failed Requests:

      `);

    for(let i = 0; i < results.failures.length; i++){
      console.log(`
        ${i} -  Variant: ${results.failures[i].variant}
            Image_URL: ${results.failures[i].image}
            Error: ${results.failures[i].error.statusCode} ${results.failures[i].error.statusMessage}
        `);
    }

    process.exit(0);
  }catch(err){
    console.log(`Error running script: ${err}`);
    process.exit(1);
  }
}

function parse_list(list_file_path){
  return new Promise((resolve, reject) => {
    csv()
      .fromFile(list_file_path)
      .on('error',(err)=>{
        console.log(err);
        process.exit(1);
      })
      .on('end_parsed',(jsonArrObj)=>{
        resolve(jsonArrObj);
      });
  });
}

function match_ids_to_products(ids, products){
  for(let i = 0; i < ids.length; i++){
    for(let j = 0; j < products.length; j++){
      if(ids[i].name == products[j].Variant){
        parsed_list[j]["variant_id"] = [ids[i].id];
        parsed_list[j]["product_id"] = ids[i].product_id;
      }
    }
  }
}

async function upload_images(list, base_url){
  let failures = [];
  for(let i = 0; i < list.length; i++){
    if (verbose){console.log(`${list[i].product_id}, ${list[i].variant_id[0]}, ${base_url}${list[i].Image}`)};

    let ret = await trade_gecko.tradegecko_upload_product_images(list[i].product_id, list[i].variant_id, `${base_url}${list[i].Image}`);

    if (!ret.ok){
      if(verbose){
        console.log(`Error on upload: ${ret.err}`);
      }
      failures.push({variant:list[i].Variant, image:list[i].Image, error:ret.err});
    }else if (verbose){
      console.log(`Uploaded ${base_url}${list[i].Image} to TG`);
    }

    await sleep(1000);
  }

  return {total: list.length, failures: failures};
}

// helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
