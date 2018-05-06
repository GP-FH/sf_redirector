$(document).ready(() => {
  const $j = jQuery.noConflict();

  function sps_check(){
    $j.get('/api/sps_check', document.getElementById("email_sku_check_form"), (data, status) => {
      console.log(JSON.stringify(data));
    });
  }

  function sps_get(){
    $j.get('/api/sps_get', document.getElementById("email_get_form"), (data, status) => {
      console.log(JSON.stringify(data));
    });
  }
});
