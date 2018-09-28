
describe ('Create sales order', async () => {
  /*
   * Have to require these modules in the scope of the tests otherwise jest can't 
   * mock them
   */
   
  const tradegecko = require('../libs/lib_tradegecko');
  const got = require('got');
  
  /*
   * Set up mock return/function parameter values
   */
   
  const mock_create_order_resp =  {
    "variants": [
      {
        "id": 3,
        "created_at": "2015-11-02T01:22:24.772Z",
        "updated_at": "2015-11-02T01:34:04.502Z",
        "product_id": 1,
        "default_ledger_account_id": null,
        "buy_price": "4.5",
        "committed_stock": "3",
        "incoming_stock": "0",
        "composite": null,
        "description": null,
        "keep_selling": false,
        "last_cost_price": "5.0",
        "manage_stock": true,
        "max_online": null,
        "moving_average_cost": "5",
        "name": "Peach",
        "online_ordering": true,
        "opt1": "Peach",
        "opt2": null,
        "opt3": null,
        "position": 2,
        "product_name": "Everlasting Gobstopper",
        "product_status": "active",
        "product_type": "Candy",
        "retail_price": "22.0",
        "sellable": true,
        "sku": "DEMO-GOBS-PEA",
        "status": "active",
        "stock_on_hand": "10",
        "supplier_code": null,
        "taxable": true,
        "upc": null,
        "weight": null,
        "weight_unit": null,
        "weight_value": null,
        "wholesale_price": "12.0",
        "image_ids": [],
        "variant_prices": [
          {
            "price_list_id": "retail",
            "value": "22.0"
          },
          {
            "price_list_id": "wholesale",
            "value": "12.0"
          },
          {
            "price_list_id": "buy",
            "value": "4.5"
          }
        ],
        "locations": [
          {
            "location_id": 1,
            "stock_on_hand": "10",
            "committed": "3",
            "incoming": null,
            "bin_location": null,
            "reorder_point": null
          }
        ],
        "prices": {
          "retail": "22.0",
          "wholesale": "12.0",
          "buy": "4.5"
        },
        "stock_levels": {
          "1": "10.0"
        },
        "committed_stock_levels": {
          "1": "3.0"
        }
      }
    ]
  };
  
  const mock_check_address_resp = {
    "body":{
      "addresses": [
        {
          "id": 6,
          "created_at": "2015-11-04T06:59:35.285Z",
          "updated_at": "2015-11-04T06:59:35.285Z",
          "company_id": 4,
          "address1": "Test address",
          "address2": "",
          "city": "Singapore",
          "company_name": "",
          "country": "Singapore",
          "email": "",
          "first_name": null,
          "last_name": null,
          "label": "Shipping",
          "phone_number": "",
          "state": "",
          "status": "active",
          "suburb": "",
          "zip_code": ""
        }
      ]
    }
  };
  
  const mock_subscription = {
    "id": "8avVGOkx8U1MX",
    "customer_id": "8avVGOkx8U1MX",
    "plan_id": "basic",
    "plan_quantity": 1,
    "plan_unit_price": 900,
    "billing_period": 1,
    "billing_period_unit": "month",
    "plan_free_quantity": 0,
    "status": "non_renewing",
    "trial_start": 1412101842,
    "trial_end": 1414780242,
    "current_term_start": 1527791442,
    "current_term_end": 1530383442,
    "remaining_billing_cycles": 0,
    "created_at": 1412101842,
    "started_at": 1412101842,
    "activated_at": 1414780242,
    "cancelled_at": 1530383442,
    "updated_at": 1528093635,
    "has_scheduled_changes": false,
    "resource_version": 1528093635000,
    "deleted": false,
    "object": "subscription",
    "currency_code": "USD",
    "due_invoices_count": 2,
    "due_since": 1438367442,
    "total_dues": 1800,
    "mrr": 900,
    "exchange_rate": 1.0,
    "base_currency_code": "USD",
    "shipping_address": {
        "first_name": "Benjamin",
        "last_name": "Ross",
        "company": "Acme Inc",
        "phone": "+1 (614) 226-4809",
        "line1": "345, Redington Av",
        "line2": "Suite 1200",
        "city": "Los Angeles",
        "state_code": "CA",
        "state": "California",
        "country": "US",
        "validation_status": "not_validated",
        "object": "shipping_address"
    }
  };
  
  const mock_customer = {
    "id": "4gkYnd21ouvW",
    "email": "jane@test.com",
    "auto_collection": "on",
    "net_term_days": 0,
    "allow_direct_debit": false,
    "created_at": 1412101842,
    "taxability": "taxable",
    "updated_at": 1412101842,
    "resource_version": 1412101842000,
    "deleted": false,
    "object": "customer",
    "card_status": "no_card",
    "contacts": [
        {
            "id": "ty68op521m",
            "first_name": "Michel",
            "last_name": "Ross",
            "email": "Mike@test.com",
            "label": "Mike",
            "enabled": true,
            "send_account_email": true,
            "send_billing_email": false,
            "object": "contact"
        }
    ],
    "promotional_credits": 0,
    "refundable_credits": 0,
    "excess_payments": 0,
    "unbilled_charges": 0,
    "preferred_currency_code": "USD"
  };
  
  /*
   * Set jest to mock the 'got' module + give it return values for specific 
   * module functions
   */
   
  jest.mock('got');
  got.get.mockResolvedValue(mock_check_address_resp);
  got.post.mockResolvedValue(mock_create_order_resp);
  
  /*
   * LET THE TESTS BEGIN!
   */
   
  test ('null subscription parameter should throw error', async () => {
    try{
      await tradegecko.tradegecko_create_sales_order(null, {id:'some_id'});
      expect(false).toBe(true);
    }
    catch (error){
      expect(error.message).toBe(
        'subscription parameter invalid'
      );
    }
  });
  
  test ('non-object subscription parameter should throw error', async () => {
    try{
      await tradegecko.tradegecko_create_sales_order('not an object', {id:'some_id'});
      expect(false).toBe(true);
    }
    catch (error){
      expect(error.message).toBe(
        'subscription parameter invalid'
      );
    }
  });
  
  test ('missing customer parameter should throw error', async () => {
    try{
      await tradegecko.tradegecko_create_sales_order({id:'some_id'});
      expect(false).toBe(true);
    }
    catch (error){
      expect(error.message).toBe(
        'customer parameter invalid'
      );
    }
  });
  
  test ('null customer parameter should throw error', async () => {
    try{
      await tradegecko.tradegecko_create_sales_order({id:'some_id'}, null);
      expect(false).toBe(true);
    }
    catch (error){
      expect(error.message).toBe(
        'customer parameter invalid'
      );
    }
  });
  
  test ('non-object customer parameter should throw error', async () => {
    try{
      await tradegecko.tradegecko_create_sales_order({id:'some_id'}, 'this is a string');
      expect(false).toBe(true);
    }
    catch (error){
      expect(error.message).toBe(
        'customer parameter invalid'
      );
    }
  });
  
  test ('null company_id parameter should throw error', async () => {
    try{
      await tradegecko.tradegecko_create_sales_order({id:'some_id'}, {id:'some_id'}, null);
      expect(false).toBe(true);
    }
    catch (error){
      expect(error.message).toBe(
        'company_id parameter invalid'
      );
    }
  });
  
  
  test ('successful call should return {ok:true}', async () => {
    try{
      const ret = tradegecko.tradegecko_create_sales_order(mock_subscription, mock_customer);
      expect(ret).resolves.toEqual({ok:true});
    }
    catch (error){
      expect(false).toBe(true);
    }
  });
  
  got.get.mockReset();
});

