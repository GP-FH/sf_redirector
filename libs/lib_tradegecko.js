import * as got from "got";
import * as VError from "verror";

export async function tradegecko_create_sales_order () {
  try {
    const res = await got.post('https://api.tradegecko.com/orders/', {
      headers:{
        Authorization: `Bearer ${process.env.TRADEGECKO_TOKEN}`
      },
      body: {
        company_id:"",
        issues_at:"",
        billing_address_id:"",
        shipping_address_id:"",
        tags:[],
        status:"",
        notes:""
      },
      json: true
    });
  }
  catch (err) {

  }
}

export async function tradegecko_add_address_to_stylist () {

}
