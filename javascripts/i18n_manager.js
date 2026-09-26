/*------------------------------------------------------------------------------
  多言語対応（UI表示用文言の管理）
    文言は外部ファイル（i18n.json）に言語ごとに定義する。
    表示言語は、表示メニューで選択された言語（localStorageに記録）を優先し、
    未選択の時は navigator.language から判定する（日本語以外は英語とする）。
------------------------------------------------------------------------------*/
function I18nManager(){

  //--------------------------------------
  // 定数
  //--------------------------------------
  I18nManager.prototype.DEFAULT_LANGUAGE = "en";
  I18nManager.prototype.STORAGE_KEY = "uml_draw_tool_language";

  //--------------------------------------
  // 初期化
  //--------------------------------------
  I18nManager.prototype.initialize = function(){
    this.messages = {};
    this.language = this.DEFAULT_LANGUAGE;
    return this;
  };

  //--------------------------------------
  // 文言ファイルの読み込み
  //   読み込み完了後（失敗時も）にcallbackを呼び出す
  //--------------------------------------
  I18nManager.prototype.load = function( url, callback ){
    var request = new XMLHttpRequest();
    request.open( "GET", url, true );
    request.onload = function(){
      if ( 200 == request.status ) {
        try {
          this.messages = JSON.parse( request.responseText );
        }
        catch( e ) {
          console.error( `Cannot parse i18n file. : ${ url } : ${ e }` );
        }
      }
      else {
        console.error( `Cannot get i18n file. : ${ url } : status( ${ request.status } )` );
      }
      this.language = this.detectLanguage();
      callback();
    }.bind(this);
    request.onerror = function(){
      console.error( `XHR error. : ${ url }` );
      this.language = this.detectLanguage();
      callback();
    }.bind(this);
    request.send( null );
  };

  //--------------------------------------
  // 対応言語か？
  //--------------------------------------
  I18nManager.prototype.isSupportedLanguage = function( language ){
    return ( "string" == typeof language && this.messages.hasOwnProperty( language ) );
  };

  //--------------------------------------
  // 対応言語の一覧を取得
  //--------------------------------------
  I18nManager.prototype.supportedLanguages = function(){
    return Object.keys( this.messages );
  };

  //--------------------------------------
  // 表示言語の判定
  //--------------------------------------
  I18nManager.prototype.detectLanguage = function(){
    // 表示メニューで選択済みの言語
    var saved_language = null;
    try {
      saved_language = localStorage.getItem( this.STORAGE_KEY );
    }
    catch( e ) {
      saved_language = null;
    }
    if ( this.isSupportedLanguage( saved_language ) ) return saved_language;

    // ブラウザの言語設定（"ja-JP" などの地域付きは言語部分で判定する）
    var browser_language = ( navigator.language || "" ).toLowerCase().split( "-" )[0];
    if ( this.isSupportedLanguage( browser_language ) ) return browser_language;

    return this.DEFAULT_LANGUAGE;
  };

  //--------------------------------------
  // 表示言語の取得
  //--------------------------------------
  I18nManager.prototype.getLanguage = function(){
    return this.language;
  };

  //--------------------------------------
  // 表示言語の設定（選択した言語は次回以降も使用する）
  //--------------------------------------
  I18nManager.prototype.setLanguage = function( language ){
    if ( ! this.isSupportedLanguage( language ) ) return false;

    this.language = language;
    try {
      localStorage.setItem( this.STORAGE_KEY, language );
    }
    catch( e ) {
      ;
    }
    return true;
  };

  //--------------------------------------
  // HTML文書（タイトル・lang属性）に表示言語を反映する
  //   title ... 表示するタイトル（省略時は既定のタイトル）
  //--------------------------------------
  I18nManager.prototype.applyDocument = function( title ){
    document.title = title || this.t( "title" );
    document.documentElement.lang = this.language;
  };

  //--------------------------------------
  // 文言の検索（"ui.filemenu_file" の様にドット区切りで指定）
  //--------------------------------------
  I18nManager.prototype._lookup = function( language, key ){
    var seek = this.messages[ language ];
    var paths = key.split( "." );
    for ( var i=0; i<paths.length; i++ ) {
      if ( ! seek || "object" != typeof seek || ! seek.hasOwnProperty( paths[i] ) ) return null;
      seek = seek[ paths[i] ];
    }
    return seek;
  };

  //--------------------------------------
  // 文言の取得
  //   表示言語に無い時は既定言語、それも無い時はキーをそのまま返す
  //   language を指定した時は、その言語の文言を返す
  //--------------------------------------
  I18nManager.prototype.t = function( key, language ){
    var text = this._lookup( language || this.language, key );
    if ( "string" != typeof text ) text = this._lookup( this.DEFAULT_LANGUAGE, key );
    if ( "string" != typeof text ) text = key;
    return text;
  };

  //--------------------------------------
  // 指定グループ配下のキーの一覧を取得（"ui" など）
  //--------------------------------------
  I18nManager.prototype.keys = function( group ){
    var messages = this._lookup( this.language, group ) || this._lookup( this.DEFAULT_LANGUAGE, group ) || {};
    return Object.keys( messages );
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
I18nManager();

// UI表示用文言の管理（全画面共通）
var i18n = ( new I18nManager() ).initialize();
