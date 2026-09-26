/*------------------------------------------------------------------------------
  ファイル管理
------------------------------------------------------------------------------*/
function FileManager(){

  //--------------------------------------
  // ドラッグオーバー時動作
  //--------------------------------------
  FileManager.prototype._onDragover = function( event ){
    event.preventDefault();
    event.stopPropagation();
    return false;
  }.bind(this);

  //--------------------------------------
  // ドロップ時動作
  //--------------------------------------
  FileManager.prototype._onDrop = function( event ){
    event.preventDefault();
    event.stopPropagation();

    var files = event.originalEvent.dataTransfer.files;
    // SVGはテキストとして開く（埋め込みデータの有無はリスナー側で判定する）
    if ( this.listener.onOpenFileAsSvgText && ( "image/svg+xml" == files[0].type || files[0].name.match(/\.svg$/i) ) ) {
      this.openFileAsText( files[0], this.listener.onOpenFileAsSvgText.bind(this.listener) );
    }
    else if ( files[0].type.match(/^image\//) ) {
      this.openFileAsDataURL( files[0], this.listener.onOpenFileAsDataURL.bind(this.listener) );
    }
    else if ( files[0].type.match(/(^text\/|\/json$)/) ) {
      this.openFileAsText( files[0], this.listener.onOpenFileAsText.bind(this.listener) );
    }
    else {
      this.openFileAsBuffer( files[0], this.listener.onOpenFileAsBuffer.bind(this.listener) );
    }
  }.bind(this);

  //--------------------------------------
  // ペースト時動作
  //   OSクリップボードの内容はpasteイベントでのみ権限プロンプト無しで同期的に取得できる。
  //   （navigator.clipboard.read()はブラウザによって許可UIで保留され、ペーストが遅延・失敗するため使わない）
  //--------------------------------------
  FileManager.prototype._onPaste = function( event ){
    // テキスト入力中（textarea等へのフォーカス中）はブラウザ標準のペースト動作を妨げない
    var active_element = document.activeElement;
    if ( active_element && ( "TEXTAREA" == active_element.tagName || "INPUT" == active_element.tagName ) ) return;

    var clipboard_data = ( event.originalEvent || event ).clipboardData;
    if ( ! clipboard_data ) return;

    event.preventDefault();
    event.stopPropagation();

    // クリップボードに画像のバイナリファイルがあれば画像として開く
    var items = clipboard_data.items || [];
    for ( var i=0; i<items.length; i++ ) {
      if ( "file" == items[i].kind && items[i].type.match(/^image\//) ) {
        var file = items[i].getAsFile();
        if ( file ) {
          this.openFileAsDataURL( file, this.listener.onOpenFileAsDataURL.bind(this.listener) );
          return;
        }
      }
    }

    // 画像が無ければ通常のペースト操作としてリスナーに通知する
    if ( this.listener.onPasteWithoutImage ) this.listener.onPasteWithoutImage();
  }.bind(this);

  //--------------------------------------
  // コンストラクタ
  //--------------------------------------
  FileManager.prototype.initialize = function( listener ){
    this.listener = listener;

    // イベント登録（documentにdragover/dropイベントのリスナを登録し、バブリング停止しなければ、ブラウザ標準のファイルドロップ動作が発生してしまう）
    $(document).on( "dragover", this._onDragover );
    $(document).on( "drop", this._onDrop );
    $(document).on( "paste", this._onPaste );

    return this;
  };

  //--------------------------------------
  // ファイルをテキストで開く
  //--------------------------------------
  FileManager.prototype.openFileAsText = function( file_source, listener_func ){
    var reader = new FileReader();
    reader.onload = function(){
      listener_func( file_source, reader.result );
    }
    reader.readAsText( file_source );
  };
  
  //--------------------------------------
  // バイナリデータのdata-urlを取得する
  //--------------------------------------
  FileManager.prototype.openFileAsDataURL = function( file_source, listener_func ){
    var reader = new FileReader();
    reader.onload = function(){
      listener_func( file_source, reader.result );
    }
    reader.readAsDataURL( file_source );
  };

  //--------------------------------------
  // ファイルをバイナリで開く
  //--------------------------------------
  FileManager.prototype.openFileAsBuffer = function( file_source, listener_func ){
    var reader = new FileReader();
    reader.onload = function(){
      listener_func( file_source, reader.result );
    }
    reader.readAsArrayBuffer( file_source );
  };

  //--------------------------------------
  // ファイルをバッファストリングで開く
  //--------------------------------------
  FileManager.prototype.openFileAsBufferString = function( file_source, listener_func ){
    var reader = new FileReader();
    reader.onload = function(){
      listener_func( file_source, reader.result );
    }
    reader.readAsBinaryString( file_source );
  };

  //--------------------------------------
  // 指定のJSONファイルをダウンロードさせる
  //--------------------------------------
  FileManager.prototype.downloadJson = function( object, file_name ){
    var json = JSON.stringify( object );
    var blob = new Blob([ json ], {type: 'application/json'});

    this.downloadBlob( blob, file_name );
  };

  //--------------------------------------
  // 指定のBlobデータをダウンロードさせる
  //--------------------------------------
  FileManager.prototype.downloadBlob = function( blob, file_name ){
    var a_element = document.createElement("a");
    a_element.href = URL.createObjectURL( blob );
    a_element.download = file_name;

    document.body.appendChild( a_element );
    a_element.click();
    document.body.removeChild( a_element );
    setTimeout( function(){
      URL.revokeObjectURL( a_element.href );
    }, ( 1000 * 60 ) );
  };
}
FileManager();

/*------------------------------------------------------------------------------
  ファイルドロップ時のリスナー
------------------------------------------------------------------------------*/
function FileManagerListenerInterface(){
  FileManagerListenerInterface.prototype.onOpenFileAsText = function( file, text ){}; // テキストファイル
  FileManagerListenerInterface.prototype.onOpenFileAsDataURL = function( file, data_url ){}; // 画像のバイナリファイル（ドロップ・ペースト共通）
  FileManagerListenerInterface.prototype.onOpenFileAsSvgText = function( file, svg_text ){}; // SVGファイル（ドロップ）
  FileManagerListenerInterface.prototype.onOpenFileAsBuffer = function( file, buffer ){}; // 画像以外のバイナリファイル
  FileManagerListenerInterface.prototype.onPasteWithoutImage = function(){}; // 画像以外のペースト操作
}

