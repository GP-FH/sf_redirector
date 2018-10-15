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
    * ORDER OF OPERATIONS:
    * - get list of subscriptions from chargebee where next billing is 3 days from now
    * - get list of subs from sub tracker where (for monthly) count = 1 or (for weekly) count = 5
    * - filter out those that are getting a box next renewal
    * - for those getting boxes: remove contact from 'Profile Update Email Due' list + add temp_* values to 
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
      const cb_subs = ret.list;

      if (verbose) logger.info(`Number of subs due in 3 days: ${cb_subs.length}`); 
      
      /*
       * Pick out the subs that are due a box next renewal from the array of subs returned
       * by chargebee tha are renewing 3 days from now
       */
       
      let matches = [];
      for (let i = 0; i < cb_subs.length; i++){
        if (await sub_tracker.subscription_tracker_check_box_on_next_renewal(cb_subs[i].customer.id, cb_subs[i].subscription.id)){
          matches.push(cb_subs[i]);
        }
      }
      
      if (verbose) logger.info(`Number of subs due a box on next renewal: ${matches.length}`); 
      
      if (!debug){
        for (let i = 0; i < matches.length; i++){          
          if (verbose) logger.info(`Updating fields for ${matches[i].customer.email} contact in Autopilot`);
          
          await autopilot.autopilot_update_or_create_contact(
            {
              "contact":{
                "Email": matches[i].customer.email,
                "custom": {
                  "string--temp_sub_id_for_next_email": matches[i].subscription.id, // string-- is necessary: declare the type then a space then the variable name
                  "string--temp_kid_name_for_next_email": matches[i].subscription.cf_childname, 
                  "string--temp_kid_gender_for_next_email": matches[i].subscription.cf_gender
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