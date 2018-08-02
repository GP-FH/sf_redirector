const chargebee = require('../libs/lib_chargebee');
const VError = require("verror");

describe( 'Pause chargebee subscription - ', () => {
  test('missing subscription_id parameter should throw error', async () => {
    try{
      await chargebee.chargebee_pause_subscription();
      expect(false).toBe(true);
    }
    catch(error){
      expect(error.message).toBe(
        'chargebee_pause_subscription() called with undefined subscription_id parameter'
      );
    }
  });

  test('null subscription_id parameter should throw error', async () => {
    try{
      await chargebee.chargebee_pause_subscription(null);
      expect(false).toBe(true);
    }
    catch(error){
      expect(error.message).toBe(
        'chargebee_pause_subscription() called with undefined subscription_id parameter'
      );
    }
  });
} );

describe( 'Update chargebee subscription - ', () => {
  test('missing subscription parameter should throw error', async () => {
    try{
     await chargebee.chargebee_update_subscription();
     expect(false).toBe(true);
    }
    catch(error){
     expect(error.message).toBe(
       'chargebee_update_subscription() called with undefined subscription parameter'
     );
    }
  });

  test('missing new_fields parameter should throw error', async () => {
    try{
     await chargebee.chargebee_update_subscription('subscription');
     expect(false).toBe(true);
    }
    catch(error){
     expect(error.message).toBe(
       'chargebee_update_subscription() called with undefined new_fields parameter'
     );
    }
  });
} );
