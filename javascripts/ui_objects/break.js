/*------------------------------------------------------------------------------
  改行
------------------------------------------------------------------------------*/
function Break(){
  Break.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // 型
  //--------------------------------------
  Break.prototype.objectName = function(){
    return 'Break';
  }

  //--------------------------------------
  // 強制の固定スタイルを取得
  //--------------------------------------
  Break.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: "block",
        top: "auto",
        left: "auto",
        width: 0,
        height: 0,
        overflow: "hidden",
        font_size: 0,
        line_height: 0,
        border_width: [ 0, 0, 0, 0 ],
        padding: [ 0, 0, 0, 0 ],
        margin: [ 0, 0, 0, 0 ],
      }
    );
  };

  //--------------------------------------
  // レイアウトの実行
  //--------------------------------------
  Break.prototype.layout = function( parent_caret ){
    // 幅と高さを設定
    this.width = 0;
    this.height = 0;
    return null;
  };

  //--------------------------------------
  // 描画
  //--------------------------------------
  Break.prototype.draw = function( context, offsetx, offsety ){
    ;
  };

  //--------------------------------------
  // ウィンドウサイズ変更イベント
  //--------------------------------------
  Break.prototype.reload = function(){
    ;
  };
}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Break();
