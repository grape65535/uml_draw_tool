/*------------------------------------------------------------------------------
  多言語対応（UI表示用文言の管理）
    文言は言語ごとの外部ファイル（javascripts/i18n/<言語コード>.js）に定義する。
    file:// で開いた場合（サーバ無しでの利用）でも動作するよう、XHRではなく
    script要素で読み込み、グローバル変数 i18n_messages 経由で受け取る。
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
  //   messages ... 言語コードをキーとした文言（javascripts/i18n/*.js で登録した i18n_messages）
  //--------------------------------------
  I18nManager.prototype.initialize = function( messages ){
    this.messages = messages || {};
    this.language = this.detectLanguage();
    return this;
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
//   言語ごとの文言ファイル（javascripts/i18n/*.js）は、このファイルより前に読み込むこと
var i18n = ( new I18nManager() ).initialize( "undefined" != typeof i18n_messages ? i18n_messages : {} );
