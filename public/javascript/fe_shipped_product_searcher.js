$(document).ready(() => {
  $("#email_get_form").submit((event) => {
    event.preventDefault();
    const data = $("#email_get_form :input");

    $.get('/api/sps_get', {"email":data[0].value}, (ret, status) => {
      console.log(JSON.stringify(ret));
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
