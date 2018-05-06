function sps_check(){
  $.get('/api/sps_check', document.getElementById("email_sku_check_form"), (data, status) => {

  });

}

function sps_get(){
  $.get('/api/sps_get', document.getElementById("email_get_form"), (data, status) => {

  });
}
