/*------------------------------------------------------------------------------
  HTMLパーサー
------------------------------------------------------------------------------*/
function HTMLPaser(){

  //--------------------------------------
  // 字句解析
  //--------------------------------------
  HTMLPaser.prototype._lexer = function( token_type, text, block_func ){
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
  // テキスト部の字句解析
  //--------------------------------------
  HTMLPaser.prototype._text_lexer = function( html ){
    return this._lexer( "text", html, function( lead, stream ){
      switch( lead ){
      case "<":
        return "tag_open"; // 字句解析モードの状態遷移先は開始タグ解析
      }
      return false;
    });
  };

  //--------------------------------------
  // 開始タグの開始マークアップ部の字句解析
  //--------------------------------------
  HTMLPaser.prototype._tag_open_lexer = function( html ){
    return this._lexer( "tag_open", html, function( lead, stream ){
      // 開始タグなのに1文字目が<じゃなかったらエラー
      if ( 1 == stream.length && "<" != lead ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
        throw 'errror _tag_open_lexer';
      }
      // 1文字目以降で英数字があったらタグ名の開始
      if ( 1 < stream.length ) {
        if ( lead.match(/[a-zA-Z0-9]/) ) {
          return "tag_name";  // 字句解析モードの状態遷移先はタグ名解析
        }
        else if ( "/" == lead ) {
          return "end_tag"  // 字句解析モードの状態遷移先は終了タグ
        }
      }
      return false;
    });
  };

  //--------------------------------------
  // 開始タグの終了マークアップ部の字句解析
  //--------------------------------------
  HTMLPaser.prototype._tag_close_lexer = function( html ){
    return this._lexer( "tag_close", html, function( lead, stream ){
      // 開始タグ終了なのに1文字目が>じゃなかったらエラー
      if ( 1 == stream.length && ">" != lead ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
        throw 'errror _tag_close_lexer';
      }
      if ( 1 < stream.length ) {
        return "text"; // 字句解析モードの状態遷移先はテキスト部
      }
      return false;
    });
  };

  //--------------------------------------
  // 終了タグ部の字句解析
  //--------------------------------------
  HTMLPaser.prototype._end_tag_lexer = function( html ){
    return this._lexer( "end_tag", html, function( lead, stream ){
      // 終了タグは1文字目が/でなければエラー
      if ( 1 == stream.length && "/" != lead ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
        throw 'errror _end_tag_lexer';
      }
      if ( 1 < stream.length ) {
        if ( lead.match(/[a-zA-Z0-9]/) ) {
          return "tag_name";  // 字句解析モードの状態遷移先はタグ名解析
        }
        else if ( ">" == lead ) {
          return "tag_close";  // 字句解析モードの状態遷移先は終了タグ
        }
        else {
          return "tag_delimiter"; // 字句解析モードの状態遷移先はタグ内の区切り文字・空白部の解析
        }
      }
      return false;
    });
  };

  //--------------------------------------
  // コメント開始の字句解析
  //--------------------------------------
  HTMLPaser.prototype._comment_start_lexer = function( html ){
    return this._lexer( "comment_start", html, function( lead, stream ){
      // コメント開始に使用可能な文字以外が出現するまで
      if ( ! lead.match(/[!\-]/) ) {
        // 3文字はあること
        if ( 3 < stream.length ) {
          if ( ! stream.match(/^!--/) ) {
            console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
            throw 'errror _tag_name_lexer';  
          }

          return "comment"; // 字句解析モードの状態遷移先はコメント部の解析
        }
        // コメントではない
        else {
          console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
          throw 'errror _comment_start';  
        }
      }
      // 3文字はあること
      else if ( 3 < stream.length ) {
        return "comment"; // 字句解析モードの状態遷移先はコメント部の解析
      }
      return false;
    });
  };

  //--------------------------------------
  // コメントの字句解析
  //--------------------------------------
  HTMLPaser.prototype._comment_lexer = function( html ){
    return this._lexer( "_comment", html, function( lead, stream ){
      // コメント終了の次の文字まで
      if ( stream.match(/-->$/) ) {
        return "tag_close"
      }
      return false;
    });
  };

  //--------------------------------------
  // タグ名部の字句解析
  //--------------------------------------
  HTMLPaser.prototype._tag_name_lexer = function( html ){
    return this._lexer( "tag_name", html, function( lead, stream ){
      // タグ名に使用可能な文字以外が出現するまで
      if ( ! lead.match(/[a-zA-Z0-9\-_]/) ) {
        // 最低でも1文字以上はあること
        if ( 1 < stream.length ) {
          // 空白系なら、タグの区切り文字解析に移行        
          if ( lead.match(/[ \t\r\n]/) ) {
            return "tag_delimiter"; // 字句解析モードの状態遷移先はタグ内の区切り文字・空白部の解析
          }
          else if ( "/" == lead ) {
            return "end_tag"; // 字句解析モードの状態遷移先は開始タグ終了の解析
          }
          else if ( ">" == lead ) {
            return "tag_close"; // 字句解析モードの状態遷移先は終了タグ
          }
          else if ( "!" == lead ) {
            return "comment_start"; // 字句解析モードの状態遷移先はコメント開始
          }
          // 空白以外ならエラー
          else {
            console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
            throw 'errror _tag_name_lexer';  
          }
        }
        // 名前が空ではならない
        else {
          console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
          throw 'errror _tag_name_lexer';  
        }
      }
      return false;
    });
  };

  //--------------------------------------
  // タグ内の区切り文字・空白部の解析
  //--------------------------------------
  HTMLPaser.prototype._tag_delimiter_lexer = function( html ){
    return this._lexer( "tag_delimiter", html, function( lead, stream ){
      switch( lead ){
      case ">":
        return "tag_close";  // 字句解析モードの状態遷移先は開始タグ終了の解析

      case "/":
        return "end_tag";  // 字句解析モードの状態遷移先は終了タグ

      default:
        if ( ! lead.match(/[ \t\r\n]/) ) {
          return "attribute_name";  // 字句解析モードの状態遷移先は属性名の解析
        }
      }
      return false;
    });
  };

  //--------------------------------------
  // 属性名部の字句解析
  //--------------------------------------
  HTMLPaser.prototype._attribute_name_lexer = function( html ){
    return this._lexer( "attribute_name", html, function( lead, stream ){
      // タグ名に使用可能な文字以外が出現するまで
      if ( ! lead.match(/[a-zA-Z0-9\-_]/) ) {
        // 空白や=なら属性値の区切り文字解析
        if ( 1 < stream.length && lead.match(/[ \t\r\n=]/) ) {
          return "attribute_delimiter"; // 字句解析モードの状態遷移先は属性値の区切り文字解析の解析
        }
        else if ( lead == ">" ) {
          return "tag_close";  // 字句解析モードの状態遷移先は開始タグ終了の解析
        }
        else if ( lead == "/" ) {
          return "end_tag";  // 字句解析モードの状態遷移先は終了タグ
        }

        // 空白や=以外ならエラー
        console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
        throw 'errror _attribute_name_lexer';
      }
      return false;
    });
  };

  //--------------------------------------
  // 属性値の区切り文字解析の解析
  //--------------------------------------
  HTMLPaser.prototype._attribute_delimiter_lexer = function( html ){
    return this._lexer( "attribute_delimiter", html, function( lead, stream ){
      // 空白か=以外が出たら解析終了
      if ( ! lead.match(/[ \t\r\n=]/) ) {
        // 途中に=は1つだけを許可
        if ( stream.slice( 0, stream.length - 1 ).match(/[ \t\r\n]*=[ \t\r\n]*/) ) {
          switch( lead ) {
          case '"':
            return "double_quote_attribute_value";  // 字句解析モードの状態遷移先はダブルクォートによる文字の属性値の解析

          case "'":
            return "single_quote_attribute_value";  // 字句解析モードの状態遷移先はシングルクォートによる文字の属性値の解析

          default:
            return "raw_attribute_value";  // 字句解析モードの状態遷移先は区切り文字無しの属性値の解析
          }
        }
        else if ( lead == ">" ) {
          return "tag_close";  // 字句解析モードの状態遷移先は開始タグ終了の解析
        }
        else if ( lead == "/" ) {
          return "end_tag";  // 字句解析モードの状態遷移先は終了タグ
        }
        else if ( lead.match(/[a-zA-Z0-9\-_]/) ) {
          return "attribute_name";  // 字句解析モードの状態遷移先は属性名の解析
        }
        // それ以外はエラー
        else {
          console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
          throw 'errror _attribute_delimiter_lexer';
          }
      }
      return false;
    });
  };
  
  //--------------------------------------
  // ダブルクォートによる文字の属性値部の字句解析
  //--------------------------------------
  HTMLPaser.prototype._double_quote_attribute_value_lexer = function( html ){
    var terminate_flag = false;
    return this._lexer( "double_quote_attribute_value", html, function( lead, stream ){
      if ( terminate_flag ) return "tag_delimiter";  // 字句解析モードの状態遷移先はタグ内の区切り文字解析

      // ダブルクォート囲みの属性値なのに1文字目が"じゃなかったらエラー
      if ( 1 == stream.length && '"' != lead ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
        throw 'errror _double_quote_attribute_value_lexer';
      }
      // 2文字目移行でダブルクォートが出現したら、次の文字で属性値の終了
      if ( 1 < stream.length && '"' == lead ) {
        terminate_flag = true;
      }

      return false;
    });
  };

  //--------------------------------------
  // シングルクォートによる文字の属性値部の字句解析
  //--------------------------------------
  HTMLPaser.prototype._single_quote_attribute_value_lexer = function( html ){
    var terminate_flag = false;
    return this._lexer( "single_quote_attribute_value", html, function( lead, stream ){
      if ( terminate_flag ) return "tag_delimiter";  // 字句解析モードの状態遷移先はタグ内の区切り文字解析
      // シングルクォート囲みの属性値なのに1文字目が"じゃなかったらエラー
      if ( 1 == stream.length && "'" != lead ) {
        console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
        throw 'errror _single_quote_attribute_value_lexer';
      }
      // 2文字目移行でシングルクォートが出現したら次の文字で属性値の終了
      if ( 1 < stream.length && "'" == lead ) {
        terminate_flag = true;
      }

      return false;
    });
  };

  //--------------------------------------
  // 区切り文字無しの属性値部の字句解析
  //--------------------------------------
  HTMLPaser.prototype._raw_attribute_value_lexer = function( html ){
    return this._lexer( "raw_attribute_value", html, function( lead, stream ){
      // 属性値に許された文字以外が出たら終了
      if ( ! lead.match(/[a-zA-Z0-9\-._:]/) ) {
        // 空白や>ならばタグの区切り文字解析に移行
        if ( 1 < stream.length && lead.match(/[ \t\r\n>]/) ) {
          return "tag_delimiter";  // 字句解析モードの状態遷移先はタグ内の区切り文字解析
        }

        // それ以外の文字が出現したのならエラー
        console.error( "Lexer error : '" + stream.toString() + "' in '" + html.slice( 0, 100 ) + ( 100 < html.length ? "...'" : "'" ) );
        throw 'errror _raw_attribute_value_lexer';
      }

      return false;
    });
  };

  //--------------------------------------
  // レックス（字句解析）
  //--------------------------------------
  HTMLPaser.prototype._lex = function( org_html ){
    var html = org_html;

    // 字句解析テーブル
    var lexer_table = {
      "text": this._text_lexer.bind(this),
      "tag_open": this._tag_open_lexer.bind(this),
      "tag_close": this._tag_close_lexer.bind(this),
      "comment_start": this._comment_start_lexer.bind(this),
      "comment": this._comment_lexer.bind(this),
      "end_tag": this._end_tag_lexer.bind(this),
      "tag_name": this._tag_name_lexer.bind(this),
      "tag_delimiter": this._tag_delimiter_lexer.bind(this),
      "attribute_name": this._attribute_name_lexer.bind(this),
      "attribute_delimiter": this._attribute_delimiter_lexer.bind(this),
      "double_quote_attribute_value": this._double_quote_attribute_value_lexer.bind(this),
      "single_quote_attribute_value": this._single_quote_attribute_value_lexer.bind(this),
      "raw_attribute_value": this._raw_attribute_value_lexer.bind(this),
    }
    var token = null; // 字句解析結果
    var tokens = [];   // 構文解析用
    // 初期の字句解析のモード
    var current_lex_type = "text";

    // 全ての文字を解析する
    while( 0 < html.length ) {
      if ( ! lexer_table[ current_lex_type ] ) {
        console.log( "Unknown lexer type" );
      }
      else {
        // 字句解析
        token = lexer_table[ current_lex_type ]( html )
        html = token.other;
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
  HTMLPaser.prototype._generateChunks = function( tokens ){
    var chunks = [];
    for ( var i=0; i<tokens.length; i++ ) {
      switch( tokens[i].token_type ){
      case "text":
        if ( 0 == tokens[i].stream.length ) continue;

        chunks.push({
          chunk_type: "text",
          tokens: [ tokens[i] ],
          text: null,
          children: [],
          parent: null,
        });
        break;

      case "tag_open":
        chunks.push({
          chunk_type: "element",
          tokens: [ tokens[i] ],
          // 以下、解析用の初期値
          start_tag: false,
          end_tag: false,
          tag_name: null,
          is_comment: false,
          attributes: [],
          last_attribute_name: null,
          children: [],
          parent: null,
        });
        break;

      default:
        if ( "element" != chunks[ chunks.length - 1 ].chunk_type ) {
          console.error( "Parser error : invalid chunks." );
          throw 'errror _generateChunks';
        }
        chunks[ chunks.length - 1 ].tokens.push( tokens[i] );
        break;
      }        
    }
    return chunks;
  };

  //--------------------------------------
  // テキストの構文解析
  //--------------------------------------
  HTMLPaser.prototype._parseText = function( chunk ){
    if ( "text" != chunk.chunk_type ) {
      console.error( "Parser error : invalid text" );
      throw 'errror _parseText';
    }

    for ( var i=0; i<chunk.tokens.length; i++ ) {
      if ( 0 < chunk.tokens[i].stream.length ) {
        chunk.text = ( chunk.text || "" ) + chunk.tokens[i].stream;
      }
    }
  };

  //--------------------------------------
  // 要素の構文解析
  //--------------------------------------
  HTMLPaser.prototype._parseElement = function( chunk ){
    if ( "element" != chunk.chunk_type || 0 == chunk.tokens.length ) {
      console.error( "Parser error : invalid element" );
      throw 'errror _parseElement';
    }

    // 最初はタグの開始マークアップでなければならない
    if ( "tag_open" != chunk.tokens[0].token_type ){
      console.error( "Parser error : '<' must be first in tag." );
      throw 'errror _parseElement';
    }
    // 最後はタグの終了マークアップでなければならない
    if ( "tag_close" != chunk.tokens[chunk.tokens.length-1].token_type ){
      console.error( "Parser error : '>' must be last in tag." );
      throw 'errror _parseElement';
    }
    // タグのマークアップの中身が空であってはならない
    if ( 2 >= chunk.tokens.length ){
      console.error( "Parser error : '>' must be last in tag." );
      throw 'errror _parseElement';
    }

    for ( var i=1; i<chunk.tokens.length-1; i++ ) {
      switch( chunk.tokens[i].token_type ){
      case "comment_start":
      case "comment":
        chunk.is_comment = true;
        break;

      case "tag_open":
      case "tag_close":
        // 開始や終了マークアップが途中に存在してはならない
        console.error( "Parser error : '<' or '>' must not duplicate in tag." );
        throw 'errror _parseElement';

      case "end_tag":
        // 2番目が終了タグのマークアップならば、終了タグとみなす
        if ( 1 == i ) {
          chunk.end_tag = true;
        }
        // 最後の1つ前が終了タグのマークアップならば、開始＆終了タグとみなす
        else if ( i==chunk.tokens.length - 2 ) {
          // 終了タグに、更に終了タグのマークアップをしてはならない
          if ( chunk.end_tag ) {
            console.error( "Parser error : '/' must not duplicate in tag." );
            throw 'errror _parseElement';  
          }
          chunk.start_tag = true;
          chunk.end_tag = true;
        }
        // 最初でも再度の1つ前以外で終了タグのマークアップが存在してはならない
        else {
          console.error( "Parser error : '/' must be first or last in tag." );
          throw 'errror _parseElement';
        }
        break;

      case "tag_name":
        // タグ名を記録
        chunk.tag_name = chunk.tokens[i].stream.toLowerCase();
        break;

      case "attribute_name":
        chunk.last_attribute_name = chunk.tokens[i].stream.toLowerCase();
        chunk.attributes[ chunk.last_attribute_name ] = "";
        break;

      case "double_quote_attribute_value":
      case "single_quote_attribute_value":
        chunk.attributes[ chunk.last_attribute_name ] = chunk.tokens[i].stream.slice( 1, chunk.tokens[i].stream.length-1 );
        chunk.last_attribute_name = null;
        break;

      case "raw_attribute_value":
        chunk.attributes[ chunk.last_attribute_name ] = chunk.tokens[i].stream;
        chunk.last_attribute_name = null;
        break;
      }
    }
    // コメントだった
    if ( chunk.is_comment ) {
      chunk.start_tag = true;
      chunk.end_tag = true;
    }
    // タグだった
    else {
      // 終了タグでないなら、開始タグ
      if ( ! chunk.end_tag ) chunk.start_tag = true;
      // タグ名がなければならない
      if ( ! chunk.tag_name ) {
        console.error( "Parser error : tag-name must be contain in tag." );
        throw 'errror _parseElement';
      }
      // 特定のタグ名ではタグは閉じたものにする
      switch( chunk.tag_name ){
      case "br":
      case "img":
      case "input":
      case "picture":
      case "text_input":
      case "checkbox":
      case "radio":
        chunk.end_tag = true;
        break;
      }
    }
  };

  //--------------------------------------
  // テキストと要素のパース（構文解析）
  //--------------------------------------
  HTMLPaser.prototype._parseChunks = function( chunks ){
    for ( var i=0; i<chunks.length; i++ ) {
      switch( chunks[i].chunk_type ) {
      case "text":
        this._parseText( chunks[i] );
        break;

      case "element":
        this._parseElement( chunks[i] );
        break;
      }
    }
    return chunks;
  }

  //--------------------------------------
  // パース（構文解析）
  //--------------------------------------
  HTMLPaser.prototype._parse = function( tokens ){
    // テキストと要素を大きく2つにチャンクを分ける
    var chunks = this._generateChunks( tokens );
    // テキストと要素の構文解析
    return this._parseChunks( chunks );
  };

  //--------------------------------------
  // 構文解析済みのデータをDOMツリーと同じ構成にする
  //--------------------------------------
  HTMLPaser.prototype._transformTree = function( chunks ){
    var tree_chunks = [];
    var current_parent = null;
    for ( var i=0; i<chunks.length; i++ ) {
      switch( chunks[i].chunk_type ){
      case "text":
        ( current_parent ? current_parent.children : tree_chunks ).push( chunks[i] );
        break;

      case "element":
        // 開始かつ終了タグならば、親子関係は変化しない
        if ( chunks[i].start_tag && chunks[i].end_tag ) {
          ( current_parent ? current_parent.children : tree_chunks ).push( chunks[i] );
        }
        // 開始タグなら、親子関係を新しくネストする
        else if ( chunks[i].start_tag ) {
          ( current_parent ? current_parent.children : tree_chunks ).push( chunks[i] );
          chunks[i].parent = current_parent;
          current_parent = chunks[i];
        }
        // 終了タグなら、親に戻る
        else {
          // 閉じるべき親を探す
          seek_parent = current_parent;
          while ( seek_parent ) {
            // 閉じるべき親がいたら、その親をカレントにする
            if ( seek_parent.tag_name == chunks[i].tag_name ) {
              current_parent = seek_parent.parent;
              break;
            }
            seek_parent = seek_parent.parent;
          }
        }
        break;
      }
    }
    return tree_chunks;
  };

  //--------------------------------------
  // 構文解析後のchunkからオブジェクトの生成
  //--------------------------------------
  HTMLPaser.prototype._createObjectBy = function( chunk ){
    if ( "text" == chunk.chunk_type ) {
      return ( new Text() ).initialize( null, null, chunk.text );
    }
    else if ( "element" == chunk.chunk_type ) {
      switch( chunk.tag_name ){
      // 何も生成せずに無視する要素
      case "html":
      case "head":
      case "meta":
      case "style":
      case "title":
      case "link":
      case "script":
      case "body":
        break;

      // ブロック要素
      case "div":
      case "ul":
      case "ol":
      case "li":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), ( chunk.attributes.style || null ) );

      case "h1":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), "font_size:30; margin:10 0 30 0;" + ( chunk.attributes.style || "" ) );

      case "h2":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), "font_size:26; margin:10 0 26 0;" + ( chunk.attributes.style || "" ) );

      case "h3":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), "font_size:22; margin:10 0 22 0;" + ( chunk.attributes.style || "" ) );

      case "h4":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), "font_size:18; margin:10 0 18 0;" + ( chunk.attributes.style || "" ) );

      case "h5":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), "font_size:16; margin:10 0 16 0;" + ( chunk.attributes.style || "" ) );

      case "h6":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), "font_size:14; margin:10 0 14 0;" + ( chunk.attributes.style || "" ) );

      case "p":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), "margin:12 0;" + ( chunk.attributes.style || "" ) );

      case "blockquote":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), "margin:0 12;" + ( chunk.attributes.style || "" ) );
    
      // インライン要素
      case "span":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), "display:inline;" + ( chunk.attributes.style || "" ) );

      // 対応するオブジェクトが存在する専用のもの
      case "br":
        return ( new Break() ).initialize( ( chunk.attributes.id || null ), null );

      case "img":
        var params = [];
        if ( chunk.attributes.src ) params.push( chunk.attributes.src );
        var attribute_to_style = "";
        if ( chunk.attributes.width ) attribute_to_style += `width:${chunk.attributes.width};`;
        if ( chunk.attributes.height ) attribute_to_style += `height:${chunk.attributes.height};`;
        return ( new Picture() ).initialize( ( chunk.attributes.id || null ), attribute_to_style + ( chunk.attributes.style || "" ), ...params );

      case "input":
        switch( chunk.attributes.type || "text" ) {
        case "text":
          return ( new TextInput() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), ( chunk.attributes.value || null ) );

        case "checkbox":
          return ( new Checkbox() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), ( chunk.attributes.value || null ), ( "undefined" != typeof chunk.attributes.checked ? true : false ) );

        case "radio":
          return ( new Radio() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), ( chunk.attributes.value || null ), ( "undefined" != typeof chunk.attributes.checked ? true : false ) );
        }

      case "select":
        return ( new PullDown() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), null );
      
      case "option":
        return ( new PullDownItem() ).initialize( ( chunk.attributes.value || chunk.attributes.id || null ), ( chunk.attributes.style || null ), null, ( "undefined" != typeof chunk.attributes.selected ? true : false ) );

      case "textarea":
        return ( new MultilineTextInput() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), ( chunk.attributes.value || null ) );

      case "button":
        return ( new Button() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), null );
        
      // 独自オブジェクト
      case "panel":
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), ( chunk.attributes.style || null ) );

      case "picture":
        var params = [];
        if ( chunk.attributes.src ) params.push( chunk.attributes.src );
        var attribute_to_style = "";
        if ( chunk.attributes.width ) attribute_to_style += `width:${chunk.attributes.width};`;
        if ( chunk.attributes.height ) attribute_to_style += `height:${chunk.attributes.height};`;
        return ( new Picture() ).initialize( ( chunk.attributes.id || null ), attribute_to_style + ( chunk.attributes.style || "" ), ...params );
  
      case "text_input":
        return ( new TextInput() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), ( chunk.attributes.value || null ) );
  
      case "multiline_text_input":
        return ( new MultilineTextInput() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), ( chunk.attributes.value || null ) );
        
      case "checkbox":
      return ( new Checkbox() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), ( chunk.attributes.value || null ), ( "undefined" != typeof chunk.attributes.checked ? true : false ) );
  
      case "radio":
        return ( new Radio() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), ( chunk.attributes.value || null ), ( "undefined" != typeof chunk.attributes.checked ? true : false ) );

      case "list":
      case "vertical_list":
      case "vselect":
        return ( new List() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), null );
      
      case "list_item":
      case "vertical_list_item":
      case "vertical_listitem":
      case "voption":
        return ( new ListItem() ).initialize( ( chunk.attributes.value || chunk.attributes.id || null ), ( chunk.attributes.style || null ), null, ( "undefined" != typeof chunk.attributes.selected ? true : false ) );

      case "horizontal_list":
      case "hselect":
        return ( new HorizontalList() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), null );
      
      case "horizontal_list_item":
      case "horizontal_listitem":
      case "hoption":
        return ( new HorizontalListItem() ).initialize( ( chunk.attributes.value || chunk.attributes.id || null ), ( chunk.attributes.style || null ), null, ( "undefined" != typeof chunk.attributes.selected ? true : false ) );
    
      case "pulldown":
      case "pull_down":
        return ( new PullDown() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), null );
      
      case "pulldown_item":
      case "pull_down_item":
        return ( new PullDownItem() ).initialize( ( chunk.attributes.value || chunk.attributes.id || null ), ( chunk.attributes.style || null ), null, ( "undefined" != typeof chunk.attributes.selected ? true : false ) );

      case "progress_bar":
        return ( new ProgressBar() ).initialize( ( chunk.attributes.id || chunk.attributes.name || null ), ( chunk.attributes.style || null ), ( chunk.attributes.value || null ) );

      case "toggle_panel":
        return ( new TogglePanel() ).initialize( ( chunk.attributes.id || null ), ( chunk.attributes.style || null ) );

      default:
        return ( new Panel() ).initialize( ( chunk.attributes.id || null ), ( chunk.attributes.style || null ) );
      }
    }
    return null;
  };

  //--------------------------------------
  // UIオブジェクトの生成
  //--------------------------------------
  HTMLPaser.prototype._createObjects = function( tree_chunks ){
    var objects = [];
    for ( var i=0; i<tree_chunks.length; i++ ) {
      if ( tree_chunks[i].is_comment ) continue;

      var object = this._createObjectBy( tree_chunks[i] );
      if ( object ) {
        // クラス定義がある場合には追加する
        if ( "element" == tree_chunks[i].chunk_type ) {
          if ( tree_chunks[i].attributes.class ) {
            object.classes = tree_chunks[i].attributes.class.replace(/[ \t]+/i," ").split(" ") || [];
          }
          if ( tree_chunks[i].tag_name ) {
            object.tag_name = tree_chunks[i].tag_name.toLowerCase();
          }
        }

        // オブジェクトに加える
        objects.push( object );
        if ( 0 < tree_chunks[i].children.length ) {
          var children = this._createObjects( tree_chunks[i].children );
          for ( var j=0; j<children.length; j++ ) {
            object.appendObject( children[j] );
          }
        }
      }
    }
    return objects;
  };

  //--------------------------------------
  // UIオブジェクトの生成
  //--------------------------------------
  HTMLPaser.prototype.createObject = function( org_html ){
    if ( "string" != typeof org_html ) {
      console.error("HTMLParser.parse() only accepts strings.");
    }

    try {
      // 構文解析
      var chunks = this._parse( this._lex( org_html ) );

      // ツリー形成に変換してオブジェクトを生成する
      return this._createObjects( this._transformTree( chunks ) );
    }
    catch( e ) {
      console.error( e );
      return null;
    }

  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
HTMLPaser();
