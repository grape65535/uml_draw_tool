/*------------------------------------------------------------------------------
  スタイル
    継承関係： Style -> DomShape -> DomRelation
------------------------------------------------------------------------------*/
function Style(){
  Style.prototype = Object.create( DomShape.prototype );

  //--------------------------------------
  // スタイルの初期化
  //--------------------------------------
  Style.prototype._initializeStyle = function( style ){
    this.style = Object.assign( Object.assign( this.baseStyle(), ( this.parent ? this.parent.inheritStyleObject() : {} ) ), this.defaultStyle() );
    if ( "scroll" == this.style.overflow ) this.scrollable = true;
    this.style_strings = style;
    this.dynamic_style_attributes = this.dynamic_style_attributes || {};

    // スタイルを適用
    var external_style = this._getShtySheet(); // 外部スタイルシートの取得
    this._applyStyle( external_style + style ); // スタイル属性の適用
    Object.assign( this.style, this.dynamic_style_attributes ); // 動的変更したスタイル定義の適用
    Object.assign( this.style, this.forcedStyle() ); // 強制的なスタイル定義の適用
  };

  //--------------------------------------
  // 画面に登録された外部スタイルシートを適用する
  //--------------------------------------
  Style.prototype._getShtySheet = function(){
    if ( ! this.screen ) return "";
    return this.screen.getMatchedStyleSheet( this );
  };
  
  //--------------------------------------
  // 背景画像のロード開始
  //--------------------------------------
  Style.prototype._loadBackgroundImage = function(){
    // ロード開始済
    if ( this.style.background_image_handle_name || ! this.image_manager ) return null;

    // 画像パスと画像管理があるならロード開始
    if ( this.style.background_image ) {
      this.style.background_image_handle_name = this.style.background_image;
      this.image_manager.loadImage( this.style.background_image_handle_name, this.style.background_image );
    }
  };

  //--------------------------------------
  // スタイル値の文字列化
  //--------------------------------------
  Style.prototype._styleValueString = function( value ){
    return ( "undefined" == typeof value || null == value ? "null" : value.toString() );
  };

  //--------------------------------------
  // CSSカラーをrgbカラー値に変換
  //--------------------------------------
  Style.prototype._cssColorToRgb = function( value ){
    var hex_rgb = value.replace("[#;]","").match(/[0-9a-f]{2}/ig);
    if ( ! hex_rgb || 3 != hex_rgb.length ) return null;
    var dec_rgb = hex_rgb.map( function( color ){
      return parseInt( color, 16 );
    } );
    return `rgb(${ dec_rgb[0].toString() },${ dec_rgb[1].toString() },${ dec_rgb[2].toString() })`
  };

  //--------------------------------------
  // スタイル値（カラー）の検証
  //--------------------------------------
  Style.prototype._isStyleColor = function( value ){
    if ( value.match(/rgb\(( *[0-9]{1,3} *,){2} *[0-9]{1,3} *\)/i) ) {
      return true;
    }
    else if ( value.match(/#[0-9a-f]{6}/i) ) {
      return true;
    }
    else {
      var reference_color = this.getColor( value )
      if ( null == reference_color || reference_color.match(/rgb\(( *[0-9]{1,3} *,){2} *[0-9]{1,3} *\)/i) ) return true;
    }
    return false;
  };

  //--------------------------------------
  // スタイル値（数値）の検証
  //--------------------------------------
  Style.prototype._isStyleNumber = function( value ){
    if ( "number" == typeof value ) return true;
    return value.match(/^-?[0-9]+$/i);
  };

  //--------------------------------------
  // スタイル値（率）の検証
  //--------------------------------------
  Style.prototype._isStyleRateNumber = function( value ){
    if ( "number" == typeof value ) return false;
    return value.match(/^[0-9]+%$/i);
  };

  //--------------------------------------
  // スタイル値（カラー）の設定
  //--------------------------------------
  Style.prototype._parseStyleColor = function( token, value, default_value ){
    value = value.toLowerCase();
    if ( value == "null" || value == "transparent" ) {
      return null;
    }
    else if ( this._isStyleColor( value ) ) {
      // CSS colorstyle
      if ( '#' == value.charAt(0) ) {
        return this._cssColorToRgb( value );
      }
      // RGB color style
      return value;
    }
    else {
      console.error( "Unknown style value: " + token );
    }
    return default_value;
  };

  //--------------------------------------
  // スタイル値（数値）の設定
  //--------------------------------------
  Style.prototype._parseStyleNumber = function( token, value, default_value ){
    if ( this._isStyleNumber( value ) ) {
      return parseInt( value );
    }
    else {
      console.error( "Unknown style value: " + token );
    }
    return default_value;
  };

  //--------------------------------------
  // スタイル値（%数値）の設定
  //--------------------------------------
  Style.prototype._parseStyleRateNumber = function( value ){
    return parseInt( value.slice( 0, value.length - 1 ) ) / 100.0;
  };

  //--------------------------------------
  // スタイル値の解析（position）
  //--------------------------------------
  Style.prototype._parseStyleForPosition = function( token, value ){
    switch( value.toLowerCase() ) {
    case "relative":
      this.style.position = "relative";
      break;

    case "absolute":
      this.style.position = "absolute";
      break;

    case "fixed":
      this.style.position = "fixed";
      break;

    default:
      this.style.position = "relative";
      console.error( "Unknown style value: " + token );
    }
  };

  //--------------------------------------
  // スタイル値の解析（display）
  //--------------------------------------
  Style.prototype._parseStyleForDisplay = function( token, value ){
    switch( value.toLowerCase() ) {
    case "block":
      this.style.display = "block";
      break;

    case "inline":
      this.style.display = "inline";
      break;

    case "inline-block":
      this.style.display = "inline-block";
      break;

    case "none":
      this.style.display = "none";
      break;

    default:
      this.style.display = "block";
      console.error( "Unknown style value: " + token );
    }
  };

  //--------------------------------------
  // スタイル値の解析（top）
  //--------------------------------------
  Style.prototype._parseStyleForTop = function( token, value ){
    value = value.toLowerCase();
    
    if ( value == "auto" ) {
      this.style.top =  "auto";
    }
    else if ( this._isStyleRateNumber( value ) ) {
      this.style.top =  value;
    }
    else {
      this.style.top = this._parseStyleNumber( token, value, "auto" )
    }
  };

  //--------------------------------------
  // スタイル値の解析（left）
  //--------------------------------------
  Style.prototype._parseStyleForLeft = function( token, value ){
    value = value.toLowerCase();

    if ( value == "auto" ) {
      this.style.left =  "auto";
    }
    else if ( this._isStyleRateNumber( value ) ) {
      this.style.left =  value;
    }
    else {
      this.style.left = this._parseStyleNumber( token, value, "auto" )
    }
  };

  //--------------------------------------
  // スタイル値の解析（width）
  //--------------------------------------
  Style.prototype._parseStyleForWidth = function( token, value ){
    value = value.toLowerCase();

    if ( value == "auto" ) {
      this.style.width =  "auto";
    }
    else if ( value == "max-content") {
      this.style.width =  "max-content";
    }
    else if ( value == "remaining") {
      this.style.width =  "remaining";
    }
    else if ( this._isStyleRateNumber( value ) ) {
      this.style.width =  value;
    }
    else {
      this.style.width = this._parseStyleNumber( token, value, "auto" )
    }
  };

  //--------------------------------------
  // スタイル値の解析（height）
  //--------------------------------------
  Style.prototype._parseStyleForHeight = function( token, value ){
    value = value.toLowerCase();

    if ( value == "auto" ) {
      this.style.height =  "auto";
    }
    else if ( value == "max-content") {
      this.style.height =  "max-content";
    }
    else if ( value == "remaining") {
      this.style.height =  "remaining";
    }
    else if ( this._isStyleRateNumber( value ) ) {
      this.style.height =  value;
    }
    else {
      this.style.height = this._parseStyleNumber( token, value, "auto" )
    }
  };

  //--------------------------------------
  // スタイル値の解析（overflow）
  //--------------------------------------
  Style.prototype._parseStyleForOverflow = function( token, value ){
    value = value.toLowerCase();

    if ( value == "scroll" ) {
      this.scrollable = true;
    }
    else if ( value == "hidden" ) {
      this.scrollable = false;
    }
    else {
      this.scrollable = true;
      console.error( "Unknown style value: " + token );
    }
  };  

  //--------------------------------------
  // スタイル値の解析（text_align）
  //--------------------------------------
  Style.prototype._parseStyleForTextAlign = function( token, value ){
    switch( value.toLowerCase() ) {
    case "left":
      this.style.text_align = "left";
      break;

    case "center":
      this.style.text_align = "center";
      break;

    case "right":
      this.style.text_align = "right";
      break;
      
    case "null":
      this.style.text_align = "left";
      break;

    default:
      this.style.text_align = "left";
      console.error( "Unknown style value: " + token );
    }
  };

  //--------------------------------------
  // スタイル値の解析（vertical_align）
  //--------------------------------------
  Style.prototype._parseStyleForVerticalAlign = function( token, value ){
    switch( value.toLowerCase() ) {
    case "top":
      this.style.vertical_align = "top";
      break;

    case "center":
    case "middle":
      this.style.vertical_align = "middle";
      break;

    case "bottom":
      this.style.vertical_align = "bottom";
      break;
      
    case "null":
      this.style.vertical_align = "top";
      break;
  
    default:
      this.style.vertical_align = "top";
      console.error( "Unknown style value: " + token );
    }
  };

  //--------------------------------------
  // スタイル値の解析（align_items）
  //--------------------------------------
  Style.prototype._parseStyleForAlignItems = function( token, value ){
    switch( value.toLowerCase() ) {
    case "normal":
      this.style.align_items = "normal";
      break;

    case "stretch":
      this.style.align_items = "stretch";
      break;
  
    default:
      this.style.align_items = "normal";
      console.error( "Unknown style value: " + token );
    }
  };

  //--------------------------------------
  // スタイル値の解析（align_self）
  //--------------------------------------
  Style.prototype._parseStyleForAlignSelf = function( token, value ){
    switch( value.toLowerCase() ) {
    case "auto":
      this.style.align_self = "auto";
      break;

    case "normal":
      this.style.align_self = "normal";
      break;

    case "stretch":
      this.style.align_self = "stretch";
      break;
  
    default:
      this.style.align_self = "normal";
      console.error( "Unknown style value: " + token );
    }
  };

  //--------------------------------------
  // スタイル値の解析（color）
  //--------------------------------------
  Style.prototype._parseStyleForColor = function( token, value ){
    this.style.color = this._parseStyleColor( token, value, "rgb(255,255,255)" );
  };

  //--------------------------------------
  // スタイル値の解析（text_stroke）
  //--------------------------------------
  Style.prototype._parseStyleForTextStroke = function( token, value ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");

    if ( 2 == values.length ) {
      this.style.text_stroke_width = this._parseStyleNumber( token, values[0], 0 );
      this.style.text_stroke_color = this._parseStyleColor( token, values[1], "rgb(255,255,255)" );
      return;
    }
    console.error( "Unknown style value: " + token );
  };

  //--------------------------------------
  // スタイル値の解析（white_space）
  //--------------------------------------
  Style.prototype._parseStyleForWhiteSpace = function( token, value ){
    switch( value.toLowerCase() ) {
    case "normal":
      this.style.white_space = "normal";
      break;

    case "nowrap":
      this.style.white_space = "nowrap";
      break;

    case "pre":
      this.style.white_space = "pre";
      break;

    case "pre-wrap":
      this.style.white_space = "pre-wrap";
      break;

    case "pre-line":
      this.style.white_space = "pre-line";
      break;

    case "break-spaces":
      this.style.white_space = "break-spaces";
      break;
          
    case "null":
      this.style.white_space = "normal";
      break;
  
    default:
      this.style.white_space = "normal";
      console.error( "Unknown style value: " + token );
    }
  };

  //--------------------------------------
  // スタイル値の解析（word_break）
  //--------------------------------------
  Style.prototype._parseStyleForWordBreak = function( token, value ){
    switch( value.toLowerCase() ) {
    case "normal":
      this.style.word_break = "normal";
      break;

    case "break-all":
      this.style.word_break = "break-all";
      break;
          
    case "null":
      this.style.word_break = "normal";
      break;
  
    default:
      this.style.word_break = "normal";
      console.error( "Unknown style value: " + token );
    }
  };
  
  //--------------------------------------
  // スタイル値の解析（font_size）
  //--------------------------------------
  Style.prototype._parseStyleForFontSize = function( token, value ){
    this.style.font_size = this._parseStyleNumber( token, value, 12 );
  };

  //--------------------------------------
  // スタイル値の解析（line_height）
  //--------------------------------------
  Style.prototype._parseStyleForLineHeight = function( token, value ){
    this.style.line_height = this._parseStyleNumber( token, value, 14 );
  };

  //--------------------------------------
  // スタイル値の解析（background_color）
  //--------------------------------------
  Style.prototype._parseStyleForBackgroundColor = function( token, value ){
    this.style.background_color = this._parseStyleColor( token, value, null );
  };

  //--------------------------------------
  // スタイル値の解析（background_image）
  //--------------------------------------
  Style.prototype._parseStyleForBackgroundImage = function( token, value ){
    var mached = ( value || "" ).match( /^url\([ ]*["']?([^"'\)]+)["']?[ ]*\)$/i );
    mached = ( mached ? mached[1] : ( value || "" ) ).match( /^(((http:|https:)?\/\/|\.?\.\/).*$|[^.]+\.(jpg|jpeg|gif|png|bmp))/i );
    if ( mached && mached[0] ) {
      this.style.background_image = mached[0];
    }
    else if ( null == value || "none" == value ) {
      this.style.background_image = null;
    }
    else if ( "string" == typeof value ) {
      this.style.background_image_handle_name = value;
    }
    else {
      console.error( "Unknown style value: " + token );
      this.style.background_image = null;
    }
  };

  //--------------------------------------
  // スタイル値の解析（background_position）
  //--------------------------------------
  Style.prototype._parseStyleForBackgroundPosition = function( token, value ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");

    if ( 1 == values.length ) {
      this.style.background_position = [
        this._parseStyleForBackgroundPositionValue( token, value ),
        "center"
      ];
    }
    else if ( 2 == values.length ) {
      this.style.background_position = [
        this._parseStyleForBackgroundPositionValue( token, values[0] ),
        this._parseStyleForBackgroundPositionValue( token, values[1] )
      ];
    }
    else {
      console.error( "Unknown style value: " + token );
    }

    // 1つ目(X座標)が縦キーワードなら2つ目とスワップ
    if ( "string" == typeof this.style.background_position[0] ) {
      switch( this.style.background_position[0] ){
      case "top":
      case "bottom":
        var tmp = this.style.background_position[1];
        this.style.background_position[1] = this.style.background_position[0];
        if ( "string" == typeof tmp && ( "top" == tmp || "bottom" == tmp ) ) tmp = "center";
        this.style.background_position[0] = tmp; 
      }
    }

    // キーワードを%に直す
    if ( "string" == typeof this.style.background_position[0] ) {
      switch( this.style.background_position[0] ) {
      case "left":
        this.style.background_position[0] = 0;
        break;

      case "right":
        this.style.background_position[0] = "100%";
        break;

      case "center":
        this.style.background_position[0] = "50%";
        break;

      case "top":
      case "bottom":
        this.style.background_position[0] = 0;
      }
    }
    if ( "string" == typeof this.style.background_position[1] ) {
      switch( this.style.background_position[1] ) {
      case "top":
        this.style.background_position[1] = 0;
        break;

      case "bottom":
        this.style.background_position[1] = "100%";
        break;

      case "center":
        this.style.background_position[1] = "50%";
        break;

      case "left":
      case "right":
        this.style.background_position[1] = 0;
      }
    }
  };
  Style.prototype._parseStyleForBackgroundPositionValue = function( token, value ){
    value = value.toLowerCase();

    if ( this._isStyleNumber( value ) ) {
      return this._parseStyleNumber( token, value, 0 );
    }
    else if ( this._isStyleRateNumber( value ) ) {
      return value;
    }
    else if ( "string" == typeof value ) {
      switch ( value ) {
      case "top":
      case "bottom":
      case "left":
      case "right":
      case "center":
        return value;
      }
    }
    console.error( "Unknown style value: " + token );
    return 0;
  };

  //--------------------------------------
  // スタイル値の解析（background_repeat）
  //--------------------------------------
  Style.prototype._parseStyleForBackgroundRepeat = function( token, value ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");
    if ( 1 == values.length ) {
      switch( this._parseStyleForBackgroundRepeatValue( token, values[0] ) ){
      case "repeat":
        this.style.background_repeat = [ "repeat", "repeat" ];
        break;

      case "no-repeat":
        this.style.background_repeat = [ "no-repeat", "no-repeat" ];
        break;

      case "repeat-x":
        this.style.background_repeat = [ "repeat", "no-repeat" ];
        break;

      case "repeat-y":
        this.style.background_repeat = [ "no-repeat", "repeat" ];
        break;
      }
    }
    else if ( 2 == values.length ) {
      // 縦横キーワードが逆ならスワップ
      if ( "repeat-y" == values[0] || "repeat-x" == values[1] ) {
        var tmp= values[0];
        values[0] = values[1];
        values[1] = tmp;
      }
      for ( var i=0; i<values.length; i++ ) {
        switch( values[i] ){
        case "repeat":
          this.style.background_repeat[i] = "repeat";
          break;

        case "no-repeat":
          this.style.background_repeat[i] = "no-repeat";
          break;

        case "repeat-x":
          this.style.background_repeat[0] = "repeat";
          if ( 0==i ) this.style.background_repeat[1] = "no-repeat";
          break;

        case "repeat-y":
          this.style.background_repeat[1] = "repeat";
          if ( 0==i ) this.style.background_repeat[0] = "no-repeat";
          break;
        }
      }
    }
    else {
      console.error( "Unknown style value: " + token );
    }
  };
  Style.prototype._parseStyleForBackgroundRepeatValue = function( token, value ){
    value = value.toLowerCase();
    if ( "string" == typeof value ) {
      switch ( value ) {
      case "repeat":
      case "no-repeat":
      case "repeat-x":
      case "repeat-y":
        return value;
      }
    }
    console.error( "Unknown style value: " + token );
    return "repeat";
  };

  //--------------------------------------
  // スタイル値の解析（background_size）
  //--------------------------------------
  Style.prototype._parseStyleForBackgroundSize = function( token, value ){
    if ( "string" == typeof value ) {
      value = value.toLowerCase();
      switch( value ){
      case "auto":
      case "contain":
      case "cover":
        this.style.background_size = value;
        break;

      default:
        console.error( "Unknown style value: " + token );
        this.style.background_size = "auto";
      }  
    }
    else {
      console.error( "Unknown style value: " + token );
      this.style.background_size = "auto";
    }
  };

  //--------------------------------------
  // スタイル値の解析（border）
  //--------------------------------------
  Style.prototype._parseStyleForBorder = function( token, value ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");

    var width = this._parseStyleNumber( token, values[0], 0 )
    this.style.border_width = [ width, width, width, width ];

    if ( 2 <= values.length ) {
      var color = this._parseStyleColor( token, values[1], null );
      this.style.border_color = [ color, color, color, color ];
    }
  };

  //--------------------------------------
  // スタイル値の解析（border-left/right/top/bottom）
  //--------------------------------------
  Style.prototype._parseStyleForBorderEdge = function( token, value, edge ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");

    var width = this._parseStyleNumber( token, values[0], 0 )
    this.style.border_width[edge] = width;

    if ( 2 <= values.length ) {
      var color = this._parseStyleColor( token, values[1], null );
      this.style.border_color[edge] = color;
    }
  };
  Style.prototype._parseStyleForBorderTop = function( token, value ){
    this._parseStyleForBorderEdge( token, value, 0 );
  };
  Style.prototype._parseStyleForBorderRight = function( token, value ){
    this._parseStyleForBorderEdge( token, value, 1 );
  };
  Style.prototype._parseStyleForBorderBottom = function( token, value ){
    this._parseStyleForBorderEdge( token, value, 2 );
  };
  Style.prototype._parseStyleForBorderLeft = function( token, value ){
    this._parseStyleForBorderEdge( token, value, 3 );
  };

  //--------------------------------------
  // スタイル値の解析（border_color）
  //--------------------------------------
  Style.prototype._parseStyleForBorderColor = function( token, value ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");
    var colors = values.map( function( val ){ return this._parseStyleColor( token, val, null ) }.bind(this) );
    if ( 1 == values.length ) {
      this.style.border_color = [ colors[0], colors[0], colors[0], colors[0] ];
    }
    else if ( 2 == values.length ) {
      this.style.border_color = [ colors[0], colors[1], colors[0], colors[1] ];
    }
    else if ( 3 == values.length ) {
      this.style.border_color = [ colors[0], colors[1], colors[2], colors[1] ];
    }
    else if ( 4 <= values.length ) {
      this.style.border_color = [ colors[0], colors[1], colors[2], colors[3] ];
    }
  };

  //--------------------------------------
  // スタイル値の解析（border_color_left/right/top/bottom）
  //--------------------------------------
  Style.prototype._parseStyleForBorderColorEdge = function( token, value, edge ){
    var color = this._parseStyleColor( token, value, null );
    this.style.border_color[edge] = color;
  };
  Style.prototype._parseStyleForBorderColorTop = function( token, value ){
    this._parseStyleForBorderColorEdge( token, value, 0 );
  };
  Style.prototype._parseStyleForBorderColorRight = function( token, value ){
    this._parseStyleForBorderColorEdge( token, value, 1 );
  };
  Style.prototype._parseStyleForBorderColorBottom = function( token, value ){
    this._parseStyleForBorderColorEdge( token, value, 2 );
  };
  Style.prototype._parseStyleForBorderColorLeft = function( token, value ){
    this._parseStyleForBorderColorEdge( token, value, 3 );
  };

  //--------------------------------------
  // スタイル値の解析（border_width）
  //--------------------------------------
  Style.prototype._parseStyleForBorderWidth = function( token, value ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");
    var numbers = values.map( function( val ){ return this._parseStyleNumber( token, val, 0 ) }.bind(this) );
    if ( 1 == values.length ) {
      this.style.border_width = [ numbers[0], numbers[0], numbers[0], numbers[0] ];
    }
    else if ( 2 == values.length ) {
      this.style.border_width = [ numbers[0], numbers[1], numbers[0], numbers[1] ];
    }
    else if ( 3 == values.length ) {
      this.style.border_width = [ numbers[0], numbers[1], numbers[2], numbers[1] ];
    }
    else if ( 4 <= values.length ) {
      this.style.border_width = [ numbers[0], numbers[1], numbers[2], numbers[3] ];
    }
  };

  //--------------------------------------
  // スタイル値の解析（border_width_left/right/top/bottom）
  //--------------------------------------
  Style.prototype._parseStyleForBorderWidthEdge = function( token, value, edge ){
    var width = this._parseStyleNumber( token, value, 0 );
    this.style.border_width[edge] = width;
  };
  Style.prototype._parseStyleForBorderWidthTop = function( token, value ){
    this._parseStyleForBorderWidthEdge( token, value, 0 );
  };
  Style.prototype._parseStyleForBorderWidthRight = function( token, value ){
    this._parseStyleForBorderWidthEdge( token, value, 1 );
  };
  Style.prototype._parseStyleForBorderWidthBottom = function( token, value ){
    this._parseStyleForBorderWidthEdge( token, value, 2 );
  };
  Style.prototype._parseStyleForBorderWidthLeft = function( token, value ){
    this._parseStyleForBorderWidthEdge( token, value, 3 );
  };

  //--------------------------------------
  // スタイル値の解析（border_radius）
  //--------------------------------------
  Style.prototype._parseStyleForBorderRadius = function( token, value ){
    // "/"が存在する時は 横幅/縦幅なので、/前後を別の配列に分ける
    var tokens = value.split("/");
    // "/"が存在しない時は、横幅と縦幅が同じサイズなので、/前後に同じ値が指定されたものとみなす
    if ( 1 == tokens.length ) tokens = [ tokens[0], tokens[0] ];

    for ( var i=0; i<tokens.length; i++ ) {
      var values = tokens[i].trim().replace( /[ \t]{2,}/ig, " " ).split(" ");
      var numbers = values.map( function( val ){ return this._parseStyleNumber( token, val, 0 ) }.bind(this) );
      if ( 1 == values.length ) {
        this.style.border_radius[0][i] = numbers[0];
        this.style.border_radius[1][i] = numbers[0];
        this.style.border_radius[2][i] = numbers[0];
        this.style.border_radius[3][i] = numbers[0];
      }
      else if ( 2 == values.length ) {
        this.style.border_radius[0][i] = numbers[0];
        this.style.border_radius[1][i] = numbers[1];
        this.style.border_radius[2][i] = numbers[0];
        this.style.border_radius[3][i] = numbers[1];
      }
      else if ( 3 == values.length ) {
        this.style.border_radius[0][i] = numbers[0];
        this.style.border_radius[1][i] = numbers[1];
        this.style.border_radius[2][i] = numbers[2];
        this.style.border_radius[3][i] = numbers[1];
      }
      else if ( 4 <= values.length ) {
        this.style.border_radius[0][i] = numbers[0];
        this.style.border_radius[1][i] = numbers[1];
        this.style.border_radius[2][i] = numbers[2];
        this.style.border_radius[3][i] = numbers[3];
      }
    }
  };

  //--------------------------------------
  // スタイル値の解析（border_top_left/top_right/bottom_right/bottom_left_radius）
  //--------------------------------------
  Style.prototype._parseStyleForBorderRadiusEdge = function( token, value, edge ){
    var values = value.split(" ");
    var width = this._parseStyleNumber( token, values[0].trim(), 0 );
    var height = this._parseStyleNumber( token, ( values[1] || values[0] ).trim(), 0 );
    this.style.border_radius[edge] = [ width, height ];
  };
  Style.prototype._parseStyleForBorderRadiusTopLeft = function( token, value ){
    this._parseStyleForBorderRadiusEdge( token, value, 0 );
  };
  Style.prototype._parseStyleForBorderRadiusTopRight = function( token, value ){
    this._parseStyleForBorderRadiusEdge( token, value, 1 );
  };
  Style.prototype._parseStyleForBorderRadiusBottomRight = function( token, value ){
    this._parseStyleForBorderRadiusEdge( token, value, 2 );
  };
  Style.prototype._parseStyleForBorderRadiusBottomLeft = function( token, value ){
    this._parseStyleForBorderRadiusEdge( token, value, 3 );
  };

  //--------------------------------------
  // スタイル値の解析（padding）
  //--------------------------------------
  Style.prototype._parseStyleForPadding = function( token, value ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");
    var numbers = values.map( function( val ){ return this._parseStyleNumber( token, val, 0 ) }.bind(this) );
    if ( 1 == values.length ) {
      this.style.padding = [ numbers[0], numbers[0], numbers[0], numbers[0] ];
    }
    else if ( 2 == values.length ) {
      this.style.padding = [ numbers[0], numbers[1], numbers[0], numbers[1] ];
    }
    else if ( 3 == values.length ) {
      this.style.padding = [ numbers[0], numbers[1], numbers[2], numbers[1] ];
    }
    else if ( 4 <= values.length ) {
      this.style.padding = [ numbers[0], numbers[1], numbers[2], numbers[3] ];
    }
  };

  //--------------------------------------
  // スタイル値の解析（padding_left/right/top/bottom）
  //--------------------------------------
  Style.prototype._parseStyleForPaddingEdge = function( token, value, edge ){
    var number = this._parseStyleNumber( token, value, 0 );
    this.style.padding[edge] = number;
  };
  Style.prototype._parseStyleForPaddingTop = function( token, value ){
    this._parseStyleForPaddingEdge( token, value, 0 );
  };
  Style.prototype._parseStyleForPaddingRight = function( token, value ){
    this._parseStyleForPaddingEdge( token, value, 1 );
  };
  Style.prototype._parseStyleForPaddingBottom = function( token, value ){
    this._parseStyleForPaddingEdge( token, value, 2 );
  };
  Style.prototype._parseStyleForPaddingLeft = function( token, value ){
    this._parseStyleForPaddingEdge( token, value, 3 );
  };

  //--------------------------------------
  // スタイル値の解析（margin）
  //--------------------------------------
  Style.prototype._parseStyleForMargin = function( token, value ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");
    var numbers = values.map( function( val ){ return this._parseStyleNumber( token, val, 0 ) }.bind(this) );
    if ( 1 == values.length ) {
      this.style.margin = [ numbers[0], numbers[0], numbers[0], numbers[0] ];
    }
    else if ( 2 == values.length ) {
      this.style.margin = [ numbers[0], numbers[1], numbers[0], numbers[1] ];
    }
    else if ( 3 == values.length ) {
      this.style.margin = [ numbers[0], numbers[1], numbers[2], numbers[1] ];
    }
    else if ( 4 <= values.length ) {
      this.style.margin = [ numbers[0], numbers[1], numbers[2], numbers[3] ];
    }
  };

  //--------------------------------------
  // スタイル値の解析（margin_left/right/top/bottom）
  //--------------------------------------
  Style.prototype._parseStyleForMarginEdge = function( token, value, edge ){
    var number = this._parseStyleNumber( token, value, 0 );
    this.style.margin[edge] = number;
  };
  Style.prototype._parseStyleForMarginTop = function( token, value ){
    this._parseStyleForMarginEdge( token, value, 0 );
  };
  Style.prototype._parseStyleForMarginRight = function( token, value ){
    this._parseStyleForMarginEdge( token, value, 1 );
  };
  Style.prototype._parseStyleForMarginBottom = function( token, value ){
    this._parseStyleForMarginEdge( token, value, 2 );
  };
  Style.prototype._parseStyleForMarginLeft = function( token, value ){
    this._parseStyleForMarginEdge( token, value, 3 );
  };

  //--------------------------------------
  // スタイル値の解析（z_index）
  //--------------------------------------
  Style.prototype._parseStyleForZIndex = function( token, value, edge ){
    var number = this._parseStyleNumber( token, value, 0 );
    this.style.z_index = number;
  };  

  //--------------------------------------
  // スタイル値の解析（focus_color）
  //--------------------------------------
  Style.prototype._parseStyleForFocusColor = function( token, value ){
    this.style.focus_color = this._parseStyleColor( token, value, "rgb(255,255,255)" );
  };

  //--------------------------------------
  // スタイル値の解析（focus_background_color）
  //--------------------------------------
  Style.prototype._parseStyleForFocusBackgroundColor = function( token, value ){
    this.style.focus_background_color = this._parseStyleColor( token, value, null );
  };

  //--------------------------------------
  // スタイル値の解析（focus_border_color）
  //--------------------------------------
  Style.prototype._parseStyleForFocusBorderColor = function( token, value ){
    var values = value.replace( /[ \t]{2,}/ig, " " ).split(" ");
    var colors = values.map( function( val ){ return this._parseStyleColor( token, val, null ) }.bind(this) );
    if ( 1 == values.length ) {
      this.style.focus_border_color = [ colors[0], colors[0], colors[0], colors[0] ];
    }
    else if ( 2 == values.length ) {
      this.style.focus_border_color = [ colors[0], colors[1], colors[0], colors[1] ];
    }
    else if ( 3 == values.length ) {
      this.style.focus_border_color = [ colors[0], colors[1], colors[2], colors[1] ];
    }
    else if ( 4 <= values.length ) {
      this.style.focus_border_color = [ colors[0], colors[1], colors[2], colors[3] ];
    }
  };

  //--------------------------------------
  // スタイル値の解析（focus_border_color_left/right/top/bottom）
  //--------------------------------------
  Style.prototype._parseStyleForFocusBorderColorEdge = function( token, value, edge ){
    var color = this._parseStyleColor( token, value, null );
    this.style.focus_border_color[edge] = color;
  };
  Style.prototype._parseStyleForFocusBorderColorTop = function( token, value ){
    this._parseStyleForFocusBorderColorEdge( token, value, 0 );
  };
  Style.prototype._parseStyleForFocusBorderColorRight = function( token, value ){
    this._parseStyleForFocusBorderColorEdge( token, value, 1 );
  };
  Style.prototype._parseStyleForFocusBorderColorBottom = function( token, value ){
    this._parseStyleForFocusBorderColorEdge( token, value, 2 );
  };
  Style.prototype._parseStyleForFocusBorderColorLeft = function( token, value ){
    this._parseStyleForFocusBorderColorEdge( token, value, 3 );
  };

  //--------------------------------------
  // スタイルを適用
  //--------------------------------------
  Style.prototype._applyStyle = function( style ){
    if ( ! style || 0 == style.length ) return;
    if ( style.match(/^[ \t;]+$/i) ) return;
    // 1つのスタイル定義トークンを取得
    var terminator_index = style.indexOf( ";" );
    var token = style;
    if ( -1 < terminator_index ) {
      token = style.slice( 0, terminator_index );
      style = style.slice( terminator_index + 1 );
    }
    else {
      style = "";
    }
    token = token.trim();

    // キーと値を分離する
    var split_token = token.split(":");
    var style_key   = split_token[0].trim().replace("-","_");
    var style_value = split_token[1].trim();

    // キーごとの処理
    var parseStyleTable = {
      "position":             this._parseStyleForPosition.bind(this),           // relative; absolute; fixed;
      "display":              this._parseStyleForDisplay.bind(this),            // block; inline; inline-block; none;
      "top":                  this._parseStyleForTop.bind(this),                // 0; 0%; auto;
      "left":                 this._parseStyleForLeft.bind(this),               // 0; 0%; auto;
      "width":                this._parseStyleForWidth.bind(this),              // 0; 0%; auto; max-content; remaining;
      "height":               this._parseStyleForHeight.bind(this),             // 0; 0%; auto; max-content; remaining;
      "overflow":             this._parseStyleForOverflow.bind(this),           // scroll; hidden;
      "text_align":           this._parseStyleForTextAlign.bind(this),          // left; center; right;
      "vertical_align":       this._parseStyleForVerticalAlign.bind(this),      // top; center; middle; bottom;
      "align_items":          this._parseStyleForAlignItems.bind(this),         // normal; stretch;
      "align-self":           this._parseStyleForAlignSelf.bind(this),          // normal; stretch;
      "font_size":            this._parseStyleForFontSize.bind(this),           // 0;
      "line_height":          this._parseStyleForLineHeight.bind(this),         // 0;
      "color":                this._parseStyleForColor.bind(this),              // rgb(0,0,0);
      "text_stroke":          this._parseStyleForTextStroke.bind(this),         // 0 rgb(0,0,0);
      "white_space":          this._parseStyleForWhiteSpace.bind(this),         // normal; nowrap; pre; pre-wrap; pre-line; break-spaces;
      "word_break":           this._parseStyleForWordBreak.bind(this),          // normal; break-all;
      "background_color":     this._parseStyleForBackgroundColor.bind(this),    // null; transparent; rgb(0,0,0);
      "background_image":     this._parseStyleForBackgroundImage.bind(this),    // null; none; url("http://...");
      "background_position":  this._parseStyleForBackgroundPosition.bind(this), // (number|percent|keyword); (number|percent|keyword) (number|percent|keyword); keyword=top,bottom,left,right,center
      "background_repeat":    this._parseStyleForBackgroundRepeat.bind(this),   // keyword; keyword keyword; keyword=repeat-x,repeat-y,repeat, no-repeat
      "background_size":      this._parseStyleForBackgroundSize.bind(this),     // auto; contain; cover;
      "border":               this._parseStyleForBorder.bind(this),             // 0 rgb(0,0,0); 0 null; 0 transparent;
      "border_left":          this._parseStyleForBorderLeft.bind(this),         // 0 rgb(0,0,0); 0 null; 0 transparent;
      "border_right":         this._parseStyleForBorderRight.bind(this),        // 0 rgb(0,0,0); 0 null; 0 transparent;
      "border_top":           this._parseStyleForBorderTop.bind(this),          // 0 rgb(0,0,0); 0 null; 0 transparent;
      "border_bottom":        this._parseStyleForBorderBottom.bind(this),       // 0 rgb(0,0,0); 0 null; 0 transparent;
      "border_color":         this._parseStyleForBorderColor.bind(this),        // rgb(0,0,0); null; transparent; 値は1〜4個指定可：上 右 下 左; 上 左右 下; 上下 左右; 上下左右;
      "border_color_left":    this._parseStyleForBorderColorLeft.bind(this),    // rgb(0,0,0); null; transparent;
      "border_color_right":   this._parseStyleForBorderColorRight.bind(this),   // rgb(0,0,0); null; transparent;
      "border_color_top":     this._parseStyleForBorderColorTop.bind(this),     // rgb(0,0,0); null; transparent;
      "border_color_bottom":  this._parseStyleForBorderColorBottom.bind(this),  // rgb(0,0,0); null; transparent;
      "border_width":         this._parseStyleForBorderWidth.bind(this),        // 0;
      "border_width_left":    this._parseStyleForBorderWidthLeft.bind(this),    // 0;
      "border_width_right":   this._parseStyleForBorderWidthRight.bind(this),   // 0;
      "border_width_top":     this._parseStyleForBorderWidthTop.bind(this),     // 0;
      "border_width_bottom":  this._parseStyleForBorderWidthBottom.bind(this),  // 0;
      "border_radius":        this._parseStyleForBorderRadius.bind(this),       // 0; 値は1〜4個指定可：上 右 下 左; 上 左右 下; 上下 左右; 上下左右; 0 / 0; 横幅/縦幅で、値は/で別れた左右それぞれで1〜4個指定可：上 右 下 左; 上 左右 下; 上下 左右; 上下左右;
      "border_top_left_radius":     this._parseStyleForBorderRadiusTopLeft.bind(this),      // 0; 0 0;
      "border_top_right_radius":    this._parseStyleForBorderRadiusTopRight.bind(this),     // 0; 0 0;
      "border_bottom_right_radius": this._parseStyleForBorderRadiusBottomRight.bind(this),  // 0; 0 0;
      "border_bottom_left_radius":  this._parseStyleForBorderRadiusBottomLeft.bind(this),   // 0; 0 0;
      "padding":              this._parseStyleForPadding.bind(this),            // 0; 値は1〜4個指定可：上 右 下 左; 上 左右 下; 上下 左右; 上下左右;
      "padding_left":         this._parseStyleForPaddingLeft.bind(this),        // 0;
      "padding_right":        this._parseStyleForPaddingRight.bind(this),       // 0;
      "padding_top":          this._parseStyleForPaddingTop.bind(this),         // 0;
      "padding_bottom":       this._parseStyleForPaddingBottom.bind(this),      // 0;
      "margin":               this._parseStyleForMargin.bind(this),             // 0; 値は1〜4個指定可：上 右 下 左; 上 左右 下; 上下 左右; 上下左右;
      "margin_left":          this._parseStyleForMarginLeft.bind(this),         // 0;
      "margin_right":         this._parseStyleForMarginRight.bind(this),        // 0;
      "margin_top":           this._parseStyleForMarginTop.bind(this),          // 0;
      "margin_bottom":        this._parseStyleForMarginBottom.bind(this),       // 0;
      "z_index":              this._parseStyleForZIndex.bind(this),             // 0;
      // focus
      "focus_color":                this._parseStyleForFocusColor.bind(this),              // rgb(0,0,0);
      "focus_background_color":     this._parseStyleForFocusBackgroundColor.bind(this),    // null; transparent; rgb(0,0,0);
      "focus_border_color":         this._parseStyleForFocusBorderColor.bind(this),        // rgb(0,0,0); null; transparent; 値は1〜4個指定可：上 右 下 左; 上 左右 下; 上下 左右; 上下左右;
      "focus_border_color_left":    this._parseStyleForFocusBorderColorLeft.bind(this),    // rgb(0,0,0); null; transparent;
      "focus_border_color_right":   this._parseStyleForFocusBorderColorRight.bind(this),   // rgb(0,0,0); null; transparent;
      "focus_border_color_top":     this._parseStyleForFocusBorderColorTop.bind(this),     // rgb(0,0,0); null; transparent;
      "focus_border_color_bottom":  this._parseStyleForFocusBorderColorBottom.bind(this),  // rgb(0,0,0); null; transparent;
    };
    if ( ! parseStyleTable[ style_key ] ) {
      console.error( "Unknown style key name: " + token );
    }
    else {
      parseStyleTable[ style_key ]( token, style_value );
    }

    // 再起呼び出しで次のスタイル定義を処理する
    this._applyStyle( style );
  }
  
  //--------------------------------------
  // 基本スタイルを取得
  //--------------------------------------
  Style.prototype.baseStyle = function(){
    return Object.assign( 
      {},
      {
        position: "relative",
        display: "block",
        top: "auto",
        left: "auto",
        width: "auto",
        height: "auto",
        overflow: "hidden",
        text_align: "left",
        vertical_align: "top",
        align_items: "normal",
        align_self: "auto",
        font_size: 12,
        line_height: 14,
        color: "system-text",
        text_stroke_width: 0,
        text_stroke_color: "rgb(255,255,255)",
        white_space: "normal",
        word_break: "normal",
        background_color: null,
        background_image: null,
        background_image_handle_name: null,
        background_position: [ 0, 0 ],
        background_repeat: [ "repeat", "repeat" ],
        background_size: "auto",
        border_color: [ null, null, null, null ],
        border_width: [ 0, 0, 0, 0 ],
        border_radius: [ [ 0, 0 ], [ 0, 0 ], [ 0, 0 ], [ 0, 0 ] ],
        padding: [ 0, 0, 0, 0 ],
        margin: [ 0, 0, 0, 0 ],
        z_index: 0,
        // focus
        focus_color: "system-focus-text",
        focus_background_color: "system-focus-background",
        focus_border_color: [ null, null, null, null ],
      }
    );
  };

  //--------------------------------------
  // デフォルトのスタイルを取得
  //--------------------------------------
  Style.prototype.defaultStyle = function(){
    return Object.assign( 
      {},
      {}
    );
  };

  //--------------------------------------
  // 強制の固定スタイルを取得
  //--------------------------------------
  Style.prototype.forcedStyle = function(){
    return Object.assign( 
      {},
      {}
    );
  };

  //--------------------------------------
  // スタイルを設定
  //--------------------------------------
  Style.prototype.setStyle = function( style ){
    this._initializeStyle( style );
    this._requestRelayoutAndDraw();
  };

  //--------------------------------------
  // スタイルを子孫含めて更新
  //--------------------------------------
  Style.prototype.refreshStyle = function(){
    this.screen = ( this.parent ? this.parent.screen : this.screen );
    this.setStyle( this.style_strings );
    for ( var i=0; i<this.children.length; i++ ) {
      this.children[i].refreshStyle();
    }
    // 画像管理を画面から取得
    if ( this.screen && ! this.image_manager ) {
      this.image_manager = this.screen.image_manager || null;
    }
    // 背景画像の取得
    this._loadBackgroundImage();
  };

  //--------------------------------------
  // 指定スタイル属性を動的に変更
  //--------------------------------------
  Style.prototype.setDynamicStyleAttr = function( attr_name, value ){
    attr_name = attr_name.toLowerCase();
    if ( "string" == typeof value ) value = value.toLowerCase();

    // 存在するスタイル属性？
    if ( this.style[ attr_name ] ) {
      this.dynamic_style_attributes[ attr_name ] = value;
    }

    this._requestRelayoutAndDraw();
  };

  //--------------------------------------
  // 動的に指定したスタイル属性を消去
  //--------------------------------------
  Style.prototype.clearDynamicStyleAttr = function( attr_name ){
    delete this.dynamic_style_attributes[ attr_name ];
    this._requestRelayoutAndDraw();
  };

  //--------------------------------------
  // 動的に指定したスタイル属性を全て消去
  //--------------------------------------
  Style.prototype.clearAllDynamicStyle = function(){
    this.dynamic_style_attributes = {};
    this._requestRelayoutAndDraw();
  };

  //--------------------------------------
  // 継承用スタイル
  //--------------------------------------
  Style.prototype.inheritStyle = function(){
    return  `color:${this._styleValueString( this.style.color )}; ` +
            `text_stroke:${this._styleValueString( this.style.text_stroke_width )} ${this._styleValueString( this.style.text_stroke_color )}; ` +
            `font_size:${this._styleValueString( this.style.font_size )}; ` +
            `line_height:${this._styleValueString( this.style.line_height )}; ` +
            `text_align:${this._styleValueString( this.style.text_align )}; ` +
            `vertical_align:${this._styleValueString( this.style.vertical_align )}; ` +
            `white_space:${this._styleValueString( this.style.white_space )}; ` +
            `word_break:${this._styleValueString( this.style.word_break )}; ` +
            `focus_color:${this._styleValueString( this.style.focus_color )};`;
  };
  
  //--------------------------------------
  // 継承用スタイル
  //--------------------------------------
  Style.prototype.inheritStyleObject = function(){
    return {
      color:              this.style.color,
      text_stroke_width:  this.style.text_stroke_width,
      text_stroke_color:  this.style.text_stroke_color,
      font_size:          this.style.font_size,
      line_height:        this.style.line_height,
      text_align:         this.style.text_align,
      vertical_align:     this.style.vertical_align,
      white_space:        this.style.white_space,
      word_break:         this.style.word_break,
      focus_color:        this.style.focus_color,
    };
  };

  //--------------------------------------
  // キーワードカラーの取得
  //--------------------------------------
  Style.prototype.getColor = function( color_code ){
    var color_keywords = {
      "red": "rgb(255,0,0)",
      "darkred": "rgb(139,0,0)",
      "crimson": "rgb(220,20,60)",
      "pink": "rgb(255,192,203)",
      "cyan": "rgb(0,255,255)",
      "lightcyan": "rgb(224,255,255)",
      "darkcyan": "rgb(0,139,139)",
      "magenta": "rgb(255,0,255)",
      "darkmagenta": "rgb(139,0,139)",
      "darkblue": "rgb(0,0,139)",
      "violet": "rgb(238 G:130 B:238)",
      "purple": "rgb(128,0,128)",
      "blue": "rgb(0,0,255)",
      "lightblue": "rgb(173,216,230)",
      "darkblue": "rgb(0,0,139)",
      "skyblue": "rgb(135,206,235)",
      "yellow": "rgb(255,255,0)",
      "lightyellow": "rgb(255,255,224)",
      "yellowgreen": "rgb(154,205,50)",
      "black": "rgb(0,0,0)",
      "white": "rgb(255,255,255)",
      "gray": "rgb(128,128,128)",
      "lightgray": "rgb(211,211,211)",
      "darkgray": "rgb(169,169,169)",
      "silver": "rgb(192,192,192)",
      "orange": "rgb(255,165,0)",
      "darkorange": "rgb(255,140,0)",
      "green": "rgb(0,128,0)",
      "lightgreen": "rgb(144,238,144)",
      "darkgreen": "rgb(0,100,0)",
      "lime": "rgb(0,255,0)",
      "limegreen": "rgb(50,205,50)",
      "greenyellow": "rgb(173,255,47)",
      "olive": "rgb(128,128,0)",
      "gold": "rgb(255,215,0)",
      "brown": "rgb(165,42,42)",
      // システム色
      "system-text": "rgb(0,0,0)",
      "system-background": null,
      "system-form-text": "rgb(0,0,0)",
      "system-form-background": "rgb(130,130,130)",
      "system-form-background-dark": "rgb(70,70,70)",
      "system-form-background-light": "rgb(180,180,180)",
      "system-form-dark": "rgb(90,90,90)",
      "system-form-light": "rgb(160,160,160)",
      "system-focus-text": "rgb(0,0,0)",
      "system-focus-background": null,
      "system-focus-form-text": "rgb(0,0,0)",
      "system-focus-form-background": "rgb(150,150,150)",
      "system-focus-form-background-dark": "rgb(100,100,100)",
      "system-focus-form-background-light": "rgb(210,210,210)",
      "system-focus-form-dark": "rgb(120,120,120)",
      "system-focus-form-light": "rgb(190,190,190)",
    };
    return color_keywords[ color_code ] || color_code;
  };

};
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
Style();
