/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * This cron script checks for active subscriptions that are due a box next
 * renewal. If it is 3 days before renewal it adds them to an Autopilot list
 * that triggers an email for them to update their child's size
 *
 * Arguments:
 * - d | --debug : run the script without actually updating Autopilot and 
 *                 print expected impact
 *
 * - v | --verbose : run with maximum logging
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
 
 const dotenv = require("dotenv");
 dotenv.config( {
   path: '/home/dev/redirect_node/current/config/config.env'
 } );
 const command_line_args = require("command-line-args");
 const VError = require("verror");
 
 const autopilot = require("../libs/lib_autopilot");
 const chargebee = require("../libs/lib_chargebee");
 const sub_tracker = require("../libs/lib_subscription_tracker");
 const logger = require("../libs/lib_logger");
 
 const option_definitions = [ 
   {
     name: 'debug',
     alias: 'd',
     type: Boolean,
     defaultValue: false
   },
   {
     name: 'verbose',
     alias: 'v',
     type: Boolean,
     defaultValue: false
   }
 ];
 const options = command_line_args(option_definitions);
 const verbose = options.verbose;
 const debug = options.debug;
 
 main();
 
 async function main (){
   /*
    * TODO:
    * - get list of subscriptions from chargebee where next billing is 3 days from now
    * - get list of subs from sub tracker where (for monthly) count = 1 or (for weekly) count = 5
    * - check for matching sub IDs between CB subs and sub tracker subs. 
    * - for matches: remove contact from 'Profile Update Email Due' list + add temp_* values to 
    *   contact + add contact to 'Profile Update Email Due' list in Autopilot
    */
    
    const current_ts = Math.round(new Date().getTime() / 1000);
    const three_days_from_now = current_ts + 259200;
    const four_days_from_now = current_ts + 345600;
    const time_array = [three_days_from_now,four_days_from_now];
    
    const filters = {
      "status[is]" : "active",
      "next_billing_at[between]" : `[${three_days_from_now},${four_days_from_now}]`
    };
    
    try {
      const ret = await chargebee.chargebee_list_subscriptions(filters)
      const cb_subs = [
        {
          subscription: {
            id: "1mbDWiFR6A97t8JIo",
            customer_id: "1mbDWiFR6A97t8JIo",
            plan_id: "luxe-weekly",
            plan_quantity: 1,
            plan_unit_price: 2900,
            plan_amount: 2900,
            billing_period: 1,
            billing_period_unit: "week",
            plan_free_quantity: 0,
            status: "active",
            current_term_start: 1538926622,
            current_term_end: 1539531422,
            next_billing_at: 1539531422,
            created_at: 1537720622,
            started_at: 1537720622,
            activated_at: 1537720622,
            affiliate_token: "csmjgcds2d69N8oQ5hOYIetcuNr3T29YFz",
            created_from_ip: "218.101.90.39",
            updated_at: 1538926627,
            has_scheduled_changes: false,
            resource_version: 1538926627312,
            deleted: false,
            object: "subscription",
            currency_code: "NZD",
            due_invoices_count: 0,
            mrr: 10959,
            exchange_rate: 1,
            base_currency_code: "NZD",
            shipping_address: {
              first_name: "Stephanie",
              last_name: "Mills",
              phone: "0210379284",
              line1: "900A Pungaere Road RD2 l Kerikeri",
              line2: "Kerikeri",
              city: "Northland",
              country: "NZ",
              validation_status: "not_validated",
              object: "shipping_address"
            },
            cf_gender: "Girl",
            cf_childname: "Bailey Grace",
            cf_childage: "14/08/2018",
            cf_topsize: "0-3 Months",
            cf_bottomsize: "0-3 Months",
            cf_jam: "Pared Back, Vintage inspired, Fun",
            cf_doit: "Street, Oversized",
            cf_palette: "Classic Patterns, Sky Pastels, Warm Neutrals",
            cf_keen:
              "Onesies, Playsuits, Casual Dresses, Skirts, Sweatshirts, Hoodies, Leggings",
            cf_else: "not_yet_defined",
            cf_notes: "{{field:}}"
          },
          customer: {
            id: "1mbDWiFR6A97t8JIo",
            first_name: "Marcelo",
            last_name: "Hudson",
            email: "marcelo@stitchfox.com",
            phone: "0210379284",
            auto_collection: "on",
            net_term_days: 0,
            allow_direct_debit: false,
            is_location_valid: true,
            created_at: 1537720622,
            created_from_ip: "218.101.90.39",
            taxability: "taxable",
            updated_at: 1537720625,
            pii_cleared: "active",
            resource_version: 1537720625375,
            deleted: false,
            object: "customer",
            billing_address: {
              first_name: "Stephanie",
              last_name: "Mills",
              phone: "0210379284",
              line1: "900A Pungaere Road RD2 l Kerikeri",
              line2: "Kerikeri",
              city: "Northland",
              country: "NZ",
              validation_status: "not_validated",
              object: "billing_address"
            },
            card_status: "valid",
            primary_payment_source_id: "pm_2smoc967R4UR2Abbnk",
            payment_method: {
              object: "payment_method",
              type: "card",
              reference_id: "5287852446/68zy4sm",
              gateway: "braintree",
              gateway_account_id: "gw_IG5rygVQKXoxDf7Kv",
              status: "valid"
            },
            promotional_credits: 0,
            refundable_credits: 0,
            excess_payments: 0,
            unbilled_charges: 0,
            preferred_currency_code: "NZD"
          },
          card: {
            status: "valid",
            gateway: "braintree",
            gateway_account_id: "gw_IG5rygVQKXoxDf7Kv",
            first_name: "Stephanie",
            last_name: "Mills",
            iin: "483561",
            last4: "3139",
            card_type: "visa",
            funding_type: "debit",
            expiry_month: 3,
            expiry_year: 2020,
            issuing_country: "NZ",
            billing_country: "NZ",
            ip_address: "218.101.90.39",
            object: "card",
            masked_number: "************3139",
            customer_id: "1mkVvkBR4UQvIPapb",
            payment_source_id: "pm_2smoc967R4UR2Abbnk"
          }
        }
      ];

//ret.list;
      const tracker_subs = await sub_tracker.subscription_tracker_get_upcoming_renewals(cb_subs);
      let matches = [];
      
      if (verbose) logger.info(`Number of subs due in 3 days: ${cb_subs.length}. Out of those ${tracker_subs.length} get a box on next renewal`);
      
      /*
       * Pick out the subs that are due a box next renewal from the array of subs returned
       * by chargebee tha are renewing 3 days from now
       */
       
      for (let i = 0; i < cb_subs.length; i++){
        for (let j = 0; j < tracker_subs.length; j++){
          if (cb_subs[i].subscription.id == tracker_subs[j].id){
            matches.push(cb_subs[i]);
          }
        }
      }
      
      const profile_update_email_due_list_id = 'contactlist_d96add3e-f282-422c-a144-bdb245b19c4a';
      
      if (!debug){
        for (let i = 0; i < matches.length; i++){
          if (verbose) logger.info(`Removing ${matches[i].customer.email} from Autopilot list (if they're there)`);
          await autopilot.autopilot_remove_contact_from_list(matches[i].customer.email, profile_update_email_due_list_id);
          
          if (verbose) logger.info(`(Re-)Adding ${matches[i].customer.email} to list in Autopilot to trigger journey`);
          await autopilot.autopilot_update_or_create_contact(
            {
              "contact":{
                "Email": matches[i].customer.email,
                "_autopilot_list": profile_update_email_due_list_id, // including this automagically adds them to the list
                "custom": {
                  "temp_sub_id_for_next_email": matches[i].id, 
                  "temp_kid_name_for_next_email": matches[i].subscription.cf_childname, 
                  "temp_kid_gender_for_next_email": matches[i].subscription.cf_gender
                }
              }
            } 
          );
        }
      }
      
      if (debug){
        logger.info(`Job would have moved ${matches.length} customers onto the 'Profile Update Email Due' Autopilot list`);
        process.exit(0);
      }
      
      logger.info(`Job moved ${matches.length} customers onto the 'Profile Update Email Due' Autopilot list`);
      process.exit(0);
      
    }catch (error){
      logger.error(`nightly_check_profile_size_check.js: error occured: ${JSON.stringify(error, null, 4)}`);
      process.exit(1);
    }
    
 };