describe ('Get product variants', async () => {
  /*
   * Have to require these modules in the scope of the tests otherwise jest can't 
   * mock them
   */
   
  const tradegecko = require('../libs/lib_tradegecko');
  const got = require('got');
  
  /*
   * Mock responses
   */
   
  const mock_single_return = { 
    "body":{
      "variants": [
        {
          "id": 3,
          "created_at": "2015-11-02T01:22:24.772Z",
          "updated_at": "2015-11-02T01:34:04.502Z",
          "product_id": 1,
          "default_ledger_account_id": null,
          "buy_price": "4.5",
          "committed_stock": "3",
          "incoming_stock": "0",
          "composite": null,
          "description": null,
          "keep_selling": false,
          "last_cost_price": "5.0",
          "manage_stock": true,
          "max_online": null,
          "moving_average_cost": "5",
          "name": "Peach",
          "online_ordering": true,
          "opt1": "Peach",
          "opt2": null,
          "opt3": null,
          "position": 2,
          "product_name": "Everlasting Gobstopper",
          "product_status": "active",
          "product_type": "Candy",
          "retail_price": "22.0",
          "sellable": true,
          "sku": "DEMO-GOBS-PEA",
          "status": "active",
          "stock_on_hand": "10",
          "supplier_code": null,
          "taxable": true,
          "upc": null,
          "weight": null,
          "weight_unit": null,
          "weight_value": null,
          "wholesale_price": "12.0",
          "image_ids": [],
          "variant_prices": [
            {
              "price_list_id": "retail",
              "value": "22.0"
            },
            {
              "price_list_id": "wholesale",
              "value": "12.0"
            },
            {
              "price_list_id": "buy",
              "value": "4.5"
            }
          ],
          "locations": [
            {
              "location_id": 1,
              "stock_on_hand": "10",
              "committed": "3",
              "incoming": null,
              "bin_location": null,
              "reorder_point": null
            }
          ],
          "prices": {
            "retail": "22.0",
            "wholesale": "12.0",
            "buy": "4.5"
          },
          "stock_levels": {
            "1": "10.0"
          },
          "committed_stock_levels": {
            "1": "3.0"
          }
        }
      ]
    },
    "headers":{
      "x-pagination":'{"last_page":true}'
    }
  };
  
  const mock_single_lib_return = [
    {
      "id": 3,
      "created_at": "2015-11-02T01:22:24.772Z",
      "updated_at": "2015-11-02T01:34:04.502Z",
      "product_id": 1,
      "default_ledger_account_id": null,
      "buy_price": "4.5",
      "committed_stock": "3",
      "incoming_stock": "0",
      "composite": null,
      "description": null,
      "keep_selling": false,
      "last_cost_price": "5.0",
      "manage_stock": true,
      "max_online": null,
      "moving_average_cost": "5",
      "name": "Peach",
      "online_ordering": true,
      "opt1": "Peach",
      "opt2": null,
      "opt3": null,
      "position": 2,
      "product_name": "Everlasting Gobstopper",
      "product_status": "active",
      "product_type": "Candy",
      "retail_price": "22.0",
      "sellable": true,
      "sku": "DEMO-GOBS-PEA",
      "status": "active",
      "stock_on_hand": "10",
      "supplier_code": null,
      "taxable": true,
      "upc": null,
      "weight": null,
      "weight_unit": null,
      "weight_value": null,
      "wholesale_price": "12.0",
      "image_ids": [],
      "variant_prices": [
        {
          "price_list_id": "retail",
          "value": "22.0"
        },
        {
          "price_list_id": "wholesale",
          "value": "12.0"
        },
        {
          "price_list_id": "buy",
          "value": "4.5"
        }
      ],
      "locations": [
        {
          "location_id": 1,
          "stock_on_hand": "10",
          "committed": "3",
          "incoming": null,
          "bin_location": null,
          "reorder_point": null
        }
      ],
      "prices": {
        "retail": "22.0",
        "wholesale": "12.0",
        "buy": "4.5"
      },
      "stock_levels": {
        "1": "10.0"
      },
      "committed_stock_levels": {
        "1": "3.0"
      }
    }
  ];
  
  /*
   * Set jest to mock the 'got' module + give it return values for specific 
   * module functions
   */
   
  jest.mock('got');
  got.get.mockResolvedValue(mock_single_return); 
  
  test ('successful call should return array containing variant objects', async () => {
    try{
      const ret = await tradegecko.tradegecko_get_product_variants({"ids":["3"]});
      expect(ret).toEqual(mock_single_lib_return);
    }
    catch (error){
      expect(false).toBe(true);
    };
  });
  
  /*test ('successful call with multi page results returns all results from all pages + function is called correct number of times', async () => {
    // https://stackoverflow.com/questions/45102677/testing-recursive-calls-in-jest
  });
  
  test ('successful call with single page results returns all results + function is only called once ', async () => {
    try{
      const ret = await tradegecko.tradegecko_get_product_variants({"ids":["3"]});
      expect(got.get).toHaveBeenCalledTimes(1);
    }
    catch (error){
      expect(false).toBe(true);
    };
  });*/
}); 
/*
describe ('Get images', async () => {
  test ('successful call should make http request to TradeGecko API - https://api.tradegecko.com/images/', async () => {
    
  });
  
  test ('successful call with multi page results returns all results from all pages + function is called correct number of times', async () => {
    
  });
  
  test ('successful call with single page results returns all results + function is only called once ', async () => {
    
  });
});

describe ('Get products', async () => {
  test ('successful call should make http request to TradeGecko API - https://api.tradegecko.com/products/', async () => {
    
  });
  
  test ('successful call with multi page results returns all results from all pages + function is called correct number of times', async () => {
    
  });
  
  test ('successful call with single page results returns all results + function is only called once ', async () => {
    
  });
});

describe ('Get orders', async () => {
  test ('successful call should make http request to TradeGecko API - https://api.tradegecko.com/orders/', async () => {
    
  });
  
  test ('successful call with multi page results returns all results from all pages + function is called correct number of times', async () => {
    
  });
  
  test ('successful call with single page results returns all results + function is only called once ', async () => {
    
  });
});

describe ('Get order_line_items', async () => {
  test ('successful call should make http request to TradeGecko API - https://api.tradegecko.com/order_line_items/', async () => {
    
  });
  
  test ('successful call with multi page results returns all results from all pages + function is called correct number of times', async () => {
    
  });
  
  test ('successful call with single page results returns all results + function is only called once ', async () => {
    
  });
});*/