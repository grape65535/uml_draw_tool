/*------------------------------------------------------------------------------
  スタイルシートパーサー
------------------------------------------------------------------------------*/
function StyleSheetPaser(){

  //--------------------------------------
  // 定数
  //--------------------------------------
  var blank_reqexp = new RegExp("[ \\t\\r\\n]", "i");
  var outer_comment_start_reqexp = new RegExp("\\/", "i");
  var outer_comment_start_strict_reqexp = new RegExp("^\\/\\*", "i");
  var outer_comment_end_strict_reqexp = new RegExp("^.*?\\*\\/", "i");
  var selecter_name_reqexp = new RegExp("[a-zA-Z0-9\\-_#.*]", "i");
  var selecter_name_strict_reqexp = new RegExp("([a-zA-Z0-9\\-_]+|\\*)?([#.][a-zA-Z0-9\\-_]+)*", "i");
  var selecter_delimiter_reqexp = new RegExp("[ \\t\\r\\n>,+~]", "i");
  var selecter_descendants_strict_reqexp = new RegExp("^[ ]+$", "i");
  var selecter_child_strict_reqexp = new RegExp("^[ ]*>[ ]*$", "i");
  var selecter_combinator_strict_reqexp = new RegExp("^[ ]*~[ ]*$", "i");
  var selecter_sibling_strict_reqexp = new RegExp("^[ ]*\\+[ ]*$", "i");
  var selecter_next_strict_reqexp = new RegExp("^[ \\t]*,[ \\t]*[\\r\\n]?[ \\t]*$", "i");
  var selecter_comment_start_reqexp = new RegExp("\\/", "i");
  var selecter_comment_start_strict_reqexp = new RegExp("^\\/\\*", "i");
  var selecter_comment_end_strict_reqexp = new RegExp("^.*?\\*\\/", "i");
  var style_name_delimiter_regexp = new RegExp("[ \\t\\r\\n;]", "i");
  var style_name_regexp = new RegExp("[a-zA-Z\\-_]", "i");
  var style_value_delimiter_regexp = new RegExp("[ \\t:]", "i");
  var style_value_delimiter_strict_regexp = new RegExp("^[ \\t]*:[ \\t]*$", "i");
  var style_value_regexp = new RegExp("[^;\\r\\n{}]", "i");
  var inner_comment_start_reqexp = new RegExp("\\/", "i");
  var inner_comment_start_strict_reqexp = new RegExp("^\\/\\*", "i");
  var inner_comment_end_strict_reqexp = new RegExp("^.*?\\*\\/", "i");

  //--------------------------------------
  // 字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._lexer = function( token_type, text, block_func ){
    block_func = block_func || function( lead, stream ){ return true; };

    for ( var i=0; i<text.length; i++ ) {
      var change_token = block_func.call( this, text.charAt( i ), text.slice( 0, i+1 ) );
      if ( change_token ) {
        return {
          stream: text.slice( 0, i ),  // 1つ前の状態を返す
          other: text.slice( i ),  // 未解析の残り文字
          token_type: token_type,
          next_token_type: change_token,
        }
      }
    }

    return {
      stream: text,
      other: "",
      token_type: token_type,
      next_token_type: null,
    }
  }

  //--------------------------------------
  // 次のスタイル定義への間の空白区間の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._blank_lexer = function( style_sheet ){
    return this._lexer( "blank", style_sheet, function( lead, stream ){
      // 空白や改行コード以外が出現した刻
      if ( ! lead.match( blank_reqexp ) ) {
        // セレクタに許可された文字が出現した時
        if ( lead.match( selecter_name_reqexp ) ) return "selecter_name";
        // コメントに許可された文字が出現した時
        if ( lead.match( outer_comment_start_reqexp ) ) return "outer_comment_start";

        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _blank_lexer';
      }
      return false;
    });
  };

  //--------------------------------------
  // コメントの開始の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._outer_comment_start_lexer = function( style_sheet ){
    return this._lexer( "outer_comment_start", style_sheet, function( lead, stream ){
      if ( 1 == stream.length && ! stream.match( outer_comment_start_reqexp ) ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _outer_comment_start_lexer';
      }
      else if ( 2 == stream.length && ! stream.match( outer_comment_start_strict_reqexp ) ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _outer_comment_start_lexer';
      }
      else if ( 3 == stream.length ) {
        return "outer_comment_end";
      }
      return false;
    });
  };

  //--------------------------------------
  // コメントの終了の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._outer_comment_end_lexer = function( style_sheet ){
    return this._lexer( "outer_comment_end", style_sheet, function( lead, stream ){
      if ( 2 <= stream.length && stream.slice( 0, stream.length-1 ).match( outer_comment_end_strict_reqexp ) ) {
        return "blank";
      }
      return false;
    });
  };

  //--------------------------------------
  // セレクタ名の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._selecter_name_lexer = function( style_sheet ){
    return this._lexer( "selecter_name", style_sheet, function( lead, stream ){
      // セレクタに許可された文字以外が出現した時
      if ( ! lead.match( selecter_name_reqexp ) ) {
        // セレクタのフォーマットの厳密なチェック
        if ( ! stream.slice( 0, stream.length-1 ).match( selecter_name_strict_reqexp ) ) {
          console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
          throw 'errror _selecter_name_lexer';
        }

        if ( lead.match( selecter_delimiter_reqexp ) ) return "selecter_delimiter"; // 次のセレクタへの区切り
        if ( "{" == lead ) return "style_open"; // スタイル定義の開始

        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _selecter_name_lexer';  
      }
      return false;
    });
  };

  //--------------------------------------
  // セレクタ間の空白区間の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._selecter_delimiter_lexer = function( style_sheet ){
    return this._lexer( "selecter_delimiter", style_sheet, function( lead, stream ){
      // セレクタの区切り文字以外が出現した時
      if ( ! lead.match( selecter_delimiter_reqexp ) ) {
        // セレクタ区切り文字だが、厳密には適切ではない時
        var tmp = stream.slice( 0, stream.length-1 );
        if ( 
             ( ! tmp.match( selecter_descendants_strict_reqexp ) )
          && ( ! tmp.match( selecter_child_strict_reqexp ) )
          && ( ! tmp.match( selecter_next_strict_reqexp ) )
          && ( ! tmp.match( selecter_sibling_strict_reqexp ) )
          && ( ! tmp.match( selecter_combinator_strict_reqexp ) )
          && ( ! tmp.match( /^[ \t\r\n]+$/ ) )
        ) {
          console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
          throw 'errror _selecter_delimiter_lexer';  
        }

        // セレクタに許可された文字が出現した時
        if ( lead.match( selecter_name_reqexp ) ) return "selecter_name"; // セレクタ名
        if ( "{" == lead ) return "style_open"; // スタイル定義の開始
        if ( lead.match( selecter_comment_start_reqexp ) ) return "selecter_comment_start"; // コメント

        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _selecter_name_lexer';  
      }
      return false;
    });
  };

  //--------------------------------------
  // コメントの開始の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._selecter_comment_start_lexer = function( style_sheet ){
    return this._lexer( "selecter_comment_start", style_sheet, function( lead, stream ){
      if ( 1 == stream.length && ! stream.match( selecter_comment_start_reqexp ) ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _selecter_comment_start_lexer';
      }
      else if ( 2 == stream.length && ! stream.match( selecter_comment_start_strict_reqexp ) ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _selecter_comment_start_lexer';
      }
      else if ( 3 == stream.length ) {
        return "selecter_comment_end";
      }
      return false;
    });
  };

  //--------------------------------------
  // コメントの終了の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._selecter_comment_end_lexer = function( style_sheet ){
    return this._lexer( "selecter_comment_end", style_sheet, function( lead, stream ){
      if ( 2 <= stream.length && stream.slice( 0, stream.length-1 ).match( selecter_comment_end_strict_reqexp ) ) {
        return "selecter_delimiter";
      }
      return false;
    });
  };

  //--------------------------------------
  // スタイル定義開始の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._style_open_lexer = function( style_sheet ){
    return this._lexer( "style_open", style_sheet, function( lead, stream ){
      // 1文字目は必ず{でなければならない
      if ( 1 == stream.length ) {
        if ( "{" != lead ) {
          console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
          throw 'errror _selecter_name_lexer';  
        }
      }
      // 2文字目以降
      else {
        return "style_name_delimiter";  // スタイルのプロパティ名の区切りへ
      }
    });
  };

  //--------------------------------------
  // スタイルのプロパティ名の区切の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._style_name_delimiter_lexer = function( style_sheet ){
    return this._lexer( "style_name_delimiter", style_sheet, function( lead, stream ){
      // 区切り文字として許可された文字以外が出現した時
      if ( ! lead.match( style_name_delimiter_regexp ) ) {
        // スタイルのプロパティ名として許可された値の時
        if ( lead.match( style_name_regexp ) ) return "style_name"; // スタイルのプロパティ名
        if ( "}" == lead ) return "style_close"; // スタイル定義の終了
        if ( lead.match( inner_comment_start_reqexp ) ) return "inner_comment_start"; // コメント開始

        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _style_name_delimiter_lexer';
      }
      return false;
    });
  };

  //--------------------------------------
  // スタイルのプロパティ名の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._style_name_lexer = function( style_sheet ){
    return this._lexer( "style_name", style_sheet, function( lead, stream ){
      // スタイルのプロパティ名として許可された文字以外が出現した時
      if ( ! lead.match( style_name_regexp ) ) return "style_value_delimiter"; // スタイル値の区切り
      return false;
    });
  };

  //--------------------------------------
  // スタイルの値の区切り文字の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._style_value_delimiter_lexer = function( style_sheet ){
    return this._lexer( "style_value_delimiter", style_sheet, function( lead, stream ){
      // スタイル値の区切り文字として許可された文字以外が出現した時
      if ( ! lead.match( style_value_delimiter_regexp ) ) {
        // スタイル値の区切り文字だが、厳密には適切ではない時
        var tmp = stream.slice( 0, stream.length-1 );
        if ( ! tmp.match( style_value_delimiter_strict_regexp ) ) {
          console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
          throw 'errror _style_value_delimiter_lexer';  
        }

        return "style_value"; // スタイル値
      }
      return false;
    });
  };

  //--------------------------------------
  // スタイル値の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._style_value_lexer = function( style_sheet ){
    return this._lexer( "style_value", style_sheet, function( lead, stream ){
      // スタイル値の文字として許可された文字以外が出現した時
      if ( ! lead.match( style_value_regexp ) ) return "style_name_delimiter"; // スタイル名の区切り
      return false;
    });
  };

  //--------------------------------------
  // コメントの開始の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._inner_comment_start_lexer = function( style_sheet ){
    return this._lexer( "inner_comment_start", style_sheet, function( lead, stream ){
      if ( 1 == stream.length && ! stream.match( inner_comment_start_reqexp ) ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _inner_comment_start_lexer';
      }
      else if ( 2 == stream.length && ! stream.match( inner_comment_start_strict_reqexp ) ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
        throw 'errror _inner_comment_start_lexer';
      }
      else if ( 3 == stream.length ) {
        return "inner_comment_end";
      }
      return false;
    });
  };

  //--------------------------------------
  // コメントの終了の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._inner_comment_end_lexer = function( style_sheet ){
    return this._lexer( "inner_comment_end", style_sheet, function( lead, stream ){
      if ( 2 <= stream.length && stream.slice( 0, stream.length-1 ).match( inner_comment_end_strict_reqexp ) ) {
        return "style_name_delimiter";
      }
      return false;
    });
  };

  //--------------------------------------
  // スタイル定義終了の字句解析
  //--------------------------------------
  StyleSheetPaser.prototype._style_close_lexer = function( style_sheet ){
    return this._lexer( "style_close", style_sheet, function( lead, stream ){
      // 1文字目は必ず}でなければならない
      if ( 1 == stream.length ) {
        if ( "}" != lead ) {
          console.error( "Lexer error : '" + stream.toString() + "' in '" + style_sheet.slice( 0, 100 ) + ( 100 < style_sheet.length ? "...'" : "'" ) );
          throw 'errror _selecter_name_lexer';  
        }
      }
      // 2文字目以降
      else {
        return "blank";  // 次のスタイル定義への間の空白区間
      }
    });
  };

  //--------------------------------------
  // レックス（字句解析）
  //--------------------------------------
  StyleSheetPaser.prototype._lex = function( org_style_sheet ){
    var style_sheet = org_style_sheet;

    // 字句解析テーブル
    var lexer_table = {
      "blank": this._blank_lexer.bind(this),
      "outer_comment_start": this._outer_comment_start_lexer.bind(this),
      "outer_comment_end": this._outer_comment_end_lexer.bind(this),
      "selecter_name": this._selecter_name_lexer.bind(this),
      "selecter_delimiter": this._selecter_delimiter_lexer.bind(this),
      "selecter_comment_start": this._selecter_comment_start_lexer.bind(this),
      "selecter_comment_end": this._selecter_comment_end_lexer.bind(this),
      "style_open": this._style_open_lexer.bind(this),
      "style_name_delimiter": this._style_name_delimiter_lexer.bind(this),
      "style_name": this._style_name_lexer.bind(this),
      "style_value_delimiter": this._style_value_delimiter_lexer.bind(this),
      "style_value": this._style_value_lexer.bind(this),
      "inner_comment_start": this._inner_comment_start_lexer.bind(this),
      "inner_comment_end": this._inner_comment_end_lexer.bind(this),
      "style_close": this._style_close_lexer.bind(this),
    }
    var token = null; // 字句解析結果
    var tokens = [];   // 構文解析用
    // 初期の字句解析のモード
    var current_lex_type = "blank";

    // 全ての文字を解析する
    while( 0 < style_sheet.length ) {
      if ( ! lexer_table[ current_lex_type ] ) {
        console.log( "Unknown lexer type" );
      }
      else {
        // 字句解析
        token = lexer_table[ current_lex_type ]( style_sheet )
        style_sheet = token.other;
        tokens.push( token );

        // 字句解析モードを遷移する
        current_lex_type = token.next_token_type;
      }
    }

    return tokens;
  }

  //--------------------------------------
  // 関連のあるトークン同士でまとめる
  //--------------------------------------
  StyleSheetPaser.prototype._generateChunks = function( tokens ){
    var chunks = [];
    for ( var i=0; i<tokens.length; i++ ) {
      switch( tokens[i].token_type ){
      // 構文に影響を与えないトークンは無視
      case "blank":
      case "style_name_delimiter":
      case "style_value_delimiter":
      case "outer_comment_start":
      case "outer_comment_end":
      case "selecter_comment_start":
      case "selecter_comment_end":
      case "inner_comment_start":
      case "inner_comment_end":
        break;

      case "selecter_name":
        // 最後のチャックがセレクタなら、トークンを追加する
        if ( 0 < chunks.length && "selecter" == chunks[ chunks.length - 1 ].chunk_type ) {
          chunks[ chunks.length - 1 ].tokens.push( tokens[i] );
        }
        // 直前のチャンクがセレクタでないなら、新しいチャンクを生成する
        else {
          chunks.push({
            chunk_type: "selecter",
            tokens: [ tokens[i] ],
            selecters: {},
          });  
        }
        break;

      case "style_open":
        chunks.push({
          chunk_type: "style",
          tokens: [ tokens[i] ],
          styles: {},
        });
        break;

      case "selecter_delimiter":
        // 最後のチャンクがセレクタならトークン追加
        if ( 0 < chunks.length && "selecter" == chunks[ chunks.length - 1 ].chunk_type ) {
          chunks[ chunks.length - 1 ].tokens.push( tokens[i] );
        }
        else {
          console.error( "Parser error : invalid chunks." );
          throw 'errror _generateChunks';
        }
        break;

      case "style_name":
      case "style_value":
      case "style_close":
        // 最後のチャンクがスタイルならトークン追加
        if ( 0 < chunks.length && "style" == chunks[ chunks.length - 1 ].chunk_type ) {
          chunks[ chunks.length - 1 ].tokens.push( tokens[i] );
        }
        else {
          console.error( "Parser error : invalid chunks." );
          throw 'errror _generateChunks';
        }
        break;

      default:
        console.error( "Parser error : Unknown token." );
        throw 'errror _generateChunks';
      }        
    }
    return chunks;
  };

  //--------------------------------------
  // セレクタの構文解析
  //--------------------------------------
  StyleSheetPaser.prototype._parseSelecter = function( chunk ){
    if ( "selecter" != chunk.chunk_type ) {
      console.error( "Parser error : invalid text" );
      throw 'errror _parseSelecter';
    }

    var selecters = {};
    var last_selecter = null;
    var last_token_type = null;
    var last_connecter = null;
    for ( var i=0; i<chunk.tokens.length; i++ ) {
      switch( chunk.tokens[i].token_type ){
      case "selecter_name":
        // セレクタが連続するのは構文エラー
        if ( null != last_token_type && "selecter_name" == last_token_type ) {
          console.error( "Parser error : invalid selecter" );
          throw 'errror _parseSelecter';
        }
        last_token_type = "selecter_name";

        var selecter_str = chunk.tokens[i].stream.replace( /(^[ \t]+|[ \t]+$)/i, "" );
        last_selecter = {
          object: null,
          id: null,
          classes: [],
          priority: 0,
          connection: null,
        };
        while( 0 < selecter_str.length ){
          // all objects
          if ( ! last_selecter.object && selecter_str.match(/^\*/i) ) {
            last_selecter.object = "*";
            selecter_str = selecter_str.slice( 1 );
          }
          // object
          else if ( ! last_selecter.object && selecter_str.match(/^[a-zA-Z0-9\-_]+/i) ) {
            var match = selecter_str.match(/^[a-zA-Z0-9\-_]+/i);
            last_selecter.object = match[0].toLowerCase();
            last_selecter.priority += 1;
            selecter_str = selecter_str.slice( match[0].length );
          }
          // id
          else if ( selecter_str.match(/^#[a-zA-Z0-9\-_]+/i) ) {
            var match = selecter_str.match(/^#[a-zA-Z0-9\-_]+/i);
            last_selecter.object = last_selecter.object || "*";
            last_selecter.id = match[0].slice(1);
            last_selecter.priority += 100;
            selecter_str = selecter_str.slice( match[0].length );
          }
          // class
          else if ( selecter_str.match(/^\.[a-zA-Z0-9\-_]+/i) ) {
            var match = selecter_str.match(/^\.[a-zA-Z0-9\-_]+/i);
            last_selecter.object = last_selecter.object || "*";
            last_selecter.classes.push( match[0].slice(1) );
            last_selecter.priority += 10;
            selecter_str = selecter_str.slice( match[0].length );
          }
          else {
            console.error( "Parser error : invalid selecter" );
            throw 'errror _parseSelecter';  
          }
        }

        // セレクタ名が無いのはエラー
        if ( 0 == last_selecter.object.length ) {
          console.error( "Parser error : invalid selecter" );
          throw 'errror _parseSelecter';
        }

        // 接続子でノード接続する
        if ( last_connecter ) {
          last_selecter.connection = last_connecter;
        }
        break;

      case "selecter_delimiter":
        // 接続セレクタが連続したり、直前がセレクタでない時は構文エラー
        if ( null == last_token_type && "selecter_name" != last_token_type ) {
          console.error( "Parser error : invalid selecter" );
          throw 'errror _parseSelecter';
        }
        last_token_type = "selecter_delimiter";

        // 子孫セレクタ
        if ( chunk.tokens[i].stream.match( selecter_descendants_strict_reqexp ) ) {
          last_connecter = {
            type: " ",
            selecter: null
          };
        }
        // 直下セレクタ
        else if ( chunk.tokens[i].stream.match( selecter_child_strict_reqexp ) ) {
          last_connecter = {
            type: ">",
            selecter: null
          };
        }
        // 隣接セレクタ
        else if ( chunk.tokens[i].stream.match( selecter_sibling_strict_reqexp ) ) {
          last_connecter = {
            type: "+",
            selecter: null
          };
        }
        // 間接セレクタ
        else if ( chunk.tokens[i].stream.match( selecter_combinator_strict_reqexp ) ) {
          last_connecter = {
            type: "~",
            selecter: null
          };
        }
        // 次のセレクタ
        else if ( chunk.tokens[i].stream.match( selecter_next_strict_reqexp ) ) {
          selecters[ last_selecter.object ] = selecters[ last_selecter.object ] || [];
          selecters[ last_selecter.object ].push( last_selecter );
          last_selecter = null;
          last_connecter = null;
        }
        // 空白と改行だけなら無視する
        else if ( chunk.tokens[i].stream.match( /^[ \t\r\n]+$/ ) ) {
          last_connecter = null;
        }
        else {
          console.error( "Parser error : invalid selecter" );
          throw 'errror _parseSelecter';
        }

        // セレクタ接続子に前回のセレクタを連結
        if ( last_connecter && last_selecter ) {
          last_connecter.selecter = last_selecter;
        }
        break;

      default:
        console.error( "Parser error : Unknown selecter token" );
        throw 'errror _parseSelecter';
      }
    }

    // 最後が接続子で終わるのはエラー（ただし、子孫セレクタが最後なら、ただの空白とみなす）
    if ( last_token_type == "selecter_delimiter" && last_connecter && " " != last_connecter.type ) {
      console.error( "Parser error : invalid selecter" );
      throw 'errror _parseSelecter';
    }
    // セレクタが無いのはエラー
    if ( ! last_selecter ) {
      console.error( "Parser error : invalid selecter" );
      throw 'errror _parseSelecter';
    }
    selecters[ last_selecter.object ] = selecters[ last_selecter.object ] || [];
    selecters[ last_selecter.object ].push( last_selecter );

    chunk.selecters = selecters;
  };

  //--------------------------------------
  // スタイルの構文解析
  //--------------------------------------
  StyleSheetPaser.prototype._parseStyle = function( chunk ){
    if ( "style" != chunk.chunk_type ) {
      console.error( "Parser error : invalid text" );
      throw 'errror _parseStyle';
    }

    // トークンの開始と最後はスタイル定義の開始と終了でなければならない
    if ( "style_open" != chunk.tokens[0].token_type || "style_close" != chunk.tokens[chunk.tokens.length-1].token_type ) {
      console.error( "Parser error : invalid text" );
      throw 'errror _parseStyle';
    }

    var styles = {};
    var last_style_type = null;
    var last_style_property = null;
    for ( var i=1; i<chunk.tokens.length-1; i++ ) {
      switch( chunk.tokens[i].token_type ){
      case "style_name":
        // スタイル属性名が連続するのはエラー
        if ( last_style_type && "style_name" == last_style_type ) {
          console.error( "Parser error : invalid text" );
          throw 'errror _parseStyle';    
        }
        last_style_type = "style_name";
        last_style_property = chunk.tokens[i].stream.replace( /(^[ \t]+|[ \t]+$)/i, "" );

        // スタイル属性名が無いのはエラー
        if ( 0 == last_style_property.length ) {
          console.error( "Parser error : invalid text" );
          throw 'errror _parseStyle';
        }
        break;

      case "style_value":
        // スタイル属性値が連続したり、スタイル属性名が存在しないのはエラー
        if ( ! last_style_type || "style_value" == last_style_type ) {
          console.error( "Parser error : invalid text" );
          throw 'errror _parseStyle';    
        }
        last_style_type = "style_value";
        styles[ last_style_property ] = chunk.tokens[i].stream.replace( /(^[ \t]+|[ \t]+$)/i, "" );
        break;

      default:
        console.error( "Parser error : Unknown style token" );
        throw 'errror _parseStyle';
      }
    }
    // 最後がスタイル属性名で終わるのはエラー
    if ( last_style_type && "style_name" == last_style_type ) {
      console.error( "Parser error : Unknown style token" );
      throw 'errror _parseStyle';
    }

    chunk.styles = styles;
  };

  //--------------------------------------
  // セレクタとスタイル定義のパース（構文解析）
  //--------------------------------------
  StyleSheetPaser.prototype._parseChunks = function( chunks ){
    for ( var i=0; i<chunks.length; i++ ) {
      switch( chunks[i].chunk_type ) {
      case "selecter":
        this._parseSelecter( chunks[i] );
        break;

      case "style":
        this._parseStyle( chunks[i] );
        break;
      }
    }
    return chunks;
  }

  //--------------------------------------
  // パース（構文解析）
  //--------------------------------------
  StyleSheetPaser.prototype._parse = function( tokens ){
    // セレクタとスタイル定義でトークンを分ける
    var chunks = this._generateChunks( tokens );
    // 構文解析
    return this._parseChunks( chunks );
  };

  //--------------------------------------
  // セレクタの優先度を合計する
  //--------------------------------------
  StyleSheetPaser.prototype._sumPriorities = function( selecter ){
    var priority = 0;
    while ( null != selecter ) {
      priority += selecter.priority;
      selecter = ( selecter.connection ? selecter.connection.selecter : null );
    }
    return priority;
  };

  //--------------------------------------
  // チャンクからスタイルオブジェクトの生成
  //--------------------------------------
  StyleSheetPaser.prototype._createObjects = function( chunks ){
    var styles = {};
    var last_selecters = null;
    var last_chunk_type = null;
    for ( var i=0; i<chunks.length; i++ ) {
      switch( chunks[i].chunk_type ) {
      case "selecter":
        // セレクタが連続するのはエラー
        if ( last_chunk_type && "selecter" == last_chunk_type ) {
          console.error( "Parser error : Unknown style token" );
          throw 'errror _createObjects';
        }
        last_chunk_type = "selecter";

        last_selecters = chunks[i].selecters;
        break;

      case "style":
        // スタイルが連続するか、セレクタが存在しないのはエラー
        if ( ! last_chunk_type || "style" == last_chunk_type || ! last_selecters ) {
          console.error( "Parser error : Unknown style token" );
          throw 'errror _createObjects';
        }
        last_chunk_type = "style";

        for ( var target_selecter in last_selecters ) {
          for ( var j=0; j<last_selecters[target_selecter].length; j++ ) {
            styles[ target_selecter ] = styles[ target_selecter ] || [];
            styles[ target_selecter ].push( {
              selecter: last_selecters[target_selecter][j],
              priority: this._sumPriorities( last_selecters[target_selecter][j] ),
              style: chunks[i].styles,
            } );  
          }
        }
        break;

      default:
        console.error( "Parser error : Unknown style token" );
        throw 'errror _createObjects';     
      }
    }
    // 最後がセレクターだけで終了
    if ( "selecter" == last_chunk_type ) {
      console.error( "Parser error : Unknown style token" );
      throw 'errror _createObjects';
    }

    // 優先順位の昇順でソート
    for ( var target in styles ) {
      styles[target].sort( function( a, b ){
        return a.priority - b.priority;
      } );
    }

    return styles;
  };

  //--------------------------------------
  // スタイルオブジェクトの生成
  //--------------------------------------
  StyleSheetPaser.prototype.createStyleSheet = function( org_style_sheet ){
    if ( "string" != typeof org_style_sheet ) {
      console.error("StyleSheetPaser.parse() only accepts strings.");
    }

    try {
      // 構文解析
      var chunks = this._parse( this._lex( org_style_sheet ) );
      // オブジェクトを生成する
      return this._createObjects( chunks );
    }
    catch( e ) {
      console.error( e );
      return null;
    }

  };
}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
StyleSheetPaser();
