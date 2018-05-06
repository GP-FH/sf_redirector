$(document).ready(() => {
  $("#email_get_form").submit((event) => {
    event.preventDefault();
    const data = $("#email_get_form :input");

    $.get('/api/sps_get', {"email":data[0].value} document.getElementById("email_sku_check_form"), (data, status) => {
      console.log(JSON.stringify(data));
    });
  });

  $("#email_sku_check_form").submit((event) => {
    console.log(JSON.stringify(event));
    /*$.get('/api/sps_check', document.getElementById("email_get_form"), (data, status) => {
      console.log(JSON.stringify(data));
    });*/
  });
});
