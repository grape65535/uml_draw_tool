/*------------------------------------------------------------------------------
  プレゼンター（基本的なBOX描画）
    継承関係： Presenter -> Layouter -> Style -> DomShape -> DomRelation
------------------------------------------------------------------------------*/
function Presenter(){
  Presenter.prototype = Object.create( Layouter.prototype );

  //--------------------------------------
  // 描画可能？
  //--------------------------------------
  Presenter.prototype._isDisplayable = function(){
    return ( "none" == this.style.display ? false : true );
  };

  //--------------------------------------
  // position:absoluteオブジェクトを集める
  //--------------------------------------
  Presenter.prototype._findRecursionAbsoluteObjects = function( offsetx, offsety ){
    if ( ! this._isDisplayable() ) return [];

    var absolute_objects = [];
    switch( this.style.position ){
    case "relative":
      break;

    case "absolute":
      absolute_objects.push({
        object: this,
        offsetx: offsetx,
        offsety: offsety,
        z_index: this.style.z_index
      });
      break;

    case "fixed":
      absolute_objects.push({
        object: this,
        offsetx: 0,
        offsety: 0,
        z_index: this.style.z_index
      });
      offsetx = 0;
      offsety = 0;
      break;

    default:
      return [];
    }

    // 子を探索
    var padding_inline_rect = this.paddingInlineRect();
    for ( var i=0; i<this.children.length; i++ ) {
      var tmp = this.children[i]._findRecursionAbsoluteObjects(
        offsetx + padding_inline_rect.x - this.scroll_x,
        offsety + padding_inline_rect.y - this.scroll_y
      );
      if ( tmp ) {
        absolute_objects = absolute_objects.concat( tmp );
      }
    }

    return absolute_objects;
  };

  //--------------------------------------
  // 枠線の外側の座標取得
  //--------------------------------------
  Presenter.prototype._borderPositions = function(){
    // 枠線の幅と高さを計算（負のサイズは半径計算で負の半径を生み描画エラーになるため0でクランプする）
    var border = {
      width:  Math.max( 0, this.width - ( this.style.margin[1] + this.style.margin[3] ) ),
      height: Math.max( 0, this.height - ( this.style.margin[0] + this.style.margin[2] ) ),
    };
    // 枠線の半分のサイズを計算
    var half_border = {
      width:  Math.floor( border.width / 2 ),
      height: Math.floor( border.height / 2 ),
    };

    // border_raidusの実サイズを計算
    var border_radius = {
      top_left: {
        width:  Math.min( this.style.border_radius[0][0], half_border.width ),
        height: Math.min( this.style.border_radius[0][1], half_border.height ),
      },
      top_right: {
        width:  Math.min( this.style.border_radius[1][0], half_border.width ),
        height: Math.min( this.style.border_radius[1][1], half_border.height ),
      },
      bottom_right: {
        width:  Math.min( this.style.border_radius[2][0], half_border.width ),
        height: Math.min( this.style.border_radius[2][1], half_border.height ),
      },
      bottom_left: {
        width:  Math.min( this.style.border_radius[3][0], half_border.width ),
        height: Math.min( this.style.border_radius[3][1], half_border.height ),
      },
    };
    // border_radiusの縦横比が同じ時は、より小さい方を優先する
    if ( this.style.border_radius[0][0] == this.style.border_radius[0][1] ) {
      var min = Math.min( border_radius.top_left.width, border_radius.top_left.height );
      border_radius.top_left.width  = min;
      border_radius.top_left.height = min;
    }
    if ( this.style.border_radius[1][0] == this.style.border_radius[1][1] ) {
      var min = Math.min( border_radius.top_right.width, border_radius.top_right.height );
      border_radius.top_right.width  = min;
      border_radius.top_right.height = min;
    }
    if ( this.style.border_radius[2][0] == this.style.border_radius[2][1] ) {
      var min = Math.min( border_radius.bottom_right.width, border_radius.bottom_right.height );
      border_radius.bottom_right.width  = min;
      border_radius.bottom_right.height = min;
    }
    if ( this.style.border_radius[3][0] == this.style.border_radius[3][1] ) {
      var min = Math.min( border_radius.bottom_left.width, border_radius.bottom_left.height );
      border_radius.bottom_left.width  = min;
      border_radius.bottom_left.height = min;
    }

    border_radius = {
      // 外側の半径
      outer: border_radius,
      // 内側の半径
      inner: {
        top_left: {
          width:  Math.max( border_radius.top_left.width - this.style.border_width[3], 0 ),
          height: Math.max( border_radius.top_left.height - this.style.border_width[0], 0 ),
        },
        top_right: {
          width:  Math.max( border_radius.top_right.width - this.style.border_width[1], 0 ),
          height: Math.max( border_radius.top_right.height - this.style.border_width[0], 0 ),
        },
        bottom_right: {
          width:  Math.max( border_radius.bottom_right.width - this.style.border_width[1], 0 ),
          height: Math.max( border_radius.bottom_right.height - this.style.border_width[2], 0 ),
        },
        bottom_left: {
          width:  Math.max( border_radius.bottom_left.width - this.style.border_width[3], 0 ),
          height: Math.max( border_radius.bottom_left.height - this.style.border_width[2], 0 ),
        },
      },
    };

    // 基本になる四隅の座標を計算
    var base_positions = {
      outer: {
        top_left: {
          x: this.x + this.style.margin[3],
          y: this.y + this.style.margin[0],
        },
        top_right: {
          x: this.x + this.width - this.style.margin[1],
          y: this.y + this.style.margin[0],
        },
        bottom_right: {
          x: this.x + this.width - this.style.margin[1],
          y: this.y + this.height - this.style.margin[2],
        },
        bottom_left: {
          x: this.x + this.style.margin[3],
          y: this.y + this.height - this.style.margin[2],
        },
      },  
      inner: {
        top_left: {
          x: this.x + this.style.margin[3] + this.style.border_width[3],
          y: this.y + this.style.margin[0] + this.style.border_width[0],
        },
        top_right: {
          x: this.x + this.width - ( this.style.margin[1] + this.style.border_width[1] ),
          y: this.y + this.style.margin[0] + this.style.border_width[0],
        },
        bottom_right: {
          x: this.x + this.width - ( this.style.margin[1] + this.style.border_width[1] ),
          y: this.y + this.height - ( this.style.margin[2] + this.style.border_width[2] ),
        },
        bottom_left: {
          x: this.x + this.style.margin[3] + this.style.border_width[3],
          y: this.y + this.height - ( this.style.margin[2] + this.style.border_width[2] ),
        },
      },
    };

    // 各種座標を計算して返す
    return {
      // 四隅の角丸と接する直線の座標
      outer: {
        top: {
          left: {
            x: base_positions.outer.top_left.x + border_radius.outer.top_left.width,
            y: base_positions.outer.top_left.y,
          },
          right: {
            x: base_positions.outer.top_right.x - border_radius.outer.top_right.width,
            y: base_positions.outer.top_right.y,
          },
        },
        right: {
          top: {
            x: base_positions.outer.top_right.x,
            y: base_positions.outer.top_right.y + border_radius.outer.top_right.height,
          },
          bottom: {
            x: base_positions.outer.bottom_right.x,
            y: base_positions.outer.bottom_right.y - border_radius.outer.bottom_right.height,
          }
        },
        bottom: {
          left: {
            x: base_positions.outer.bottom_left.x + border_radius.outer.bottom_left.width,
            y: base_positions.outer.bottom_left.y,
          },
          right: {
            x: base_positions.outer.bottom_right.x - border_radius.outer.bottom_right.width,
            y: base_positions.outer.bottom_right.y,
          },
        },
        left: {
          top: {
            x: base_positions.outer.top_left.x,
            y: base_positions.outer.top_left.y + border_radius.outer.top_left.height,
          },
          bottom: {
            x: base_positions.outer.bottom_left.x,
            y: base_positions.outer.bottom_left.y - border_radius.outer.bottom_left.height,
          }
        },
      },
      inner: {
        top: {
          left: {
            x: base_positions.inner.top_left.x + border_radius.inner.top_left.width,
            y: base_positions.inner.top_left.y,
          },
          right: {
            x: base_positions.inner.top_right.x - border_radius.inner.top_right.width,
            y: base_positions.inner.top_right.y,
          },
        },
        right: {
          top: {
            x: base_positions.inner.top_right.x,
            y: base_positions.inner.top_right.y + border_radius.inner.top_right.height,
          },
          bottom: {
            x: base_positions.inner.bottom_right.x,
            y: base_positions.inner.bottom_right.y - border_radius.inner.bottom_right.height,
          }
        },
        bottom: {
          left: {
            x: base_positions.inner.bottom_left.x + border_radius.inner.bottom_left.width,
            y: base_positions.inner.bottom_left.y,
          },
          right: {
            x: base_positions.inner.bottom_right.x - border_radius.inner.bottom_right.width,
            y: base_positions.inner.bottom_right.y,
          },
        },
        left: {
          top: {
            x: base_positions.inner.top_left.x,
            y: base_positions.inner.top_left.y + border_radius.inner.top_left.height,
          },
          bottom: {
            x: base_positions.inner.bottom_left.x,
            y: base_positions.inner.bottom_left.y - border_radius.inner.bottom_left.height,
          }
        },
      },
      // 枠線の角丸に関する座標
      radius: {
        // 角丸のサイズ
        size: border_radius,
        // 四隅の角丸の中心点になる座標を計算
        center: {
          top_left: {
            x: base_positions.outer.top_left.x + border_radius.outer.top_left.width,
            y: base_positions.outer.top_left.y + border_radius.outer.top_left.height,
          },
          top_right: {
            x: base_positions.outer.top_right.x - border_radius.outer.top_right.width,
            y: base_positions.outer.top_right.y + border_radius.outer.top_right.height,
          },
          bottom_right: {
            x: base_positions.outer.bottom_right.x - border_radius.outer.bottom_right.width,
            y: base_positions.outer.bottom_right.y - border_radius.outer.bottom_right.height,
          },
          bottom_left: {
            x: base_positions.outer.bottom_left.x + border_radius.outer.bottom_left.width,
            y: base_positions.outer.bottom_left.y - border_radius.outer.bottom_left.height,
          },
        },
      }
    };
  };

  //--------------------------------------
  // 背景画像の描画サイズを取得する
  //--------------------------------------
  Presenter.prototype._getDrawBackgroundImageSize = function( image_data ){
    var dsp_width = image_data.trim.width;
    var dsp_height = image_data.trim.height;
    if ( "auto" != this.style.background_size ) {
      var dsp_width_rate = this.width / dsp_width;
      var dsp_height_rate = this.height / dsp_height;
      switch( this.style.background_size ){
      // 全体が収まるサイズにする
      case "contain":
        // 画像幅＝描画幅にした時、縦幅は画面内に収まる？
        if ( dsp_height * dsp_width_rate <= this.height ) {
          dsp_width = Math.floor( dsp_width * dsp_width_rate );
          dsp_height = Math.floor( dsp_height * dsp_width_rate );
        }
        // 画面に収まらないならば、画像縦幅＝描画縦幅にする
        else {
          dsp_width = Math.floor( dsp_width * dsp_height_rate );
          dsp_height = Math.floor( dsp_height * dsp_height_rate );
        }
        break;

      // 描画領域全体を画像で埋め尽くせるサイズにする
      case "cover":
        // 画像幅＝描画幅にした時、縦幅は画面内に収まらない？
        if ( dsp_height * dsp_width_rate > this.height ) {
          dsp_width = Math.floor( dsp_width * dsp_width_rate );
          dsp_height = Math.floor( dsp_height * dsp_width_rate );
        }
        // 画面に収まるならば、画像縦幅＝描画縦幅にする
        else {
          dsp_width = Math.floor( dsp_width * dsp_height_rate );
          dsp_height = Math.floor( dsp_height * dsp_height_rate );
        }
        break;

      }
    }

    return {
      width: dsp_width,
      height: dsp_height,
    };
  };

  //--------------------------------------
  // 背景画像の描画位置を計算する
  //--------------------------------------
  Presenter.prototype._getDrawBackgroundImagePosition = function( image_data, border_inline_rect, draw_background_image_size ){
    // 最初にno-repeat時の配置座標を計算しておく
    var org_x = this.style.background_position[0];
    if ( "string" == typeof org_x ) {
      var rate = parseInt( org_x.slice(0,org_x.length-1) ) / 100.0;
      org_x = Math.floor( ( border_inline_rect.width - draw_background_image_size.width ) * rate );
    }
    var org_y = this.style.background_position[1];
    if ( "string" == typeof org_y ) {
      var rate = parseInt( org_y.slice(0,org_y.length-1) ) / 100.0;
      org_y = Math.floor( ( border_inline_rect.height - draw_background_image_size.height ) * rate );
    }

    // repeat時の繰り返しの開始位置を計算
    var start_x = org_x % draw_background_image_size.width;
    if ( 0 < start_x ) start_x -= draw_background_image_size.width;
    var start_y = org_y % draw_background_image_size.height;
    if ( 0 < start_y ) start_y -= draw_background_image_size.height;

    return {
      x: org_x,
      y: org_y,
      start_x: start_x,
      start_y: start_y
    }
  };

  //--------------------------------------
  // コンテンツ描画（クリップ済）
  //--------------------------------------
  Presenter.prototype._drawInnerContents = function( context, offsetx, offsety, is_draw_everything ){
    is_draw_everything = is_draw_everything || false;

    // パディングの内側の矩形を取得
    var padding_inline_rect = this.paddingInlineRect();

    for ( var i=0; i<this.children.length; i++ ) {
      if ( ! this.children[i]._isDisplayable() ) continue;
      // relative以外ならば、後でまとめて描画するのでスキップする
      if ( ! is_draw_everything && "relative" != this.children[i].style.position ) continue;
      // 現在のオブジェクトのpaddingの内側＋スクロール後の位置を起点とした座標で子を描画
      this.children[i].draw(
        context,
        offsetx + padding_inline_rect.x - this.scroll_x,
        offsety + padding_inline_rect.y - this.scroll_y
      );
    }
  };

  //--------------------------------------
  // スクロール位置などから描画される位置にオブジェクトが存在するか？
  //--------------------------------------
  Presenter.prototype.isDisplayed = function(){
    if ( "none" == this.style.display ) return false;

    var seek_parent = this.parent;
    var position = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
    while ( null != seek_parent ) {
      if ( "none" == seek_parent.style.display ) return false;

      // スクロール位置の座標補正
      position.x -= seek_parent.scrollLeft();
      position.y -= seek_parent.scrollTop();
      // 親の描画範囲外ならば、描画範囲外として即時終了
      var border_inline = seek_parent.borderInlineRect();
      if (
         ( -seek_parent.style.padding[3] > position.x || position.x + position.width > border_inline.width )
      || ( -seek_parent.style.padding[0] > position.y || position.y + position.height > border_inline.height )
      ) {
        return false;
      }

      // 親の起点座標に直す
      position.x += seek_parent.x;
      position.y += seek_parent.y;

      // 更に親のチェック
      seek_parent = seek_parent.parent;
    }
    // ループを抜けたら、全ての子孫までチェックしても描画範囲内だったとみなす
    return true;
  };

  //--------------------------------------
  // position:relative以外のオブジェクトの取得
  //--------------------------------------
  Presenter.prototype.findAbsoluteObjects = function( offsetx, offsety ){
    // position:absoluteのオブジェクトを集める
    var absolute_objects = this._findRecursionAbsoluteObjects( offsetx, offsety );
    // z_indexの昇順ソート
    absolute_objects.sort( function( a, b ){ return a.z_index - b.z_index; } );

    return absolute_objects;
  };
  
  //--------------------------------------
  // 背景色の取得
  //--------------------------------------
  Presenter.prototype.getDrawBackgroundColor = function(){
    return this.getColor( ( this.focused ? this.style.focus_background_color : null ) || this.style.background_color );
  };

  //--------------------------------------
  // 文字色の取得
  //--------------------------------------
  Presenter.prototype.getDrawColor = function(){
    // 実行不可（グレーアウト）のオブジェクト内の文字は灰色で描画する
    if ( this.isDisabledByAncestor() ) return this.getColor( "system-disabled-text" );
    return this.getColor( ( this.focused ? this.style.focus_color : null ) || this.style.color );
  };

  //--------------------------------------
  // 自身または祖先が実行不可（グレーアウト）状態？
  //--------------------------------------
  Presenter.prototype.isDisabledByAncestor = function(){
    for ( var object = this; object; object = object.parent ) {
      if ( object.disabled ) return true;
    }
    return false;
  };

  //--------------------------------------
  // ボーダー色の取得
  //--------------------------------------
  Presenter.prototype.getDrawBorderColor = function(){
    var draw_border_color = [];
    for ( var i=0; i<4; i++ ) {
      draw_border_color[i] = this.getColor( ( this.focused ? this.style.focus_border_color[i] : null ) || this.style.border_color[i] );
    }
    return draw_border_color;
  };

  //--------------------------------------
  // 背景描画
  //--------------------------------------
  Presenter.prototype.drawBackground = function( context, offsetx, offsety ){
    var border_inline_rect = this.borderInlineRect();

    // 背景色の描画
    var color = this.getDrawBackgroundColor();
    if ( color ) {
      drawRect(
        context,
        offsetx + border_inline_rect.x,
        offsety + border_inline_rect.y,
        border_inline_rect.width,
        border_inline_rect.height,
        color,
        true
      );
    }

    // 背景画像の描画
    if ( this.image_manager && this.style.background_image_handle_name ) {
      var image_data = this.image_manager.getImagedata( this.style.background_image_handle_name );
      if ( image_data ) {
        // 描画時の縮尺を計算する
        var draw_background_image_size = this._getDrawBackgroundImageSize( image_data );
        // 描画位置を計算する
        var draw_background_image_position = this._getDrawBackgroundImagePosition( image_data, border_inline_rect, draw_background_image_size )

        // 繰り返し描画（no-repeatの場合も、繰り返し処理の中で描画させる）
        var x = draw_background_image_position.start_x;
        var y = draw_background_image_position.start_y;
        while ( y < border_inline_rect.height ) {
          // repeatか、no-repeatにおける描画位置のどちらかの時に描画
          if (
             ( x == draw_background_image_position.x || "repeat" == this.style.background_repeat[0] )
          && ( y == draw_background_image_position.y || "repeat" == this.style.background_repeat[1] )
          ) {
            drawScaleImage(
              context,
              image_data,
              offsetx + border_inline_rect.x + x,
              offsety + border_inline_rect.y + y,
              draw_background_image_size.width,
              draw_background_image_size.height
            );    
          }

          x += draw_background_image_size.width;
          if ( x > border_inline_rect.width ) {
            x = draw_background_image_position.start_x;
            y += draw_background_image_size.height;
          }
        }
      }
    }

  };

  //--------------------------------------
  // コンテンツ描画
  //--------------------------------------
  Presenter.prototype.drawContents = function( context, offsetx, offsety, is_draw_everything ){
    // 子オブジェクトの描画
    is_draw_everything = is_draw_everything || false;
    this._drawInnerContents( context, offsetx, offsety, is_draw_everything );
  };

  //--------------------------------------
  // ボーダー描画
  //--------------------------------------
  Presenter.prototype.drawBorder = function( context, offsetx, offsety ){
    var color = this.getDrawBorderColor();

    // 枠線に関する各座標を取得する
    var positions = this._borderPositions();

    // 枠線上の描画
    if ( color[0] && this.style.border_width[0] > 0 ) {
      drawShape( context, function(){
        // 外側
        context.ellipse( offsetx + positions.radius.center.top_left.x,  offsety + positions.radius.center.top_left.y, positions.radius.size.outer.top_left.width, positions.radius.size.outer.top_left.height, 0, ( 225 * RADIAN ), ( 270 * RADIAN ) );
        context.lineTo(  offsetx + positions.outer.top.left.x,          offsety + positions.outer.top.left.y );
        context.lineTo(  offsetx + positions.outer.top.right.x,         offsety + positions.outer.top.right.y );
        context.ellipse( offsetx + positions.radius.center.top_right.x, offsety + positions.radius.center.top_right.y, positions.radius.size.outer.top_right.width, positions.radius.size.outer.top_right.height, 0, ( 270 * RADIAN ), ( 315 * RADIAN ) );
        // 内側
        context.ellipse( offsetx + positions.radius.center.top_right.x, offsety + positions.radius.center.top_right.y, positions.radius.size.inner.top_right.width, positions.radius.size.inner.top_right.height, 0, ( 315 * RADIAN ), ( 270 * RADIAN ), true );
        context.lineTo(  offsetx + positions.inner.top.right.x,         offsety + positions.inner.top.right.y );
        context.lineTo(  offsetx + positions.inner.top.left.x,          offsety + positions.inner.top.left.y );
        context.ellipse( offsetx + positions.radius.center.top_left.x,  offsety + positions.radius.center.top_left.y, positions.radius.size.inner.top_left.width, positions.radius.size.inner.top_left.height, 0, ( 270 * RADIAN ), ( 225 * RADIAN ), true );
      }, color[0], true );
    }
    // 枠線右の描画
    if ( color[1] && this.style.border_width[1] > 0 ) {
      drawShape( context, function(){
        // 外側
        context.ellipse( offsetx + positions.radius.center.top_right.x,    offsety + positions.radius.center.top_right.y, positions.radius.size.outer.top_right.width, positions.radius.size.outer.top_right.height, 0, ( 315 * RADIAN ), ( 0 * RADIAN ) );
        context.lineTo(  offsetx + positions.outer.right.top.x,            offsety + positions.outer.right.top.y );
        context.lineTo(  offsetx + positions.outer.right.bottom.x,         offsety + positions.outer.right.bottom.y );
        context.ellipse( offsetx + positions.radius.center.bottom_right.x, offsety + positions.radius.center.bottom_right.y, positions.radius.size.outer.bottom_right.width, positions.radius.size.outer.bottom_right.height, 0, ( 0 * RADIAN ), ( 45 * RADIAN ) );
        // 内側
        context.ellipse( offsetx + positions.radius.center.bottom_right.x, offsety + positions.radius.center.bottom_right.y, positions.radius.size.inner.bottom_right.width, positions.radius.size.inner.bottom_right.height, 0, ( 45 * RADIAN ), ( 0 * RADIAN ), true );
        context.lineTo(  offsetx + positions.inner.right.bottom.x,         offsety + positions.inner.right.bottom.y );
        context.lineTo(  offsetx + positions.inner.right.top.x,            offsety + positions.inner.right.top.y );
        context.ellipse( offsetx + positions.radius.center.top_right.x,    offsety + positions.radius.center.top_right.y, positions.radius.size.inner.top_right.width, positions.radius.size.inner.top_right.height, 0, ( 0 * RADIAN ), ( 315 * RADIAN ), true );
      }, color[1], true );
    }
    // 枠線下の描画
    if ( color[2] && this.style.border_width[2] > 0 ) {
      drawShape( context, function(){
        // 外側
        context.ellipse( offsetx + positions.radius.center.bottom_right.x, offsety + positions.radius.center.bottom_right.y, positions.radius.size.outer.bottom_right.width, positions.radius.size.outer.bottom_right.height, 0, ( 45 * RADIAN ), ( 90 * RADIAN ) );
        context.lineTo(  offsetx + positions.outer.bottom.right.x,         offsety + positions.outer.bottom.right.y );
        context.lineTo(  offsetx + positions.outer.bottom.left.x,          offsety + positions.outer.bottom.left.y );
        context.ellipse( offsetx + positions.radius.center.bottom_left.x,  offsety + positions.radius.center.bottom_left.y, positions.radius.size.outer.bottom_left.width, positions.radius.size.outer.bottom_left.height, 0, ( 90 * RADIAN ), ( 135 * RADIAN ) );
        // 内側
        context.ellipse( offsetx + positions.radius.center.bottom_left.x,  offsety + positions.radius.center.bottom_left.y, positions.radius.size.inner.bottom_left.width, positions.radius.size.inner.bottom_left.height, 0, ( 135 * RADIAN ), ( 90 * RADIAN ), true );
        context.lineTo(  offsetx + positions.inner.bottom.left.x,          offsety + positions.inner.bottom.left.y );
        context.lineTo(  offsetx + positions.inner.bottom.right.x,         offsety + positions.inner.bottom.right.y );
        context.ellipse( offsetx + positions.radius.center.bottom_right.x, offsety + positions.radius.center.bottom_right.y, positions.radius.size.inner.bottom_right.width, positions.radius.size.inner.bottom_right.height, 0, ( 90 * RADIAN ), ( 45 * RADIAN ), true );
      }, color[2], true );
    }
    // 枠線左の描画
    if ( color[3] && this.style.border_width[3] > 0 ) {
      drawShape( context, function(){
        // 外側
        context.ellipse( offsetx + positions.radius.center.bottom_left.x, offsety + positions.radius.center.bottom_left.y, positions.radius.size.outer.bottom_left.width, positions.radius.size.outer.bottom_left.height, 0, ( 135 * RADIAN ), ( 180 * RADIAN ) );
        context.lineTo(  offsetx + positions.outer.left.bottom.x,         offsety + positions.outer.left.bottom.y );
        context.lineTo(  offsetx + positions.outer.left.top.x,            offsety + positions.outer.left.top.y );
        context.ellipse( offsetx + positions.radius.center.top_left.x,    offsety + positions.radius.center.top_left.y, positions.radius.size.outer.top_left.width, positions.radius.size.outer.top_left.height, 0, ( 180 * RADIAN ), ( 225 * RADIAN ) );
        // 内側
        context.ellipse( offsetx + positions.radius.center.top_left.x,    offsety + positions.radius.center.top_left.y, positions.radius.size.inner.top_left.width, positions.radius.size.inner.top_left.height, 0, ( 225 * RADIAN ), ( 180 * RADIAN ), true );
        context.lineTo(  offsetx + positions.inner.left.top.x,            offsety + positions.inner.left.top.y );
        context.lineTo(  offsetx + positions.inner.left.bottom.x,         offsety + positions.inner.left.bottom.y );
        context.ellipse( offsetx + positions.radius.center.bottom_left.x, offsety + positions.radius.center.bottom_left.y, positions.radius.size.inner.bottom_left.width, positions.radius.size.inner.bottom_left.height, 0, ( 180 * RADIAN ), ( 135 * RADIAN ), true );
      }, color[3], true );
    }

  };

  //--------------------------------------
  // 描画
  //--------------------------------------
  Presenter.prototype.draw = function( context, offsetx, offsety, is_draw_everything ){
    if ( "none" == this.style.display ) return;
    is_draw_everything = is_draw_everything || false;

    // ボーダー描画
    this.drawBorder( context, offsetx, offsety );

    // 枠線に関する各座標を取得する
    var positions = this._borderPositions();

    clipShape(
      context,
      function(){
        context.ellipse( offsetx + positions.radius.center.top_left.x,     offsety + positions.radius.center.top_left.y, positions.radius.size.inner.top_left.width, positions.radius.size.inner.top_left.height, 0, ( 180 * RADIAN ), ( 270 * RADIAN ) );
        context.lineTo(  offsetx + positions.inner.top.left.x,             offsety + positions.inner.top.left.y );
        context.lineTo(  offsetx + positions.inner.top.right.x,            offsety + positions.inner.top.right.y );
        context.ellipse( offsetx + positions.radius.center.top_right.x,    offsety + positions.radius.center.top_right.y, positions.radius.size.inner.top_right.width, positions.radius.size.inner.top_right.height, 0, ( 270 * RADIAN ), ( 0 * RADIAN ) );
        context.lineTo(  offsetx + positions.inner.right.top.x,            offsety + positions.inner.right.top.y );
        context.lineTo(  offsetx + positions.inner.right.bottom.x,         offsety + positions.inner.right.bottom.y );
        context.ellipse( offsetx + positions.radius.center.bottom_right.x, offsety + positions.radius.center.bottom_right.y, positions.radius.size.inner.bottom_right.width, positions.radius.size.inner.bottom_right.height, 0, ( 0 * RADIAN ), ( 90 * RADIAN ) );
        context.lineTo(  offsetx + positions.inner.bottom.right.x,         offsety + positions.inner.bottom.right.y );
        context.lineTo(  offsetx + positions.inner.bottom.left.x,          offsety + positions.inner.bottom.left.y );
        context.ellipse( offsetx + positions.radius.center.bottom_left.x,  offsety + positions.radius.center.bottom_left.y, positions.radius.size.inner.bottom_left.width, positions.radius.size.inner.bottom_left.height, 0, ( 90 * RADIAN ), ( 180 * RADIAN ) );
        context.lineTo(  offsetx + positions.inner.left.bottom.x,          offsety + positions.inner.left.bottom.y );
        context.lineTo(  offsetx + positions.inner.left.top.x,             offsety + positions.inner.left.top.y );
      }.bind(this),
      function(){

        // 背景描画
        this.drawBackground( context, offsetx, offsety );

        // コンテンツ描画
        this.drawContents( context, offsetx, offsety, is_draw_everything );

      }.bind(this)
    );
  };

  //--------------------------------------
  // position:absoluteだけの描画
  //--------------------------------------
  Presenter.prototype.drawAbsoluteObject = function( context, offsetx, offsety ){
    // position:absoluteのオブジェクトを集める
    var absolute_objects = this.findAbsoluteObjects( offsetx, offsety );

    // 描画実行
    for ( var i=0; i<absolute_objects.length; i++ ) {
      absolute_objects[i].object.draw(
        context,
        absolute_objects[i].offsetx,
        absolute_objects[i].offsety,
        true
      );
    }
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Presenter();
