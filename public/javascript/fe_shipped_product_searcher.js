$(document).ready(() => {
  $("#email_get_button").click(sps_get);
  $("#email_sku_check_button").click(sps_check);

  function sps_check(){
    $.get('/api/sps_check', document.getElementById("email_sku_check_form"), (data, status) => {
      console.log(JSON.stringify(data));
    });
  }

  function sps_get(){
    $.get('/api/sps_get', document.getElementById("email_get_form"), (data, status) => {
      console.log(JSON.stringify(data));
    });
  }
});
