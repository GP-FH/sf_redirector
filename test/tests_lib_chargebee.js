const expect = require( 'chai' ).expect;
const chargebee = require('../libs/lib_chargebee');
const VError = require("verror");

describe( 'Pause chargebee subscription - ', () => {
  it( 'missing subscription_id parameter should throw error', async () => {
    try{
      await chargebee.chargebee_pause_subscription();
      expect(false).to.be.true;
    }
    catch(error){
      expect(error.message).to.equal('chargebee_pause_subscription() called with undefined subscription_id parameter');
    }
  } );

  it( 'null subscription_id parameter should throw error', async () => {
    try{
      await chargebee.chargebee_pause_subscription(null);
      expect(false).to.be.true;
    }
    catch(error){
      expect(error.message).to.equal('chargebee_pause_subscription() called with undefined subscription_id parameter');
    }
  } );
} );

describe( 'Update chargebee subscription - ', () => {
  it( 'missing subscription parameter should throw error', async () => {
    try{
     await chargebee.chargebee_update_subscription();
     expect(false).to.be.true;
    }
    catch(error){
     expect(error.message).to.equal('chargebee_update_subscription() called with undefined subscription parameter');
    }
  } );

  it( 'missing new_fields parameter should throw error', async () => {
    try{
     await chargebee.chargebee_update_subscription('subscription');
     expect(false).to.be.true;
    }
    catch(error){
     expect(error.message).to.equal('chargebee_update_subscription() called with undefined new_fields parameter');
    }
  } );
} );
