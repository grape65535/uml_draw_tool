$(function(){

  history.pushState(null, null, location.href);
  window.addEventListener('popstate', (e) => {
    history.go(1);
  });

  //--------------------------------------
  // ブラウザバックの抑止
  //--------------------------------------
  if ( !window.location.href.match( /^file:\/\//i ) ) {
    if( window.history && window.history.pushState ){
      //. ブラウザ履歴に１つ追加
      history.pushState( "nohb", null, "" );
      $(window).on( "popstate", function(event){
        //. このページで「戻る」を実行
        if( !event.originalEvent.state ){
          //. もう一度履歴を操作して終了
          history.pushState( "nohb", null, "" );
          return;
        }
      });
    }
  }
  else {
    if ( !window.location.href.match( /#/i ) ) {
      function history_override(){
        var num = window.location.href.match( /#([0-9]{1,2})$/i );
        if ( num ) {
          num = parseInt( num[1] );
          if ( 99 >= num ) {
            num++;
            window.location.href = window.location.href.replace(/#.*/i, "") + '#' + num.toString();
            setTimeout( history_override, 100 );
            return;
          }
        }
        setTimeout( history_override, 5000 );
      }
      window.location.href = window.location.href + '#0';
      history_override();
    }
  }

});
