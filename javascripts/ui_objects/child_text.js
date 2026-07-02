/*------------------------------------------------------------------------------
  展開子テキスト
------------------------------------------------------------------------------*/
function ChildText(){
  ChildText.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // 初期化
  //--------------------------------------
  ChildText.prototype.initialize = function( name, style, text ){
    // 基底クラスの中からforcedStyleを呼び出すので、先にtextを初期化しておく必要がある
    this.text = text;
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  ChildText.prototype.objectName = function(){
    return 'ChildText';
  };

  //--------------------------------------
  // 強制の固定スタイルを取得
  //--------------------------------------
  ChildText.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: ( 0 < this.text.length ? "inline" : "block" ),
        top: "auto",
        left: "auto",
        width: "auto",
        height: "auto",
        overflow: "hidden",
      }
    );
  };

  //--------------------------------------
  // レイアウトの実行
  //--------------------------------------
  ChildText.prototype.layout = function( parent_caret ){
    // 幅と高さを設定
    this.width = getTextWidth( this.text, this.style.font_size );
    this.height = Math.max( this.style.font_size, this.style.line_height );
    return null;
  };

  //--------------------------------------
  // 描画
  //--------------------------------------
  ChildText.prototype.draw = function( context, offsetx, offsety ){
    if ( 0 == this.text.length ) return;

    var padding_inline_rect = this.paddingInlineRect();
    var color = this.getDrawColor();

    // ふちどり無
    if ( 0 == this.style.text_stroke_width ) {
      drawText(
        context,
        this.text,
        offsetx + padding_inline_rect.x,
        offsety + padding_inline_rect.y,
        color,
        this.style.font_size,
        true
      );
    }
    // ふちどり有
    else {
      drawTextStroke(
        context,
        this.text,
        offsetx + padding_inline_rect.x,
        offsety + padding_inline_rect.y,
        this.style.text_stroke_color,
        color,
        this.style.font_size,
        this.style.text_stroke_width
      );
    }

  };

  //--------------------------------------
  // ウィンドウサイズ変更イベント
  //--------------------------------------
  ChildText.prototype.reload = function(){
    ;
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
ChildText();
