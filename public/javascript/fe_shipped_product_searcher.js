$(document).ready(() => {
  $("#email_get_form").submit((event) => {
    console.log(JSON.stringify(event));
    /*$.get('/api/sps_check', document.getElementById("email_sku_check_form"), (data, status) => {
      console.log(JSON.stringify(data));
    });*/
  });

  $("#email_sku_check_form").submit((event) => {
    console.log(JSON.stringify(event));
    /*$.get('/api/sps_get', document.getElementById("email_get_form"), (data, status) => {
      console.log(JSON.stringify(data));
    });*/
  });
});
