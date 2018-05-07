$(document).ready(() => {
  $("#email_get_form").submit((event) => {
    event.preventDefault();
    const data = $("#email_get_form :input");

    $.get('/api/sps_get', {"email":data[0].value}, (ret, status) => {
      console.log(JSON.stringify(ret));
      $("#email_get_results_list").empty();
      for (let i = 0; i < ret.products.length; i++ ){
        const product = ret.products[i];
        $("#email_get_results_list").append(`<li class="list-group-item"><b>Product Name:</b> ${product.product_name} <b>SKU:</b> ${product.product_code} <b>Colour:</b> ${product.product_option1}</li>`);
      }
    });
  });

  $("#email_sku_check_form").submit((event) => {
    event.preventDefault();
    const data = $("#email_sku_check_form :input");

    $.get('/api/sps_check', {"email":data[0].value, "sku":data[1].value}, (ret, status) => {
      console.log(JSON.stringify(ret));

      $("#email_sku_check_no_result_alert").addClass("invisible");
      $("#email_sku_check_result_alert").addClass("invisible");

      if (!ret.products){
        $("#email_sku_check_no_result_alert").text("DOES THIS WORK?");
        $("#email_sku_check_no_result_alert").removeClass("invisible");
      }else{
        $("#email_sku_check_result_alert").text("DOES THIS WORK?");
        $("#email_sku_check_result_alert").removeClass("invisible");
      }
    });
  });
});
