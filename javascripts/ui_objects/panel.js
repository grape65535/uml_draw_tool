/*------------------------------------------------------------------------------
  パネル
------------------------------------------------------------------------------*/
function Panel(){
  Panel.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // 型
  //--------------------------------------
  Panel.prototype.objectName = function(){
    return 'Panel';
  };
 
  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  Panel.prototype.defaultStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: "block",
        overflow: "scroll",
      }
    );
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Panel();
