const expect = require( 'chai' ).expect;
const chargebee = require('../libs/lib_chargebee');
const VError = require("verror");

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
