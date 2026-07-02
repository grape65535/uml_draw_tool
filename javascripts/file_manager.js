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
    if ( files[0].type.match(/^image\//) ) {
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
  // コンストラクタ
  //--------------------------------------
  FileManager.prototype.initialize = function( listener ){
    this.listener = listener;

    // イベント登録（documentにdragover/dropイベントのリスナを登録し、バブリング停止しなければ、ブラウザ標準のファイルドロップ動作が発生してしまう）
    $(document).on( "dragover", this._onDragover );
    $(document).on( "drop", this._onDrop );

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
  FileManagerListenerInterface.prototype.onOpenFileAsDataURL = function( file, data_url ){}; // 画像のバイナリファイル
  FileManagerListenerInterface.prototype.onOpenFileAsBuffer = function( file, buffer ){}; // 画像以外のバイナリファイル
}

