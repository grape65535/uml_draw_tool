/*------------------------------------------------------------------------------
  DOM形状オブジェクトベース
    継承関係： DomShape -> DomRelation
------------------------------------------------------------------------------*/
function DomShape(){
  DomShape.prototype = Object.create( DomRelation.prototype );

  //--------------------------------------
  // DOM関係初期化
  //--------------------------------------
  DomShape.prototype._initializeDomShape = function(){
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.scroll_x = 0;
    this.scroll_y = 0;
    this.scrollable = false;
    this.drag_scroll_start_pos = null;
  };

  //--------------------------------------
  // ページ座標（絶対値）を取得
  //--------------------------------------
  DomShape.prototype.pagePosition = function(){
    if ( "none" == this.style.display ) return { x:0, y:0 };

    var position = {
      x: this.x,
      y: this.y,
    };
    var seek_parent = this.parent;
    while( null != seek_parent ){
      if ( "none" == seek_parent.style.display ) return { x:0, y:0 };

      position.x += ( seek_parent.x + seek_parent.style.margin[3] + seek_parent.style.border_width[3] + seek_parent.style.padding[3] );
      position.y += ( seek_parent.y + seek_parent.style.margin[0] + seek_parent.style.border_width[0] + seek_parent.style.padding[0] );
      seek_parent = seek_parent.parent;
    }
    return position;
  };

  //--------------------------------------
  // スクリーン座標（絶対値＆スクロール位置影響有）を取得
  //--------------------------------------
  DomShape.prototype.screenPosition = function(){
    if ( "none" == this.style.display ) return { x:0, y:0 };

    var position = this.pagePosition();

    if ( this.parent ) {
      position.x -= this.parent.scrollLeft();
      position.y -= this.parent.scrollTop();  
    }

    var seek_parent = this.parent;
    while( null != seek_parent ){
      if ( "none" == seek_parent.style.display ) return { x:0, y:0 };
      
      position.x -= ( seek_parent.parent ? seek_parent.parent.scrollLeft() : 0 );
      position.y -= ( seek_parent.parent ? seek_parent.parent.scrollTop() : 0 );
      seek_parent = seek_parent.parent;
    }
    return position;
  };

  //--------------------------------------
  // 最もページ右下の座標を取得する
  //--------------------------------------
  DomShape.prototype.mostFarAbsolutePosition = function( current_bottom ){
    current_bottom = current_bottom || { x:0, y:0 };

    if ( "none" == this.style.display ) return current_bottom;

    // 自身がposition:absoluteの時にだけ、右下座標を取得する
    if ( this.style.position != "relative" ) {
      var absolute_position = this.pagePosition();
      absolute_position.x + this.width;
      absolute_position.y + this.height;

      if ( current_bottom.x < absolute_position.x ) current_bottom.x = absolute_position.x
      if ( current_bottom.y < absolute_position.y ) current_bottom.y = absolute_position.y
    }
    // 子も探す
    for ( var i=0; i<this.children.length; i++ ) {
      current_bottom = this.children[i].mostFarAbsolutePosition( current_bottom );
    }

    return current_bottom;
  };

  //--------------------------------------
  // パディング内部の横幅
  //--------------------------------------
  DomShape.prototype.inlineWidth = function(){
    var width = this.width - ( 
                  this.style.margin[1] + this.style.border_width[1] + this.style.padding[1] +
                  this.style.margin[3] + this.style.border_width[3] + this.style.padding[3]
                );
    return width >= 0 ? width : 0;
  };

  //--------------------------------------
  // 内部の縦幅
  //--------------------------------------
  DomShape.prototype.inlineheight = function(){
    var height = this.height - ( 
                  this.style.margin[0] + this.style.border_width[0] + this.style.padding[0] +
                  this.style.margin[2] + this.style.border_width[2] + this.style.padding[2]
                );
    return height >= 0 ? height : 0;
  };

  //--------------------------------------
  // ボーダー内側の矩形取得
  //--------------------------------------
  DomShape.prototype.borderInlineRect = function(){
    return {
      x: this.x + this.style.margin[3] + this.style.border_width[3],
      y: this.y + this.style.margin[0] + this.style.border_width[0],
      width: this.inlineWidth() + ( this.style.padding[1] + this.style.padding[3] ),
      height: this.inlineheight() + ( this.style.padding[0] + this.style.padding[2] ),
    }
  };

  //--------------------------------------
  // パディング内側の矩形取得
  //--------------------------------------
  DomShape.prototype.paddingInlineRect = function(){
    return {
      x: this.x + this.style.margin[3] + this.style.border_width[3] + this.style.padding[3],
      y: this.y + this.style.margin[0] + this.style.border_width[0] + this.style.padding[0],
      width: this.inlineWidth(),
      height: this.inlineheight(),
    }
  };

  //--------------------------------------
  // ページ幅を取得
  //--------------------------------------
  DomShape.prototype.pageWidth = function(){
    return this.content_width + ( this.style.padding[1] + this.style.padding[3] );
  };

  //--------------------------------------
  // ページの高さを取得
  //--------------------------------------
  DomShape.prototype.pageHeight = function(){
    return this.content_height + ( this.style.padding[0] + this.style.padding[2] );
  };

  //--------------------------------------
  // スクロール領域の幅を取得
  //--------------------------------------
  DomShape.prototype.scrollWidth = function(){
    // 表示領域の高さ
    var inline_width = this.width - ( 
      this.style.margin[1] + this.style.border_width[1] +
      this.style.margin[3] + this.style.border_width[3]
    );
    var page_width = this.pageWidth();
    if ( 0 > inline_width ) inline_width = 0;
    if ( page_width < inline_width ) inline_width = page_width;

    return page_width - inline_width
  };

  //--------------------------------------
  // スクロール領域の高さを取得
  //--------------------------------------
  DomShape.prototype.scrollHeight = function(){
    // 表示領域の高さ
    var inline_height = this.height - ( 
      this.style.margin[0] + this.style.border_width[0] +
      this.style.margin[2] + this.style.border_width[2]
    );
    var page_height = this.pageHeight();
    if ( 0 > inline_height ) inline_height = 0;
    if ( page_height < inline_height ) inline_height = page_height;

    return page_height - inline_height
  };

  //--------------------------------------
  // 横スクロール
  //--------------------------------------
  DomShape.prototype.scrollLeft = function( value ){
    // 引数なし＝スクロール位置の取得
    if ( "undefined" == typeof value ) {
      return this.scroll_x;
    }
    // 引数あり＝スクロール位置の設定
    else {
      // スクロール可能でなければここで終了
      if ( ! this.scrollable ) return false;

      // 後でスクロール位置が変化したかを確認するために、現在のスクロール位置をバックアップする
      var before_scroll = this.scroll_x;

      // 最も左の境界値
      if ( 0 > value ) value = 0;

      // 表示領域の高さ
      var scroll_width = this.scrollWidth();

      // ページ下限？
      if ( scroll_width < value ) value = scroll_width;
      
      // スクロール位置の保存
      this.scroll_x = value;

      return ( before_scroll != this.scroll_x ? true : false );
    }
  };

  //--------------------------------------
  // 縦スクロール
  //--------------------------------------
  DomShape.prototype.scrollTop = function( value ){
    // 引数なし＝スクロール位置の取得
    if ( "undefined" == typeof value ) {
      return this.scroll_y;
    }
    // 引数あり＝スクロール位置の設定
    else {
      // スクロール可能でなければここで終了
      if ( ! this.scrollable ) return false;

      // 後でスクロール位置が変化したかを確認するために、現在のスクロール位置をバックアップする
      var before_scroll = this.scroll_y;

      // 最も上の境界値
      if ( 0 > value ) value = 0;

      // 表示領域の高さ
      var scroll_height = this.scrollHeight();

      // ページ下限？
      if ( scroll_height < value ) value = scroll_height;
      
      // スクロール位置の保存
      this.scroll_y = value;

      return ( before_scroll != this.scroll_y ? true : false );
    }
  };

  //--------------------------------------
  // 右スクロール可能？
  //--------------------------------------
  DomShape.prototype.canScrollRight = function(){
    if ( ! this.scrollable ) return false;
    if ( this.scrollWidth() > this.scrollLeft() ) return true;

    return false;
  };

  //--------------------------------------
  // 左スクロール可能？
  //--------------------------------------
  DomShape.prototype.canScrollLeft = function(){
    if ( ! this.scrollable ) return false;
    if ( 0 < this.scrollLeft() ) return true;

    return false;
  };

  //--------------------------------------
  // 下にスクロール
  //--------------------------------------
  DomShape.prototype.scrollDown = function(){
    this.scrollTop( this.scrollTop() + Math.max( this.style.font_size, this.style.line_height ) );
  };

  //--------------------------------------
  // 上にスクロール
  //--------------------------------------
  DomShape.prototype.scrollUp = function(){
    this.scrollTop( this.scrollTop() - Math.max( this.style.font_size, this.style.line_height ) );
  };

  //--------------------------------------
  // 下スクロール可能？
  //--------------------------------------
  DomShape.prototype.canScrollDown = function(){
    if ( ! this.scrollable ) return false;
    if ( this.scrollHeight() > this.scrollTop() ) return true;

    return false;
  };

  //--------------------------------------
  // 上スクロール可能？
  //--------------------------------------
  DomShape.prototype.canScrollUp = function(){
    if ( ! this.scrollable ) return false;
    if ( 0 < this.scrollTop() ) return true;

    return false;
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
DomShape();
