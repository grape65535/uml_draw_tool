/*------------------------------------------------------------------------------
  レイアウタ
    継承関係： Layouter -> Style -> DomShape -> DomRelation
------------------------------------------------------------------------------*/
function Layouter(){
  Layouter.prototype = Object.create( Style.prototype );

  //--------------------------------------
  // 横幅をスタイル相対値から絶対値に変換する
  //--------------------------------------
  Layouter.prototype._relativeToAbsoluteWidth = function( parent_caret ){
    parent_caret = parent_caret || null;

    // 数値の時はそのまま返す
    if ( this._isStyleNumber( this.style.width ) ) {
      return this.style.width;
    }
    // 相対値なら親が存在する必要がある
    else if ( this.parent ) {
      // 親のマージン、ボーダー、パディングのサイズを省いたサイズに大して比率を求めたいので、ここで減算用の値を計算しておく
      var outer_size =  this.parent.style.margin[1] + this.parent.style.border_width[1] + this.parent.style.padding[1] +
                        this.parent.style.margin[3] + this.parent.style.border_width[3] + this.parent.style.padding[3]

      // ％値の時
      if ( this._isStyleRateNumber( this.style.width ) ) {
        return Math.floor( ( this.parent._relativeToAbsoluteWidth() - outer_size ) * this._parseStyleRateNumber( this.style.width ) );
      }
      // autoは100%とみなす
      else if ( "auto" == this.style.width || "max-content" == this.style.width ) {
        return this.parent._relativeToAbsoluteWidth() - outer_size;
      }
      // remainingはwidthが確定しているので、そのままサイズを渡す
      else if ( "remaining" == this.style.width  ) {
        if ( parent_caret ) {
          var tmp = ( this.parent.inlineWidth() - parent_caret.x );
          return ( 0 < tmp ? tmp : 0 );
        }
        else {
          return this.width;
        }
      }
    }
    else {
      return 0;
    }
  };

  //--------------------------------------
  // 縦幅をスタイル相対値から絶対値に変換する
  //--------------------------------------
  Layouter.prototype._relativeToAbsoluteHeight = function( parent_caret ){
    parent_caret = parent_caret || null;

    // 数値の時はそのまま返す
    if ( this._isStyleNumber( this.style.height ) ) {
      return this.style.height;
    }
    // 相対値なら親が存在する必要がある
    else if ( this.parent ) {
      // 親のマージン、ボーダー、パディングのサイズを省いたサイズに大して比率を求めたいので、ここで減算用の値を計算しておく
      var outer_size =  this.parent.style.margin[0] + this.parent.style.border_width[0] + this.parent.style.padding[0] +
                        this.parent.style.margin[2] + this.parent.style.border_width[2] + this.parent.style.padding[2]

      // ％値の時
      if ( this._isStyleRateNumber( this.style.height ) ) {
        return Math.floor( ( this.parent._relativeToAbsoluteHeight() - outer_size ) * this._parseStyleRateNumber( this.style.height ) );
      }
      // autoは100%とみなす
      else if ( "auto" == this.style.height || "max-content" == this.style.height ) {
        return this.parent._relativeToAbsoluteHeight() - outer_size;
      }
      // remainingはwidthが確定しているので、そのままサイズを渡す
      else if ( "remaining" == this.style.height  ) {
        if ( parent_caret ) {
          var tmp = ( this.parent.inlineheight() - parent_caret.y );
          return ( 0 < tmp ? tmp : 0 );
        }
        else {
          return this.height;
        }
      }
    }
    else {
      return 0;
    }
  };

  //--------------------------------------
  // Y座標をスタイル相対値から絶対値に変換する
  //--------------------------------------
  Layouter.prototype._relativeToAbsoluteTop = function(){
    if ( this._isStyleRateNumber( this.style.top ) ) {
      return this.parent._relativeToAbsoluteHeight() * this._parseStyleRateNumber( this.style.top )
    }
    else if ( "auto" != this.style.top ) {
      return this.style.top;
    }

    return 0;
  };

  //--------------------------------------
  // Y座標をスタイル相対値から絶対値に変換する
  //--------------------------------------
  Layouter.prototype._relativeToAbsoluteLeft = function(){
    if ( this._isStyleRateNumber( this.style.left ) ) {
      return this.parent._relativeToAbsoluteHeight() * this._parseStyleRateNumber( this.style.left )
    }
    else if ( "auto" != this.style.left ) {
      return this.style.left;
    }

    return 0;
  };

  //--------------------------------------
  // レイアウト情報初期化
  //--------------------------------------
  Layouter.prototype._initializeLayout = function(){
    this.line_width = 0;
    this.line_height = 0;
    this._initializeCaret();
  };

  //--------------------------------------
  // キャレット情報初期化
  //--------------------------------------
  Layouter.prototype._initializeCaret = function(){
    this.caret = {
      line: [],
      offset_x: this.style.margin[3] + this.style.border_width[3] + this.style.padding[3],
      offset_y: this.style.margin[0] + this.style.border_width[0] + this.style.padding[0],
      x: 0,
      y: 0,
      // 行の幅・高さ
      line_width: 0,
      line_height: 0,
    };
    // コンテンツ部分の幅・高さ
    this.content_width  = 0;
    this.content_height = 0;
  };

  //--------------------------------------
  // 改行レイアウト
  //--------------------------------------
  Layouter.prototype._layoutLineBreak = function( style ){
    // 行内のオブジェクトに行のコンテンツ幅と高さを設定
    for ( var i=0; i<this.caret.line.length; i++ ) {
      this.caret.line[i].line_width = this.caret.line_width;
      this.caret.line[i].line_height = this.caret.line_height;
    }
    // 次行のための初期化
    if ( this.content_width < this.caret.line_width ) this.content_width = this.caret.line_width;
    this.content_height += this.caret.line_height;
    this.caret.y += this.caret.line_height;
    this.caret.x = 0;
    this.caret.line_width = 0;
    this.caret.line_height = 0;
    this.caret.line = [];
  };

  //--------------------------------------
  // アライメントのレイアウト
  //--------------------------------------
  Layouter.prototype._layoutAlign = function(){
    for ( var i=0; i<this.children.length; i++ ) {
      if ( this.children[i].style.position == "absolute" ) continue;

      // 縦方向のアライン
      switch( this.children[i].style.vertical_align ){
      case "middle":
        this.children[i].y += Math.floor( ( this.children[i].line_height - this.children[i].height ) / 2 );
        break;

      case "bottom":
        this.children[i].y += ( this.children[i].line_height - this.children[i].height );
        break;
      }

      // 横方向のアライン
      switch( this.style.text_align ) {
      case "right":
        this.children[i].x += ( this.inlineWidth() - this.children[i].line_width );
        break;

      case "center":
        this.children[i].x += Math.floor( ( this.inlineWidth() - this.children[i].line_width ) / 2 );
        break;
      }

      // 縦幅配置
      if (
         ( "stretch" == this.children[i].style.align_self )
      || ( "auto" == this.children[i].style.align_self && "stretch" == this.style.align_items )
      ) {
        this.children[i].height = this.children[i].line_height;
      }
    }
  };

  //--------------------------------------
  // レイアウトの実行
  //--------------------------------------
  Layouter.prototype.layout = function( parent_caret ){
    if ( "none" == this.style.display ) return;

    // キャレット位置の初期化
    this._initializeCaret();

    // 幅と高さの仮値を設定
    this.width = this._relativeToAbsoluteWidth( parent_caret );
    this.height = this._relativeToAbsoluteHeight( parent_caret );

    // レイアウト
    for ( var i=0; i<this.children.length; i++ ) {
      if ( "none" == this.children[i].style.display ) continue;

      // 先に子のレイアウト
      var expand_child = this.children[i].layout( this.caret );
      // 展開するオブジェクトがあった場合にはレイアウト対象として挿入する
      if ( expand_child && 0 < expand_child.length ) {
        this.children.splice( i, 1, ...( [ this.children[i] ].concat( expand_child ) ) );
      }

      // 固定レイアウトなら座標を確定後にスキップ
      if ( this.children[i].style.position != "relative" ) {
        this.children[i].x = this.children[i]._relativeToAbsoluteLeft();
        this.children[i].y = this.children[i]._relativeToAbsoluteTop();
        continue;
      }

      // 子のサイズ取得
      var size = {
        width: this.children[i].width,
        height: this.children[i].height,
      };

      // 行内に収まらないのなら改行
      if ( 0 == this.caret.x && this.children[i].objectName() == "Break" ) {
        this.caret.line_height = Math.max( this.style.font_size, this.style.line_height );
      }
      // （横幅がmax-contentの時はコンテンツ幅に合わせるので、幅超過による改行はしない）
      if ( 0 < this.caret.x && ( this.children[i].style.display == "block" || ( "max-content" != this.style.width && this.inlineWidth() < this.caret.x + size.width ) ) ) {
        this._layoutLineBreak();
      }

      // 配置
      this.children[i].x = this.caret.x;
      this.children[i].y = this.caret.y;

      // キャレット位置の更新
      this.caret.x += size.width;
      this.caret.line_width += size.width;
      if ( this.caret.line_height < size.height ) this.caret.line_height = size.height;
      this.caret.line.push( this.children[i] );

      // ブロック要素なら改行
      if ( this.children[i].style.display == "block" ) {
        this._layoutLineBreak();
      }
    }

    if ( 0 < this.caret.x ) this._layoutLineBreak();

    // インライン・インラインブロック・absoluteオブジェクトでwidthがautoまたはmax-contentの時、あるいはブロックでwidthがmax-contentの時は、コンテンツ幅をオブジェクト幅とする
    if (
       ( ( this.style.display == "inline" || this.style.display == "inline-block" || this.style.position != "relative" ) && ( this.style.width == "auto" || this.style.width == "max-content" ) )
    || ( this.style.display == "block" && this.style.width == "max-content" )
    ) {
      this.width = 
        this.pageWidth() + 
        this.style.margin[1] + this.style.margin[3] + 
        this.style.border_width[1] + this.style.border_width[3];
    }
    // heightがautoかmax-contentの時は、コンテンツ高をオブジェクトの高さにする
    if ( this.style.height == "auto" || this.style.height == "max-content" ) {
      this.height = 
        this.pageHeight() + 
        this.style.margin[0] + this.style.margin[2] + 
        this.style.border_width[0] + this.style.border_width[2];
    }

    // アライメントを設定する
    this._layoutAlign();

    // 最上位ボックスの時は、内部のpositioin:absoluteのレイアウトによるページ高さの補正を行う
    if ( ! this.parent ) {
      // 最も下位置のposiiton:absoluteを探す
      var most_far_position = this.mostFarAbsolutePosition( 0 );
      if ( this.width < most_far_position.x ) this.width = most_far_position.x;
      if ( this.height < most_far_position.y ) this.height = most_far_position.y;
    }

    // 展開するオブジェクトは無いのでnullを返す
    return null;
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Layouter();
