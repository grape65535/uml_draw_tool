/*------------------------------------------------------------------------------
  画像管理
------------------------------------------------------------------------------*/
function ImageManager(){

  //--------------------------------------
  // 初期化
  //--------------------------------------
  ImageManager.prototype._initializeContext = function(){
    this.images = {};
    this.loading_count = 0;
    this.loaded_count = 0;
  };

  //--------------------------------------
  // 画像の追加
  //--------------------------------------
  ImageManager.prototype._appendImage = function( name, path ){
    if ( this.images[ name ] ) return false;
    this.images[ name ] = new ImageContext();
    this.images[ name ].initialize( name, path );
    return true;

  };

  //--------------------------------------
  // パッケージ読込み開始
  //--------------------------------------
  ImageManager.prototype._startLoadImage = function( image_context, force_reload ){
    force_reload = force_reload || false;
    
    this.loading_count++;
    // データURLはリロード時に再読み込みさせない
    if ( force_reload && image_context.path.match(/^data:/) ) {
      this._onLoadedImage( image_context );
    }
    // 再読み込みやデータURLではない時の画像ロード
    else {
      image_context.element.src = image_context.path + ( force_reload ? '?' + new Date().getTime() : '' );
    }
  };

  //--------------------------------------
  // 画像読み込み完了時の処理
  //--------------------------------------
  ImageManager.prototype._onLoadedImage = function( image_context ){
    image_context.trim.width  = image_context.element.width;
    image_context.trim.height = image_context.element.height;
    image_context.is_loaded = true;
    this.loaded_count++;

    // リスナ呼び出し
    if ( this.listener && this.isLoaded() ) {
      this.listener.onLoadedImages( this );
    }
  };

  //--------------------------------------
  // コンストラクタ
  //--------------------------------------
  ImageManager.prototype.initialize = function( listener ){
    this.listener = listener || new ImageManagerListenerInterface();
    this._initializeContext();

    return this;
  };

  //--------------------------------------
  // 画像のロード
  //--------------------------------------
  ImageManager.prototype.loadImage = function( name, path ){
    // 同じ名前は登録不可とする
    if ( ! this._appendImage( name, path ) ) return this.images[ name ];
    // 読込みイベント設定
    $(this.images[ name ].element).on( "load", this._onLoadedImage.bind( this, this.images[ name ] ) );
    // 読込み開始
    this._startLoadImage( this.images[ name ] );

    return this.images[ name ];
  };

  //--------------------------------------
  // 画像の部分読込み
  //--------------------------------------
  ImageManager.prototype.loadPartialImage = function( name, path, index, offset_x, offset_y, width, height ){
    index = index || 0;
    // オリジナル画像の読込み
    var org_image_context = this.loadImage( name, path );
    var image_context = null;

    // 部分画像の読込み
    var partial_name = name + index.toString();
    org_image_context.partial_names.push( partial_name );
    if ( this._appendImage( partial_name, path ) ) {
      image_context = this.images[ partial_name ];
      image_context.element = org_image_context.element;
      image_context.source_context = org_image_context;
      image_context.trim.offset_x = offset_x;
      image_context.trim.offset_y = offset_y;
      image_context.trim.width = width;
      image_context.trim.height = height;
      image_context.trim.is_divided = true;
      image_context.is_loaded = true;   // オリジナル画像次第だけど、読込完了イベント発火しないので、この時点で完了したことにする  
    }
    return image_context || this.images[ partial_name ];
  };

  //--------------------------------------
  // 画像の分割読込
  //--------------------------------------
  ImageManager.prototype.loadDividedImages = function( name, path, x_num, y_num, width, height ){
    for ( var y=0; y<y_num; y++ ) {
      for ( var x=0; x<x_num; x++ ) {
        this.loadPartialImage( 
          name, path, 
          (( x_num * y ) + x ),   // index
          ( width * x ),          // offset_x
          ( height * y ),         // offset_y
          width,
          height
        );
      }
    }
  };

  //--------------------------------------
  // 画像の破棄
  //--------------------------------------
  ImageManager.prototype.deleteImage = function( name ){
    var image_context = this.images[ name ];
    if ( ! image_context ) return;

    // 指定画像と、その下の分割画像名を取得して削除する
    delete this.images[ name ];

    var image_names = image_context.partial_names;
    if ( image_names ) {
      for ( var i=0; i<image_names.length; i++ ) {
        delete this.images[ image_names[i] ];
      }
    }
  };

  //--------------------------------------
  // 全部画像の破棄
  //--------------------------------------
  ImageManager.prototype.deleteAll = function(){
    // パッケージ下の全ての画像を削除する
    for ( var name in this.images ) {
      this.deleteImage( name );
    }
  };

  //--------------------------------------
  // 読込進捗率を取得
  //--------------------------------------
  ImageManager.prototype.loadProgress = function(){
    if ( 0 == this.loading_count ) return 1.0;
    return this.loaded_count / this.loading_count;
  };

  //--------------------------------------
  // 読込完了？
  //--------------------------------------
  ImageManager.prototype.isLoaded = function(){
    return ( this.loaded_count == this.loading_count ? true : false );
  };

  //--------------------------------------
  // 画像情報の取得
  //--------------------------------------
  ImageManager.prototype.getImagedata = function( name ){
    if ( ! this.images[ name ] || ! this.images[ name ].is_loaded ) return null;
    return this.images[ name ];
  };

  //--------------------------------------
  // 画像再読み込み
  //--------------------------------------
  ImageManager.prototype.reload = function(){
    this.loading_count = 0;
    this.loaded_count = 0;
    for ( var name in this.images ) {
      // 分割データはスキップ
      if ( this.images[ name ].trim.is_divided ) continue;
      
      // 読込みイベント設定
      $(this.images[ name ].element).on( "load", this._onLoadedImage.bind( this, this.images[ name ] ) );
      // 強制再読み込み
      this._startLoadImage( this.images[name], true );
    }
  };
}
ImageManager();


/*------------------------------------------------------------------------------
  ImageManagerからのイベント処理を行うためのインタフェース
------------------------------------------------------------------------------*/
function ImageManagerListenerInterface(){
  ImageManagerListenerInterface.prototype.onLoadedImages = function( image_manager ){};
}

/*------------------------------------------------------------------------------
  画像データ
------------------------------------------------------------------------------*/
function ImageContext(){
  ImageContext.prototype.initialize = function( name, path ){
    this.name = name;
    this.partial_names = [];
    this.path = path;
    this.element = new Image();
    this.source_context = null;
    this.trim = {
      offset_x: 0,
      offset_y: 0,
      width: 0,
      height: 0,
      is_divided: false
    };
    this.is_loaded = false;
  };
}
ImageContext();

