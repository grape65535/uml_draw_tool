/*------------------------------------------------------------------------------
  テキスト
------------------------------------------------------------------------------*/
function Text(){
  Text.prototype = Object.create( UIBase.prototype );

  //--------------------------------------
  // 展開された子の削除
  //--------------------------------------
  Text.prototype._removeExpandChild = function(){
    while ( 0 < this.children.length ) {
      this.parent.removeObject( this.children[0] );
      this.children.splice( 0, 1 );
    }
  };

  //--------------------------------------
  // レイアウトする次の文字候補を取得する
  //--------------------------------------
  Text.prototype._nextWord = function( current_chunk, org_text ){
    switch ( this.style.word_break ) {
    case "normal":
      var next_word = "";
      for ( var i=current_chunk.length; i<org_text.length; i++ ) {
        var next_char = org_text.charAt( i );
        // 改行コードだったら、その直前までを返す。最初の1文字だった時はfalseを返す
        if ( next_char.match(/[\r\n]/) ) {
          return ( 0 < next_word.length ? next_word : false );
        }
        // 空白が途中の文字だった時は直前までを返す。
        if ( " " == next_char && 1 < next_word.length ) return next_word;
        next_word += next_char;

        // 空白やアスキーコード範囲外は1文字づつ追加して返す
        if ( " " == next_char || 0xFF < next_char.charCodeAt(0) ) break;
      }
      return next_word;

    case "break-all":
      return org_text.charAt( current_chunk.length );
    }
  };

  //--------------------------------------
  // 行頭の空白を削除する
  //--------------------------------------
  Text.prototype._trimFirstSpace = function( text ){
    switch ( this.style.word_break ) {
    case "normal":
    case "nowrap":
    case "pre-line":
      return text.replace( /^[ \t]+/, "" );

    default:
      return text;
    }
  };

  //--------------------------------------
  // 初期化
  //--------------------------------------
  Text.prototype.initialize = function( name, style, text ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, name, style );
    this.text = text;
    return this;
  };

  //--------------------------------------
  // 型
  //--------------------------------------
  Text.prototype.objectName = function(){
    return 'Text';
  };

  //--------------------------------------
  // 強制の固定スタイルを取得
  //--------------------------------------
  Text.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: "inline",
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
  Text.prototype.layout = function( parent_caret ){
    // 幅と高さを設定
    this.width = 0;
    this.height = 0;

    // 前回の展開された子の削除
    this._removeExpandChild();
    // キャレット位置の初期化
    this._initializeCaret();
    this.caret.x = parent_caret.x;
    // 親のレイアウト可能最大幅を取得
    var parent_inline_width = this.parent.inlineWidth();
    // 親の横幅がmax-contentの時は、コンテンツ幅に合わせるので折り返さない
    // （日本語などの非ASCII文字は1文字単位で折り返し可能なため、ここで抑止しないと1文字ずつ改行されてしまう）
    var is_wrappable = ( "nowrap" != this.style.white_space && "pre" != this.style.white_space && "max-content" != this.parent.style.width );

    var layout_text = this.text;
    // 文字の前後の空白トリムと改行コードやタブは空白に変換し、連続した空白も1つに短縮する
    switch ( this.style.white_space ) {
    case "normal":
    case "nowrap":
      layout_text = layout_text.trim().replace( /[ \t\r\n]+/, " " );
      break;

    case "pre-line":
      layout_text = layout_text.trim().replace( /[ \t]+/, " " );
      break;  
    }

    var chunk = "";
    var confirmed_chunk = "";
    while( 0 < layout_text.length && chunk.length < layout_text.length ){
      var tmp = this._nextWord( chunk, layout_text );
      // 次の文字が存在しない時は改行コードによる改行
      if ( ! tmp ) {
        // 未レイアウトの文字がまだある
        if ( 0 < confirmed_chunk.length ) {
          this.appendObject( ( new ChildText() ).initialize( null, null, this._trimFirstSpace( confirmed_chunk ) ) );
          layout_text = layout_text.slice( confirmed_chunk.length + 1 );
          chunk = "";
          confirmed_chunk = "";
        }
        // 改行コードだけ
        else {
          this.appendObject( ( new ChildText() ).initialize( null, null, "" ) );
          layout_text = layout_text.slice( 1 );
        }
        // 改行
        this._layoutLineBreak();

        continue;
      }
      chunk += tmp;

      // 行に収まらない時
      if ( is_wrappable && getTextWidth( this._trimFirstSpace( chunk ), this.style.font_size ) > ( parent_inline_width - this.caret.x ) ) {
        // 行に収まる文字が1文字以上あるのなら、展開された子オブジェクトとする
        if ( 1 < confirmed_chunk.length ) {
          this.appendObject( ( new ChildText() ).initialize( null, null, this._trimFirstSpace( confirmed_chunk ) ) );
          layout_text = layout_text.slice( confirmed_chunk.length );
          chunk = "";
          confirmed_chunk = "";
        }
        // 改行しても収まる文字が無さそうな時は、現在の文字をそのまま展開された子オブジェクトとする
        else if ( 0 == this.caret.x ) {
          this.appendObject( ( new ChildText() ).initialize( null, null, this._trimFirstSpace( chunk ) ) );
          layout_text = layout_text.slice( chunk.length );
          chunk = "";
          confirmed_chunk = "";
        }
        // 改行
        this._layoutLineBreak();
      }

      // 行に収まることが解ったところまで保持する
      confirmed_chunk = chunk;
    }

    if ( 0 < chunk.length ) this.appendObject( ( new ChildText() ).initialize( null, null, this._trimFirstSpace( chunk ) ) );

    // 展開された子オブジュクトを返す
    return this.children;
  };

  //--------------------------------------
  // 描画
  //--------------------------------------
  Text.prototype.draw = function( context, offsetx, offsety ){
    ;
  };

  //--------------------------------------
  // ウィンドウサイズ変更イベント
  //--------------------------------------
  Text.prototype.reload = function(){
    this._removeExpandChild();
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Text();
