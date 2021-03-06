/*
 *  Test suite for the subscription_tracker library.
 */

const sub_tracker = require("../libs/lib_subscription_tracker");

sub_tracker.set_weekly( 'test_id_weekly', 'test_sub_id_weekly', true );
sub_tracker.set_monthly( 'test_id_monthly', 'test_sub_id', true );
sub_tracker.set_monthly( 'test_id_switch', 'test_sub_id_switch', true );
sub_tracker.set_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', true );

describe( 'Subscription created to first renewal - monthly ', () => {
  test('1st subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_monthly( 'test_id_monthly', 'test_sub_id', 'deluxe-box', true );
    expect( ret ).toBe(false);
  });

  test('2nd subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_monthly( 'test_id_monthly', 'test_sub_id', 'deluxe-box', true );
    expect( ret ).toBe(false);
  });

  test('3rd subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_monthly( 'test_id_monthly', 'test_sub_id', 'deluxe-box', true );
    expect( ret ).toBe(true);
  });
} );

describe( 'Subscription created to first renewal - weekly ', () => {
  test('1st subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('2nd subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('3rd subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('4th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('5th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('6th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('7th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('8th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('9th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('10th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('11th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('12th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(false);
  });

  test('13th subscription renewal counted', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly',  true );
    expect( ret ).toBe(true);
  });
} );

describe( 'Subscription changed from monthly to weekly on renewal changes count to weekly range ', () => {
  test('increment count to 10 and return false', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test('increment count to 11 and return false', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test('increment count to 12 and return false ', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test('increment count to 13 and return false ', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test('increment count to 14 and return false ', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test('increment count to 15 and return false ', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test('increment count to 16 and return false ', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test('increment count to 17 and return false ', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test('reset count to 5 and return false ', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test(
    'increment count to 6 and return true - new sales order created',
    async () => {
      let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', true );
      expect( ret ).toBe(true);
    }
  );
} );

describe( 'Subscription changed from weekly to monthly on renewal changes count to monthly range ', () => {
  test('increment count to 7 and return false', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });

  test('increment count to 8 and return false', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });


  test('increment count to 9 and return false', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'deluxe-box-weekly', true );
    expect( ret ).toBe(false);
  });


  test('plan change and set count to 2 and return false', async () => {
    let ret = await sub_tracker.increment_and_check_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'deluxe-box', true );
    expect( ret ).toBe(false);
  });


  test('increment count to 1 and return false', async () => {
    let ret = await sub_tracker.increment_and_check_monthly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'deluxe-box', true );
    expect( ret ).toBe(false);
  });

  test(
    'increment count to 2  - new sales order created, return true',
    async () => {
      let ret = await sub_tracker.increment_and_check_monthly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'deluxe-box', true );
      expect( ret ).toBe(true);
    }
  );
} );
