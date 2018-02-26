const got = require("got");
const VError = require("verror");

// gonna have to do something with addresses. Either dedupe via daily cron or check for existance on the fly

const tradegecko_create_sales_order = async () => {
  let res;
  try {
    res = await got.post('https://api.tradegecko.com/orders/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      body: {
        "order":{
          "company_id": "20733937", // this should be the Stylists relationship ID
          "shipping_address": { // the customers address -> this will be automagically added to the Stylists relationship
            "address1": "1 Test St",
            "suburb": "Teston",
            "city": "Testville",
            "country": "New Zealand",
            "label":"test@test.com", // should be the customewrs email (for identification)
            "email":"test@test.com"
          },
          "issued_at": "26-02-2018", // dd-mm-yyyy
          "tags": ["deluxe-box"],
          "status": "draft",
          "notes": "Here are some notes"
        }
      },
      json: true
    });

  }
  catch (err) {
    throw new VError (err, "Error creating sales order via TradeGecko API" );
  }

  if (res.statusCode !== 200) {
    throw new VError ( `Error creating sales order via TradeGecko API - non 200 status code: ${res.statusCode}`);
  }

  return { ok:true };
}

function _prep_style_profile_args_for_sending () {

}

exports.tradegecko_create_sales_order = tradegecko_create_sales_order;
