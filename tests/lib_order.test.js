const order = require('../libs/lib_order');

describe( 'Validate whether new subscription is for existing customer', () => {
  test('customer is new', async () => {
    const sub = {name: 'Gary', phone: '5555555555', cf_firstmame:'baby'};
    const ret = await order.order_validate_if_for_new_customer(sub);
    expect( ret ).toBe(true);
  });

  test('customer is existing', async () => {
    const sub = {name: 'Gary', phone: '5555555555'};
    const ret = await order.order_validate_if_for_new_customer(sub);
    expect( ret ).toBe(false);
  });
} );
