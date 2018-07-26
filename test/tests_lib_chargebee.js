const expect = require( 'chai' ).expect;
const chargebee = require('../libs/lib_chargebee');
const VError = require("verror");

describe( 'Subscription created to first renewal - monthly ', () => {
  it( '1st subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_monthly( 'test_id_monthly', 'test_sub_id', 'deluxe-box', true );
    expect( ret ).to.be.false;
  } );

  it( '2nd subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_monthly( 'test_id_monthly', 'test_sub_id', 'deluxe-box', true );
    expect( ret ).to.be.false;
  } );

  it( '3rd subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_monthly( 'test_id_monthly', 'test_sub_id', 'deluxe-box', true );
    expect( ret ).to.be.true;
  } );
} );
