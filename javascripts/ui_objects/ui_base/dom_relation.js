/*------------------------------------------------------------------------------
  DOM関係オブジェクトベース
    全てのUIオブジェクトの基底
------------------------------------------------------------------------------*/
function DomRelation(){

  //--------------------------------------
  // 再描画要求
  //--------------------------------------
  DomRelation.prototype._requestDraw = function(){
    // 再描画要求
    if ( this.screen && this.screen.screen_manager ) {
      this.screen.screen_manager.requestDraw( this.screen );  
    }
  };

  //--------------------------------------
  // 再レイアウト・再描画要求
  //--------------------------------------
  DomRelation.prototype._requestRelayoutAndDraw = function(){
    // リレイアウトと再描画要求
    if ( this.screen && this.screen.screen_manager ) {
      this.screen.screen_manager.requestRelayout( this.screen );
      this.screen.screen_manager.requestDraw( this.screen );  
    }
  };

  //--------------------------------------
  // DOM関係初期化
  //--------------------------------------
  DomRelation.prototype._initializeDomRelation = function( name ){
    this.name = name || null;
    this.tag_name = null;
    this.classes = [];

    this.parent = null;
    this.prev = null;
    this.next = null;
    this.children = [];
  };

  //--------------------------------------
  // 子オブジェクトの追加
  //--------------------------------------
  DomRelation.prototype.appendObject = function( object ){
    // 子オブジェクト同士を連結するために、追加位置より前のオブジェクトを取得
    var prev = ( this.children.length > 0 ? this.children[ this.children.length - 1 ] : null );

    // 子として追加
    this.children.push( object );
    object.parent = this;

    // 兄弟オブジェクト同士の連結
    if ( prev ) prev.next = object;
    object.prev= prev;

    // 親からの継承のため、スタイルの再設定
    object.refreshStyle();
    object.display_context = this.display_context;

    this._requestRelayoutAndDraw();
    return this;
  };

  //--------------------------------------
  // 子オブジェクト（複数）の追加
  //--------------------------------------
  DomRelation.prototype.appendObjects = function( objects ){
    if ( false == objects instanceof Array ) objects = [ objects ];
    for ( var i=0; i<objects.length; i++ ) {
      this.appendObject( objects[i] );
    }

    return this;
  };

  //--------------------------------------
  // 子オブジェクトをHTMLで追加
  //--------------------------------------
  DomRelation.prototype.appendHtml = function( html_string ){
    this.appendObjects(
      ( new HTMLPaser() ).createObject( html_string )
    );
    return this;
  };

  //--------------------------------------
  // 子オブジェクトにテキストノードを追加
  //--------------------------------------
  DomRelation.prototype.appendText = function( text ){
    this.appendObject(
      ( new Text() ).initialize( null, null, text )
    );
    return this;
  };

  //--------------------------------------
  // 自オブジェクトの兄弟（弟）として追加
  //--------------------------------------
  DomRelation.prototype.appendNextObject = function( object ){
    if ( ! this.parent ) return this;

    // 親オブジェクトの中での自オブジェクトの位置を取得
    var index = this.indexMyselfInParent();
    if ( -1 == index ) return this;

    var prevObject = this.parent.children[ index ];
    var nextObject = null;

    // 自身が最後のオブジェクトだった
    if ( index == this.parent.children.length - 1 ) {
      this.parent.children.push( object );
    }
    // 自身が途中のオブジェクトだった
    else {
      nextObject = this.parent.children[ index + 1 ];
      this.parent.children.splice( index + 1, 0, object );
    }

    // 前後の兄弟オブジェクトとの連結
    prevObject.next = object;
    object.prev = prevObject;
    object.next = nextObject;
    if ( nextObject ) nextObject.prev = object;

    this._requestRelayoutAndDraw();
    return this;
  };

  //--------------------------------------
  // 自オブジェクトの兄弟（兄）として追加
  //--------------------------------------
  DomRelation.prototype.appendPrevObject = function( object ){
    if ( ! this.parent ) return this;

    // 親オブジェクトの中での自オブジェクトの位置を取得
    var index = this.indexMyselfInParent();
    if ( -1 == index ) return this;

    var prevObject = ( 0 < index ? this.parent.children[ index ] : null );
    var nextObject = this.parent.children[ index ];

    this.parent.children.splice( index, 0, object );

    // 前後の兄弟オブジェクトとの連結
    if ( prevObject ) prevObject.next = object;
    object.prev = prevObject;
    object.next = nextObject;
    nextObject.prev = object;

    this._requestRelayoutAndDraw();
    return this;
  };

  //--------------------------------------
  // 子オブジェクトの削除
  //--------------------------------------
  DomRelation.prototype.removeObject = function( object ){
    for ( var i=0; i<this.children.length; i++ ) {
      if ( this.children[i] == object ) {
        this.children.splice( i, 1 );
        return this;
      }
    }

    this._requestRelayoutAndDraw();
    return this;
  };

  //--------------------------------------
  // 子オブジェクトの全削除
  //--------------------------------------
  DomRelation.prototype.emptyObjects = function(){
    this.children = [];

    this._requestRelayoutAndDraw();
    return this;
  };

  //--------------------------------------
  // 自身を親からオブジェクト削除する
  //--------------------------------------
  DomRelation.prototype.detachObject = function(){
    if ( this.parent ) this.parent.removeObject( this );
    return this;
  };  

  //--------------------------------------
  // 自オブジェクトが親オブジェクトの子としてのインデックス番号を取得する
  //--------------------------------------
  DomRelation.prototype.indexMyselfInParent = function(){
    if ( ! this.parent ) return -1;

    for ( var i=0; i<this.parent.children.length; i++ ) {
      if ( this.parent.children[i] == this ) return i;
    }
    return -1;
  };

  //--------------------------------------
  // 子オブジェクトのうち、指定オブジェクトのインデックス番号を取得する
  //--------------------------------------
  DomRelation.prototype.indexInChildren = function( object ){
    for ( var i=0; i<this.children.length; i++ ) {
      if ( this.children[i] == object ) return i;
    }
    return -1;
  };

  //--------------------------------------
  // 兄弟オブジェクトのうち、指定オブジェクトのインデックス番号を取得する
  //--------------------------------------
  DomRelation.prototype.indexInParent = function( object ){
    if ( ! this.parent ) return -1;
    
    for ( var i=0; i<this.parent.children.length; i++ ) {
      if ( this.parent.children[i] == object ) return i;
    }
    return -1;
  };

  //--------------------------------------
  // 前の要素オブジェクトを取得
  //--------------------------------------
  DomRelation.prototype.prevElement = function(){
    var seek = this.prev;
    while ( null != seek ) {
      // テキスト以外なら終了
      if ( ! isIncludeArray( ["Text", "ChildText"], seek.objectName() ) ) return seek;
      seek = seek.prev;
    }
    return null;
  };

  //--------------------------------------
  // 指定のオブジェクトが祖先に存在するか？
  //--------------------------------------
  DomRelation.prototype.isAncestorBy = function( parent_object ){
    seek_parent = this.parent;
    while ( null != seek_parent ) {
      if ( seek_parent == parent_object ) return true;
      seek_parent = seek_parent.parent;
    }
    return false;
  };

  //--------------------------------------
  // 最初に見つかった指定の名前のオブジェクトを子孫まで辿って取得する
  //--------------------------------------
  DomRelation.prototype.findObjectByName = function( name ){
    for ( var i=0; i<this.children.length; i++ ) {
      if ( this.children[i].name == name ) return this.children[i];
      var tmp = this.children[i].findObjectByName( name );
      if ( tmp ) return tmp;
    }
    return null;
  };

  //--------------------------------------
  // 指定の名前のオブジェクトを子孫まで辿って取得する（複数対応）
  //--------------------------------------
  DomRelation.prototype.findObjectsByName = function( name ){
    var targets = [];
    for ( var i=0; i<this.children.length; i++ ) {
      if ( this.children[i].name == name ) targets.push( this.children[i] );
      targets = targets.concat( this.children[i].findObjectsByName( name ) );
    }
    return targets;
  };

  //--------------------------------------
  // 指定のクラス名のオブジェクトを子孫まで辿って取得する（複数対応）
  //--------------------------------------
  DomRelation.prototype.findObjectsByClass = function( class_name ){
    var targets = [];
    for ( var i=0; i<this.children.length; i++ ) {
      if ( isIncludeArray( this.children[i].classes, class_name ) ) targets.push( this.children[i] );
      targets = targets.concat( this.children[i].findObjectsByClass( class_name ) );
    }
    return targets;
  };

  //--------------------------------------
  // 指定の名前の親オブジェクトを取得する
  //--------------------------------------
  DomRelation.prototype.findParentByName = function( name ){
    if ( null == this.parent ) {
      return null;
    }
    else if ( this.parent.name == name ) {
      return this.parent
    }
    else {
      return this.parent.findParentByName( name );
    }
    return null;
  };

  //--------------------------------------
  // 指定のオブジェクト名（タグ名）を取得する
  //--------------------------------------
  DomRelation.prototype.findParentByObjectName = function( object_name ){
    if ( null == this.parent ) {
      return null;
    }
    else if ( this.parent && this.parent.objectName() == object_name ) {
      return this.parent
    }
    else if ( this.parent ) {
      return this.parent.findParentByObjectName( object_name );
    }
    return null;
  };

  //--------------------------------------
  // 指定の名前の子オブジェクトを取得する
  //--------------------------------------
  DomRelation.prototype.getChildByName = function( name ){
    for ( var i=0; i<this.children.length; i++ ) {
      if ( this.children[i].name == name ) return this.children[i];
    }
    return null;
  };

  //--------------------------------------
  // 指定のオブジェクト名の子オブジェクトを取得する
  //--------------------------------------
  DomRelation.prototype.getChildByObjectName = function( object_name ){
    for ( var i=0; i<this.children.length; i++ ) {
      if ( this.children[i].objectName() == object_name ) return this.children[i];
    }
    return null;
  };

  //--------------------------------------
  // 指定のインデックス番号の子オブジェクトを取得する
  //--------------------------------------
  DomRelation.prototype.getChildByIndex = function( index ){
    if ( 0 > index || index > this.children.length - 1) return null;
    return this.children[index];
  };

  //--------------------------------------
  // 指定ブロックが真を返すオブジェクトを昇順にツリー探索して検索する
  //--------------------------------------
  DomRelation.prototype.detectAscendingObject = function( detect_func ){
    detect_func = detect_func || function( object ){ return false; };
    function eachAscendingObject( object ){
      for ( var i=0; i<object.children.length; i++ ) {
        if ( detect_func.call( this, object.children[i] ) ) return object.children[i];
        var res = eachAscendingObject( object.children[i] );
        if ( res ) return res;
      }
      return null;
    }

    var res = null;
    // 子の探索
    res = eachAscendingObject( this );
    if ( res ) return res;
   
    // 親の兄弟を辿る
    var seek = this;
    while ( null != seek.parent ) {

      // 親の子の中で、自身よりも後のオブジェクトのみを検索対象にする
      var index = seek.indexInParent( seek );
      for ( var i=index+1; i<seek.parent.children.length; i++ ) {
        // 兄弟自身のチェック
        if ( detect_func.call( this, seek.parent.children[i] ) ) return seek.parent.children[i];
        // 兄弟の子の探索
        res = eachAscendingObject( seek.parent.children[i] )
        if ( res ) return res;
      }
      // 更に親を辿る
      seek = seek.parent;
    }

    return null;
  };

  //--------------------------------------
  // 指定ブロックが真を返すオブジェクトを降順にツリー探索して検索する
  //--------------------------------------
  DomRelation.prototype.detectDescendingObject = function( detect_func ){
    detect_func = detect_func || function( object ){ return false; };
    function eachAscendingObject( object ){
      for ( var i=object.children.length-1; i>=0; i-- ) {
        if ( detect_func.call( this, object.children[i] ) ) return object.children[i];
        var res = eachAscendingObject( object.children[i] );
        if ( res ) return res;
      }
      return null;
    }

    var res = null;
    // 子の探索
    res = eachAscendingObject( this );
    if ( res ) return res;
   
    // 親の兄弟を辿る
    var seek = this;
    while ( null != seek.parent ) {

      // 親の子の中で、自身よりも前のオブジェクトのみを検索対象にする
      var index = seek.indexInParent( seek );
      for ( var i=index-1; i>=0; i-- ) {
        // 兄弟自身のチェック
        if ( detect_func.call( this, seek.parent.children[i] ) ) return seek.parent.children[i];
        // 兄弟の子の探索
        res = eachAscendingObject( seek.parent.children[i] )
        if ( res ) return res;
      }
      // 更に親を辿る
      seek = seek.parent;
    }

    return null;
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
DomRelation();
