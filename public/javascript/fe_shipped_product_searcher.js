$(document).ready(() => {
  $("#email_get_form").submit((event) => {
    event.preventDefault();
    const data = $("#email_get_form :input");

    $.get('/api/sps_get', {"email":data[0].value}, (ret, status) => {
      console.log(JSON.stringify(ret));

      for (let i = 0; i < ret.products.length; i++ ){
        const product = ret.products[i];
        $("email_get_results_list").append(`<li class="list-group-item"><b>${product.product_name}</b> SKU: ${product.product_code} Colour: ${product.product_option1} Quantity: ${product.quantity} </li>`);
      }
    });
  });

  $("#email_sku_check_form").submit((event) => {
    event.preventDefault();
    const data = $("#email_sku_check_form :input");

    $.get('/api/sps_check', {"email":data[0].value, "sku":data[1].value}, (ret, status) => {
      console.log(JSON.stringify(ret));
    });
  });
});
