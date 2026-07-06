/*------------------------------------------------------------------------------
  エディタ画面
------------------------------------------------------------------------------*/
function EditorScreen(){
  EditorScreen.prototype = Object.create( ScreenBase.prototype );

  //--------------------------------------
  // デバッグ矩形表示
  //--------------------------------------
  EditorScreen.prototype._debugUmlObjectRect = function( rects, prefix, parent ){
    rects = rects || {};
    prefix = prefix || "";
    if ( parent ) {
      for ( var key in parent.children ) {
        var uml_object = parent.children[key];
        rects[ prefix + key ] = {
          type: uml_object.type,
          x: uml_object.x,
          y: uml_object.y,
          width: uml_object.width,
          height: uml_object.height
        }
        this._debugUmlObjectRect( rects, prefix + key + ".", uml_object );
      }
    }
    else {
      for ( var key in this.save_data.objects ) {
        var uml_object = this.save_data.objects[key];
        rects[ key ] = {
          type: uml_object.type,
          x: uml_object.x,
          y: uml_object.y,
          width: uml_object.width,
          height: uml_object.height
        }
        this._debugUmlObjectRect( rects, key + ".", uml_object );
      }
    }
  };

  //--------------------------------------
  // デバッグObjct表示
  //--------------------------------------
  EditorScreen.prototype._debugObjectData = function( object, prefix ){
    prefix = prefix || "";
    var str = "";
    if ( object instanceof Array ) {
      for ( var i=0; i<object.length; i++ ) {
        str += `${prefix}  ${i} : ${ this._debugObjectData( object[i], prefix + "  " ) }\n`;
      }
      str = `[\n${str}${prefix}]`;
    }
    else if ( "object" == typeof object ) {
      for ( var key in object ) {
        str += `${prefix}  ${key} : ${ this._debugObjectData( object[key], prefix + "  " ) }\n`;
      }
      str = `{\n${str}${prefix}}`;
    }
    else {
      str = object.toString();
    }
    return str;
  };

  //--------------------------------------
  // デバッグ表示
  //--------------------------------------
  EditorScreen.prototype._debugUmlObjectData = function( uml_object ){
    // console.log( this._debugObjectData( uml_object ) );
    console.log( uml_object );
  };

  //--------------------------------------
  // ショートカットキーからデバッグ表示
  //--------------------------------------
  EditorScreen.prototype._logByShortCutKey = function( statuses ){
    if ( statuses.isDownKey( KEYCODE_D ) ) {
      var selected_uml_objects = this._selectedRootUmlObjects();
      for ( var i=0; i<selected_uml_objects.length; i++ ) {
        this._debugUmlObjectData( selected_uml_objects[i] );
      }
      return true;
    }
    return false;
  };

  /*------------------------------------------------------------------------------
    オブジェクトキーの操作
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // 全てのUMLオブジェクトを走査する
  //--------------------------------------
  EditorScreen.prototype._eachUmlObjects = function( iterator_function, parent ){
    if ( parent ) {
      for ( var key in parent.children ) {
        var uml_object = parent.children[key];
        iterator_function( uml_object );
        this._eachUmlObjects( iterator_function, uml_object );
      }
    }
    else {
      for ( var key in this.save_data.objects ) {
        var uml_object = this.save_data.objects[key];
        iterator_function( uml_object );
        this._eachUmlObjects( iterator_function, uml_object );
      }
    }
  };

  //--------------------------------------
  // UMLオブジェクトキーを選択可能なUMLオブジェクトキーに変換します
  //--------------------------------------
  EditorScreen.prototype._getSelectableUmlObjectKeyByKey = function( uml_object_key ){
    return uml_object_key.replace( /\.inner_shapes\..+$/i, "" );
  };

  //--------------------------------------
  // UMLオブジェクトキーから終端のUMLオブジェクトキーを取得する
  //--------------------------------------
  EditorScreen.prototype._getDescendantUmlObjectKeyByKey = function( uml_object_key ){
    var index = uml_object_key.search( /children\.(?!.*children)/i );
    return -1 == index ? uml_object_key : uml_object_key.slice( index + "children.".length );
  };

  //--------------------------------------
  // UMLオブジェクトキーから親UMLオブジェクトを取得する
  //--------------------------------------
  EditorScreen.prototype._getRootUmlObjectByKey = function( uml_object_key ){
    var keys = uml_object_key.split(".");
    var uml_object = this.save_data.objects[ keys[0] ] || null;
    if ( uml_object ) return uml_object;

    // 取得できなかった場合、グループ内のオブジェクトのIDかもしれない
    uml_object = this._findUmlObjectById( uml_object_key );
    if ( ! uml_object ) return null;

    // 親を探す
    return this._getRootUmlObjectByKey( uml_object.parent_id );
  };

  //--------------------------------------
  // UMLオブジェクトキーからUMLオブジェクトIDを取得する
  //--------------------------------------
  EditorScreen.prototype._getUmlObjectIdByKey = function( uml_object_key ){
    return this._getDescendantUmlObjectKeyByKey( uml_object_key ).split(".")[0];
  };

  //--------------------------------------
  // UMLオブジェクトキーから矩形情報を取得する
  //--------------------------------------
  EditorScreen.prototype._getInnerShapeKeyByKey = function( uml_object_key ){
    var keys = this._getDescendantUmlObjectKeyByKey( uml_object_key ).split(".");
    keys.splice( 0, 1 );
    return keys.join(".");
  };

  //--------------------------------------
  // UMLオブジェクトからフルのUMLオブジェクトキーを取得する
  //--------------------------------------
  EditorScreen.prototype._getFullUmlObjectKey = function( uml_object ){
    // 親がある？
    if ( uml_object.parent_id ) {
      return `${ this._getFullUmlObjectKey( this._findUmlObjectById( uml_object.parent_id ) ) }.children.${ uml_object.id }`
    }
    return uml_object.id;
  };

  //--------------------------------------
  // UMLオブジェクトキーからUMLオブジェクトを取得する
  //--------------------------------------
  EditorScreen.prototype._findUmlObjectByKey = function( uml_object_key, parent ){
    parent = parent || null;
    // 先頭はオブジェクトキーで、次はその属性名
    var keys = uml_object_key.split(".");
    var uml_object_key = keys[0];
    var propertiy_key = keys[1] || null;
    // 元のオブジェクトキーから、先頭のオブジェクトキーと属性名を削除する
    if ( "children" == propertiy_key ) {
      keys.splice( 0, 2 );
    }
    // 属性名が子でないのなら終端なので残りのキーは無し
    else {
      keys = [];
    }
    var child_uml_object_key = keys.join(".");    

    // 先頭のオブジェクトを探す
    var uml_object = null;
    if ( parent ) {
      uml_object = parent.children[ uml_object_key ];
    }
    else {
      uml_object = this.save_data.objects[ uml_object_key ];
    }

    // まだオジェクトキーが残っているのなら子を探す
    if ( 0 < child_uml_object_key.length ) {
      for ( var key in uml_object.children ) {
        var child_uml_object = this._findUmlObjectByKey( child_uml_object_key, uml_object );
        if ( child_uml_object ) return child_uml_object;
      }
      return null;
    }
    return uml_object
  };

  //--------------------------------------
  // UMLオブジェクトIDからUMLオブジェクトを取得する
  //--------------------------------------
  EditorScreen.prototype._findUmlObjectById = function( uml_object_id, parent ){
    parent = parent || null;

    var uml_object = null;
    if ( parent ) {
      uml_object = parent.children[ uml_object_id ];
      if ( uml_object ) return uml_object;

      for ( var key in parent.children ) {
        uml_object = this._findUmlObjectById( uml_object_id, parent.children[key] );
        if ( uml_object ) return uml_object;
      }
    }
    else {
      uml_object = this.save_data.objects[ uml_object_id ];
      if ( uml_object ) return uml_object;

      for ( var key in this.save_data.objects ) {
        uml_object = this._findUmlObjectById( uml_object_id, this.save_data.objects[key] );
        if ( uml_object ) return uml_object;
      }
    }
    return null;
  };

  //--------------------------------------
  // UMLオブジェクトキーから内部矩形を取得する
  //--------------------------------------
  EditorScreen.prototype._getUmlObjectInnerShapeByKey = function( uml_object_key ){
    // キー末端のオブジェクトを得る
    var descendant_uml_object = this._findUmlObjectByKey( uml_object_key );
    // キー末端の矩形選択キーを取得する
    var inner_shape_keys = this._getInnerShapeKeyByKey( uml_object_key ).split(".");
    // 矩形を取得する
    if ( descendant_uml_object ) {
      var seek = descendant_uml_object;
      for ( var i=0; i<inner_shape_keys.length; i++ ) {
        seek = seek[ inner_shape_keys[i] ];
      }
      return ( seek == descendant_uml_object ? null : seek );
    }
    return null;
  };

  /*------------------------------------------------------------------------------
    UMLオブジェクトの座標からの検索
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // 指定座標と重なっているUMLオブジェクトのキーを取得する
  //--------------------------------------
  EditorScreen.prototype._getHoverUmlObjectKeyByPoint = function( uml_object, x, y ){
    // グループの時
    if ( "group" == uml_object.type ) {
      for ( var key in uml_object.children ) {
        var hover_key = this._getHoverUmlObjectKeyByPoint( uml_object.children[key], x, y );
        if ( hover_key ) return `${uml_object.id}.children.${hover_key}`;
      }
      return null;
    }
    // 矩形と衝突している？
    for ( var key in uml_object.inner_rects ) {
      // 矩形中心は選択できない
      if ( uml_object.inner_rects[key].ignore_select ) {
        if ( 
           ( isCollisionPointAndLine( x, y, uml_object.inner_rects[key].x, uml_object.inner_rects[key].y, uml_object.inner_rects[key].x + uml_object.inner_rects[key].width, uml_object.inner_rects[key].y ) )
        || ( isCollisionPointAndLine( x, y, uml_object.inner_rects[key].x, uml_object.inner_rects[key].y + uml_object.inner_rects[key].height, uml_object.inner_rects[key].x + uml_object.inner_rects[key].width, uml_object.inner_rects[key].y + uml_object.inner_rects[key].height ) )
        || ( isCollisionPointAndLine( x, y, uml_object.inner_rects[key].x, uml_object.inner_rects[key].y, uml_object.inner_rects[key].x, uml_object.inner_rects[key].y + uml_object.inner_rects[key].height ) )
        || ( isCollisionPointAndLine( x, y, uml_object.inner_rects[key].x + uml_object.inner_rects[key].width, uml_object.inner_rects[key].y, uml_object.inner_rects[key].x + uml_object.inner_rects[key].width, uml_object.inner_rects[key].y + uml_object.inner_rects[key].height ) )
        ) {
          return `${uml_object.id}.inner_rects.${key}`;
        }  

      }
      // 矩形全体を選択可能
      else {
        if ( isCollisionPointAndRect( x, y, uml_object.inner_rects[key].x, uml_object.inner_rects[key].y, uml_object.inner_rects[key].width, uml_object.inner_rects[key].height ) ) {
          return `${uml_object.id}.inner_rects.${key}`;
        }  
      }
    }
    // 線と衝突している？
    for ( var i=0; i<uml_object.inner_lines.length-1; i++ ) {
      if ( uml_object.params["pathStyle"] == "curve" ) {
        var is_horizontal = ( ! uml_object.inner_lines[0].relation || isIncludeArray( [ "left", "right" ], uml_object.inner_lines[0].relation.base_type ) );
        if ( 3 <= uml_object.inner_lines.length ) {
          if ( is_horizontal ) {
            if ( uml_object.inner_lines[0].y <= uml_object.inner_lines[2].y && ( uml_object.inner_lines[1].y < uml_object.inner_lines[0].y || uml_object.inner_lines[2].y < uml_object.inner_lines[1].y  ) ) is_horizontal = false;
            if ( uml_object.inner_lines[0].y >  uml_object.inner_lines[2].y && ( uml_object.inner_lines[1].y < uml_object.inner_lines[2].y || uml_object.inner_lines[0].y < uml_object.inner_lines[1].y  ) ) is_horizontal = false;
          }
          else {
            if ( uml_object.inner_lines[0].x <= uml_object.inner_lines[2].x && ( uml_object.inner_lines[1].x < uml_object.inner_lines[0].x || uml_object.inner_lines[2].x < uml_object.inner_lines[1].x ) ) is_horizontal = true;
            if ( uml_object.inner_lines[0].x >  uml_object.inner_lines[2].x && ( uml_object.inner_lines[1].x < uml_object.inner_lines[2].x || uml_object.inner_lines[0].x < uml_object.inner_lines[1].x ) ) is_horizontal = true;
          }
        }
        var bezire_points = getBezierPointsByPoints( uml_object.inner_lines, is_horizontal )
        if ( isCollisionPointAndBezier( x, y, bezire_points ) ) {
          return `${uml_object.id}.inner_lines.${i}`;
        }  
      }
      else {
        if ( isCollisionPointAndLine( x, y, uml_object.inner_lines[i].x, uml_object.inner_lines[i].y, uml_object.inner_lines[i+1].x, uml_object.inner_lines[i+1].y ) ) {
          return `${uml_object.id}.inner_lines.${i}`;
        }
      }
    }
    // 各種図形と衝突している？
    for ( var key in uml_object.inner_shapes ) {
      switch ( uml_object.inner_shapes[key].type ) {
      case "rect":
        if ( isCollisionPointAndRect( x, y, uml_object.inner_shapes[key].x, uml_object.inner_shapes[key].y, uml_object.inner_shapes[key].width, uml_object.inner_shapes[key].height ) ) {
          return `${uml_object.id}.inner_shapes.${key}`;
        }
        break;
      case "circle":
        if ( isCollisionPointAndCircle( x, y, uml_object.inner_shapes[key].x, uml_object.inner_shapes[key].y, uml_object.inner_shapes[key].radius ) ) {
          return `${uml_object.id}.inner_shapes.${key}`;
        }
        break;
      case "line":
        if ( isCollisionPointAndLine( x, y, uml_object.inner_shapes[key].start.x, uml_object.inner_shapes[key].start.y, uml_object.inner_shapes[key].end.x, uml_object.inner_shapes[key].end.y ) ) {
          return `${uml_object.id}.inner_shapes.${key}`;
        }  
        break;
      case "polygon":
        if ( isCollisionPointAndPolygon( x, y, uml_object.inner_shapes[key].polygon ) ) {
          return `${uml_object.id}.inner_shapes.${key}`;
        }
        break;
      }
    }

    return null;
  };

  //--------------------------------------
  // 指定座標がUMLオブジェクトの上か？
  //--------------------------------------
  EditorScreen.prototype._isHoverUmlObjectByPoint = function( uml_object, x, y ){
    var key = this._getHoverUmlObjectKeyByPoint( uml_object, x, y );
    if ( key ) return true;
  };

  //--------------------------------------
  // 指定矩形の範囲にUMLオブジェクトがあるか？
  //--------------------------------------
  EditorScreen.prototype._isIncludeUmlObjectInRect = function( uml_object, x, y, width, height ){
    // グループの時
    if ( "group" == uml_object.type ) {
      for ( var key in uml_object.children ) {
        if ( this._isIncludeUmlObjectInRect( uml_object.children[key], x, y, width, height ) ) return true;
      }
      return false;
    }
    // 矩形と衝突している？
    for ( var key in uml_object.inner_rects ) {
      if ( isCollisionRectAndRect( uml_object.inner_rects[key].x, uml_object.inner_rects[key].y, uml_object.inner_rects[key].width, uml_object.inner_rects[key].height, x, y, width, height ) ) return true;
    }
    // 線と衝突している？
    for ( var i=0; i<uml_object.inner_lines.length-1; i++ ) {
      if ( isCollisionLineAndRect( uml_object.inner_lines[i].x, uml_object.inner_lines[i].y, uml_object.inner_lines[i+1].x, uml_object.inner_lines[i+1].y, x, y, width, height ) ) return true;
    }
    // 各種図形と衝突している？
    for ( var key in uml_object.inner_shapes ) {
      switch ( uml_object.inner_shapes[key].type ) {
      case "rect":
        if ( isCollisionRectAndRect( uml_object.inner_shapes[key].x, uml_object.inner_shapes[key].y, uml_object.inner_shapes[key].width, uml_object.inner_shapes[key].height, x, y, width, height ) ) return true;
        break;
      case "circle":
        if ( isCollisionRectAndCircle( x, y, width, height, uml_object.inner_shapes[key].x, uml_object.inner_shapes[key].y, uml_object.inner_shapes[key].radius ) ) return true;
        break;
      case "line":
        if ( isCollisionLineAndRect( uml_object.inner_shapes[key].start.x, uml_object.inner_shapes[key].start.y, uml_object.inner_shapes[key].end.x, uml_object.inner_shapes[key].end.y, x, y, width, height ) ) return true;
        break;
      case "polygon":
        if ( isCollisionRectAndPolygon( x, y, width, height, uml_object.inner_shapes[key].polygon ) ) return true;
        break;
      }
    }

    return false;
  };

  //--------------------------------------
  // 指定座標にあるUMLオブジェクトを探す
  //--------------------------------------
  EditorScreen.prototype._findHoverUmlObjectKeyByPoint = function( x, y ){
    // 選択中のものを優先して探す
    var selected_uml_objects = this._selectedRootUmlObjects();
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      var uml_object = selected_uml_objects[i];
      if ( isCollisionPointAndRect( x, y, uml_object.x-3, uml_object.y-3, uml_object.width+6, uml_object.height+6 ) ) {
        var object_key = this._getHoverUmlObjectKeyByPoint( uml_object, x, y );
        if ( object_key ) {
          return object_key;
        }
      }
    }

    // 未選択のものから探す（実際には選択中か否かの区別なく探す）
    for ( var i=this.save_data.priorities.length - 1; i>=0; i-- ) {
      var uml_object = this._getRootUmlObjectByKey( this.save_data.priorities[i] );
      if ( isCollisionPointAndRect( x, y, uml_object.x-3, uml_object.y-3, uml_object.width+6, uml_object.height+6 ) ) {
        if ( this._isHoverUmlObjectByPoint( uml_object, x, y ) ) {
          // 未選択状態から探す場合には、オブジェクト内部の矩形選択はさせないので、根のキーだけ返す
          return uml_object.id;
        }
      }
    }

    return null;
  };

  //--------------------------------------
  // 指定範囲にあるUMLオブジェクトを探す
  //--------------------------------------
  EditorScreen.prototype._findIncludeUmlObjectKeysInRect = function( x, y, width, height ){
    var include_keys = [];

    for ( var key in this.save_data.objects ) {
      var uml_object = this.save_data.objects[ key ];
      if ( isCollisionRectAndRect( x, y, width, height, uml_object.x, uml_object.y, uml_object.width, uml_object.height ) ) {
        if ( this._isIncludeUmlObjectInRect( uml_object, x, y, width, height ) ) {
          include_keys.push( uml_object.id );
        }
      }
    }

    return include_keys;
  };

  //--------------------------------------
  // 指定範囲に含むUMLオブジェクトを探す
  //--------------------------------------
  EditorScreen.prototype._findContainUmlObjectKeysInRect = function( x, y, width, height ){
    var include_keys = [];

    for ( var key in this.save_data.objects ) {
      var uml_object = this.save_data.objects[ key ];

      if (
         ( x <= uml_object.x && x + width >= uml_object.x + uml_object.width )
      && ( y <= uml_object.y && y + height >= uml_object.y + uml_object.height )
      ) {
        include_keys.push( uml_object.id );
      }
    }

    return include_keys;
  };

  //--------------------------------------
  // 指定UMLオブジェクトの指定包囲の接点情報を取得する
  //   direction
  //      上を0として、時計回りに右を1、下を2、左を3
  //--------------------------------------
  EditorScreen.prototype._getContactUmlObjectRectByDirection = function( uml_object, direction ){
    var contact = { x:uml_object.x, y:uml_object.y, offset: 0 };
    if ( 0 == direction || 2 == direction ) {
      contact.offset = Math.round( uml_object.width / 2 );
      contact.x += contact.offset;
      if ( 2 == direction ) contact.y += uml_object.height;
    }
    else {
      contact.offset = Math.round( uml_object.height / 2 );
      contact.y += contact.offset;
      if ( 1 == direction ) contact.x += uml_object.width;
    }

    return {
      owner:      uml_object,
      type:       "object_rect",
      base_type:  [ "top", "right", "bottom", "left" ][ direction ],
      distance:   0,
      contact:    { x:contact.x, y:contact.y },
      offset:     contact.offset,
      is_inside:  true
    };
  };

  //--------------------------------------
  // 指定UMLオブジェクトと座標の距離を取得する
  //--------------------------------------
  EditorScreen.prototype._getDistanceUmlObjectRectByPoint = function( uml_object, x, y ){
    // 指定座標と矩形の4辺との間の距離を計算し、最も近い辺への情報を取得する
    var contacts = getDistanceRectByPoint( x, y, { x: uml_object.x, y: uml_object.y, width: uml_object.width, height: uml_object.height } );
    contacts = contacts.sort( function( a, b ){ return a.distance - b.distance } );
    return {
      owner:      uml_object,
      type:       "object_rect",
      base_type:  contacts[0].type,
      distance:   contacts[0].distance,
      contact:    contacts[0].contact,
      // percent: ( "top" == contacts[0].type || "bottom" == contacts[0].type ? ( contacts[0].contact.x - uml_object.x ) / uml_object.width : ( contacts[0].contact.y - uml_object.y ) / uml_object.height )
      offset:     ( "top" == contacts[0].type || "bottom" == contacts[0].type ? ( contacts[0].contact.x - uml_object.x ) : ( contacts[0].contact.y - uml_object.y ) ),
      is_inside:  isCollisionPointAndRect( x, y, uml_object.x, uml_object.y, uml_object.width, uml_object.height )
    };
  };

  //--------------------------------------
  // 指定座標付近のUMLオブジェクト矩形を取得する
  //--------------------------------------
  EditorScreen.prototype._findNearUmlObjectByPoint = function( except_uml_object, x, y, parent ){
    parent = parent || null;
    
    var priorities = [];
    if ( parent ) {
      priorities = parent.priorities;
    }
    else {
      priorities = this.save_data.priorities;
    }

    // 全てのUMLオブジェクトの中で指定座標に近いものを探す
    var near_contact = null;
    for ( var i=priorities.length - 1; i>=0; i-- ) {
      // オブジェクトの矩形を構成する線と、座標の違い点を探す
      var uml_object = this._findUmlObjectById( priorities[i] );
      // 指定オブジェクトとリレーションオブジェクトは無視する
      if ( except_uml_object.id == uml_object.id || uml_object.type == "relation" ) continue;
      var contact = null;
      if ( uml_object.type == "group" ) {
        contact = this._findNearUmlObjectByPoint( except_uml_object, x, y, uml_object );
      }
      else {
        contact = this._getDistanceUmlObjectRectByPoint( uml_object, x, y );
      }
      if ( contact ) {
        // 座標と線の距離が30以下でないならスキップ
        if ( 30 < contact.distance ) continue;

        // 最も近いものを記録
        if ( ! near_contact || ( contact.is_inside && !near_contact.is_inside ) || near_contact.distance > contact.distance ) near_contact = contact;
      }
    }

    return near_contact;
  };

  //--------------------------------------
  // 指定のオブジェクトのリスト中で指定包囲に最も近いオブジェクトを1つ取得
  //   direction
  //     上を0として時計回りに、右を1、下を2、左を3
  //--------------------------------------
  EditorScreen.prototype._findUmlObjectByDirection = function( uml_objects, direction ){
    var nearest_val = null;
    var nearest_uml_object = null;
    for ( var i=0, length=uml_objects.length; i<length; i++ ) {
      if ( "relation" == uml_objects[i].type ) continue;
      var target_uml_object = uml_objects[i];

      // グルーピングされている場合には再起的に取得する
      if ( "group" == uml_objects[i].type ) {
        var children = [];
        for ( var key in target_uml_object.children ) {
          children.push( target_uml_object.children[key] );
        }
        target_uml_object = this._findUmlObjectByDirection( children, direction );
        if ( ! target_uml_object ) continue;
      }

      switch( direction ) {
      case 0:
        if ( ! nearest_uml_object || nearest_val > target_uml_object.y ) {
          nearest_val = target_uml_object.y;
          nearest_uml_object = target_uml_object;
        }
        break;

      case 1:
        if ( ! nearest_uml_object || nearest_val < target_uml_object.x + target_uml_object.width ) {
          nearest_val = target_uml_object.x + target_uml_object.width;
          nearest_uml_object = target_uml_object;
        }
        break;

      case 2:
        if ( ! nearest_uml_object || nearest_val < target_uml_object.y + target_uml_object.height ) {
          nearest_val = target_uml_object.y + target_uml_object.height;
          nearest_uml_object = target_uml_object;
        }
        break;

      case 3:
        if ( ! nearest_uml_object || nearest_val > target_uml_object.x ) {
          nearest_val = target_uml_object.x;
          nearest_uml_object = target_uml_object;
        }
        break;
      }
    }
    return nearest_uml_object;
  };

  //--------------------------------------
  // 指定のオブジェクトのリストを包含するサイズを取得する
  //--------------------------------------
  EditorScreen.prototype._getRectByUmlObjects = function( uml_objects ){
    if ( ! uml_objects || 0 == uml_objects.length ) return { x:0, y:0, width:0, height:0 };

    rect = {
      x:      uml_objects[0].x,
      y:      uml_objects[0].y,
      width:  uml_objects[0].width,
      height: uml_objects[0].height,
    };
    for ( var i=1, length=uml_objects.length; i<length; i++ ) {
      if ( rect.x > uml_objects[i].x ) {
        rect.width  +=  rect.x - uml_objects[i].x;
        rect.x      =   uml_objects[i].x;
      }
      if ( rect.x + rect.width < uml_objects[i].x + uml_objects[i].width ) {
        rect.width  =  uml_objects[i].x + uml_objects[i].width - rect.x;
      }
      if ( rect.y > uml_objects[i].y ) {
        rect.height +=  rect.y - uml_objects[i].y;
        rect.y      =   uml_objects[i].y;
      }
      if ( rect.y + rect.height < uml_objects[i].y + uml_objects[i].height ) {
        rect.height =  uml_objects[i].y + uml_objects[i].height - rect.y;
      }
    }

    return rect;
  };

  /*------------------------------------------------------------------------------
    UMLオブジェクトの選択
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // 選択済みのUMLオブジェクト（親）を取得する
  //--------------------------------------
  EditorScreen.prototype._selectedRootUmlObjects = function(){
    var selected_uml_objects = [];
    for ( var i=0; i<this.select_uml_object_ids.length; i++ ) {
      selected_uml_objects[i] = this._getRootUmlObjectByKey( this.select_uml_object_ids[i] )
    }
    return selected_uml_objects;
  };

  //--------------------------------------
  // 選択済みのUMLオブジェクトを取得する
  //--------------------------------------
  EditorScreen.prototype._selectedUmlObjects = function(){
    var selected_uml_objects = [];
    for ( var i=0; i<this.select_uml_object_ids.length; i++ ) {
      selected_uml_objects[i] = this._findUmlObjectByKey( this.select_uml_object_ids[i] )
    }
    return selected_uml_objects;
  };

  //--------------------------------------
  // 選択済みのUMLオブジェクトをグループ末端まで再起的に取得する
  //--------------------------------------
  EditorScreen.prototype._selectedDescendantUmlObjects = function( parent_uml_object ){
    var selected_uml_objects = [];
    if ( parent_uml_object ) {
      if ( parent_uml_object.type != "group" ) return [ parent_uml_object ];
      for ( var key in parent_uml_object.children ) {
        selected_uml_objects.push( ...this._selectedDescendantUmlObjects( parent_uml_object.children[ key ] ) );
      }
    }
    else {
      for ( var i=0; i<this.select_uml_object_ids.length; i++ ) {
        selected_uml_objects.push( ...this._selectedDescendantUmlObjects( this._findUmlObjectByKey( this.select_uml_object_ids[i] ) ) );
      }  
    }
    return selected_uml_objects;
  };

  //--------------------------------------
  // 選択済みのUMLオブジェクトの内部記録用配列の順序を、描画優先順でソートする
  //--------------------------------------
  EditorScreen.prototype._sortSelectedUmlObjectByPriority = function(){
    var selected_uml_objects = this._selectedRootUmlObjects();

    // 選択したオブジェクトのそれぞれの優先度を、idをキーとして取得
    var priority_map = {};
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      priority_map[ selected_uml_objects[i].id ] = this.save_data.priorities.indexOf( selected_uml_objects[i].id );
    }

    // ソート
    this.select_uml_object_ids = this.select_uml_object_ids.sort( function( a, b ){
      return priority_map[ a ] - priority_map[ b ];
    });
  };

  //--------------------------------------
  // 選択中のオブジェクトと同根ならキーを交換する
  //--------------------------------------
  EditorScreen.prototype._swapUmlObjectKeyBySelectedObjects = function( uml_object_key ){
    var root_uml_object = this._getRootUmlObjectByKey( uml_object_key );

    // 既に選択中のオブジェクトと同じ根なら、新しいオブジェクトキーに交換する
    for ( var i=0; i<this.select_uml_object_ids.length; i++ ) {
      var current_root_uml_object = this._getRootUmlObjectByKey( this.select_uml_object_ids[i] );
      // 同じ根だった
      if ( root_uml_object == current_root_uml_object ) {
        // 交換前に、現在の入力欄の内容を選択中オブジェクトへ反映しておく
        this._setSelectedUmlObjectParams();
        this.select_uml_object_ids[i] = this._getSelectableUmlObjectKeyByKey( uml_object_key );
        this._sortSelectedUmlObjectByPriority();
        this._generateDraggableToggles();
        // 交換後の選択（グループ内の特定オブジェクト等）に合わせてパラメータ欄を更新する
        this._refreshSelectedUmlObjectParams();
        return true;
      }
    }

    return false;
  };

  //--------------------------------------
  // 選択済みのUMLオブジェクトに同じキーが存在するか？
  //--------------------------------------
  EditorScreen.prototype._isIncludeSelectedUmlObjectByKey = function( uml_object_key ){
    var root_uml_object = this._getRootUmlObjectByKey( uml_object_key );

    // 既に選択中のオブジェクトと同じ根なら、新しいオブジェクトキーに交換する
    for ( var i=0; i<this.select_uml_object_ids.length; i++ ) {
      var current_root_uml_object = this._getRootUmlObjectByKey( this.select_uml_object_ids[i] );
      // 同じ根だった
      if ( root_uml_object == current_root_uml_object ) {
        return true;
      }
    }

    return false;
  };

  //--------------------------------------
  // UMLオブジェクトを追加する
  //   戻り値
  //     true  : 既に選択済みだった
  //     false : 新規追加した
  //--------------------------------------
  EditorScreen.prototype._appendSelectUmlObjectByKey = function( uml_object_key ){
    var root_uml_object = this._getRootUmlObjectByKey( uml_object_key );

    // 既に選択中のオブジェクトと同じ根なら、新しいオブジェクトキーに交換する
    if ( this._swapUmlObjectKeyBySelectedObjects( uml_object_key ) ) return true;

    // 同じ根のキーは無いので追加する
    this._setSelectedUmlObjectParams();
    this.select_uml_object_ids.push( root_uml_object.id );
    this._sortSelectedUmlObjectByPriority();
    this._generateDraggableToggles();
    this._refreshSelectedUmlObjectParams();
    return false;
  };

  //--------------------------------------
  // UMLオブジェクトを選択する
  //   戻り値
  //     true  : 既に選択済みだった
  //     false : 新規選択した
  //--------------------------------------
  EditorScreen.prototype._selectUmlObjectByKey = function( uml_object_key ){
    var root_uml_object = this._getRootUmlObjectByKey( uml_object_key );

    // 既に選択中のオブジェクトと同じ根なら、新しいオブジェクトキーに交換する
    if ( this._swapUmlObjectKeyBySelectedObjects( uml_object_key ) ) return true;

    // 同じ根のキーは無いので選択を切替える
    this._setSelectedUmlObjectParams();
    this.select_uml_object_ids = [ root_uml_object.id ];
    this._generateDraggableToggles();
    this._refreshSelectedUmlObjectParams();
    return false;
  };

  //--------------------------------------
  // UMLオブジェクトの選択を全て解除する
  //--------------------------------------
  EditorScreen.prototype._clearSelectedAllUmlObject = function(){
    this._setSelectedUmlObjectParams();
    this.select_uml_object_ids = [];
    this._generateDraggableToggles();
    this._refreshSelectedUmlObjectParams();
  };

  //--------------------------------------
  // 引数で指定したUMLオブジェクトの選択を解除する
  //--------------------------------------
  EditorScreen.prototype._clearSelectedUmlObjectByKey = function( uml_object_key ){
    var root_uml_object = this._getRootUmlObjectByKey( uml_object_key );

    // 既に選択中のオブジェクトと同一根であれば、指定のキーと交換する
    for ( var i=0; i<this.select_uml_object_ids.length; i++ ) {
      var current_root_uml_object = this._getRootUmlObjectByKey( this.select_uml_object_ids[i] );
      // 同じ根だった
      if ( root_uml_object.id == current_root_uml_object.id ) {
        this._setSelectedUmlObjectParams();
        this.select_uml_object_ids.splice( i, 1 );
        this._generateDraggableToggles();
        this._refreshSelectedUmlObjectParams();
        return;
      }
    }
  };

  //--------------------------------------
  // 指定のUMLオブジェクトキーは選択中か？
  //--------------------------------------
  EditorScreen.prototype._isSelectedUmlObjectByKey = function( uml_object_key ){
    for ( var i=0; i<this.select_uml_object_ids.length; i++ ) {
      // キーが完全一致するか、ルートが一致しているか
      if ( 
         ( this.select_uml_object_ids[i] == this._getSelectableUmlObjectKeyByKey( uml_object_key ) )
      || ( this._getRootUmlObjectByKey( this.select_uml_object_ids[i] ).id == this._getRootUmlObjectByKey( uml_object_key ).id )
      ) {
        return true;
      }
    }
    return false;
  }

  //--------------------------------------
  // 指定のUMLオブジェクトについてドラッグ可能なUMLオブジェクト変形様のトグルUIを生成
  //--------------------------------------
  EditorScreen.prototype._generateDraggableTogglesAt = function( uml_object_key ){
    var toggles = [];
    var uml_object = this._findUmlObjectByKey( uml_object_key );
    if ( uml_object.type == "group" ) return toggles;

    // 上下左右・角のサイズ変更トグル
    if ( uml_object.type != "relation" ) {
      if ( uml_object.fix_width && uml_object.fix_height ) {
        ;
      }
      else if ( uml_object.fix_width ) {
        toggles.push( { x:uml_object.x + Math.round( uml_object.width / 2 ), y:uml_object.y,                                       type:"top",          owner:uml_object, inner_shape:null } );
        toggles.push( { x:uml_object.x + Math.round( uml_object.width / 2 ), y:uml_object.y + uml_object.height,                   type:"bottom",       owner:uml_object, inner_shape:null } );
      }
      else if ( uml_object.fix_height ) {
        toggles.push( { x:uml_object.x,                                      y:uml_object.y + Math.round( uml_object.height / 2 ), type:"left",         owner:uml_object, inner_shape:null } );
        toggles.push( { x:uml_object.x + uml_object.width,                   y:uml_object.y + Math.round( uml_object.height / 2 ), type:"right",        owner:uml_object, inner_shape:null } );
      }
      else if ( uml_object.is_keep_aspect_rate ) {
        toggles.push( { x:uml_object.x,                                      y:uml_object.y,                                       type:"top-left",     owner:uml_object, inner_shape:null } );
        toggles.push( { x:uml_object.x + uml_object.width,                   y:uml_object.y,                                       type:"top-right",    owner:uml_object, inner_shape:null } );
        toggles.push( { x:uml_object.x,                                      y:uml_object.y + uml_object.height,                   type:"bottom-left",  owner:uml_object, inner_shape:null } );
        toggles.push( { x:uml_object.x + uml_object.width,                   y:uml_object.y + uml_object.height,                   type:"bottom-right", owner:uml_object, inner_shape:null } );
      }
      else {
        // 角
        toggles.push( { x:uml_object.x,                                      y:uml_object.y,                                       type:"top-left",     owner:uml_object, inner_shape:null } );
        toggles.push( { x:uml_object.x + uml_object.width,                   y:uml_object.y,                                       type:"top-right",    owner:uml_object, inner_shape:null } );
        toggles.push( { x:uml_object.x,                                      y:uml_object.y + uml_object.height,                   type:"bottom-left",  owner:uml_object, inner_shape:null } );
        toggles.push( { x:uml_object.x + uml_object.width,                   y:uml_object.y + uml_object.height,                   type:"bottom-right", owner:uml_object, inner_shape:null } );
        // 上下左右
        if ( 30 < uml_object.height && 30 < uml_object.width ) {
          toggles.push( { x:uml_object.x + Math.round( uml_object.width / 2 ), y:uml_object.y,                                       type:"top",          owner:uml_object, inner_shape:null } );
          toggles.push( { x:uml_object.x + Math.round( uml_object.width / 2 ), y:uml_object.y + uml_object.height,                   type:"bottom",       owner:uml_object, inner_shape:null } );  
          toggles.push( { x:uml_object.x,                                      y:uml_object.y + Math.round( uml_object.height / 2 ), type:"left",         owner:uml_object, inner_shape:null } );
          toggles.push( { x:uml_object.x + uml_object.width,                   y:uml_object.y + Math.round( uml_object.height / 2 ), type:"right",        owner:uml_object, inner_shape:null } );
        }
      }
    }
    for ( var key in uml_object.inner_rects ){
      // 内部矩形が全体幅と一致してない時だけ、パーティションの移動トグルを生成する
      if ( ! uml_object.inner_rects[ key ].is_bind_object_width ) {
        // 左右両方に連結する他の矩形が無いなら、左右にトグル生成
        if ( ! uml_object.inner_rects[ key ].left_rect_id && ! uml_object.inner_rects[ key ].right_rect_id ) {
          toggles.push( { x:uml_object.inner_rects[ key ].x,                                       y:uml_object.inner_rects[ key ].y + Math.round( uml_object.inner_rects[ key ].height / 2 ), type:"inner-left",  owner:uml_object, inner_shape: uml_object.inner_rects[ key ] } );
          toggles.push( { x:uml_object.inner_rects[ key ].x + uml_object.inner_rects[ key ].width, y:uml_object.inner_rects[ key ].y + Math.round( uml_object.inner_rects[ key ].height / 2 ), type:"inner-right", owner:uml_object, inner_shape: uml_object.inner_rects[ key ] } );
        }
        // 左に連結するトグルがある時にだけ、左にトグルを生成
        else if ( uml_object.inner_rects[ key ].left_rect_id ) {
          toggles.push( { x:uml_object.inner_rects[ key ].x,                                       y:uml_object.inner_rects[ key ].y + Math.round( uml_object.inner_rects[ key ].height / 2 ), type:"inner-left",  owner:uml_object, inner_shape: uml_object.inner_rects[ key ] } );
        }
      }
      // 内部矩形が全体高と一致してない時だけ、パーティションの移動トグルを生成する
      if ( ! uml_object.inner_rects[ key ].is_bind_object_height ) {
        // 上下両方に連結する他の矩形が無いなら、上下にトグル生成
        if ( ! uml_object.inner_rects[ key ].top_rect_id && ! uml_object.inner_rects[ key ].bottom_rect_id ) {
          toggles.push( { x:uml_object.inner_rects[ key ].x + Math.round( uml_object.inner_rects[ key ].width / 2 ), y:uml_object.inner_rects[ key ].y,                                        type:"inner-top",    owner:uml_object, inner_shape: uml_object.inner_rects[ key ] } );
          toggles.push( { x:uml_object.inner_rects[ key ].x + Math.round( uml_object.inner_rects[ key ].width / 2 ), y:uml_object.inner_rects[ key ].y + uml_object.inner_rects[ key ].height, type:"inner-bottom", owner:uml_object, inner_shape: uml_object.inner_rects[ key ] } );
        }
        // 上に連結するトグルがある時にだけ、上にトグルを生成
        else if ( uml_object.inner_rects[ key ].top_rect_id ) {
          toggles.push( { x:uml_object.inner_rects[ key ].x + Math.round( uml_object.inner_rects[ key ].width / 2 ), y:uml_object.inner_rects[ key ].y,                                        type:"inner-top",    owner:uml_object, inner_shape: uml_object.inner_rects[ key ] } );
        }
      }
    }
    // 内部の線は、始点・終点・中継点の全てにトグルを生成
    if ( 1 <= uml_object.inner_lines.length ) {
      toggles.push( { x:uml_object.inner_lines[0].x, y:uml_object.inner_lines[0].y, type:"inner-line-start", owner:uml_object, inner_shape: uml_object.inner_lines[0], related: ( uml_object.inner_lines[0].relation ? true : false ) } );
      for ( var i=1; i<uml_object.inner_lines.length - 1; i++ ){
        toggles.push( { x:uml_object.inner_lines[i].x, y:uml_object.inner_lines[i].y, type:"inner-line-relay", owner:uml_object, inner_shape: uml_object.inner_lines[i] } );
      }
      var i = uml_object.inner_lines.length - 1;
      toggles.push( { x:uml_object.inner_lines[i].x, y:uml_object.inner_lines[i].y, type:"inner-line-end", owner:uml_object, inner_shape: uml_object.inner_lines[i], related: ( uml_object.inner_lines[i].relation ? true : false ) } );
    }

    return toggles;
  };

  //--------------------------------------
  // ドラッグ可能なUMLオブジェクト変形様のトグルUIを生成
  //--------------------------------------
  EditorScreen.prototype._generateDraggableToggles = function(){
    this.draggable_toggles = [];
    for ( var i=0; i<this.select_uml_object_ids.length; i++ ) {
      this.draggable_toggles = this.draggable_toggles.concat( this._generateDraggableTogglesAt( this.select_uml_object_ids[i] ) );
    }
  };

  //--------------------------------------
  // オブジェクトのパラメータを再帰的に設定する
  //--------------------------------------
  EditorScreen.prototype._setUmlObjectParams = function( uml_object, params ){
    for ( var key in uml_object.params ) {
      // オブジェクトにもパラメータにも同じキーが存在する
      if ( "undefined" != typeof params[key] ) {
        // null以外の値がパラメータに与えられていたら、値を上書きする
        if ( null != params[key] ) {
          uml_object.params[key] = params[key];
        }
      }
    }
    // 子があれば、子のパラメータを設定する
    for ( var key in uml_object.children ) {
      this._setUmlObjectParams( uml_object.children[ key ], params );
    }
  };

  //--------------------------------------
  // オブジェクトのパラメータを再帰的に取得する
  //--------------------------------------
  EditorScreen.prototype._getUmlObjectParams = function( uml_object, params ){
    for ( var key in uml_object.params ) {
      // キーが重複している
      if ( "undefined" != typeof params[key] ) {
        // 値が異なっていたら、nullにする
        params[key] = ( params[key] != uml_object.params[key] ? null : params[key] );
      }
      // 重複していないキー
      else {
        params[key] = uml_object.params[key];
      }
    }
    // 子があれば、子のパラメータを収集する
    for ( var key in uml_object.children ) {
      this._getUmlObjectParams( uml_object.children[key], params );
    }
  };

  //--------------------------------------
  // オブジェクトのinner_shapesを再帰的に再生成する（グループの場合は子孫それぞれを再生成）
  //--------------------------------------
  EditorScreen.prototype._refreshInnerShapeByObjectDeep = function( uml_object ){
    if ( "group" == uml_object.type ) {
      for ( var key in uml_object.children ) {
        this._refreshInnerShapeByObjectDeep( uml_object.children[ key ] );
      }
    }
    else {
      uml_object.inner_shapes = this._refreshInnerShape( uml_object, uml_object.type );
    }
  };

  //--------------------------------------
  // 選択オブジェクトにパラメータを設定する
  //--------------------------------------
  EditorScreen.prototype._setSelectedUmlObjectParams = function(){

    // 入力フォームからパラメータを取得する
    var params = {};
    var keys = [ "fontSize", "nameAlign", "textAlign", "wordBreak", "pathStyle", "lineStyle", "lineStartStyle", "lineEndStyle", "lineColor", "backgroundColor", "textColor", "lineWidth" ];
    for ( var i=0; i<keys.length; i++ ) {
      var object = this.findObjectByName( `input_${ keys[i] }` );
      if ( object ) {
        var value = object.val();
        if ( null != value && "undefined" != typeof value && 0 < value.length ) {
          if ( "fontSize" == keys[i] || "lineWidth" == keys[i] ) {
            params[ keys[i] ] = parseInt( value );
          }
          else {
            params[ keys[i] ] = value;
          }
        }
      }
    }

    // 選択中のUMLオブジェクト（実体）にパラメータを設定する。
    //   グループ全体を選択している場合はグループに適用（_setUmlObjectParamsが子孫へ再帰適用）、
    //   グループ内の特定オブジェクトを選択（ドリルイン）している場合は当該オブジェクトのみに適用される。
    var selected_uml_objects = this._selectedUmlObjects();
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      this._setUmlObjectParams( selected_uml_objects[i], params );

      // 内部矩形（inner_shapes）の再生成（グループの場合は子孫それぞれを再生成）
      this._refreshInnerShapeByObjectDeep( selected_uml_objects[i] );
    }

    // データの記録
    this.data_manager.setData( this.save_data );

    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // 選択オブジェクトに関するパラメータ入力UIを生成する
  //--------------------------------------
  EditorScreen.prototype._refreshSelectedUmlObjectParams = function(){
    // 選択を末端（グループの子孫まで展開したリーフ）のオブジェクト単位で収集する。
    // グループを選択した場合は、その構成要素すべてを個別に対象とする（＝論理積を取るため）。
    // グループ内の特定オブジェクトを選択（ドリルイン）した場合は、そのオブジェクトのみが対象となる。
    var leaf_uml_objects = this._selectedDescendantUmlObjects();
    var params_list = [];
    for ( var i=0; i<leaf_uml_objects.length; i++ ) {
      params_list.push( leaf_uml_objects[i].params );
    }

    // 全ての対象オブジェクトに共通して存在するパラメータ（論理積）だけを対象とする。
    // 値が全オブジェクトで一致すればその値、異なる場合はnull（未選択表示）とする。
    var params = {};
    if ( 0 < params_list.length ) {
      for ( var key in params_list[0] ) {
        var is_common = true;
        var value = params_list[0][ key ];
        for ( var i=1; i<params_list.length; i++ ) {
          if ( ! params_list[i].hasOwnProperty( key ) ) { is_common = false; break; }
          if ( value != params_list[i][ key ] ) value = null;
        }
        if ( is_common ) params[ key ] = value;
      }
    }

    // UI用のHTML生成（表示順序を固定する。paramsに存在するキーのみ描画する）
    var ordered_keys = [ "fontSize", "nameAlign", "textAlign", "wordBreak", "textColor", "pathStyle", "lineStyle", "lineStartStyle", "lineEndStyle", "lineWidth", "lineColor", "backgroundColor" ];
    var html_string = "";
    for ( var ki=0; ki<ordered_keys.length; ki++ ) {
      var key = ordered_keys[ ki ];
      if ( ! params.hasOwnProperty( key ) ) continue;
      switch ( key ) {
      case "fontSize":
        html_string += `<div>${ key }<input id='input_${ key }' value='${ ( null != params[ key ] ? params[ key ] : "" ) }' /></div>`;
        break;

      case "nameAlign":
      case "textAlign":
        var options = "";
        if ( ! params[ key ] ) options += "<option value=''></option>";
        options += `<option value='left'   ${  "left"  == params[ key ] ? "selected" : "" }>left</option>`;
        options += `<option value='center' ${ "center" == params[ key ] ? "selected" : "" }>center</option>`;
        options += `<option value='right'  ${ "right"  == params[ key ] ? "selected" : "" }>right</option>`;
        html_string += `<div>${ key }<br/><select id='input_${ key }'>${ options }</select></div>`;
        break;

      case "wordBreak":
        var options = "";
        if ( ! params[ key ] ) options += "<option value=''></option>";
        options += `<option value='normal' ${ "normal" == params[ key ] ? "selected" : "" }>normal</option>`;
        options += `<option value='break'  ${ "break"  == params[ key ] ? "selected" : "" }>break</option>`;
        html_string += `<div>${ key }<br/><select id='input_${ key }'>${ options }</select></div>`;
        break;

      case "pathStyle":
        var options = "";
        if ( ! params[ key ] ) options += "<option value=''></option>";
        options += `<option value='line'  ${  "line" == params[ key ] ? "selected" : "" }>line</option>`;
        options += `<option value='curve' ${ "curve" == params[ key ] ? "selected" : "" }>curve</option>`;
        html_string += `<div>${ key }<br/><select id='input_${ key }'>${ options }</select></div>`;
        break;

      case "lineStyle":
        var options = "";
        if ( ! params[ key ] ) options += "<option value=''></option>";
        options += `<option value='solid'  ${  "solid" == params[ key ] ? "selected" : "" }>solid</option>`;
        options += `<option value='dashed' ${ "dashed" == params[ key ] ? "selected" : "" }>dashed</option>`;
        options += `<option value='dotted' ${ "dotted" == params[ key ] ? "selected" : "" }>dotted</option>`;
        html_string += `<div>${ key }<br/><select id='input_${ key }'>${ options }</select></div>`;
        break;

      case "lineStartStyle":
      case "lineEndStyle":
        var options = "";
        if ( ! params[ key ] ) options += "<option value=''></option>";
        options += `<option value='none'                 ${                 "none" == params[ key ] ? "selected" : "" }>none</option>`;
        options += `<option value='arrow'                ${                "arrow" == params[ key ] ? "selected" : "" }>arrow</option>`;
        options += `<option value='check_arrow'          ${          "check_arrow" == params[ key ] ? "selected" : "" }>check-arrow</option>`;
        options += `<option value='triangle_arrow'       ${       "triangle_arrow" == params[ key ] ? "selected" : "" }>triangle-arrow</option>`;
        options += `<option value='triangle_arrow_black' ${ "triangle_arrow_black" == params[ key ] ? "selected" : "" }>triangle-arrow(black)</option>`;
        options += `<option value='rhombus'              ${              "rhombus" == params[ key ] ? "selected" : "" }>rhombus</option>`;
        options += `<option value='rhombus_black'        ${        "rhombus_black" == params[ key ] ? "selected" : "" }>rhombus(black)</option>`;
        options += `<option value='circle'               ${               "circle" == params[ key ] ? "selected" : "" }>circle</option>`;
        options += `<option value='circle_black'         ${         "circle_black" == params[ key ] ? "selected" : "" }>circle(black)</option>`;
        html_string += `<div>${ key }<br/><select id='input_${ key }'>${ options }</select></div>`;
        break;

      case "lineColor":
        html_string += `<div>${ key }<br/><select id='input_${ key }'>${ this._buildColorOptions( params[ key ], true, false ) }</select></div>`;
        break;

      case "textColor":
        html_string += `<div>${ key }<br/><select id='input_${ key }'>${ this._buildColorOptions( params[ key ], true, false ) }</select></div>`;
        break;

      case "backgroundColor":
        html_string += `<div>${ key }<br/><select id='input_${ key }'>${ this._buildColorOptions( params[ key ], true, true ) }</select></div>`;
        break;

      case "lineWidth":
        var options = "";
        if ( ! params[ key ] ) options += "<option value=''></option>";
        for ( var w=1; w<=5; w++ ) {
          options += `<option value='${ w }' ${ w == params[ key ] ? "selected" : "" }>${ w }px</option>`;
        }
        html_string += `<div>${ key }<br/><select id='input_${ key }'>${ options }</select></div>`;
        break;
      }
    }

    // UI更新
    var ui_object = this.findObjectByName( "object_params" );
    ui_object.emptyObjects();
    ui_object.appendHtml( html_string );
  };

  //--------------------------------------
  // 全選択
  //--------------------------------------
  EditorScreen.prototype._allSelectUmlObject = function(){
    // 同じ根のキーは無いので追加する
    this._setSelectedUmlObjectParams();

    this._clearSelectedAllUmlObject();
    for ( var key in this.save_data.objects ) {
      this.select_uml_object_ids.push( key );
    }
    this._sortSelectedUmlObjectByPriority();
    this._generateDraggableToggles();
    this._refreshSelectedUmlObjectParams();

  };

  //--------------------------------------
  // ショートカットキーから全選択
  //--------------------------------------
  EditorScreen.prototype._allSelectByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_SELECT ) ) {
      this._allSelectUmlObject();
      return true;
    }
    return false;
  };

  /*------------------------------------------------------------------------------
    選択されたUMLオブジェクトの変形
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // オブジェクト内部矩形内のテキストサイズを取得
  //--------------------------------------
  EditorScreen.prototype._getTextSizeByInnerUmlObject = function( inner_rect, font_size ){
    if ( ! inner_rect.has_text || 0 == inner_rect.text.length ) return null;

    var text_rows = inner_rect.text.split("\n");
    var max_text_width = 0;
    for ( var i=0; i<text_rows.length; i++ ) {                
      var text_width = getTextWidth( text_rows[i], font_size )
      if ( max_text_width < text_width ) max_text_width = text_width;
    }

    // 縦書き
    if ( inner_rect.vertical_text ) {
      return {
        width:  ( font_size + 2 ) * text_rows.length + 6,
        height: max_text_width + 6,
      };
    }
    // 横書き
    else {
      return {
        width:  max_text_width + 6,
        height: ( font_size + 2 ) * text_rows.length + 6,
      };
    }
  };

  //--------------------------------------
  // オブジェクトのテキストサイズを取得
  //--------------------------------------
  EditorScreen.prototype._getTextSizeByUmlObject = function( uml_object, inner_rect ){
    if ( inner_rect ) return this._getTextSizeByInnerUmlObject( inner_rect, uml_object.params["fontSize"] );

    var size = { width: null, height: null };
    for ( var key in uml_object.inner_rects ) {
      var tmp_size = this._getTextSizeByInnerUmlObject( uml_object.inner_rects[ key ], uml_object.params["fontSize"] );
      if ( tmp_size ) {
        if ( ! size.width  || size.width < tmp_size.width   ) size.width = tmp_size.width;
        if ( ! size.height || size.height < tmp_size.height ) size.height = tmp_size.height;
      }
    }

    return ( size.width ? size : null );
  };

  //--------------------------------------
  // UMLオブジェクト内部座標の移動
  //--------------------------------------
  EditorScreen.prototype._translateInnerUmlObject = function( uml_object, move_amount_x, move_amount_y, move_amount_width, move_amount_height ){
    if ( "undefined" == typeof move_amount_width ) move_amount_width = 0;
    if ( "undefined" == typeof move_amount_height ) move_amount_height = 0;
    var width_scale_rate = uml_object.width / ( uml_object.width - move_amount_width );
    var height_scale_rate = uml_object.height / ( uml_object.height - move_amount_height );

    // 内部座標の更新
    for ( var key in uml_object.inner_rects ) {
      uml_object.inner_rects[key].x += move_amount_x;
      uml_object.inner_rects[key].y += move_amount_y;

      // 内部矩形がオブジェクト幅と一致する時は無条件で変形
      if ( uml_object.inner_rects[key].is_bind_object_width ) {
        uml_object.inner_rects[key].width *= width_scale_rate;
        uml_object.inner_rects[key].x = uml_object.x + ( uml_object.inner_rects[key].x - uml_object.x ) * width_scale_rate;
      }
      // 内部矩形がオブジェクト幅と一致させない時は、内部矩形リンクの最後のオブジェクトだけ変形
      else if ( ! uml_object.inner_rects[key].right_rect_id ) {
        uml_object.inner_rects[key].width += move_amount_width;
      }
      // 内部矩形がオブジェクト高さと一致する時は無条件で変形
      if ( uml_object.inner_rects[key].is_bind_object_height ) {
        uml_object.inner_rects[key].height *= height_scale_rate;
        uml_object.inner_rects[key].y = uml_object.y + ( uml_object.inner_rects[key].y - uml_object.y ) * height_scale_rate;
      }
      // 内部矩形がオブジェクト高さと一致させない時は、内部矩形リンクの最後のオブジェクトだけ変形
      else if ( ! uml_object.inner_rects[key].bottom_rect_id ) {
        uml_object.inner_rects[key].height += move_amount_height;
      }
    }
    for ( var i=0; i<uml_object.inner_lines.length; i++ ) {
      if ( uml_object.inner_lines[i].relation ) continue;

      uml_object.inner_lines[i].x += move_amount_x;
      uml_object.inner_lines[i].y += move_amount_y;
    }
    for ( var key in uml_object.inner_shapes ) {
      switch( uml_object.inner_shapes[key].type ) {
      case "line":
        uml_object.inner_shapes[key].start.x += move_amount_x;
        uml_object.inner_shapes[key].start.y += move_amount_y;
        uml_object.inner_shapes[key].end.x   += move_amount_x;
        uml_object.inner_shapes[key].end.y   += move_amount_y;

        uml_object.inner_shapes[key].start.x = uml_object.x + ( uml_object.inner_shapes[key].start.x - uml_object.x ) * width_scale_rate;
        uml_object.inner_shapes[key].start.y = uml_object.y + ( uml_object.inner_shapes[key].start.y - uml_object.y ) * height_scale_rate;
        uml_object.inner_shapes[key].end.x   = uml_object.x + ( uml_object.inner_shapes[key].end.x - uml_object.x ) * width_scale_rate;
        uml_object.inner_shapes[key].end.y   = uml_object.y + ( uml_object.inner_shapes[key].end.y - uml_object.y ) * height_scale_rate;
        break;

      case "rect":
        uml_object.inner_shapes[key].x += move_amount_x;
        uml_object.inner_shapes[key].y += move_amount_y;
        uml_object.inner_shapes[key].width += move_amount_width;
        uml_object.inner_shapes[key].height += move_amount_height;  

        uml_object.inner_shapes[key].x = uml_object.x + ( uml_object.inner_shapes[key].x - uml_object.x ) * width_scale_rate;
        uml_object.inner_shapes[key].y = uml_object.y + ( uml_object.inner_shapes[key].y - uml_object.y ) * height_scale_rate;
        break;

      case "circle":
        uml_object.inner_shapes[key].x += move_amount_x;
        uml_object.inner_shapes[key].y += move_amount_y;
        uml_object.inner_shapes[key].radius += move_amount_width/2;
        if ( 0 > uml_object.inner_shapes[key].radius ) uml_object.inner_shapes[key].radius = 0;

        uml_object.inner_shapes[key].x = uml_object.x + ( uml_object.inner_shapes[key].x - uml_object.x ) * width_scale_rate;
        uml_object.inner_shapes[key].y = uml_object.y + ( uml_object.inner_shapes[key].y - uml_object.y ) * height_scale_rate;
        break;

      case "polygon":
        var polygon = [];
        for ( var i=0; i<uml_object.inner_shapes[key].polygon.length; i++ ) {
          uml_object.inner_shapes[key].polygon[i].x += move_amount_x;
          uml_object.inner_shapes[key].polygon[i].y += move_amount_y;

          uml_object.inner_shapes[key].polygon[i].x = uml_object.x + ( uml_object.inner_shapes[key].polygon[i].x - uml_object.x ) * width_scale_rate;
          uml_object.inner_shapes[key].polygon[i].y = uml_object.y + ( uml_object.inner_shapes[key].polygon[i].y - uml_object.y ) * height_scale_rate;
        }
        break;
      }
    }
    // 子オブジェクトが存在するなら移動する
    for ( var key in uml_object.children ) {
      this._translateUmlObject( uml_object.children[key], move_amount_x, move_amount_y, move_amount_width, move_amount_height );
    }
  };

  //--------------------------------------
  // UMLオブジェクト内部図形の補正
  //--------------------------------------
  EditorScreen.prototype._normalizationInnerRect = function( uml_object, inner_rect, move_amount_x, move_amount_y ){
    inner_rect.x += move_amount_x
    inner_rect.y += move_amount_y
    if ( inner_rect.right_rect_id ) this._normalizationInnerRect( uml_object, uml_object.inner_rects[ inner_rect.right_rect_id ], move_amount_x, move_amount_y );
    if ( inner_rect.bottom_rect_id ) this._normalizationInnerRect( uml_object, uml_object.inner_rects[ inner_rect.bottom_rect_id ], move_amount_x, move_amount_y );
  };

  //--------------------------------------
  // UMLオブジェクト内部図形の最小サイズを超えないサイズを返す
  //--------------------------------------
  EditorScreen.prototype._isExceedMinSizeInnerRect = function( uml_object, amount_x, amount_y ){
    var most_righter_rect = null;
    var most_bottomer_rect = null;
    // 最後に全体サイズを修正するために、最も右と下の座標と矩形を記憶しておく
    for ( var key in uml_object.inner_rects ) {
      var inner_rect = uml_object.inner_rects[ key ];
      // 最も右座標の矩形を記録
      if ( ! most_righter_rect || ! inner_rect.right_rect_id ) {
        most_righter_rect = inner_rect;
      }
      // 最も下座標の矩形を記録
      if ( ! most_bottomer_rect || ! inner_rect.bottom_rect_id ) {
        most_bottomer_rect = inner_rect;
      }
    }

    if ( ! most_righter_rect | ! most_bottomer_rect ) {
      return {
        amount_x: amount_x,
        amount_y: amount_y
      }
    }

    return {
      amount_x:  ( most_righter_rect.min_width > most_righter_rect.width + amount_x  ? -( most_righter_rect.width  - most_righter_rect.min_width )  : amount_x ),
      amount_y: ( most_righter_rect.min_height > most_righter_rect.height + amount_y ? -( most_righter_rect.height - most_righter_rect.min_height ) : amount_y ),
    };
  };

  //--------------------------------------
  // UMLオブジェクト内部図形の補正
  //--------------------------------------
  EditorScreen.prototype._normalizationInnerUmlObject = function( uml_object ){
    var most_righter_rect = null;
    var most_bottomer_rect = null;
    // 最後に全体サイズを修正するために、最も右と下の座標と矩形を記憶しておく
    for ( var key in uml_object.inner_rects ) {
      var inner_rect = uml_object.inner_rects[ key ];
      // 最も右座標の矩形を記録
      if ( ! most_righter_rect || ! inner_rect.right_rect_id ) {
        most_righter_rect = inner_rect;
      }
      // 最も下座標の矩形を記録
      if ( ! most_bottomer_rect || ! inner_rect.bottom_rect_id ) {
        most_bottomer_rect = inner_rect;
      }
    }

    // 内部座標の更新
    var has_exceed_min_width = false;
    var has_exceed_min_height = false;
    for ( var key in uml_object.inner_rects ) {
      var inner_rect = uml_object.inner_rects[ key ];
      // 内部矩形の最低サイズ補正
      if ( inner_rect.min_width > inner_rect.width ) {
        has_exceed_min_width = true;
        var move_amount_x = inner_rect.min_width - inner_rect.width;
        inner_rect.width = inner_rect.min_width;
        if ( inner_rect.right_rect_id ) this._normalizationInnerRect( uml_object, uml_object.inner_rects[ inner_rect.right_rect_id ], move_amount_x, 0 );
      }
      if ( inner_rect.min_height > inner_rect.height ) {
        has_exceed_min_height = true;
        var move_amount_y = inner_rect.min_height - inner_rect.height;
        inner_rect.height = inner_rect.min_height;
        if ( inner_rect.bottom_rect_id ) this._normalizationInnerRect( uml_object, uml_object.inner_rects[ inner_rect.bottom_rect_id ], 0, move_amount_y );
      }
    }

    // 全体サイズの補正
    if ( most_righter_rect && has_exceed_min_width ) {
      uml_object.width = ( most_bottomer_rect.x + most_bottomer_rect.width ) - uml_object.x;
    }
    // 全体サイズの補正
    if ( most_bottomer_rect && has_exceed_min_height ) {
      uml_object.height = ( most_bottomer_rect.y + most_bottomer_rect.height ) - uml_object.y;
    }
  };

  //--------------------------------------
  // リレーションのUMLオブジェクトの線の座標を更新
  //--------------------------------------
  EditorScreen.prototype._updateRelationInnerLineUmlObject = function( uml_object, inner_line, dest_uml_object ){
    switch( inner_line.relation.base_type ) {
    case "top":
      inner_line.x = dest_uml_object.x + ( dest_uml_object.width < inner_line.relation.offset ? dest_uml_object.width : inner_line.relation.offset );
      inner_line.y = dest_uml_object.y;
      break;

    case "right":
      inner_line.x = dest_uml_object.x + dest_uml_object.width;
      inner_line.y = dest_uml_object.y + ( dest_uml_object.height < inner_line.relation.offset ? dest_uml_object.height : inner_line.relation.offset );
      break;

    case "bottom":
      inner_line.x = dest_uml_object.x + ( dest_uml_object.width < inner_line.relation.offset ? dest_uml_object.width : inner_line.relation.offset );
      inner_line.y = dest_uml_object.y + dest_uml_object.height;
      break;

    case "left":
      inner_line.x = dest_uml_object.x;
      inner_line.y = dest_uml_object.y + ( dest_uml_object.height < inner_line.relation.offset ? dest_uml_object.height : inner_line.relation.offset );
      break;
    }

    // 内部線からUMLオブジェクト矩形を正規化する
    this._normalizationUmlObjectSizeByInnerLine( uml_object );
  };

  //--------------------------------------
  // リレーションのUMLオブジェクトを更新する
  //--------------------------------------
  EditorScreen.prototype._updateRelationUmlObject = function( uml_object ){
    // 全てのリレーション先を更新する
    for ( var i=0; i<uml_object.relation_ids.length; i++ ) {
      var dest_uml_object = this._findUmlObjectById( uml_object.relation_ids[i] );

      // リレーション先の線を更新する
      if ( dest_uml_object && dest_uml_object.type == "relation" ) {
        dest_uml_object.inner_shapes = [];

        // 開始点・終了点の更新
        for ( var j=0; j<dest_uml_object.inner_lines.length; j=(j+1)|0 ) {
          if ( ! dest_uml_object.inner_lines[ j ].relation ) continue;

          var relation_uml_object = this._findUmlObjectById( dest_uml_object.inner_lines[ j ].relation.id );
          if ( relation_uml_object ) {
            this._updateRelationInnerLineUmlObject(
              dest_uml_object,
              dest_uml_object.inner_lines[ j ],
              relation_uml_object,
            );
          }
          // リンク先を喪失
          else {
            dest_uml_object.inner_lines[ j ].relation = null;
          }  
        }

      }
      // オブジェクトを喪失していた場合にはリレーションから削除する
      else {
        uml_object.relation_ids.splice( i--, 1 );
      }
    }
    // 子があるなら更新
    for ( var key in uml_object.children ) {
      this._updateRelationUmlObject( uml_object.children[key] );      
    }
  };

  //--------------------------------------
  // UMLオブジェクトを移動する
  //--------------------------------------
  EditorScreen.prototype._moveUmlObject = function( uml_object, x, y ){
    var move_amount_x = x - uml_object.x;
    var move_amount_y = y - uml_object.y;
    this._translateUmlObject( uml_object, move_amount_x, move_amount_y );

    // 紙サイズの修正
    this._refreshPaperSize();
  };

  //--------------------------------------
  // UMLオブジェクトを移動する（移動量を指定）
  //--------------------------------------
  EditorScreen.prototype._translateUmlObject = function( uml_object, move_amount_x, move_amount_y ){
    uml_object.x += move_amount_x;
    uml_object.y += move_amount_y;
    this._translateInnerUmlObject( uml_object, move_amount_x, move_amount_y );
  };

  //--------------------------------------
  // UMLオブジェクトのサイズ変更
  //--------------------------------------
  EditorScreen.prototype._editUmlObjectSize = function( uml_object, type, x, y ){
    // X方向のサイズ変更（left）
    if ( isIncludeArray( [ "top-left", "left", "bottom-left" ], type ) ) {
      var move_amount_x = x - uml_object.x;
      if ( uml_object.min_width > uml_object.width - move_amount_x ) move_amount_x = uml_object.width - uml_object.min_width;
      var min_amount = this._isExceedMinSizeInnerRect( uml_object, -move_amount_x, 0 );
      move_amount_x = -min_amount.amount_x;

      uml_object.x += move_amount_x;
      uml_object.width -= move_amount_x;
      this._translateInnerUmlObject( uml_object, move_amount_x, 0, -move_amount_x, 0 );
    }
    // X方向のサイズ変更（right）
    if ( isIncludeArray( [ "top-right", "right", "bottom-right" ], type ) ) {
      var move_amount_x = x - ( uml_object.x + uml_object.width );
      if ( uml_object.min_width > uml_object.width + move_amount_x ) move_amount_x = uml_object.min_width - uml_object.width;
      var min_amount = this._isExceedMinSizeInnerRect( uml_object, move_amount_x, 0 );
      move_amount_x = min_amount.amount_x;

      uml_object.width += move_amount_x;
      this._translateInnerUmlObject( uml_object, 0, 0, move_amount_x, 0 );
    }

    // Y方向のサイズ変更（top）
    if ( isIncludeArray( [ "top-left", "top", "top-right" ], type ) ) {
      var move_amount_y = y - uml_object.y;
      if ( uml_object.min_height > uml_object.height - move_amount_y ) move_amount_y = uml_object.height - uml_object.min_height;
      var min_amount = this._isExceedMinSizeInnerRect( uml_object, 0, -move_amount_y );
      move_amount_y = -min_amount.amount_y;

      uml_object.y += move_amount_y;
      uml_object.height -= move_amount_y;
      this._translateInnerUmlObject( uml_object, 0, move_amount_y, 0, -move_amount_y );
    }
    // Y方向のサイズ変更（bottom）
    if ( isIncludeArray( [ "bottom-left", "bottom", "bottom-right" ], type ) ) {
      var move_amount_y = y - ( uml_object.y + uml_object.height );
      if ( uml_object.min_height > uml_object.height + move_amount_y ) move_amount_y = uml_object.min_height - uml_object.height;
      var min_amount = this._isExceedMinSizeInnerRect( uml_object, 0, move_amount_y );
      move_amount_y = min_amount.amount_y;

      uml_object.height += move_amount_y;
      this._translateInnerUmlObject( uml_object, 0, 0, 0, move_amount_y );
    }

    // 内部図形の最小サイズ補正
    this._normalizationInnerUmlObject( uml_object );

    // 移動に伴って、リレーション先に影響がある時の座標更新
    this._updateRelationUmlObject( uml_object );

    // 紙サイズの修正
    this._refreshPaperSize();
  };

  //--------------------------------------
  // UMLオブジェクトの内部区切り位置の変更
  //--------------------------------------
  EditorScreen.prototype._editInnerUmlObjectSize = function( uml_object, inner_shape, type, x, y ){
    // 内部の区切り位置のX方向の移動
    if ( "inner-left" == type ) {
      // 隣の左の矩形を取得
      var left_inner_shape = inner_shape.left_rect_id ? uml_object.inner_rects[ inner_shape.left_rect_id ] : null;
      // 移動量を計算
      var move_amount_x = x - inner_shape.x;
      // 移動量が現在の矩形の最小サイズを超えない様にする
      if ( inner_shape.min_width > inner_shape.width - move_amount_x ) move_amount_x = inner_shape.width - inner_shape.min_width;
      // 移動量が隣の矩形の最小サイズを超えない様にする
      if ( left_inner_shape ) {
        if ( left_inner_shape.min_width > left_inner_shape.width + move_amount_x ) move_amount_x = left_inner_shape.min_width - left_inner_shape.width;
      }
      // 移動量がオブジェクトのサイズを超えない様にする
      else {
        if ( uml_object.x > inner_shape.x + move_amount_x ) move_amount_x = uml_object.x - inner_shape.x;
      }

      // 移動とサイズ変形
      inner_shape.x += move_amount_x;
      inner_shape.width -= move_amount_x;
      if ( left_inner_shape ) {
        left_inner_shape.width += move_amount_x;
      }
      else if ( inner_shape.is_bind_object_width ) {
        uml_object.x += move_amount_x;
        uml_object.width -= move_amount_x;  
      }
    }
    if ( "inner-right" == type ) {
      // 隣の左の矩形を取得
      var right_inner_shape = inner_shape.right_rect_id ? uml_object.inner_rects[ inner_shape.right_rect_id ] : null;
      // 移動量を計算
      var move_amount_x = x - ( inner_shape.x + inner_shape.width );
      // 移動量が現在の矩形の最小サイズを超えない様にする
      if ( inner_shape.min_width > inner_shape.width + move_amount_x ) move_amount_x = inner_shape.min_width - inner_shape.width;
      // 移動量が隣の矩形の最小サイズを超えない様にする
      if ( right_inner_shape ) {
        if ( right_inner_shape.min_width > right_inner_shape.width - move_amount_x ) move_amount_x = right_inner_shape.width - right_inner_shape.min_width;
      }
      // 移動量がオブジェクトのサイズを超えない様にする
      else {
        if ( uml_object.x + uml_object.width < inner_shape.x + inner_shape.width + move_amount_x ) move_amount_x = ( uml_object.x + uml_object.width ) - ( inner_shape.x + inner_shape.width );
      }

      // 移動とサイズ変形
      inner_shape.width += move_amount_x;
      if ( right_inner_shape ) {
        right_inner_shape.x += move_amount_x;
        right_inner_shape.width -= move_amount_x;
      }
      else if ( inner_shape.is_bind_object_width ) {
        uml_object.width += move_amount_x;  
      }
    }

    // 内部の区切り位置のY方向の移動
    if ( "inner-top" == type ) {
      // 隣の左の矩形を取得
      var top_inner_shape = inner_shape.top_rect_id ? uml_object.inner_rects[ inner_shape.top_rect_id ] : null;
      // 移動量を計算
      var move_amount_y = y - inner_shape.y;
      // 移動量が現在の矩形の最小サイズを超えない様にする
      if ( inner_shape.min_height > inner_shape.height - move_amount_y ) move_amount_y = inner_shape.height - inner_shape.min_height;
      // 移動量が隣の矩形の最小サイズを超えない様にする
      if ( top_inner_shape ) {
        if ( top_inner_shape.min_height > top_inner_shape.height + move_amount_y ) move_amount_y = top_inner_shape.min_height - top_inner_shape.height;
      }
      // 移動量がオブジェクトのサイズを超えない様にする
      else {
        if ( uml_object.y > inner_shape.y + move_amount_y ) move_amount_y = uml_object.y - inner_shape.y;
      }

      // 移動とサイズ変形
      inner_shape.y += move_amount_y;
      inner_shape.height -= move_amount_y;
      if ( top_inner_shape ) {
        top_inner_shape.height += move_amount_y;
      }
      else if ( inner_shape.is_bind_object_height ) {
        uml_object.y += move_amount_y;
        uml_object.height -= move_amount_y;  
      }
    }
    if ( "inner-bottom" == type ) {
      // 隣の左の矩形を取得
      var bottom_inner_shape = inner_shape.bottom_rect_id ? uml_object.inner_rects[ inner_shape.bottom_rect_id ] : null;
      // 移動量を計算
      var move_amount_y = y - ( inner_shape.y + inner_shape.height );
      // 移動量が現在の矩形の最小サイズを超えない様にする
      if ( inner_shape.min_height > inner_shape.height + move_amount_y ) move_amount_y = inner_shape.min_height - inner_shape.height;
      // 移動量が隣の矩形の最小サイズを超えない様にする
      if ( bottom_inner_shape ) {
        if ( bottom_inner_shape.min_height > bottom_inner_shape.height - move_amount_y ) move_amount_y = bottom_inner_shape.height - bottom_inner_shape.min_height;
      }
      // 移動量がオブジェクトのサイズを超えない様にする
      else {
        if ( uml_object.y + uml_object.height < inner_shape.y + inner_shape.height + move_amount_y ) move_amount_y = ( uml_object.y + uml_object.height ) - ( inner_shape.y + inner_shape.height );
      }

      // 移動とサイズ変形
      inner_shape.height += move_amount_y;
      if ( bottom_inner_shape ) {
        bottom_inner_shape.y += move_amount_y;
        bottom_inner_shape.height -= move_amount_y;
      }
      else if ( inner_shape.is_bind_object_height ) {
        uml_object.height += move_amount_y;  
      }
    }

    // 内部図形の最小サイズ補正
    this._normalizationInnerUmlObject( uml_object );

    // 紙サイズの修正
    this._refreshPaperSize();
  };

  //--------------------------------------
  // 内部線からUMLオブジェクトの矩形を正規化する
  //--------------------------------------
  EditorScreen.prototype._normalizationUmlObjectSizeByInnerLine = function( uml_object ){
    var edge_point = {
      left_x:   uml_object.inner_lines[0].x,
      top_y:    uml_object.inner_lines[0].y,
      right_x:  uml_object.inner_lines[0].x,
      bottom_y: uml_object.inner_lines[0].y,
    };
    for ( var i=1; i<uml_object.inner_lines.length; i++ ) {
      if ( edge_point.left_x   > uml_object.inner_lines[i].x ) edge_point.left_x   = uml_object.inner_lines[i].x
      if ( edge_point.right_x  < uml_object.inner_lines[i].x ) edge_point.right_x  = uml_object.inner_lines[i].x
      if ( edge_point.top_y    > uml_object.inner_lines[i].y ) edge_point.top_y    = uml_object.inner_lines[i].y
      if ( edge_point.bottom_y < uml_object.inner_lines[i].y ) edge_point.bottom_y = uml_object.inner_lines[i].y
    }

    uml_object.x      = edge_point.left_x;
    uml_object.y      = edge_point.top_y;
    uml_object.width  = edge_point.right_x  - edge_point.left_x;
    uml_object.height = edge_point.bottom_y - edge_point.top_y;

    if ( 10 > uml_object.width ) {
      var delta = 10 - uml_object.width;
      uml_object.width = 10;
      uml_object.x -= Math.floor( delta / 2 );
    }
    if ( 10 > uml_object.height ) {
      var delta = 10 - uml_object.height;
      uml_object.height = 10;
      uml_object.y -= Math.floor( delta / 2 );
    }
  };

  //--------------------------------------
  // 指定リレーションを接続
  //--------------------------------------
  EditorScreen.prototype._linkRelation = function( relation_uml_object, inner_shape, dest_uml_object ){
    // リレーション先を記録する
    if ( ! isIncludeArray( dest_uml_object.owner.relation_ids, relation_uml_object.id ) ){
      dest_uml_object.owner.relation_ids.push( relation_uml_object.id );
    }
    // リンク先の情報を記録する
    inner_shape.relation = {
      id:         dest_uml_object.owner.id,
      type:       dest_uml_object.type,
      base_type:  dest_uml_object.base_type,
      offset:     dest_uml_object.offset,
    };
  };

  //--------------------------------------
  // 関係線の接続時の辺沿いオフセットを吸着させる
  //   基本は10px単位。ただし辺の中央（edge_length/2）付近（±grid/2=±5px）は中央へ吸着させ、
  //   その範囲内に10px単位の吸着点がある場合は、その点の±1pxに限り10px点を優先する。
  //   （branchの菱形やstart/end等の円形で、辺中央に接続すると実線と接続点の隙間が無くなる）
  //--------------------------------------
  EditorScreen.prototype._snapConnectionOffset = function( raw_offset, edge_length ){
    var grid = this.grid_size;
    var center = edge_length / 2;

    // 中央から±(grid/2)以内は中央へ吸着（ただし10px点の±1pxはそちらを優先）
    if ( Math.abs( raw_offset - center ) <= ( grid / 2 ) ) {
      var nearest_grid = Math.round( raw_offset / grid ) * grid;
      if ( Math.abs( raw_offset - nearest_grid ) <= 1 ) return nearest_grid;
      return center;
    }

    // それ以外は従来通り10px単位（切り捨て）
    return Math.floor( raw_offset / grid ) * grid;
  };

  //--------------------------------------
  // UMLオブジェクトの内部区切り位置の変更
  //--------------------------------------
  EditorScreen.prototype._moveInnerLine = function( uml_object, inner_shape, type, x, y, is_not_connection ){
    if ( "undefined" == typeof is_not_connection ) is_not_connection = false;

    // 内部の区切り位置のX方向の移動
    switch ( type ) {
    case "inner-line-start":
    case "inner-line-end":
      // 前回のリンク先情報を初期化する
      if ( inner_shape.relation ) {
        old_dest_uml_object = this._findUmlObjectById( inner_shape.relation.id );
        if ( old_dest_uml_object ) {
          removeArray( old_dest_uml_object.relation_ids, uml_object.id );
        }
        inner_shape.relation = null;
      }

      // コネクション可能な時
      if ( ! is_not_connection ) {

        var contact = this._findNearUmlObjectByPoint( uml_object, x, y );
        // 接続先がある時
        if ( contact ) {
          // 接続時の辺沿いオフセットを、10px単位＋辺中央への吸着ルールで確定する
          var edge_length = isIncludeArray( [ "top", "bottom" ], contact.base_type ) ? contact.owner.width : contact.owner.height;
          contact.offset = Math.max( 0, Math.min( edge_length, this._snapConnectionOffset( contact.offset, edge_length ) ) );

          // 確定したoffsetから接続点座標を再計算する
          switch ( contact.base_type ) {
          case "top":    contact.contact = { x: contact.owner.x + contact.offset,      y: contact.owner.y };                        break;
          case "bottom": contact.contact = { x: contact.owner.x + contact.offset,      y: contact.owner.y + contact.owner.height }; break;
          case "left":   contact.contact = { x: contact.owner.x,                       y: contact.owner.y + contact.offset };       break;
          case "right":  contact.contact = { x: contact.owner.x + contact.owner.width, y: contact.owner.y + contact.offset };       break;
          }

          // カーソル位置を接続位置だったことにする
          x = contact.contact.x;
          y = contact.contact.y;

          // リレーションを設定
          this._linkRelation( uml_object, inner_shape, contact );
        }
        else {
          inner_shape.relation = null;
          // 接続しない始点・終点は通常のグリッド（10px）に吸着する（CTRL時は1px）
          x = Math.floor( x / this.grid_size ) * this.grid_size;
          y = Math.floor( y / this.grid_size ) * this.grid_size;
        }
      }

    // 意図的にbreak無し
    case "inner-line-relay":
      inner_shape.x = x;
      inner_shape.y = y;

      // 内部図形の削除
      uml_object.inner_shapes = {};

      // 内部線からUMLオブジェクト矩形を正規化する
      this._normalizationUmlObjectSizeByInnerLine( uml_object );

      // 紙サイズの修正
      this._refreshPaperSize();
      break;
    }

    // 自身の親がグループならば、親の矩形を修正する
    if ( uml_object.parent_id ) {
      var parent = this._findUmlObjectById( uml_object.parent_id )
      if ( parent.type == "group" ) this._updateGroupedUmlObjectRect( parent, true );
    }
  };

  //--------------------------------------
  // 描画優先順位の変更（最背面移動）
  //--------------------------------------
  EditorScreen.prototype._moveLowestPriorityBySelectedUmlObject = function(){
    // 選択中のオブジェクトの現在の優先順位位置を消し、優先順位を先頭（最背面）に移動する
    var selected_uml_objects = this._selectedRootUmlObjects();
    var selected_uml_object_ids = [];
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      this.save_data.priorities.splice( this.save_data.priorities.indexOf( selected_uml_objects[i].id ), 1 );
      selected_uml_object_ids[i] = selected_uml_objects[i].id;
    }
    this.save_data.priorities = selected_uml_object_ids.concat( this.save_data.priorities );

    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // 描画優先順位の変更（背面移動）
  //--------------------------------------
  EditorScreen.prototype._moveLowerPriorityBySelectedUmlObject = function(){
    // 選択中のオブジェクトの現在の優先順位位置を消し、１つ前方（背面）に全ての選択中オブジェクトを移動する
    var selected_uml_objects = this._selectedRootUmlObjects();
    var selected_uml_object_ids = [];
    var first_object_priority = null;
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      var index = this.save_data.priorities.indexOf( selected_uml_objects[i].id );
      this.save_data.priorities.splice( index, 1 );
      selected_uml_object_ids[i] = selected_uml_objects[i].id;
      if ( null == first_object_priority ) first_object_priority = index;
    }

    if ( 0 == first_object_priority ) first_object_priority = 1;
    this.save_data.priorities.splice( first_object_priority-1, 0, ...selected_uml_object_ids );

    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // 描画優先順位の変更（前面移動）
  //--------------------------------------
  EditorScreen.prototype._moveHigherPriorityBySelectedUmlObject = function(){
    // 選択中のオブジェクトの現在の優先順位位置を消し、１つ後方（前面）に全ての選択中オブジェクトを移動する
    var selected_uml_objects = this._selectedRootUmlObjects();
    var selected_uml_object_ids = [];
    var first_object_priority = null;
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      var index = this.save_data.priorities.indexOf( selected_uml_objects[i].id );
      this.save_data.priorities.splice( index, 1 );
      selected_uml_object_ids[i] = selected_uml_objects[i].id;
      if ( null == first_object_priority ) first_object_priority = index;
    }

    if ( this.save_data.priorities.length - 1 <= first_object_priority ) first_object_priority = this.save_data.priorities.length - 1;
    this.save_data.priorities.splice( first_object_priority+1, 0, ...selected_uml_object_ids );

    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // 描画優先順位の変更（最前面移動）
  //--------------------------------------
  EditorScreen.prototype._moveHighestPriorityBySelectedUmlObject = function(){
    // 選択中のオブジェクトの現在の優先順位位置を消し、優先順位を後ろ（最前面）に移動する
    var selected_uml_objects = this._selectedRootUmlObjects();
    var selected_uml_object_ids = [];
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      this.save_data.priorities.splice( this.save_data.priorities.indexOf( selected_uml_objects[i].id ), 1 );
      selected_uml_object_ids[i] = selected_uml_objects[i].id;
    }
    this.save_data.priorities.push( ...selected_uml_object_ids );

    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // ショートカットキーから描画優先順位の移動
  //--------------------------------------
  EditorScreen.prototype._moveDrawPriorityByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_MOVE_LOW ) ) {
      this._moveLowestPriorityBySelectedUmlObject();
      return true;
    }
    if ( statuses.isDownKey( KEYCODE_OPEN_BRACKET ) ) {
      this._moveLowerPriorityBySelectedUmlObject();
      return true;
    }
    if ( statuses.isDownKey( KEYCODE_CLOSE_BRACKET ) ) {
      this._moveHigherPriorityBySelectedUmlObject();
      return true;
    }
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_MOVE_HIGH ) ) {
      this._moveHighestPriorityBySelectedUmlObject();
      return true;
    }
    return false;
  };

  /*------------------------------------------------------------------------------
    グルーピング
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // グルーピングされたオブジェクトの矩形を更新する
  //--------------------------------------
  EditorScreen.prototype._updateGroupedUmlObjectRect = function( uml_object, is_not_breakdown ){
    if ( "undefined" == typeof is_not_breakdown ) is_not_breakdown = false;
    if ( "group" != uml_object.type ) return;
    if ( 0 == uml_object.priorities.length ) return;

    var group_size = {
      left_x:   null,
      top_y:    null,
      right_x:  null,
      bottom_y: null,
    };

    // 子の矩形から上下左右の境界値を取得する
    for ( var key in uml_object.children ) {
      var child = uml_object.children[key];
      if ( ! is_not_breakdown && 0 < child.priorities.length ) this._updateGroupedUmlObjectRect( child );

      if ( null == group_size.left_x   || group_size.left_x > child.x                  ) group_size.left_x   = child.x;
      if ( null == group_size.right_x  || group_size.right_x < child.x + child.width   ) group_size.right_x  = child.x + child.width;
      if ( null == group_size.top_y    || group_size.top_y > child.y                   ) group_size.top_y    = child.y;
      if ( null == group_size.bottom_y || group_size.bottom_y < child.y + child.height ) group_size.bottom_y = child.y + child.height;
    }

    // 自身の矩形を更新
    uml_object.x      = group_size.left_x;
    uml_object.y      = group_size.top_y;
    uml_object.width  = group_size.right_x - group_size.left_x;
    uml_object.height = group_size.bottom_y - group_size.top_y;

    // 親がグループならば、親も更新する
    if ( uml_object.parent_id ) {
      var parent = this._findUmlObjectById( uml_object.parent_id )
      if ( parent.type == "group" ) this._updateGroupedUmlObjectRect( parent, true );
    }
  };

  //--------------------------------------
  // 指定UMLオブジェクトの親がグループならば、その包含矩形を更新する
  //--------------------------------------
  EditorScreen.prototype._updateParentGroupRect = function( uml_object ){
    if ( uml_object && uml_object.parent_id ) {
      var parent = this._findUmlObjectById( uml_object.parent_id );
      if ( parent && "group" == parent.type ) this._updateGroupedUmlObjectRect( parent );
    }
  };

  //--------------------------------------
  // 現在選択中のUMLオブジェクトをグループ化する
  //--------------------------------------
  EditorScreen.prototype._groupSelectedUmlObjects = function(){
    if ( 1 >= this.select_uml_object_ids.length ) return;

    var group = this._createInitializedUmlObject( "group" );
    this.save_data.objects[ group.id ] = group;

    var group_uml_object_keys = {};
    // 選択中のオブジェクトキーを収集しながら全体の矩形を取得する
    var selected_uml_objects = this._selectedRootUmlObjects();
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      group_uml_object_keys[ selected_uml_objects[i].id ] = true;
    }
    // 選択中のオブジェクトを一旦消す
    this._clearSelectedAllUmlObject();

    // 描画優先度順にグループに子として追加する
    for ( var i=0; i<this.save_data.priorities.length; i++ ) {
      var uml_object_key = this.save_data.priorities[i];
      var uml_object = this.save_data.objects[ uml_object_key ];
      // このオブジェクトはグループ化される？
      if ( group_uml_object_keys[ uml_object_key ] ) {
        // 親のオブジェクト登録からは消す
        delete this.save_data.objects[ uml_object_key ];

        // もっとも優先度の高いオブジェクトだったら、選択中オブジェクトを親の描画優先度から外す代わりにグループを登録する
        if ( 0 == group.priorities.length ) {
          this.save_data.priorities.splice( i--, 1, group.id );
        }
        // そうでなければ、ただ選択中オブジェクトを親の描画優先度から外す
        else {
          this.save_data.priorities.splice( i--, 1 );
        }
        // グループの子として追加
        group.priorities.push( uml_object_key )
        group.children[ uml_object_key ] = uml_object;

        // 親を再設定
        uml_object.parent_id = group.id;
      }
    }

    // グループの矩形を設定
    this._updateGroupedUmlObjectRect( group );

    // 作成したグループを選択し直す
    this._selectUmlObjectByKey( group.id );

    // データの記録
    this.data_manager.setData( this.save_data );

    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // 現在選択中のUMLオブジェクトのグループ化を解除する
  //--------------------------------------
  EditorScreen.prototype._ungroupSelectedUmlObjects = function(){
    if ( 0 == this.select_uml_object_ids.length ) return;

    // 選択の変更前に、現在の入力欄の内容を「現在の選択オブジェクト」へ反映（コミット）しておく。
    // これを行わないと、解除後に選択が子オブジェクト群へ変わった後の再コミットで、
    // 解除前の入力欄の値が他のオブジェクトへ誤って適用されてしまう。
    this._setSelectedUmlObjectParams();

    // 選択中のオブジェクトがグループならば解除する
    for ( var i=0; i<this.select_uml_object_ids.length; i++ ) {
      var uml_object = this._getRootUmlObjectByKey( this.select_uml_object_ids[i] );
      if ( "group" == uml_object.type ) {

        // 選択中のオブジェクトから当該グループを外し、代わりにグループ解除したオブジェクトを追加する
        this.select_uml_object_ids.splice( i, 1, ...uml_object.priorities );
        i += uml_object.priorities.length - 1;

        // 親の優先度順から当該グループを外し、代わりにグループ解除したオブジェクトを追加する
        for ( var j=0; j<this.save_data.priorities.length; j++ ) {
          if ( uml_object.id == this.save_data.priorities[j] ) {
            this.save_data.priorities.splice( j, 1, ...uml_object.priorities );
            break;
          }
        }

        // 親のオブジェクト登録にグループ解除したオブジェクトを登録する
        Object.assign( this.save_data.objects, uml_object.children );
        delete this.save_data.objects[ uml_object.id ];

        // 親の再設定
        for ( var key in uml_object.children ) {
          uml_object.children[key].parent_id = null;
        }
      }
    }

    // データの記録
    this.data_manager.setData( this.save_data );

    // 手動での複数選択時と同等の状態にする
    // （解除で選択が子オブジェクト群へ変わったため、各オブジェクトの変形トグルとパラメータ入力欄を再生成する）
    this._sortSelectedUmlObjectByPriority();
    this._generateDraggableToggles();
    this._refreshSelectedUmlObjectParams();

    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // ショートカットキーからグルーピング
  //--------------------------------------
  EditorScreen.prototype._groupSelectedUmlObjectsByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_FIND_NEXT ) ) {
      this._groupSelectedUmlObjects();
      return true;
    }
  }

  //--------------------------------------
  // ショートカットキーからグルーピング解除
  //--------------------------------------
  EditorScreen.prototype._ungroupSelectedUmlObjectsByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_FIND_PREV ) ) {
      this._ungroupSelectedUmlObjects();
      return true;
    }
  }

  /*------------------------------------------------------------------------------
    描画関連
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // 保存データを画面に反映する
  //--------------------------------------
  EditorScreen.prototype._refreshSaveData = function(){
    // 紙サイズの設定
    var paper_element = this.findObjectByName( "paper" );
    paper_element.setDynamicStyleAttr( "width", Math.round( this.save_data.paper.width * this.zoom_rate ) );
    paper_element.setDynamicStyleAttr( "height", Math.round( this.save_data.paper.height * this.zoom_rate ) );
    
    // 再レイアウト・再描画
    this.screen_manager.requestRelayout( this );
  };

  //--------------------------------------
  // 紙領域のサイズ変更
  //--------------------------------------
  EditorScreen.prototype._refreshPaperSize = function(){

    // 紙サイズの初期値
    this.save_data.paper.width  = 1200;
    this.save_data.paper.height = 848;

    this._eachUmlObjects( function( uml_object ){
      if ( this.save_data.paper.width < ( uml_object.x + uml_object.width ) ) {
        this.save_data.paper.width = ( uml_object.x + uml_object.width );
      }
      if ( this.save_data.paper.height < ( uml_object.y + uml_object.height ) ) {
        this.save_data.paper.height = ( uml_object.y + uml_object.height );
      }
    }.bind(this) );

    if ( this.save_data.paper.width > 1200 ) this.save_data.paper.width += 32;
    if ( this.save_data.paper.height > 848 ) this.save_data.paper.height += 32;

    // 保存データのリフレッシュ
    this._refreshSaveData();
  };

  //--------------------------------------
  // 折り返し位置で分割して配列化した文字列を取得する
  //--------------------------------------
  EditorScreen.prototype._getLayouteText = function( text, font_size, width, is_word_break ){
    if ( is_word_break ) {
      var text_rows = [];
      var row = "";
      var words = "";
      for ( var i=0, length=text.length; i<length; i=(i+1)|0 ) {
        var head = text.charAt( i );
        if ( "\n" == head ) {
          text_rows.push( row + words );
          row = "";
          words = "";
        }
        else if ( head.match( /[0-9a-zA-Z\-_.,"']/ ) ) {
          words += head;
          if ( 0 < row.length && width < getTextWidth( row + words, font_size ) ){
            text_rows.push( row );
            row = "";
          }
        }
        else {
          row += words;
          words = "";
          if ( width < getTextWidth( row + head, font_size ) ){
            text_rows.push( row );
            row = head;
          }
          else {
            row += head;
          }
        }
      }
      if ( 0 < row.length + words.length ) text_rows.push( row + words );
      return text_rows;
    }
    else {
      return text.split("\n");
    }
  };

  //--------------------------------------
  // 選択可能な色のパレット（色名 → RGB各成分[0-255]）
  //--------------------------------------
  EditorScreen.prototype._colorPalette = function(){
    return {
      black:      [   0,   0,   0 ],
      gray:       [ 130, 130, 130 ],
      white:      [ 255, 255, 255 ],
      red:        [ 220,   0,   0 ],
      brown:      [ 140,  80,  20 ],
      pink:       [ 255, 120, 120 ],  // 明るい赤
      green:      [   0, 150,   0 ],
      darkgreen:  [   0,  90,  40 ],
      lightgreen: [ 140, 215, 120 ],
      blue:       [   0,   0, 220 ],
      darkblue:   [   0,   0, 120 ],
      skyblue:    [  60, 180, 225 ],
      yellow:     [ 220, 190,   0 ],
      purple:     [ 140,   0, 180 ]
    };
  };

  //--------------------------------------
  // 色名に対応するCanvas用のRGB文字列を取得する（transparentや未定義はnullを返す）
  //--------------------------------------
  EditorScreen.prototype._colorNameToRgb = function( color_name ){
    var rgb = this._colorPalette()[ color_name ];
    return rgb ? `rgb(${ rgb[0] },${ rgb[1] },${ rgb[2] })` : null;
  };

  //--------------------------------------
  // 色名に対応するPDF用の色を取得する（transparentや未定義はnullを返す）
  //--------------------------------------
  EditorScreen.prototype._colorNameToPdfColor = function( context, color_name ){
    var rgb = this._colorPalette()[ color_name ];
    return rgb ? getPdfColor( context, rgb[0] / 255, rgb[1] / 255, rgb[2] / 255 ) : null;
  };

  //--------------------------------------
  // 背景色（塗り）専用のパレット（色名 → RGB各成分[0-255]）
  //   線色・文字色（_colorPalette）はコントラストの強い色のままとし、背景色に限り、
  //   黒文字が読みやすいよう明度を上げた（白寄りの）色を用いる。ここに定義の無い色名は _colorPalette を用いる。
  //   既存の明るい色（pink/light green/sky blue）や green と dark green 同士が同色にならないよう差別化する。
  //--------------------------------------
  EditorScreen.prototype._backgroundColorPalette = function(){
    return {
      red:        [ 255, 205, 205 ],  // 明るい赤（pink よりさらに淡い）
      brown:      [ 220, 195, 165 ],  // 明るい茶（ベージュ）
      green:      [ 205, 240, 200 ],  // 明るい緑（light green より淡い緑寄り）
      darkgreen:  [ 180, 218, 205 ],  // 明るい深緑（緑よりやや青みのある淡いteal）
      blue:       [ 210, 225, 255 ],  // 明るい青（sky blue より淡い）
      darkblue:   [ 188, 192, 232 ],  // 明るい紺（青よりやや暗め・灰みのある淡い青）
      purple:     [ 230, 205, 245 ]   // 明るい紫（淡いラベンダー）
    };
  };

  //--------------------------------------
  // 背景色（塗り）用の色成分を取得する（背景専用パレット優先、無ければ通常パレット。未定義はnull）
  //--------------------------------------
  EditorScreen.prototype._backgroundColorRgbComponents = function( color_name ){
    return this._backgroundColorPalette()[ color_name ] || this._colorPalette()[ color_name ] || null;
  };

  //--------------------------------------
  // 背景色（塗り）用のCanvas用RGB文字列を取得する（transparentや未定義はnullを返す）
  //--------------------------------------
  EditorScreen.prototype._backgroundColorNameToRgb = function( color_name ){
    var rgb = this._backgroundColorRgbComponents( color_name );
    return rgb ? `rgb(${ rgb[0] },${ rgb[1] },${ rgb[2] })` : null;
  };

  //--------------------------------------
  // 背景色（塗り）用のPDF用の色を取得する（transparentや未定義はnullを返す）
  //--------------------------------------
  EditorScreen.prototype._backgroundColorNameToPdfColor = function( context, color_name ){
    var rgb = this._backgroundColorRgbComponents( color_name );
    return rgb ? getPdfColor( context, rgb[0] / 255, rgb[1] / 255, rgb[2] / 255 ) : null;
  };

  //--------------------------------------
  // 色選択のoption要素文字列を生成する
  //   include_white:       選択肢に「白」を含める場合はtrue
  //   include_transparent: 選択肢に「透明」を含める場合はtrue
  //--------------------------------------
  EditorScreen.prototype._buildColorOptions = function( selected_value, include_white, include_transparent ){
    // 表示順: black, gray, (white), red, brown, pink, green, dark green, light green, blue, dark blue, sky blue, yellow, purple, (transparent)
    var colors = [
      [ "black",      "black" ],
      [ "gray",       "gray" ]
    ];
    if ( include_white ) colors.push( [ "white", "white" ] );
    colors = colors.concat( [
      [ "red",        "red" ],
      [ "brown",      "brown" ],
      [ "pink",       "pink" ],
      [ "green",      "green" ],
      [ "darkgreen",  "dark green" ],
      [ "lightgreen", "light green" ],
      [ "blue",       "blue" ],
      [ "darkblue",   "dark blue" ],
      [ "skyblue",    "sky blue" ],
      [ "yellow",     "yellow" ],
      [ "purple",     "purple" ]
    ] );
    if ( include_transparent ) colors.push( [ "transparent", "transparent" ] );
    var options = "";
    // 複数選択で値が混在している場合は空の選択肢を表示する
    if ( ! selected_value ) options += "<option value=''></option>";
    for ( var i=0; i<colors.length; i++ ) {
      options += `<option value='${ colors[i][0] }' ${ colors[i][0] == selected_value ? "selected" : "" }>${ colors[i][1] }</option>`;
    }
    return options;
  };

  //--------------------------------------
  // 線のスタイルを適用して描画するラッパー
  //--------------------------------------
  EditorScreen.prototype._drawLineWrapper = function( context, line_style, draw_function ){
    var _zoom = function( value ){
      return value * this.zoom_rate;
    }.bind(this);

    if ( line_style ) {
      switch( line_style ){
      case "solid":
        setLineDash( context, [] );
        break;

      case "dashed":
        setLineDash( context, [ _zoom( 5 ), _zoom( 8 ) ] );
        break;

      case "dotted":
        setLineDash( context, [ _zoom( 1 ), _zoom( 5 ) ] );
        break;
      }
    }
    draw_function();
    setLineDash( context, [] );
  }

  //--------------------------------------
  // UMLオブジェクトを再起的に描画
  //--------------------------------------
  EditorScreen.prototype._drawUmlObjectRecursion = function( context, base_x, base_y, uml_object, base_color, base_bg_color, keys, include_color ){
    // 子がいるなら先に描画する
    for ( var key in uml_object.children ) {
      this._drawUmlObjectRecursion( context, base_x, base_y, uml_object.children[key], base_color, base_bg_color, keys, include_color );
    }

    if ( keys && keys[ uml_object.id ] ) {
      this._drawUmlObjectAt( context, base_x, base_y, uml_object, include_color, base_bg_color );
    }
    else {
      this._drawUmlObjectAt( context, base_x, base_y, uml_object, base_color, base_bg_color );
    }
  };

  //--------------------------------------
  // UMLオブジェクトの描画
  //--------------------------------------
  EditorScreen.prototype._drawUmlObjectAt = function( context, base_x, base_y, uml_object, base_color, base_bg_color ){
    var _zoom = function( value ){
      return value * this.zoom_rate;
    }.bind(this);

    // 描画色の解決
    //   base_color / base_bg_color は選択中や関係先などの上書き色。
    //   上書きが無い場合はオブジェクトのパラメータ（色名）を使う。
    var line_color = base_color || this._colorNameToRgb( uml_object.params["lineColor"] ) || "rgb(0,0,0)";
    var text_color = base_color || this._colorNameToRgb( uml_object.params["textColor"] ) || "rgb(0,0,0)";
    var is_transparent_bg = ( "transparent" == uml_object.params["backgroundColor"] );
    var fill_color = base_bg_color || this._backgroundColorNameToRgb( uml_object.params["backgroundColor"] ) || "rgb(255,255,255)";

    // 線幅の設定（このオブジェクトの描画後に既定の1へ戻す）
    setLineWidth( context, Math.max( 1, ( uml_object.params["lineWidth"] || 1 ) * this.zoom_rate ) );

    // 描画順序について
    // 線、図形、矩形の順で描画
    //   矩形はテキスト表示領域となるので、最後に描画
    //   線の上に関係線の図形を上書きするので、線を最初に描画

    // 線の描画
    if ( 0 < uml_object.inner_lines.length ) {
      this._drawLineWrapper( context, uml_object.params["lineStyle"], function(){
        var points = [];
        for ( var i=0; i<uml_object.inner_lines.length; i++ ) {
          points[i] = {
            x: base_x + _zoom( uml_object.inner_lines[i].x ),
            y: base_y + _zoom( uml_object.inner_lines[i].y )
          };
        }
        if ( uml_object.params["pathStyle"] == "curve" ) {
          var is_horizontal = ( ! uml_object.inner_lines[0].relation || isIncludeArray( [ "left", "right" ], uml_object.inner_lines[0].relation.base_type ) );
          if ( 3 <= points.length ) {
            if ( is_horizontal ) {
              if ( points[0].y <= points[2].y && ( points[1].y < points[0].y || points[2].y < points[1].y  ) ) is_horizontal = false;
              if ( points[0].y >  points[2].y && ( points[1].y < points[2].y || points[0].y < points[1].y  ) ) is_horizontal = false;
            }
            else {
              if ( points[0].x <= points[2].x && ( points[1].x < points[0].x || points[2].x < points[1].x ) ) is_horizontal = true;
              if ( points[0].x >  points[2].x && ( points[1].x < points[2].x || points[0].x < points[1].x ) ) is_horizontal = true;
            }
          }
          drawBezier( context, points, line_color, is_horizontal );
        }
        else {
          drawLines( context, points, line_color );
        }
      } );
    }

    // 各形状の描画
    for ( var key in uml_object.inner_shapes ) {
      switch( uml_object.inner_shapes[key].type ) {
      case "line":
        this._drawLineWrapper( context, ( uml_object.inner_shapes[key].line_style || uml_object.params["lineStyle"] ), function(){
          drawLine( context, base_x + _zoom( uml_object.inner_shapes[key].start.x ), base_y + _zoom( uml_object.inner_shapes[key].start.y ), base_x + _zoom( uml_object.inner_shapes[key].end.x ), base_y + _zoom( uml_object.inner_shapes[key].end.y ), line_color, false );
        });
        break;

      case "rect":
        if ( uml_object.inner_shapes[key].fill && ! is_transparent_bg ) drawRect( context, base_x + _zoom( uml_object.inner_shapes[key].x ), base_y + _zoom( uml_object.inner_shapes[key].y ), _zoom( uml_object.inner_shapes[key].width ), _zoom( uml_object.inner_shapes[key].height ), fill_color, true );
        drawRect( context, base_x + _zoom( uml_object.inner_shapes[key].x ), base_y + _zoom( uml_object.inner_shapes[key].y ), _zoom( uml_object.inner_shapes[key].width ), _zoom( uml_object.inner_shapes[key].height ), line_color, false );
        break;

      case "circle":
        if ( uml_object.inner_shapes[key].fill ) {
          // fill_border_color の塗りは線色に追従させ、背景色による塗りは透明時にスキップする
          if ( uml_object.inner_shapes[key].fill_border_color ) drawCircle( context, base_x + _zoom( uml_object.inner_shapes[key].x ), base_y + _zoom( uml_object.inner_shapes[key].y ), _zoom( uml_object.inner_shapes[key].radius ), line_color, true );
          else if ( ! is_transparent_bg )                       drawCircle( context, base_x + _zoom( uml_object.inner_shapes[key].x ), base_y + _zoom( uml_object.inner_shapes[key].y ), _zoom( uml_object.inner_shapes[key].radius ), fill_color, true );
        }
        drawCircle( context, base_x + _zoom( uml_object.inner_shapes[key].x ), base_y + _zoom( uml_object.inner_shapes[key].y ), _zoom( uml_object.inner_shapes[key].radius ), line_color, false );
        break;

      case "polygon":
        var polygon = [];
        for ( var i=0; i<uml_object.inner_shapes[key].polygon.length; i++ ) polygon.push( { x: base_x + _zoom( uml_object.inner_shapes[key].polygon[i].x ), y: base_y + _zoom( uml_object.inner_shapes[key].polygon[i].y ) } );
        if ( uml_object.inner_shapes[key].fill ) {
          if ( uml_object.inner_shapes[key].fill_border_color ) drawPolygon( context, polygon, line_color, true );
          else if ( ! is_transparent_bg )                       drawPolygon( context, polygon, fill_color, true );
        }
        drawPolygon( context, polygon, line_color, false );
        break;
      }
    }

    // 矩形描画
    var font_size = uml_object.params["fontSize"] || 12;
    for ( var key in uml_object.inner_rects ) {
      if ( uml_object.inner_rects[ key ].fill && ! is_transparent_bg ) drawRect( context, base_x + _zoom( uml_object.inner_rects[key].x ), base_y + _zoom( uml_object.inner_rects[key].y ), _zoom( uml_object.inner_rects[key].width ), _zoom( uml_object.inner_rects[key].height ), fill_color, true );
      if ( uml_object.inner_rects[ key ].is_border_visible ) drawRect( context, base_x + _zoom( uml_object.inner_rects[key].x ), base_y + _zoom( uml_object.inner_rects[key].y ), _zoom( uml_object.inner_rects[key].width ), _zoom( uml_object.inner_rects[key].height ), line_color, false );
      // テキストがある時は描画
      if ( uml_object.inner_rects[key].has_text ) {
        // 入力中の時は描画しない
        if ( this.inputting_uml_object && this.inputting_uml_object.id == uml_object.id && this.inputting_uml_object_shape.id == key ) continue;

        clipRect( context, base_x + _zoom( uml_object.inner_rects[key].x + 1 ), base_y + _zoom( uml_object.inner_rects[key].y + 1 ), _zoom( uml_object.inner_rects[key].width - 2 ), _zoom( uml_object.inner_rects[key].height - 2 ), function(){
          var x = base_x + _zoom( uml_object.inner_rects[key].x + 3 );
          var y = base_y + _zoom( uml_object.inner_rects[key].y + 3 );
          var width  = uml_object.inner_rects[key].width;
          var height = uml_object.inner_rects[key].height;
          var text_area_size = ( uml_object.inner_rects[ key ].vertical_text ? height : width );
          var text_rows = this._getLayouteText( uml_object.inner_rects[key].text, _zoom( font_size ), text_area_size, ( "break" == uml_object.params["wordBreak"] ? true : false ) );

          var align = "left";
          if ( uml_object.params["textAlign"]                   ) align = uml_object.params["textAlign"];
          if ( uml_object.params["nameAlign"] && key == "name" ) align = uml_object.params["nameAlign"];

          for ( var i=0; i<text_rows.length; i++ ) {
            var text_width = getTextWidth( text_rows[i], font_size );
            var align_offset = 0;
            switch( align ) {
            case "left":
              align_offset = 0;
              break;

            case "center":
              align_offset = Math.round( ( text_area_size - text_width ) / 2 );
              break;

            case "right":
              align_offset = text_area_size - text_width;
              break;
            }
            text_width = _zoom( text_width );
            align_offset = _zoom( align_offset );

            // 縦書き
            if ( uml_object.inner_rects[ key ].vertical_text ) {
              var offset_y = _zoom( uml_object.inner_rects[ key ].height - 6 ) - text_width;
              drawVerticalText( context, text_rows[i], x, y + offset_y - align_offset, text_color, _zoom( font_size ), true );
              x += _zoom( font_size + 2 );
            }
            // 横書き
            else {
              drawText( context, text_rows[i], x + align_offset, y, text_color, _zoom( font_size ), true );
              y += _zoom( font_size + 2 );
            }
          }

        }.bind(this) );
      }
    }

    // 線幅を既定値へ戻す（後続の描画へ影響させない）
    setLineWidth( context, 1 );
  };

  /*------------------------------------------------------------------------------
    UMLオブジェクトの生成・削除
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // UMLオブジェクトの内部矩形の生成
  //--------------------------------------
  EditorScreen.prototype._rotatePoint = function( base_x, base_y, px, py, angle ){
    var angle_sin = Math.sin( angle * RADIAN );
    var angle_cos = Math.cos( angle * RADIAN );
    return {
      x: base_x + Math.round( angle_cos * px - angle_sin * py ),
      y: base_y + Math.round( angle_sin * px + angle_cos * py )
    };  
  }

  //--------------------------------------
  // 再起的にUMLオブジェクトに関係している先の矩形を更新する
  //--------------------------------------
  EditorScreen.prototype._refreshInnerShapeRecursion = function( uml_object ){

    // リレーション先の内部矩形の再生成
    for ( var j=0; j<uml_object.relation_ids.length; j++ ) {
      var dest_uml_object = this._findUmlObjectById( uml_object.relation_ids[j] );
      dest_uml_object.inner_shapes = this._refreshInnerShape( dest_uml_object, dest_uml_object.type );
    }

    for ( var key in uml_object.children ) {
      this._refreshInnerShapeRecursion( uml_object.children[ key ] );
    }
  };

  //--------------------------------------
  // UMLオブジェクトの内部矩形の生成
  //--------------------------------------
  EditorScreen.prototype._refreshInnerShape = function( uml_object, type ){
    var shapes = {};
    switch( type ){
    case "relation":
      var data = [ 
        { x: uml_object.inner_lines[                               0 ].x, y: uml_object.inner_lines[                               0 ].y, type: uml_object.params["lineStartStyle"], angle: 0, prefix: "start_" },
        { x: uml_object.inner_lines[ uml_object.inner_lines.length-1 ].x, y: uml_object.inner_lines[ uml_object.inner_lines.length-1 ].y, type: uml_object.params["lineEndStyle"],   angle: 0, prefix: "end_" },
      ];

      // 曲線（ペジェ）の時の視点・終点のそれぞれの角度を計算
      if ( uml_object.params["pathStyle"] == "curve" ) {
        var is_horizontal = ( ! uml_object.inner_lines[0].relation || isIncludeArray( [ "left", "right" ], uml_object.inner_lines[0].relation.base_type ) );
        if ( 3 <= uml_object.inner_lines.length ) {
          if ( is_horizontal ) {
            if ( uml_object.inner_lines[0].y <= uml_object.inner_lines[2].y && ( uml_object.inner_lines[1].y < uml_object.inner_lines[0].y || uml_object.inner_lines[2].y < uml_object.inner_lines[1].y  ) ) is_horizontal = false;
            if ( uml_object.inner_lines[0].y >  uml_object.inner_lines[2].y && ( uml_object.inner_lines[1].y < uml_object.inner_lines[2].y || uml_object.inner_lines[0].y < uml_object.inner_lines[1].y  ) ) is_horizontal = false;
          }
          else {
            if ( uml_object.inner_lines[0].x <= uml_object.inner_lines[2].x && ( uml_object.inner_lines[1].x < uml_object.inner_lines[0].x || uml_object.inner_lines[2].x < uml_object.inner_lines[1].x ) ) is_horizontal = true;
            if ( uml_object.inner_lines[0].x >  uml_object.inner_lines[2].x && ( uml_object.inner_lines[1].x < uml_object.inner_lines[2].x || uml_object.inner_lines[0].x < uml_object.inner_lines[1].x ) ) is_horizontal = true;
          }
        }
        var bezire_points = getBezierPointsByPoints( uml_object.inner_lines, is_horizontal );
        first_bezire_point = _contactDistanceBezierPoint( data[0].x, data[0].y, 24, bezire_points.slice( 0, 3 ) );
        last_bezire_point  = _contactDistanceBezierPoint( data[1].x, data[1].y, 24, bezire_points.slice( -3 ) );
        data[0].angle = ( Math.atan2( data[0].y - first_bezire_point.y, data[0].x - first_bezire_point.x ) / RADIAN );
        data[1].angle = ( Math.atan2( data[1].y - last_bezire_point.y,  data[1].x - last_bezire_point.x ) / RADIAN );
      }
      // 直線の時の視点・終点のそれぞれの角度を計算
      else {
        data[0].angle = ( Math.atan2( data[0].y - uml_object.inner_lines[                                  1].y, data[0].x - uml_object.inner_lines[                                 1 ].x ) / RADIAN );
        data[1].angle = ( Math.atan2( data[1].y - uml_object.inner_lines[ uml_object.inner_lines.length - 2 ].y, data[1].x - uml_object.inner_lines[ uml_object.inner_lines.length - 2 ].x ) / RADIAN );  
      }

      for ( var i=0; i<2; i++ ) {
        // 0を基点として全て右向きで図形を生成し、後で座標移動と回転をする
        var shape = null;
        switch ( data[i].type ){
        case "arrow":
          shape = [
            {
              id: data[i].prefix + "association1",
              type: "line",
              start: { x: -18, y: -7 },
              end:   { x:   0, y:  0 },
              line_style: "solid",
            },
            {
              id: data[i].prefix + "association2",
              type: "line",
              start: { x:   0, y:  0 },
              end:   { x: -18, y:  7 },
              line_style: "solid",
            },
          ];
          break;

        case "check_arrow":
          if (
             ( 0==i && uml_object.inner_lines[0].x < uml_object.inner_lines[1].x )
          || ( 1==i && uml_object.inner_lines[uml_object.inner_lines.length-1].x < uml_object.inner_lines[uml_object.inner_lines.length-2].x )
          ) {
            shape = [
              {
                id: data[i].prefix + "association1",
                type: "line",
                start: { x: -18, y:  8 },
                end:   { x:   0, y:  0 },
                line_style: "solid",
              },
            ];
          }
          else {
            shape = [
              {
                id: data[i].prefix + "association1",
                type: "line",
                end:   { x: -18, y: -8 },
                start: { x:   0, y:  0 },
                line_style: "solid",
              },
            ];
          }
          break;

        case "triangle_arrow":
          shape = [{
            id: data[i].prefix + "implementation",
            type: "polygon",
            polygon: [
              { x: -18, y: -8 },
              { x:   0, y:  0 },
              { x: -18, y:  8 },
              { x: -18, y: -8 },
            ],
            fill: true,
            fill_border_color: false,
          }];
          break;

        case "triangle_arrow_black":
          shape = [{
            id: data[i].prefix + "aggregation",
            type: "polygon",
            polygon: [
              { x: -18, y: -8 },
              { x:   0, y:  0 },
              { x: -18, y:  8 },
              { x: -18, y: -8 },
            ],
            fill: true,
            fill_border_color: true,
          }];
          break;

        case "rhombus":
          shape = [{
            id: data[i].prefix + "aggregation",
            type: "polygon",
            polygon: [
              { x: -12, y: -8 },
              { x:   0, y:  0 },
              { x: -12, y:  8 },
              { x: -24, y:  0 },
            ],
            fill: true,
            fill_border_color: false,
          }];
          break;

        case "rhombus_black":
          shape = [{
            id: data[i].prefix + "aggregation",
            type: "polygon",
            polygon: [
              { x: -12, y: -8 },
              { x:   0, y:  0 },
              { x: -12, y:  8 },
              { x: -24, y:  0 },
            ],
            fill: true,
            fill_border_color: true,
          }];
          break;

        case "circle":
          shape = [{
            id: data[i].prefix + "aggregation",
            type: "circle",
            x: -8,
            y: 0,
            radius: 8,
            fill: true,
            fill_border_color: false,
          }];
          break;

        case "circle_black":
          shape = [{
            id: data[i].prefix + "aggregation",
            type: "circle",
            x: -8,
            y: 0,
            radius: 8,
            fill: true,
            fill_border_color: true,
          }];
          break;  
        }
        if ( shape ) {
          for ( var j=0; j<shape.length; j++ ) {
            if ( shape[j].start && shape[j].end ) {
              var start_pos = this._rotatePoint( data[i].x, data[i].y, shape[j].start.x, shape[j].start.y, data[i].angle );
              var end_pos   = this._rotatePoint( data[i].x, data[i].y, shape[j].end.x,   shape[j].end.y,   data[i].angle );
              shape[j].start.x = start_pos.x;
              shape[j].start.y = start_pos.y;
              shape[j].end.x   = end_pos.x;
              shape[j].end.y   = end_pos.y;
            }
            else if ( shape[j].polygon ) {
              for ( var k=0; k<shape[j].polygon.length; k++ ) {
                var pos = this._rotatePoint( data[i].x, data[i].y, shape[j].polygon[k].x, shape[j].polygon[k].y, data[i].angle );
                shape[j].polygon[k].x = pos.x;
                shape[j].polygon[k].y = pos.y;
              }  
            }
            else {
              var pos = this._rotatePoint( data[i].x, data[i].y, shape[j].x, shape[j].y, data[i].angle );
              shape[j].x = pos.x;
              shape[j].y = pos.y;
            }
            shapes[ shape[j].id ] = shape[j];
          }
        }
      }
      break;

    case "comment":
      shapes["outer"] = {
        id: "outer",
        type: "polygon",
        polygon: [
          { x: uml_object.x,                          y: uml_object.y },
          { x: uml_object.x + uml_object.width,       y: uml_object.y },
          { x: uml_object.x + uml_object.width,       y: uml_object.y + uml_object.height - 20 },
          { x: uml_object.x + uml_object.width - 20,  y: uml_object.y + uml_object.height },
          { x: uml_object.x,                          y: uml_object.y + uml_object.height },
          { x: uml_object.x,                          y: uml_object.y },
        ],
        fill: true,
        fill_border_color: false,
      };
      shapes["wrap"] = {
        id: "wrap",
        type: "polygon",
        polygon: [
          { x: uml_object.x + uml_object.width,       y: uml_object.y + uml_object.height - 20 },
          { x: uml_object.x + uml_object.width - 20,  y: uml_object.y + uml_object.height - 20 },
          { x: uml_object.x + uml_object.width - 20,  y: uml_object.y + uml_object.height },
        ],
        fill: false,
        fill_border_color: false,
      };      
      break;

    case "start":
      shapes["outer"] = {
        id: "outer",
        type: "circle",
        x: uml_object.x + uml_object.width / 2,
        y: uml_object.y + uml_object.height / 2,
        radius: uml_object.width / 2,
        fill: true,
        fill_border_color: true,
      };
      break;

    case "end":
      shapes["outer"] = {
        id: "outer",
        type: "circle",
        x: uml_object.x + uml_object.width / 2,
        y: uml_object.y + uml_object.height / 2,
        radius: uml_object.width / 2,
        fill: true,
        fill_border_color: false,
      };
      shapes["inner"] = {
        id: "inner",
        type: "circle",
        x: uml_object.x + uml_object.width / 2,
        y: uml_object.y + uml_object.height / 2,
        radius: uml_object.width / 2 - 5,
        fill: true,
        fill_border_color: true,
      };
      break;

    case "begin":
      shapes["outer"] = {
        id: "outer",
        type: "circle",
        x: uml_object.x + uml_object.width / 2,
        y: uml_object.y + uml_object.height / 2,
        radius: uml_object.width / 2,
        fill: true,
        fill_border_color: false,
      };
      break;

    case "terminate":
      shapes["outer"] = {
        id: "outer",
        type: "circle",
        x: uml_object.x + uml_object.width / 2,
        y: uml_object.y + uml_object.height / 2,
        radius: uml_object.width / 2,
        fill: true,
        fill_border_color: false,
      };
      var sin45 = Math.sin( 45 * RADIAN ) * ( uml_object.width / 2 );
      shapes["bottom-left-to-top-right"] = {
        id: "bottom-left-to-top-right",
        type: "line",
        start: { x: uml_object.x + ( uml_object.width / 2 - sin45 ), y: uml_object.y + ( uml_object.height / 2 + sin45 ) },
        end:   { x: uml_object.x + ( uml_object.width / 2 + sin45 ), y: uml_object.y + ( uml_object.height / 2 - sin45 ) },
        line_style: null,
      };
      shapes["top-left-to-bottom-right"] = {
        id: "bottom-left-to-top-right",
        type: "line",
        start: { x: uml_object.x + ( uml_object.width / 2 - sin45 ), y: uml_object.y + ( uml_object.height / 2 - sin45 ) },
        end:   { x: uml_object.x + ( uml_object.width / 2 + sin45 ), y: uml_object.y + ( uml_object.height / 2 + sin45 ) },
        line_style: null,
      };
      break;

    case "actor":
      shapes["head"] = {
        id: "head",
        type: "circle",
        x: uml_object.x + uml_object.width / 2,
        y: uml_object.y + uml_object.width / 2,
        radius: uml_object.width / 2,
        fill: true,
        fill_border_color: false,
      };
      shapes["arm"] = {
        id: "arm",
        type: "line",
        start: { x: uml_object.x ,                   y: uml_object.y + uml_object.height * 0.48 },
        end:   { x: uml_object.x + uml_object.width, y: uml_object.y + uml_object.height * 0.48 },
        line_style: null,
      };
      shapes["body"] = {
        id: "body",
        type: "line",
        start: { x: uml_object.x + ( uml_object.width / 2 ), y: uml_object.y + uml_object.height * 0.4166 },
        end:   { x: uml_object.x + ( uml_object.width / 2 ), y: uml_object.y + uml_object.height * 0.7 },
        line_style: null,
      };
      shapes["left_leg"] = {
        id: "left_leg",
        type: "line",
        start: { x: uml_object.x + ( uml_object.width / 2 ), y: uml_object.y + uml_object.height * 0.7 },
        end:   { x: uml_object.x,                            y: uml_object.y + uml_object.height },
        line_style: null,
      };
      shapes["right_leg"] = {
        id: "right_leg",
        type: "line",
        start: { x: uml_object.x + ( uml_object.width / 2 ), y: uml_object.y + uml_object.height * 0.7 },
        end:   { x: uml_object.x + uml_object.width,         y: uml_object.y + uml_object.height },
        line_style: null,
      };
      break;

    case "branch":
      shapes["rhombus"] = {
        id: "rhombus",
        type: "polygon",
        polygon: [
          { x: uml_object.x + uml_object.width / 2, y: uml_object.y },
          { x: uml_object.x + uml_object.width,     y: uml_object.y + uml_object.height / 2 },
          { x: uml_object.x + uml_object.width / 2, y: uml_object.y + uml_object.height },
          { x: uml_object.x,                        y: uml_object.y + uml_object.height / 2 },
          { x: uml_object.x + uml_object.width / 2, y: uml_object.y },
        ],
        fill: true,
        fill_border_color: false,
      };
      break;

    case "vertical_line":
      shapes["vline"] = {
        id: "vline",
        type: "line",
        start: { x: uml_object.x + 2, y: uml_object.y },
        end:   { x: uml_object.x + 2, y: uml_object.y + uml_object.height },
        line_style: null,
      };
      break;

    case "horizontal_line":
      shapes["hline"] = {
        id: "hline",
        type: "line",
        start: { x: uml_object.x,                    y: uml_object.y + 2 },
        end:   { x: uml_object.x + uml_object.width, y: uml_object.y + 2 },
        line_style: null,
      };
      break;

    case "close":
      shapes["bottom-left-to-top-right"] = {
        id: "bottom-left-to-top-right",
        type: "line",
        start: { x: uml_object.x,                     y: uml_object.y + uml_object.height },
        end:   { x: uml_object.x + uml_object.width,  y: uml_object.y },
        line_style: null,
      };
      shapes["top-left-to-bottom-right"] = {
        id: "bottom-left-to-top-right",
        type: "line",
        start: { x: uml_object.x,                     y: uml_object.y },
        end:   { x: uml_object.x + uml_object.width,  y: uml_object.y + uml_object.height },
        line_style: null,
      };
      break;

    default:
      return uml_object.inner_shapes;
    }

    return shapes;
  };

  //--------------------------------------
  // UMLオブジェクトのIDを生成
  //--------------------------------------
  EditorScreen.prototype._generateUmlObjectId = function(){
    return `${ ( new Date ).getTime().toString() }_${ this.generate_uml_object_count++ }`;
  };

  //--------------------------------------
  // UMLオブジェクトの生成
  //--------------------------------------
  EditorScreen.prototype._createInitializedUmlObject = function( type ){
    var uml_object = {
      id: this._generateUmlObjectId(),
      type: type,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      min_width: 10,
      min_height: 10,
      is_keep_aspect_rate: false,
      aspect_rate: 1.0, // height / width
      fix_width: false,
      fix_height: false,
      inner_rects: {  /* サイズ変更可能な矩形
        "rect_id": {
          id: "rect_id",
          type: "rect",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          min_width: 10,
          min_height: 10,
          has_text: true,
          text: "",
          vertical_text: false,
          top_rect_id: null,
          bottom_rect_id: null,
          left_rect_id: null,
          right_rect_id: null,
          is_bind_object_width: false,
          is_bind_object_height: false,
          is_border_visible: true,
          fill: true,
          ignore_select: false,
        },
      */ },
      inner_lines: [  /* 座標変更可能な直線
        {
          index: 0,
          type: "inner-line-start",
          x:0,
          y:0,
          relation: {
            id: null,
            type: "object_rect",
            base_type: "top"
            offset: 0,
          }
        },
      */ ],
      inner_shapes: { /* マニュアルでの座標変更ができない矩形・円・線・多角形など
        "shape_id": {
          id: "shape_id",
          type: "rect",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          fill: false,
        },
        "shape_id": {
          id: "shape_id",
          type: "circle",
          x: 0,
          y: 0,
          radius: 0,
          fill: false,
          fill_border_color: false,
        },
        "shape_id": {
          id: "shape_id",
          type: "line",
          start: { x:0, y:0 },
          end: { x:0, y:0 },
          line_style: null,
        },
        "shape_id": {
          id: "shape_id",
          type: "polygon",
          polygon: [
            { x:0, y:0 }, ...
          ],
          fill: false,
          fill_border_color: false,
        },
      */ },
      relation_ids: [],
      parent_id: null, /* uml_object */
      children: { /* uml_object_key: { uml_object }, ... */ },
      priorities: [ /* uml_object_key, ... */ ],
      params: {}
    };
    switch( type ){
    case "group":
      break;

    case "text_box":
      uml_object.width  = 100;
      uml_object.height = 50;
      uml_object.inner_rects[ "name" ] = {
        id: "name",
        type: "rect",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "text",
        top_rect_id: null,
        bottom_rect_id: null,
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: true,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      uml_object.params["fontSize"] = 12;
      uml_object.params["textAlign"] = "center";
      uml_object.params["wordBreak"] = "normal";
      break;

    case "object":
      uml_object.width  = 100;
      uml_object.height = 100;
      uml_object.inner_rects[ "name" ] = {
        id: "name",
        type: "rect",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "name",
        top_rect_id: null,
        bottom_rect_id: "properties",
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: false,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      uml_object.inner_rects[ "properties" ] = {
        id: "properties",
        type: "rect",
        x: 0,
        y: 50,
        width: 100,
        height: 50,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "text",
        top_rect_id: "name",
        bottom_rect_id: null,
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: false,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      uml_object.params["fontSize"] = 12;
      uml_object.params["nameAlign"] = "center";
      uml_object.params["wordBreak"] = "normal";
      break;

    case "class":
      uml_object.width  = 100;
      uml_object.height = 150;
      uml_object.inner_rects[ "name" ] = {
        id: "name",
        type: "rect",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "name",
        top_rect_id: null,
        bottom_rect_id: "properties",
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: false,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      uml_object.inner_rects[ "properties" ] = {
        id: "properties",
        type: "rect",
        x: 0,
        y: 50,
        width: 100,
        height: 50,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "text",
        top_rect_id: "name",
        bottom_rect_id: "methods",
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: false,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      uml_object.inner_rects[ "methods" ] = {
        id: "methods",
        type: "rect",
        x: 0,
        y: 100,
        width: 100,
        height: 50,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "text",
        top_rect_id: "properties",
        bottom_rect_id: null,
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: false,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      uml_object.params["fontSize"] = 12;
      uml_object.params["nameAlign"] = "center";
      uml_object.params["wordBreak"] = "normal";
      break;
  
    case "text":
      uml_object.width  = 100;
      uml_object.height = 50;
      uml_object.inner_rects[ "name" ] = {
        id: "name",
        type: "rect",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "name",
        top_rect_id: null,
        bottom_rect_id: null,
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: true,
        is_border_visible: false,
        fill: false,
        ignore_select: false,
      };
      uml_object.params["fontSize"] = 12;
      uml_object.params["textAlign"] = "left";
      uml_object.params["wordBreak"] = "break";
      break;

    case "relation":
      uml_object.width  = 300;
      uml_object.height = 300;
      uml_object.min_width = 30;
      uml_object.min_height = 30;
      uml_object.inner_lines = [
        { index:0, type:"inner-line-start", x:0, y:0,   relation: null },
        { index:1, type:"inner-line-end", x:300, y:300, relation: null }
      ];
      uml_object.params["pathStyle"] = "line";
      uml_object.params["lineStyle"] = "solid";
      uml_object.params["lineStartStyle"] = "none";
      uml_object.params["lineEndStyle"] = "none";
      break;

    case "comment":
      uml_object.width  = 100;
      uml_object.height = 50;
      uml_object.min_width = 30;
      uml_object.min_height = 30;
      uml_object.inner_rects[ "name" ] = {
        id: "name",
        type: "rect",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "text",
        top_rect_id: null,
        bottom_rect_id: null,
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: true,
        is_border_visible: false,
        fill: false,
        ignore_select: false,
      };
      uml_object.params["fontSize"] = 12;
      uml_object.params["textAlign"] = "left";
      uml_object.params["wordBreak"] = "break";
      break;

    case "frame":
      uml_object.width  = 300;
      uml_object.height = 300;
      uml_object.inner_rects[ "name" ] = {
        id: "name",
        type: "rect",
        x: 0,
        y: 0,
        width: 200,
        height: 30,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "name",
        top_rect_id: null,
        bottom_rect_id: "contents",
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: false,
        is_bind_object_height: false,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      uml_object.inner_rects[ "contents" ] = {
        id: "contents",
        type: "rect",
        x: 0,
        y: 30,
        width: 300,
        height: 270,
        min_width: 10,
        min_height: 10,
        has_text: false,
        text: "",
        top_rect_id: "name",
        bottom_rect_id: null,
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: false,
        is_border_visible: true,
        fill: false,
        ignore_select: true,
      };
      uml_object.params["fontSize"] = 12;
      uml_object.params["nameAlign"] = "left";
      uml_object.params["wordBreak"] = "normal";
      break;

    case "start":
      uml_object.width  = 40;
      uml_object.height = 40;
      uml_object.is_keep_aspect_rate = true;
      uml_object.aspect_rate = 1.0;
      break;
      
    case "end":
      uml_object.width  = 40;
      uml_object.height = 40;
      uml_object.is_keep_aspect_rate = true;
      uml_object.aspect_rate = 1.0;
      break;

    case "begin":
      uml_object.width  = 40;
      uml_object.height = 40;
      uml_object.is_keep_aspect_rate = true;
      uml_object.aspect_rate = 1.0;
      break;

    case "terminate":
      uml_object.width  = 40;
      uml_object.height = 40;
      uml_object.is_keep_aspect_rate = true;
      uml_object.aspect_rate = 1.0;
      break;

    case "actor":
      uml_object.width  = 50;
      uml_object.height = 120;
      uml_object.is_keep_aspect_rate = true;
      uml_object.aspect_rate = 2.4;
      break;

    case "branch":
      uml_object.width  = 40;
      uml_object.height = 40;
      uml_object.is_keep_aspect_rate = true;
      uml_object.aspect_rate = 1.0;
      break;

    case "vertical_line":
      uml_object.width  = 5;
      uml_object.height = 200;
      uml_object.fix_width = true;
      uml_object.params["lineStyle"] = "solid";
      break;

    case "horizontal_line":
      uml_object.width  = 200;
      uml_object.height = 5;
      uml_object.fix_height = true;
      uml_object.params["lineStyle"] = "solid";
      break;
      
    case "box":
      uml_object.width  = 50;
      uml_object.height = 50;
      uml_object.inner_rects[ "box" ] = {
        id: "box",
        type: "rect",
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        min_width: 10,
        min_height: 10,
        has_text: false,
        text: "",
        top_rect_id: null,
        bottom_rect_id: null,
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: true,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      break;

    case "horizontal_partition":
      uml_object.width  = 300;
      uml_object.height = 300;
      uml_object.inner_rects[ "name" ] = {
        id: "name",
        type: "rect",
        x: 0,
        y: 0,
        width: 300,
        height: 30,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "name",
        top_rect_id: null,
        bottom_rect_id: "contents",
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: false,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      uml_object.inner_rects[ "contents" ] = {
        id: "contents",
        type: "rect",
        x: 0,
        y: 30,
        width: 300,
        height: 270,
        min_width: 10,
        min_height: 10,
        has_text: false,
        text: "",
        top_rect_id: "name",
        bottom_rect_id: null,
        left_rect_id: null,
        right_rect_id: null,
        is_bind_object_width: true,
        is_bind_object_height: false,
        is_border_visible: true,
        fill: false,
        ignore_select: true,
      };
      uml_object.params["fontSize"] = 12;
      uml_object.params["nameAlign"] = "left";
      uml_object.params["wordBreak"] = "normal";
      break;

    case "vertical_partition":
      uml_object.width  = 300;
      uml_object.height = 300;
      uml_object.inner_rects[ "name" ] = {
        id: "name",
        type: "rect",
        x: 0,
        y: 0,
        width: 30,
        height: 300,
        min_width: 10,
        min_height: 10,
        has_text: true,
        text: "name",
        vertical_text: true,
        top_rect_id: null,
        bottom_rect_id: null,
        left_rect_id: null,
        right_rect_id: "contents",
        is_bind_object_width: false,
        is_bind_object_height: true,
        is_border_visible: true,
        fill: true,
        ignore_select: false,
      };
      uml_object.inner_rects[ "contents" ] = {
        id: "contents",
        type: "rect",
        x: 30,
        y: 0,
        width: 270,
        height: 300,
        min_width: 10,
        min_height: 10,
        has_text: false,
        text: "",
        top_rect_id: null,
        bottom_rect_id: null,
        left_rect_id: "name",
        right_rect_id: null,
        is_bind_object_width: false,
        is_bind_object_height: true,
        is_border_visible: true,
        fill: false,
        ignore_select: true,
      };
      uml_object.params["fontSize"] = 12;
      uml_object.params["nameAlign"] = "left";
      uml_object.params["wordBreak"] = "normal";
      break;

    case "close":
      uml_object.width  = 50;
      uml_object.height = 50;
      uml_object.is_keep_aspect_rate = true;
      uml_object.aspect_rate = 1.0;
      break;

    }

    // 共通スタイル（色・線幅）の既定値を付与する（オブジェクトのtypeによって不要なものは付与しない）
    //   lineColor / lineWidth : 線・枠を持たない text には付与しない
    //   backgroundColor       : 塗り領域を持たない text / relation / 各種線・close には付与しない
    //   textColor             : 文字列を持つ（fontSizeを持つ）オブジェクトにのみ付与する
    if ( "text" != type && "undefined" == typeof uml_object.params["lineColor"] ) uml_object.params["lineColor"] = "black";
    if ( ! isIncludeArray( [ "text", "relation", "vertical_line", "horizontal_line", "close" ], type ) && "undefined" == typeof uml_object.params["backgroundColor"] ) uml_object.params["backgroundColor"] = "white";
    if ( "text" != type && "undefined" == typeof uml_object.params["lineWidth"] ) uml_object.params["lineWidth"] = 1;
    if ( "undefined" != typeof uml_object.params["fontSize"] && "undefined" == typeof uml_object.params["textColor"] ) uml_object.params["textColor"] = "black";

    // 内部矩形の生成
    uml_object.inner_shapes = this._refreshInnerShape( uml_object, type );

    return uml_object;
  };

  //--------------------------------------
  // UMLオブジェクトの生成
  //--------------------------------------
  EditorScreen.prototype._createUmlObject = function( tool_button_name ){
    // メインコンテンツ領域でクリップ
    var uml_object = this._createInitializedUmlObject( tool_button_name.replace( "tool_button_", "" ) );

    // 初期配置位置を現在のスクロール位置を考慮した、画面中央の座標を取得
    var main_contents_element = this.findObjectByName( "main_contents" );
    var main_contents_element_pos = {
      x: main_contents_element.scrollLeft() - main_contents_element.style.padding[3],
      y: main_contents_element.scrollTop() - main_contents_element.style.padding[0],
    };
    this._moveUmlObject(
      uml_object,
      ( Math.floor( (( main_contents_element.width - uml_object.width ) / 2 ) / this.grid_size ) * this.grid_size ) + main_contents_element_pos.x,
      ( Math.floor( (( main_contents_element.height - uml_object.height ) / 2 ) / this.grid_size ) * this.grid_size ) + main_contents_element_pos.y
    );

    // オブジェクトを登録・選択状態にする
    this.save_data.objects[ uml_object.id ] = uml_object;
    this.save_data.priorities.push( uml_object.id );
    this._selectUmlObjectByKey( uml_object.id );

    // 紙サイズの修正
    this._refreshPaperSize();
    // データの記録
    this.data_manager.setData( this.save_data );

    // ツール選択をカーソルか範囲選択に戻す
    setTimeout( function(){
      this.setFocusObject( this.findObjectByName( this.select_tool_name ) );
    }.bind(this), 100 );

    return uml_object;
  };

  //--------------------------------------
  // アンドゥ
  //--------------------------------------
  EditorScreen.prototype._undo = function(){
    this._clearSelectedAllUmlObject();

    this.data_manager.undo();
    this.save_data = this.data_manager.getData();

    // 紙サイズの修正
    this._refreshPaperSize();
    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // ショートカットキーからアンドゥ
  //--------------------------------------
  EditorScreen.prototype._undoByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_UNDO ) ) {
      this._undo();
      return true;
    }
    return false;
  };

  //--------------------------------------
  // リドゥ
  //--------------------------------------
  EditorScreen.prototype._redo = function(){
    this._clearSelectedAllUmlObject();

    this.data_manager.redo();
    this.save_data = this.data_manager.getData();

    // 紙サイズの修正
    this._refreshPaperSize();
    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // ショートカットキーからリドゥ
  //--------------------------------------
  EditorScreen.prototype._redoByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_REDO ) ) {
      this._redo();
      return true;
    }
    return false;
  };

  //--------------------------------------
  // オブジェクトの関連を削除
  //--------------------------------------
  EditorScreen.prototype._releaseRelations = function( uml_object ){
    if ( ! uml_object ) return;

    // 削除オブジェクトがリレーションされている時に、リレーション元を解除
    for ( var j=0; j<uml_object.relation_ids.length; j++ ) {
      var dest_uml_object = this._findUmlObjectById( uml_object.relation_ids[j] );
      if ( dest_uml_object ) {
        if ( dest_uml_object.inner_lines[                                      0 ].relation && dest_uml_object.inner_lines[                                      0 ].relation.id == uml_object.id ) dest_uml_object.inner_lines[                                      0 ].relation = null;
        if ( dest_uml_object.inner_lines[ dest_uml_object.inner_lines.length - 1 ].relation && dest_uml_object.inner_lines[ dest_uml_object.inner_lines.length - 1 ].relation.id == uml_object.id ) dest_uml_object.inner_lines[ dest_uml_object.inner_lines.length - 1 ].relation = null;  
      }
    }

    // 削除オブジェクトがリレーションしている時に、リレーション先を解除
    if ( 0 < uml_object.inner_lines.length ) {
      if ( uml_object.inner_lines[0].relation ) {
        var dest_uml_object = this._findUmlObjectById( uml_object.inner_lines[0].relation.id );
        if ( dest_uml_object ) removeArray( dest_uml_object.relation_ids, uml_object.id );  
      }
      if ( uml_object.inner_lines[ uml_object.inner_lines.length - 1 ].relation ) {
        var dest_uml_object = this._findUmlObjectById( uml_object.inner_lines[ uml_object.inner_lines.length - 1 ].relation.id );
        if ( dest_uml_object ) removeArray( dest_uml_object.relation_ids, uml_object.id );
      }
    }

    // 再起的に解除する
    for ( var key in uml_object.children ) {
      this._releaseRelations( uml_object.children[key] );
    }
  };

  //--------------------------------------
  // オブジェクトの削除
  //--------------------------------------
  EditorScreen.prototype._removeSelectedUmlObject = function(){
    if ( 0 == this.select_uml_object_ids.length ) return false;

    var remove_objects = this._selectedUmlObjects();
    for ( var i=0; i<remove_objects.length; i++ ) {
      var remove_object = remove_objects[i];
      delete this.save_data.objects[ remove_object.id ];

      // 削除対象との関連を解除する
      this._releaseRelations( remove_object );

      // 描画優先順位からも削除する
      for ( var j=0; j<this.save_data.priorities.length; j++ ) {
        if ( this.save_data.priorities[j] == remove_object.id ) {
          this.save_data.priorities.splice( j--, 1 );
        }
      }
    }

    // 選択を初期化する
    this.select_uml_object_ids = [];  // _clearSelectedAllUmlObject()の前に先に配列を削除しておかないと、パラメータの適用・更新処理が削除されたオブジェクトに対して発生してしまう
    this._clearSelectedAllUmlObject();

    // 紙サイズの修正
    this._refreshPaperSize();
    // データの記録
    this.data_manager.setData( this.save_data );
    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // キーからオブジェクトの削除
  //--------------------------------------
  EditorScreen.prototype._removeByKey = function( statuses ){
    if ( statuses.isDownKey( KEYCODE_DELETE ) ) {
      this._removeSelectedUmlObject();
      return true;
    }
    return false;
  };

  /*------------------------------------------------------------------------------
    マウス・キーイベント処理
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // スクリーン座標を編集領域（紙）上の座標に変換する
  //--------------------------------------
  EditorScreen.prototype._getPaperOffsetPosition = function( position ){
    var main_contents_element = this.findObjectByName( "main_contents" );
    var main_content_page_position = main_contents_element.pagePosition();
    var main_contents_offset_pos = {
      x: main_content_page_position.x + main_contents_element.style.padding[3],
      y: main_content_page_position.y + main_contents_element.style.padding[0],
    };

    return {
      x: ( position.x - main_contents_offset_pos.x + main_contents_element.scrollLeft() ) / this.zoom_rate,
      y: ( position.y - main_contents_offset_pos.y + main_contents_element.scrollTop() ) / this.zoom_rate,
    }
  };

  //--------------------------------------
  // 入力完了
  //--------------------------------------
  EditorScreen.prototype._blurInputting = function(){
    if ( this.inputting_uml_object ) {
      this.inputting_uml_object_shape.text = this.requestBlurTextarea();
      this.inputting_uml_object = null;
      this.inputting_uml_object_shape = null;
    }
    // インスタントラベル入力中だった場合
    else if ( this.inputting_instant_label ) {
      var label_position = this.inputting_instant_label;
      this.inputting_instant_label = null;
      var text = this.requestBlurTextarea();
      // 1文字以上入力されていた場合のみ、textオブジェクトを同じ位置に生成する
      if ( text && 0 < text.length ) {
        this._createInstantLabelTextObject( label_position, text );
      }
    }
  };

  //--------------------------------------
  // 何も無い場所のダブルクリックによるインスタントラベル入力を開始する
  //--------------------------------------
  EditorScreen.prototype._startInstantLabelInput = function( position ){
    // 既存の入力があれば確定させる
    this._blurInputting();

    // インスタントラベル入力状態にする（生成位置を記録）
    this.inputting_instant_label = { x: position.x, y: position.y };

    // オブジェクトの文字入力時と同じtextareaをクリック位置に表示する
    var font_size = 12;
    var base_pos = this.findObjectByName( "paper" ).screenPosition();
    this.requestTextarea(
      "",
      {
        x: base_pos.x + ( position.x * this.zoom_rate ),
        y: base_pos.y + ( position.y * this.zoom_rate ),
        width:  200 * this.zoom_rate,
        height: ( font_size + 2 ) * 3 * this.zoom_rate
      },
      "rgb(0,0,0)",
      font_size,
      font_size + 2,
      0
    );
  };

  //--------------------------------------
  // インスタントラベルのtextオブジェクトを生成する
  //--------------------------------------
  EditorScreen.prototype._createInstantLabelTextObject = function( position, text ){
    var text_object = this._createInitializedUmlObject( "text" );

    // 入力された文字を初期文字として流し込む
    text_object.inner_rects["name"].text = text;

    // テキストに合わせてサイズを調整する
    var text_size = this._getTextSizeByUmlObject( text_object, null );
    if ( text_size ) {
      text_object.width  = text_size.width;
      text_object.height = text_size.height;
      text_object.inner_rects["name"].width  = text_size.width;
      text_object.inner_rects["name"].height = text_size.height;
    }

    // 入力位置へ配置する
    this._moveUmlObject( text_object, position.x, position.y );

    // 内部矩形の再生成
    text_object.inner_shapes = this._refreshInnerShape( text_object, text_object.type );

    // オブジェクトを登録・選択状態にする
    this.save_data.objects[ text_object.id ] = text_object;
    this.save_data.priorities.push( text_object.id );
    this._selectUmlObjectByKey( text_object.id );

    // 紙サイズの修正
    this._refreshPaperSize();
    // データの記録
    this.data_manager.setData( this.save_data );
    // 再描画
    this.screen_manager.requestDraw( this );

    return text_object;
  };

  //--------------------------------------
  // クリックによる入力完了
  //--------------------------------------
  EditorScreen.prototype._blurInputtingByClick = function( statuses ){
    // ドラッグではなくクリック？
    if ( statuses.isUpKey( KEYCODE_CURSOR ) && ! statuses.isDrop( KEYCODE_CURSOR ) ) {
      this._blurInputting();
    }
    return false;
  }

  //--------------------------------------
  // 右クリックメニューを非表示にする
  //--------------------------------------
  EditorScreen.prototype._hideContextMenu = function(){
    var panel = this.findObjectByName( "context_menu_panel" );
    if ( panel && panel.isShow() ) {
      panel.hide();
      this.screen_manager.requestDraw( this );
      return true;
    }
    return false;
  };

  //--------------------------------------
  // ESCキーで右クリックメニューを非表示にする
  //--------------------------------------
  EditorScreen.prototype._hideContextMenuByShortCutKey = function( statuses ){
    if ( statuses.isDownKey( KEYCODE_ESC ) ) {
      return this._hideContextMenu();
    }
    return false;
  };

  //--------------------------------------
  // 右クリックによる右クリックメニューの表示
  //   オブジェクト／グループ上での右クリック時のみメニューを表示する（それ以外は何もしない）。
  //   カーソル位置のオブジェクトが未選択なら、左クリック同様に選択状態にしてから表示する。
  //--------------------------------------
  EditorScreen.prototype._showContextMenuByRightClick = function( statuses ){
    // ドラッグではなく右クリック（押して離す）？
    if ( statuses.isUpKey( KEYCODE_MOUSE_RIGHT ) && ! statuses.isDrop( KEYCODE_MOUSE_RIGHT ) ) {
      // クリック位置を紙の左上からの相対位置に変換
      var cursor_position = this._getPaperOffsetPosition( statuses.getCursorPosition() );

      // 座標位置のUMLオブジェクトを取得
      var uml_object_key = this._findHoverUmlObjectKeyByPoint( cursor_position.x, cursor_position.y );

      // オブジェクト／グループ以外（何も無い場所）では何もしない
      if ( ! uml_object_key ) return true;

      // カーソル位置のオブジェクトが未選択ならば、左クリック同様に選択状態にする
      if ( ! this._isIncludeSelectedUmlObjectByKey( uml_object_key ) ) {
        this._selectUmlObjectByKey( uml_object_key );
      }

      // 右クリックメニューをカーソル位置に表示する（canvasへフレームワークで描画）
      var screen_cursor_position = statuses.getCursorPosition();
      var panel = this.findObjectByName( "context_menu_panel" );
      panel.setDynamicStyleAttr( "left", screen_cursor_position.x );
      panel.setDynamicStyleAttr( "top",  screen_cursor_position.y );
      panel.show();

      // 再描画
      this.screen_manager.requestDraw( this );
      return true;
    }
    return false;
  };

  //--------------------------------------
  // クリックによるオブジェクト選択
  //--------------------------------------
  EditorScreen.prototype._selectUmlObjectByClick = function( statuses ){
    // ドラッグではなくクリック？
    if ( statuses.isUpKey( KEYCODE_CURSOR ) && ! statuses.isDrop( KEYCODE_CURSOR ) ) {
      // クリック位置を紙の左上からの相対位置に変換
      var cursor_position = this._getPaperOffsetPosition( statuses.getCursorPosition() );

      // トグルをクリックした時には何もしないが選択解除させないためにキーを消費させる
      for ( var i=0; i<this.draggable_toggles.length; i++ ) {
        if (
           ( this.draggable_toggles[i].x - 4 <= cursor_position.x && cursor_position.x <= this.draggable_toggles[i].x + 8 )
        && ( this.draggable_toggles[i].y - 4 <= cursor_position.y && cursor_position.y <= this.draggable_toggles[i].y + 8 )
        ) {
          return true;
        }
      }

      // 座標位置のUMLオブジェクトを取得
      var uml_object_key = this._findHoverUmlObjectKeyByPoint( cursor_position.x, cursor_position.y );
      if ( uml_object_key ) {
        // クリックでオブジェクトを対象にした場合、そのオブジェクト位置を次のペースト基準にする（右下へ少しずらす）
        var paste_base_object = this._findUmlObjectByKey( uml_object_key ) || this._getRootUmlObjectByKey( uml_object_key );
        if ( paste_base_object ) {
          this.paste_base_position = { x: paste_base_object.x + ( this.grid_size * 2 ), y: paste_base_object.y + ( this.grid_size * 2 ) };
        }

        // SHIFTを押しながらならば、選択中のオブジェクトに追加。そうでなければ再選択
        if ( statuses.isPressKey( KEYCODE_SHIFT ) ) {
          // 既に選択済み？
          if ( this._isIncludeSelectedUmlObjectByKey( uml_object_key ) ) {
            this._clearSelectedUmlObjectByKey( uml_object_key );
          }
          // まだ選択されていない
          else {
            this._appendSelectUmlObjectByKey( uml_object_key );
          }
        }
        else {
          // 段階的な選択・文字入力のため、選択切替の「前」に、
          // クリックしたオブジェクト「自体」が既に選択済みかどうかを実体（ルートではなくオブジェクト一致）で判定する。
          //   グループの場合: 1回目=グループ選択、2回目=メンバー選択（ここでは文字入力しない）、
          //                   3回目（メンバーが選択済みの状態で文字矩形を再クリック）=文字入力、となる。
          var clicked_uml_object = this._findUmlObjectByKey( uml_object_key );
          var is_already_selected_object = false;
          for ( var select_index=0; select_index<this.select_uml_object_ids.length; select_index++ ) {
            if ( this._findUmlObjectByKey( this.select_uml_object_ids[ select_index ] ) === clicked_uml_object ) {
              is_already_selected_object = true;
              break;
            }
          }

          // 選択切替（グループ内メンバーへのドリルイン選択を含む）
          this._selectUmlObjectByKey( uml_object_key );

          // クリックしたオブジェクト自体が既に選択済みだった場合にのみ文字入力可能かを判断する
          if ( is_already_selected_object ) {
            var selectable_key = this._getSelectableUmlObjectKeyByKey( uml_object_key );
            var shape = this._getUmlObjectInnerShapeByKey( selectable_key );
            // 文字入力を行う
            if ( shape && "rect" == shape.type && shape.has_text ) {
              var base_pos = this.findObjectByName( "paper" ).screenPosition();
        
              this.inputting_uml_object = this._findUmlObjectByKey( selectable_key );
              this.inputting_uml_object_shape = shape;
              this.requestTextarea(
                shape.text,
                { 
                  x: base_pos.x + ( ( shape.x + 3 ) * this.zoom_rate ),
                  y: base_pos.y + ( ( shape.y + 3 ) * this.zoom_rate ),
                  width:  ( ( shape.width - 6 ) * this.zoom_rate ),
                  height: ( ( shape.height - 6 ) * this.zoom_rate ) 
                },
                "rgb(0,0,0)", 
                this.inputting_uml_object.params.fontSize || 12,
                ( this.inputting_uml_object.params.fontSize || 12 ) + 2,
                0
              );
            }
          }
        }

        // 再描画
        this.screen_manager.requestDraw( this );
        return true;
      }
      // クリック位置には何もなかった
      else {

        // 何も無い場所をクリックした場合、その位置を次のペースト基準にする（グリッド吸着）
        this.paste_base_position = {
          x: Math.round( cursor_position.x / this.grid_size ) * this.grid_size,
          y: Math.round( cursor_position.y / this.grid_size ) * this.grid_size
        };

        // SHIFT押下してないのなら、現在選択しているものを全てキャンセル
        if ( ! statuses.isPressKey( KEYCODE_SHIFT ) ) {
          // 入力中状態を解除する
          if ( this.focus_ui_object ) this.focus_ui_object.blur();

          this._clearSelectedAllUmlObject();

          // 再描画
          this.screen_manager.requestDraw( this );
        }
      }

    }
    return false;
  };

  //--------------------------------------
  // オブジェクト選択のドラッグ中のスクロール処理
  //--------------------------------------
  EditorScreen.prototype._scrollPaperForDragging = function( statuses ){
    // メインコンテンツ領域内でのカーソル位置を取得
    var main_contents_element = this.findObjectByName("main_contents");
    var main_content_page_position = main_contents_element.pagePosition();
    var offset_cursor_position = statuses.getCursorPosition();
    offset_cursor_position.x -= main_content_page_position.x;
    offset_cursor_position.y -= main_content_page_position.y;

    // メインコンテンツ端ならスクロール
    if ( 60 >= offset_cursor_position.x ) {
      main_contents_element.scrollLeft( main_contents_element.scrollLeft() - 7 );
    }
    else if ( main_contents_element.width - 60 <= offset_cursor_position.x ) {
      main_contents_element.scrollLeft( main_contents_element.scrollLeft() + 7 );
    }
    if ( 60 >= offset_cursor_position.y ) {
      main_contents_element.scrollTop( main_contents_element.scrollTop() - 7 );
    }
    else if ( main_contents_element.height - 60 <= offset_cursor_position.y ) {
      main_contents_element.scrollTop( main_contents_element.scrollTop() + 7 );
    }
  }

  //--------------------------------------
  // オブジェクトの範囲選択
  //--------------------------------------
  EditorScreen.prototype._selectUmlObjectsByDrag = function( statuses ){
    // オブジェクトの処理よりも優先で分割情報のドラッグ判定を行う（画像のスクロール処理にとられるため）
    if ( statuses.isDrag( KEYCODE_CURSOR ) ) {
      // 前回のドラッグ情報を消去する
      statuses.storeDraggingTemporaryData( KEYCODE_CURSOR, null );

      // ドラッグ開始位置を紙の左上からの相対位置に変換
      var cursor_position = this._getPaperOffsetPosition( statuses.getDragPosition() );

      // ドラッグ範囲の記録（範囲の描画用にも利用）
      this.dragging_rect = {
        start_position: cursor_position,
        x: cursor_position.x,
        y: cursor_position.y,
        width: 0,
        height: 0,
      };
      return true; // ドラッグ処理ならば必ずtrueを返さないと、画面スクロールが発生してしまう
    }
    // ドラッグ中
    else if ( statuses.isDragging( KEYCODE_CURSOR ) ) {

      // ドラッグ中の位置を紙の左上からの相対位置に変換
      var cursor_position = this._getPaperOffsetPosition( statuses.getCursorPosition() );

      // ドラッグ範囲を更新
      if ( this.dragging_rect.start_position.x < cursor_position.x ) {
        this.dragging_rect.width = cursor_position.x - this.dragging_rect.start_position.x;
      }
      else {
        this.dragging_rect.x = cursor_position.x;
        this.dragging_rect.width = this.dragging_rect.start_position.x - cursor_position.x;
      }
      if ( this.dragging_rect.start_position.y < cursor_position.y ) {
        this.dragging_rect.height = cursor_position.y - this.dragging_rect.start_position.y;
      }
      else {
        this.dragging_rect.y = cursor_position.y;
        this.dragging_rect.height = this.dragging_rect.start_position.y - cursor_position.y;
      }

      // 画面端ならここでスクロールもさせる
      this._scrollPaperForDragging( statuses );

      // 再描画
      this.screen_manager.requestDraw( this );
      return true; // ドラッグ処理ならば必ずtrueを返さないと、画面スクロールが発生してしまう
    }
    // ドロップ
    else if ( statuses.isDrop( KEYCODE_CURSOR ) ) {

      var uml_object_keys = [];
      switch ( this.select_tool_name ) {
      case "tool_button_contain_range":
        uml_object_keys = this._findContainUmlObjectKeysInRect( this.dragging_rect.x, this.dragging_rect.y, this.dragging_rect.width, this.dragging_rect.height );
        break;

      case "tool_button_range":
      default:
        // 範囲選択（交差）ツール、またはカーソルツール中のSHIFT＋ドラッグ
        uml_object_keys = this._findIncludeUmlObjectKeysInRect( this.dragging_rect.x, this.dragging_rect.y, this.dragging_rect.width, this.dragging_rect.height );
        break;

      }

      // SHIFTを押しながらでない時は選択を解除してから追加
      if ( ! statuses.isPressKey( KEYCODE_SHIFT ) ) {
        this._clearSelectedAllUmlObject();
      }

      // 範囲選択したオブジェクトを選択追加
      for ( var i=0; i<uml_object_keys.length; i++ ) {
        this._appendSelectUmlObjectByKey( uml_object_keys[i] );
      }

      // ドラッグ範囲を初期化
      this.dragging_rect = null;

      // ツール選択をカーソルに戻す
      this.select_tool_name = "tool_button_cursor";
      this.setFocusObject( this.findObjectByName( this.select_tool_name ) );

      // 再描画
      this.screen_manager.requestDraw( this );
      return true; // ドラッグ処理ならば必ずtrueを返さないと、画面スクロールが発生してしまう
    }
    return false;
  };

  //--------------------------------------
  // ダブルクリックによるオブジェクト変形
  //--------------------------------------
  EditorScreen.prototype._editSelectedUmlObjectsByDoubleClick = function( statuses ){
    if ( statuses.isMultiKeyUp( KEYCODE_CURSOR, 2 ) ) {
      // クリック位置を紙の左上からの相対位置に変換
      var cursor_position = this._getPaperOffsetPosition( statuses.getCursorPosition() );

      // トグルをクリックしている？
      for ( var i=0; i<this.draggable_toggles.length; i++ ) {
        if (
           ( this.draggable_toggles[i].x - 4 <= cursor_position.x && cursor_position.x <= this.draggable_toggles[i].x + 8 )
        && ( this.draggable_toggles[i].y - 4 <= cursor_position.y && cursor_position.y <= this.draggable_toggles[i].y + 8 )
        ) {
          var draggable_toggle = this.draggable_toggles[i];

          // リレーションの分割点ならば削除する
          switch( draggable_toggle.type ) {
          case "inner-line-relay":
            draggable_toggle.owner.inner_lines.splice( draggable_toggle.inner_shape.index, 1 );

            // 中継点のインデックス番号の再設定
            for ( var j=0; j<draggable_toggle.owner.inner_lines.length; j++ ) {
              draggable_toggle.owner.inner_lines[j].index = j;
            }

            // 入力状態の完了
            this._blurInputting();

            // 内部矩形の再生成
            draggable_toggle.owner.inner_shapes = this._refreshInnerShape( draggable_toggle.owner, draggable_toggle.owner.type );

            // リレーションの全体矩形を正規化
            this._normalizationUmlObjectSizeByInnerLine( draggable_toggle.owner );
            break;

          // テキストエリアのサイズをテキストに一致させる
          case "inner-left":
          case "inner-top":
            var inner_rect = null;
            if ( draggable_toggle.inner_shape.left_rect_id ) inner_rect = draggable_toggle.owner.inner_rects[ draggable_toggle.inner_shape.left_rect_id ];
            if ( draggable_toggle.inner_shape.top_rect_id  ) inner_rect = draggable_toggle.owner.inner_rects[ draggable_toggle.inner_shape.top_rect_id ];
            if ( ! inner_rect ) return false;
            var text_size = this._getTextSizeByUmlObject( draggable_toggle.owner, inner_rect );
            if ( ! text_size ) return false;

            this._editInnerUmlObjectSize(
              draggable_toggle.owner,
              draggable_toggle.inner_shape,
              draggable_toggle.type,
              inner_rect.x + text_size.width,
              inner_rect.y + text_size.height,
            );
            break;

          case "inner-right":
          case "inner-bottom":
            var text_size = this._getTextSizeByUmlObject( draggable_toggle.owner, draggable_toggle.inner_shape );
            if ( ! text_size ) return false;

            this._editInnerUmlObjectSize(
              draggable_toggle.owner,
              draggable_toggle.inner_shape,
              draggable_toggle.type,
              draggable_toggle.inner_shape.x + text_size.width,
              draggable_toggle.inner_shape.y + text_size.height
            );
            break;

          case "top-right":
          case "right":
            var has_occupy_text_rect = false
            var last_inner_rect = null;
            for ( var key in draggable_toggle.owner.inner_rects ) {
              if ( draggable_toggle.owner.inner_rects[key].is_bind_object_width  && draggable_toggle.owner.inner_rects[key].has_text ) has_occupy_text_rect = true;
              if ( draggable_toggle.owner.inner_rects[key].is_bind_object_height && draggable_toggle.owner.inner_rects[key].left_rect_id && ! draggable_toggle.owner.inner_rects[key].right_rect_id ) last_inner_rect = draggable_toggle.owner.inner_rects[key];
            }
            if ( ! has_occupy_text_rect && ! last_inner_rect ) return false;

            if ( last_inner_rect ) {
              var text_size = this._getTextSizeByUmlObject( draggable_toggle.owner, last_inner_rect );
              if ( ! text_size ) return false;

              this._editUmlObjectSize( 
                draggable_toggle.owner,
                draggable_toggle.type,
                last_inner_rect.x + text_size.height,
                draggable_toggle.owner.y ,
              );
            }
            if ( has_occupy_text_rect ) {
              var text_size = this._getTextSizeByUmlObject( draggable_toggle.owner, null );
              if ( ! text_size ) return false;
              
              this._editUmlObjectSize( 
                draggable_toggle.owner,
                draggable_toggle.type,
                draggable_toggle.owner.x + text_size.width,
                draggable_toggle.owner.y,
              );
            }
            break;

          case "bottom-left":
          case "bottom":
            var has_occupy_text_rect = false
            var last_inner_rect = null;
            for ( var key in draggable_toggle.owner.inner_rects ) {
              if ( draggable_toggle.owner.inner_rects[key].is_bind_object_height && draggable_toggle.owner.inner_rects[key].has_text ) has_occupy_text_rect = true;
              if ( draggable_toggle.owner.inner_rects[key].is_bind_object_width  && draggable_toggle.owner.inner_rects[key].top_rect_id && ! draggable_toggle.owner.inner_rects[key].bottom_rect_id ) last_inner_rect = draggable_toggle.owner.inner_rects[key];
            }
            if ( ! has_occupy_text_rect && ! last_inner_rect ) return false;
            
            if ( last_inner_rect ) {
              var text_size = this._getTextSizeByUmlObject( draggable_toggle.owner, last_inner_rect );
              if ( ! text_size ) return false;

              this._editUmlObjectSize( 
                draggable_toggle.owner,
                draggable_toggle.type,
                draggable_toggle.owner.x,
                last_inner_rect.y + text_size.height,
              );
            }
            if ( has_occupy_text_rect ) {
              var text_size = this._getTextSizeByUmlObject( draggable_toggle.owner, null );
              if ( ! text_size ) return false;
  
              this._editUmlObjectSize( 
                draggable_toggle.owner,
                draggable_toggle.type,
                draggable_toggle.owner.x,
                draggable_toggle.owner.y + text_size.height + ( "comment" == draggable_toggle.owner.type ? 20 : 0 ),
              );
            }
            break;
            
          case "bottom-right":
            var has_occupy_text_width = false
            var has_occupy_text_height = false
            var last_bottom_inner_rect = null;
            var last_right_inner_rect = null;
            for ( var key in draggable_toggle.owner.inner_rects ) {
              if ( draggable_toggle.owner.inner_rects[key].has_text ) {
                if ( draggable_toggle.owner.inner_rects[key].is_bind_object_width  ) has_occupy_text_width = true;
                if ( draggable_toggle.owner.inner_rects[key].is_bind_object_height ) has_occupy_text_height = true;
                if ( draggable_toggle.owner.inner_rects[key].is_bind_object_width  && draggable_toggle.owner.inner_rects[key].top_rect_id  && ! draggable_toggle.owner.inner_rects[key].bottom_rect_id ) last_bottom_inner_rect = draggable_toggle.owner.inner_rects[key];
                if ( draggable_toggle.owner.inner_rects[key].is_bind_object_height && draggable_toggle.owner.inner_rects[key].left_rect_id && ! draggable_toggle.owner.inner_rects[key].right_rect_id  ) last_right_inner_rect = draggable_toggle.owner.inner_rects[key];
              }
            }
            if ( ! has_occupy_text_width && ! has_occupy_text_height && ! last_bottom_inner_rect && ! last_right_inner_rect ) return false;

            if ( last_bottom_inner_rect ) {
              var text_size = this._getTextSizeByUmlObject( draggable_toggle.owner, last_bottom_inner_rect );
              if ( ! text_size ) return false;

              this._editUmlObjectSize( 
                draggable_toggle.owner,
                draggable_toggle.type,
                draggable_toggle.owner.x,
                last_bottom_inner_rect.y + text_size.height,
              );
            }
            if ( last_right_inner_rect ) {
              var text_size = this._getTextSizeByUmlObject( draggable_toggle.owner, last_right_inner_rect );
              if ( ! text_size ) return false;

              this._editUmlObjectSize( 
                draggable_toggle.owner,
                draggable_toggle.type,
                last_right_inner_rect.x + text_size.width,
                draggable_toggle.owner.y,
              );
            }
            if ( has_occupy_text_width || has_occupy_text_height ) {
              var text_size = this._getTextSizeByUmlObject( draggable_toggle.owner, null );
              if ( ! text_size ) return false;
              
              this._editUmlObjectSize( 
                draggable_toggle.owner,
                draggable_toggle.type,
                draggable_toggle.owner.x + ( has_occupy_text_width  ? text_size.width  : draggable_toggle.owner.width ),
                draggable_toggle.owner.y + ( has_occupy_text_height ? text_size.height : draggable_toggle.owner.height ) + ( "comment" == draggable_toggle.owner.type ? 20 : 0 ),
              );  
            }
            break;

          default:
            return false;            
          }

          // 親グループの矩形を更新
          if ( draggable_toggle.owner.parent_id ) {
            this._updateGroupedUmlObjectRect(
              this._findUmlObjectById( draggable_toggle.owner.parent_id )
            );
          }

          // データの記録
          this.data_manager.setData( this.save_data );

          // 再描画
          this.screen_manager.requestDraw( this );

          // 選択中オブジェクトの編集用トグルを再表示
          this._generateDraggableToggles();

          return true;
        }
      }

      // 座標位置のUMLオブジェクトを取得
      var uml_object_key = this._findHoverUmlObjectKeyByPoint( cursor_position.x, cursor_position.y );
      if ( uml_object_key ) {
        // 接続済みのリレーションだった時
        var selected_uml_object = this._findUmlObjectByKey( uml_object_key );
        if ( selected_uml_object.type == "relation" ) {

          // 線を分割するための位置を探す
          for ( var i=0; i<selected_uml_object.inner_lines.length-1; i++ ) {
            var is_horizontal = ( ! selected_uml_object.inner_lines[0].relation || isIncludeArray( [ "left", "right" ], selected_uml_object.inner_lines[0].relation.base_type ) );
            if ( 3 <= selected_uml_object.inner_lines.length ) {
              if ( is_horizontal ) {
                if ( selected_uml_object.inner_lines[0].y <= selected_uml_object.inner_lines[2].y && ( selected_uml_object.inner_lines[1].y < selected_uml_object.inner_lines[0].y || selected_uml_object.inner_lines[2].y < selected_uml_object.inner_lines[1].y  ) ) is_horizontal = false;
                if ( selected_uml_object.inner_lines[0].y >  selected_uml_object.inner_lines[2].y && ( selected_uml_object.inner_lines[1].y < selected_uml_object.inner_lines[2].y || selected_uml_object.inner_lines[0].y < selected_uml_object.inner_lines[1].y  ) ) is_horizontal = false;
              }
              else {
                if ( selected_uml_object.inner_lines[0].x <= selected_uml_object.inner_lines[2].x && ( selected_uml_object.inner_lines[1].x < selected_uml_object.inner_lines[0].x || selected_uml_object.inner_lines[2].x < selected_uml_object.inner_lines[1].x ) ) is_horizontal = true;
                if ( selected_uml_object.inner_lines[0].x >  selected_uml_object.inner_lines[2].x && ( selected_uml_object.inner_lines[1].x < selected_uml_object.inner_lines[2].x || selected_uml_object.inner_lines[0].x < selected_uml_object.inner_lines[1].x ) ) is_horizontal = true;
              }
            }
            var bezire_points = getBezierPointsByPoints( selected_uml_object.inner_lines, is_horizontal )
            if (
               ( selected_uml_object.params["pathStyle"] == "curve" && isCollisionPointAndBezier( cursor_position.x, cursor_position.y, bezire_points.slice( i*2, i*2+3 ) ) )
            || ( selected_uml_object.params["pathStyle"] == "line"  && isCollisionPointAndLine( cursor_position.x, cursor_position.y, selected_uml_object.inner_lines[i].x, selected_uml_object.inner_lines[i].y, selected_uml_object.inner_lines[i+1].x, selected_uml_object.inner_lines[i+1].y ) )
            ) {

              // 分割
              selected_uml_object.inner_lines.splice( i+1, 0, { index: i+1, type: "inner-line-relay", x:cursor_position.x, y:cursor_position.y, relation:null } )

              // インデックス番号を振り直す
              for ( var j=i+2; j<selected_uml_object.inner_lines.length; j++ ) {
                selected_uml_object.inner_lines[j].index = j;
              }

              // 内部矩形の生成
              selected_uml_object.inner_shapes = this._refreshInnerShape( selected_uml_object, selected_uml_object.type );

              // データの記録
              this.data_manager.setData( this.save_data );

              // 再描画
              this.screen_manager.requestDraw( this );

              // 選択中オブジェクトの編集用トグルを再表示
              this._generateDraggableToggles();

              return true;
            }
          }
        }
      }
      // 何も無い場所をダブルクリックした場合は、インスタントラベル入力を開始する
      else {
        this._startInstantLabelInput( cursor_position );
        return true;
      }
    }
    return false;
  }

  //--------------------------------------
  // ドラッグによるオブジェクト変形
  //--------------------------------------
  EditorScreen.prototype._editSelectedUmlObjectsByDrag = function( statuses ){
    // オブジェクトの処理よりも優先で分割情報のドラッグ判定を行う（画像のスクロール処理にとられるため）
    if ( statuses.isDrag( KEYCODE_CURSOR ) ) {
      // 前回のドラッグ情報を消去する
      statuses.storeDraggingTemporaryData( KEYCODE_CURSOR, null );

      // ドラッグ開始位置を紙の左上からの相対位置に変換
      var cursor_position = this._getPaperOffsetPosition( statuses.getDragPosition() );

      // ドラッグ開始位置のトグルを探す
      for ( var i=0; i<this.draggable_toggles.length; i++ ) {
        if (
           ( this.draggable_toggles[i].x - 4 <= cursor_position.x && cursor_position.x <= this.draggable_toggles[i].x + 8 )
        && ( this.draggable_toggles[i].y - 4 <= cursor_position.y && cursor_position.y <= this.draggable_toggles[i].y + 8 )
        ) {
          statuses.storeDraggingTemporaryData( KEYCODE_CURSOR, { type:"toggle", toggle: this.draggable_toggles[i], start_cursor_position: cursor_position } );

          // 選択オブジェクト編集用のトグルを一旦削除
          this.draggable_toggles = [];

          // 入力状態の完了
          this._blurInputting();

          return true; // ドラッグ処理ならば必ずtrueを返さないと、画面スクロールが発生してしまう
        }
      }

      return false;
    }
    // ドラッグ中
    else if ( statuses.isDragging( KEYCODE_CURSOR ) ) {
      // ドラッグ位置を紙の左上からの相対位置に変換
      var cursor_position = this._getPaperOffsetPosition( statuses.getCursorPosition() );
      // ドラッグ開始時点での情報を取得
      var drag_starting_data = statuses.loadDraggingTemporaryData( KEYCODE_CURSOR );
      if ( ! drag_starting_data || "toggle" != drag_starting_data.type ) return false;
      // ドラッグ開始位置を取得（ドラッグ開始以降でスクロールが発生しているかもしれないので、テンポラリに事前に保存していた値を利用する）
      var start_cursor_position = drag_starting_data.start_cursor_position;

      // コントロールキー（またはコマンドキー）押下なら、1ピクセル単位での移動にする
      var is_not_connection = false;
      if ( statuses.isPressKey( KEYCODE_CTRL ) || statuses.isPressKey( KEYCODE_COMMAND ) ) {
        is_not_connection = true; // リレーションオブジェクトの場合に、コントロールキー押下時は他オブジュエクトとの接続をしない
      }
      // 通常は10ピクセル単位で移動。
      // ただし関係線（relation）の始点・終点は、接続時に「辺の中央へ吸着」させる判定のため生座標のまま渡す
      // （接続有無に応じて _moveInnerLine 内で確定。接続時は10px＋辺中央、非接続時は10px、中継点・リサイズは10px）
      else {
        if ( ! isIncludeArray( [ "inner-line-start", "inner-line-end" ], drag_starting_data.toggle.type ) ) {
          cursor_position.x = Math.floor( cursor_position.x / this.grid_size ) * this.grid_size;
          cursor_position.y = Math.floor( cursor_position.y / this.grid_size ) * this.grid_size;
        }
      }

      // アスペクト比の維持
      if ( drag_starting_data.toggle.owner.is_keep_aspect_rate ) {
        var move_amount_x = cursor_position.x - start_cursor_position.x;
        var move_amount_y = cursor_position.y - start_cursor_position.y;
        switch ( drag_starting_data.toggle.type ) {
        case "top-left":
          if ( -move_amount_x < -move_amount_y ) move_amount_x = move_amount_y;
          cursor_position.x = start_cursor_position.x + move_amount_x;
          cursor_position.y = start_cursor_position.y + ( move_amount_x * drag_starting_data.toggle.owner.aspect_rate );
          break;

        case "top-right":
          if ( move_amount_x < -move_amount_y ) move_amount_x = -move_amount_y;
          cursor_position.x = start_cursor_position.x + move_amount_x;
          cursor_position.y = start_cursor_position.y - ( move_amount_x * drag_starting_data.toggle.owner.aspect_rate );
          break;

        case "bottom-left":
          if ( -move_amount_x < move_amount_y ) move_amount_x = -move_amount_y;
          cursor_position.x = start_cursor_position.x + move_amount_x;
          cursor_position.y = start_cursor_position.y - ( move_amount_x * drag_starting_data.toggle.owner.aspect_rate );
          break;

        case "bottom-right":
          if ( move_amount_x < move_amount_y ) move_amount_x = move_amount_y;
          cursor_position.x = start_cursor_position.x + move_amount_x;
          cursor_position.y = start_cursor_position.y + ( move_amount_x * drag_starting_data.toggle.owner.aspect_rate );
          break;
        }
      }

      // オブジェクトの変形
      this._editUmlObjectSize( drag_starting_data.toggle.owner, drag_starting_data.toggle.type, cursor_position.x, cursor_position.y );
      this._editInnerUmlObjectSize( drag_starting_data.toggle.owner, drag_starting_data.toggle.inner_shape, drag_starting_data.toggle.type, cursor_position.x, cursor_position.y );
      this._moveInnerLine( drag_starting_data.toggle.owner, drag_starting_data.toggle.inner_shape, drag_starting_data.toggle.type, cursor_position.x, cursor_position.y, is_not_connection );

      // 画面端ならここでスクロールもさせる
      this._scrollPaperForDragging( statuses );

      // 再描画
      this.screen_manager.requestDraw( this );
      return true; // ドラッグ処理ならば必ずtrueを返さないと、画面スクロールが発生してしまう
    }
    // ドロップ
    else if ( statuses.isDrop( KEYCODE_CURSOR ) ) {
      // ドラッグ開始時点での情報を取得
      var drag_starting_data = statuses.loadDraggingTemporaryData( KEYCODE_CURSOR );
      if ( ! drag_starting_data || "toggle" != drag_starting_data.type ) return false;

      // 内部矩形の再生成
      drag_starting_data.toggle.owner.inner_shapes = this._refreshInnerShape( drag_starting_data.toggle.owner, drag_starting_data.toggle.owner.type );
      // リレーション先の内部矩形の再生成
      for ( var i=0; i<drag_starting_data.toggle.owner.relation_ids.length; i++ ) {
        var dest_uml_object = this._findUmlObjectById( drag_starting_data.toggle.owner.relation_ids[i] );
        dest_uml_object.inner_shapes = this._refreshInnerShape( dest_uml_object, dest_uml_object.type );
      }

      // 前回のドラッグ情報を消去する
      statuses.storeDraggingTemporaryData( KEYCODE_CURSOR, null );

      // 選択中オブジェクトの編集用トグルを再表示
      this._generateDraggableToggles();

      // データの記録
      this.data_manager.setData( this.save_data );

      // 再描画
      this.screen_manager.requestDraw( this );
      return true; // ドラッグ処理ならば必ずtrueを返さないと、画面スクロールが発生してしまう
    }
    return false;
  };

  //--------------------------------------
  // ドラッグによるオブジェクト移動
  //--------------------------------------
  EditorScreen.prototype._moveSelectedUmlObjectsByDrag = function( statuses ){
    // オブジェクトの処理よりも優先で分割情報のドラッグ判定を行う（画像のスクロール処理にとられるため）
    if ( statuses.isDrag( KEYCODE_CURSOR ) ) {
      // 前回のドラッグ情報を消去する
      statuses.storeDraggingTemporaryData( KEYCODE_CURSOR, null );

      // 選択オブジェクト編集用のトグルを一旦削除
      this.draggable_toggles = [];

      // ドラッグ開始位置を紙の左上からの相対位置に変換
      var cursor_position = this._getPaperOffsetPosition( statuses.getDragPosition() );
      // 座標位置のUMLオブジェクトを取得
      var uml_object_key = this._findHoverUmlObjectKeyByPoint( cursor_position.x, cursor_position.y );
      if ( uml_object_key ) {
        // UMLオブジェクトは選択中のもの？
        if ( this._isSelectedUmlObjectByKey( uml_object_key ) ) {

          // 接続済みのリレーションだった時
          var selected_uml_object = this._findUmlObjectByKey( uml_object_key );
          if (
             ( selected_uml_object.type == "relation" )
          && ( selected_uml_object.inner_lines[0].relation || selected_uml_object.inner_lines[ selected_uml_object.inner_lines.length - 1 ].relation )
          ) {

            // 線を分割するための位置を探す
            for ( var i=0; i<selected_uml_object.inner_lines.length-1; i++ ) {
              var is_horizontal = ( ! selected_uml_object.inner_lines[0].relation || isIncludeArray( [ "left", "right" ], selected_uml_object.inner_lines[0].relation.base_type ) );
              if ( 3 <= selected_uml_object.inner_lines.length ) {
                if ( is_horizontal ) {
                  if ( selected_uml_object.inner_lines[0].y <= selected_uml_object.inner_lines[2].y && ( selected_uml_object.inner_lines[1].y < selected_uml_object.inner_lines[0].y || selected_uml_object.inner_lines[2].y < selected_uml_object.inner_lines[1].y  ) ) is_horizontal = false;
                  if ( selected_uml_object.inner_lines[0].y >  selected_uml_object.inner_lines[2].y && ( selected_uml_object.inner_lines[1].y < selected_uml_object.inner_lines[2].y || selected_uml_object.inner_lines[0].y < selected_uml_object.inner_lines[1].y  ) ) is_horizontal = false;
                }
                else {
                  if ( selected_uml_object.inner_lines[0].x <= selected_uml_object.inner_lines[2].x && ( selected_uml_object.inner_lines[1].x < selected_uml_object.inner_lines[0].x || selected_uml_object.inner_lines[2].x < selected_uml_object.inner_lines[1].x ) ) is_horizontal = true;
                  if ( selected_uml_object.inner_lines[0].x >  selected_uml_object.inner_lines[2].x && ( selected_uml_object.inner_lines[1].x < selected_uml_object.inner_lines[2].x || selected_uml_object.inner_lines[0].x < selected_uml_object.inner_lines[1].x ) ) is_horizontal = true;
                }
              }
              var bezire_points = getBezierPointsByPoints( selected_uml_object.inner_lines, is_horizontal )
              if (
                 ( selected_uml_object.params["pathStyle"] == "curve" && isCollisionPointAndBezier( cursor_position.x, cursor_position.y, bezire_points.slice( i*2, i*2+3 ) ) )
              || ( selected_uml_object.params["pathStyle"] == "line"  && isCollisionPointAndLine( cursor_position.x, cursor_position.y, selected_uml_object.inner_lines[i].x, selected_uml_object.inner_lines[i].y, selected_uml_object.inner_lines[i+1].x, selected_uml_object.inner_lines[i+1].y ) )
              ) {
 
                // 分割
                selected_uml_object.inner_lines.splice( i+1, 0, { index: i+1, type: "inner-line-relay", x:cursor_position.x, y:cursor_position.y, relation:null } )

                // ドラッグ用のトグル情報を生成する
                var toggle = { x:cursor_position.x, y:cursor_position.y, type:"inner-line-relay", owner:selected_uml_object, inner_shape: selected_uml_object.inner_lines[i+1] };
                // ドラッグ情報を生成
                statuses.storeDraggingTemporaryData( KEYCODE_CURSOR, { type:"toggle", toggle: toggle, start_cursor_position: cursor_position } );

                // インデックス番号を振り直す
                for ( var j=i+2; j<selected_uml_object.inner_lines.length; j++ ) {
                  selected_uml_object.inner_lines[j].index = j;
                }
                break;
              }
            }
          }
          // それ以外のオブジェクトの時
          else {
            // 選択中オブジェクト（実体）の現在の座標を記録する。
            // グループ全体を選択している場合はグループを、グループ内の特定オブジェクトを選択（ドリルイン）
            // している場合は当該オブジェクトだけを移動対象とする。
            var drag_start_position_map = {};
            var selected_uml_objects = this._selectedUmlObjects();
            for ( var i=0; i<selected_uml_objects.length; i++ ) {
              drag_start_position_map[ selected_uml_objects[i].id ] = {
                x: selected_uml_objects[i].x,
                y: selected_uml_objects[i].y
              };

              // グループを移動する場合には一時的に包含する矩形を消す
              if ( selected_uml_objects[i].type == "group" ){
                selected_uml_objects[i].width = 0;
                selected_uml_objects[i].height = 0;
              }
              if ( selected_uml_objects[i].type == "relation" ) {
                drag_start_position_map[ selected_uml_objects[i].id ] = {
                  x: 0,
                  y: 0
                };
              }
            }

            // ドラッグ情報として開始座標（紙上のオフセット座標）を記録
            statuses.storeDraggingTemporaryData( KEYCODE_CURSOR, {
              type: "move",
              drag_start_cursor_position: cursor_position,
              drag_start_position_map: drag_start_position_map
            } );
          }

          // 入力状態の完了
          this._blurInputting();

          return true; // ドラッグ処理ならば必ずtrueを返さないと、画面スクロールが発生してしまう
        }
      }
    }
    // ドラッグ中
    else if ( statuses.isDragging( KEYCODE_CURSOR ) ) {
      // ドラッグ開始位置を紙の左上からの相対位置に変換
      var cursor_position = this._getPaperOffsetPosition( statuses.getCursorPosition() );
      // ドラッグ開始時点での情報を取得
      var drag_starting_data = statuses.loadDraggingTemporaryData( KEYCODE_CURSOR );
      if ( ! drag_starting_data || "move" != drag_starting_data.type ) return false;

      // 移動量を計算
      var move_amount_x = cursor_position.x - drag_starting_data.drag_start_cursor_position.x;
      var move_amount_y = cursor_position.y - drag_starting_data.drag_start_cursor_position.y;

      // コントロールキー（またはコマンドキー）押下してなければ、10ピクセル単位での移動にする
      if ( ! statuses.isPressKey( KEYCODE_CTRL ) && ! statuses.isPressKey( KEYCODE_COMMAND ) ) {
        move_amount_x = Math.floor( ( move_amount_x / this.grid_size ) ) * this.grid_size;
        move_amount_y = Math.floor( ( move_amount_y / this.grid_size ) ) * this.grid_size;
      }

      // 選択中のオブジェクト（実体）を移動する
      var selected_uml_objects = this._selectedUmlObjects();
      for ( var i=0; i<selected_uml_objects.length; i++ ) {
        var root_uml_object = selected_uml_objects[i];
        var frag_start_pos = drag_starting_data.drag_start_position_map[ root_uml_object.id ];
        if ( ! frag_start_pos ) continue;

        if ( "relation" != root_uml_object.type ) {
          this._moveUmlObject(
            root_uml_object,
            frag_start_pos.x + move_amount_x,
            frag_start_pos.y + move_amount_y
          );
        }
        else {
          // 関係線がが他オブジェクトとリレーションしている場合に、オブジェクトの基点座標は関係先の移動に伴って自動補正されてしまい、
          // ドラッグ開始時点の関係線の基点とは関係の無い座標に動的に変化してしまう関係で、関係線の移動に不具合が生じてしまう。
          // そこで、関係線に限っては前回ドラッグ時からの移動差分だけ関係性の座標移動させる
          this._translateUmlObject(
            root_uml_object,
            move_amount_x - frag_start_pos.x,
            move_amount_y - frag_start_pos.y
          );
          frag_start_pos.x = move_amount_x;
          frag_start_pos.y = move_amount_y;

          // 内部線からUMLオブジェクト矩形を正規化する
          this._normalizationUmlObjectSizeByInnerLine( root_uml_object );
        }
      }
      // 移動処理が完了してからリレーション先のオブジェクトの更新をする
      for ( var i=0; i<selected_uml_objects.length; i++ ) {
        // 移動に伴って、リレーション先に影響がある時の座標更新
        this._updateRelationUmlObject( selected_uml_objects[i] );
        // グループ内メンバーを移動した場合は、親グループの包含矩形を追従させる
        this._updateParentGroupRect( selected_uml_objects[i] );
      }

      // 画面端ならここでスクロールもさせる
      this._scrollPaperForDragging( statuses );

      // 再描画
      this.screen_manager.requestDraw( this );
      return true; // ドラッグ処理ならば必ずtrueを返さないと、画面スクロールが発生してしまう
    }
    // ドロップ
    else if ( statuses.isDrop( KEYCODE_CURSOR ) ) {
      // 選択中のオブジェクト（実体）の移動を確定する
      var selected_uml_objects = this._selectedUmlObjects();
      for ( var i=0; i<selected_uml_objects.length; i++ ) {
        var root_uml_object = selected_uml_objects[i];
        // 内部矩形の再生成
        root_uml_object.inner_shapes = this._refreshInnerShape( root_uml_object, root_uml_object.type );

        // 再起的に関係先の内部矩形を更新する
        this._refreshInnerShapeRecursion( root_uml_object );

        // グループを移動時はグループの矩形を更新する。
        // グループ内メンバーを移動した場合は、親グループの包含矩形を更新する。
        if ( root_uml_object.type == "group" ) this._updateGroupedUmlObjectRect( root_uml_object );
        else this._updateParentGroupRect( root_uml_object );
      }

      // ドラッグ開始時点での情報を取得
      var drag_starting_data = statuses.loadDraggingTemporaryData( KEYCODE_CURSOR );
      if ( ! drag_starting_data || "move" != drag_starting_data.type ) return false;

      // ドラッグ情報を消去する
      statuses.storeDraggingTemporaryData( KEYCODE_CURSOR, null );

      // 選択中オブジェクトの編集用トグルを再表示
      this._generateDraggableToggles();

      // データの記録
      this.data_manager.setData( this.save_data );

      // 再描画
      this.screen_manager.requestDraw( this );
      return true; // ドラッグ処理ならば必ずtrueを返さないと、画面スクロールが発生してしまう
    }

    return false;
  };

  /*------------------------------------------------------------------------------
    クリップボード制御
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // 選択中のオブジェクトをクリップボードに記録
  //--------------------------------------
  EditorScreen.prototype._sendSelectedUmlObjectToClipboard = function(){
    // 選択中のデータのUMLオブジェクトのコピーを取る
    var copy_targets = [];
    var selected_uml_objects = this._selectedRootUmlObjects();
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      var root_uml_object = selected_uml_objects[i];
      copy_targets.push( {
        key:        this.select_uml_object_ids[i],
        id:         root_uml_object.id,
        uml_object: JSON.stringify( root_uml_object ),
        priority:   this.save_data.priorities.indexOf( root_uml_object.id ),
      } );
    }
    // 描画優先順位順に並べ替える
    copy_targets = copy_targets.sort( function( a, b ){ return a.priority - b.priority } );

    // 仮装クリップボードに記録する
    this.clipboard = {
      application: this.application_name,
      version: this.current_version,
      data: copy_targets,
      time: ( new Date() ).getTime(),
      paste_count: 0,
    };

    // 仮想クリップボード（localStorage）に記録する
    localStorage.setItem( this.application_name + "_clipboard", JSON.stringify( this.clipboard ) );

    // 新規にコピーしたので、ペースト基準位置をリセットする（次のクリックまでは従来のコピー元基準でカスケード）
    this.paste_base_position = null;

    // クリップボードに転送する
    //navigator.clipboard.writeText( JSON.stringify( this.clipboard ) ).then();
  };

  //--------------------------------------
  // ショートカットキーからカット
  //--------------------------------------
  EditorScreen.prototype._cutByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_CUT ) ) {
      this._sendSelectedUmlObjectToClipboard();
      this._removeSelectedUmlObject();
      return true;
    }
    return false;
  };

  //--------------------------------------
  // ショートカットキーからコピー
  //--------------------------------------
  EditorScreen.prototype._copyByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_COPY ) ) {
      this._sendSelectedUmlObjectToClipboard();
      return true;
    }
    return false;
  };

  //--------------------------------------
  // 指定UMLオブジェクトのID、関連するIDを新しく再設定する
  //--------------------------------------
  EditorScreen.prototype._reGenerateUmlObjectId = function( old_id, known_ids ){
    if ( ! known_ids[ old_id ] ) {
      known_ids[ old_id ] = this._generateUmlObjectId();
    }
    return known_ids[ old_id ];
  };

  //--------------------------------------
  // 指定UMLオブジェクトのID、関連するIDを新しく再設定する
  //--------------------------------------
  EditorScreen.prototype._resetUmlbjectId = function( uml_object, known_ids, new_uml_object_ids ){
    // UMLオブジェクトIDを新規生成する
    uml_object.id = this._reGenerateUmlObjectId( uml_object.id, known_ids );
    new_uml_object_ids[ uml_object.id ] = true;

    // 内部線の関係作のIDを新規生成する
    for ( var i=0; i<uml_object.inner_lines.length; i++ ) {
      if ( uml_object.inner_lines[i].relation ) {
        uml_object.inner_lines[i].relation.id = this._reGenerateUmlObjectId( uml_object.inner_lines[i].relation.id, known_ids );
      }
    }

    // UMLオブジェクトとの関係先のIDを新規生成する
    for ( var i=0; i<uml_object.relation_ids.length; i++ ) {
      uml_object.relation_ids[i] = this._reGenerateUmlObjectId( uml_object.relation_ids[i], known_ids );
    }

    // 親IDを新規生成する
    if ( uml_object.parent_id ) uml_object.parent_id = this._reGenerateUmlObjectId( uml_object.parent_id, known_ids );
    
    // 子オブジェクトが存在する時は再帰的に処理する
    var new_children = {};
    for ( var key in uml_object.children ) {
      var child = uml_object.children[ key ];
      delete uml_object.children[ key ];
      
      this._resetUmlbjectId( child, known_ids, new_uml_object_ids );
      new_children[ child.id ] = child;
    }
    uml_object.children = new_children;

    for ( var i=0; i<uml_object.priorities.length; i++ ) {
      uml_object.priorities[i] = this._reGenerateUmlObjectId( uml_object.priorities[i], known_ids );
    }

    return {
      known_ids: known_ids,
      new_uml_object_ids: new_uml_object_ids
    };
  };
  
  //--------------------------------------
  // 指定オブジェクトの関係先が知らないオブジェクトなら削除する
  //--------------------------------------
  EditorScreen.prototype._resetUnknownUmlObjectRelationId = function( uml_object, known_uml_object_ids ){
    // 内部線の関係先のIDを確認する
    for ( var i=0; i<uml_object.inner_lines.length; i++ ) {
      if ( uml_object.inner_lines[i].relation ) {
        if ( ! known_uml_object_ids[ uml_object.inner_lines[i].relation.id ] ) uml_object.inner_lines[i].relation = null;
      }
    }

    // UMLオブジェクトとの関係先のIDを確認する
    for ( var i=0; i<uml_object.relation_ids.length; i++ ) {
      if ( ! known_uml_object_ids[ uml_object.relation_ids[i] ] ) uml_object.relation_ids.splice( i--, 1 );
    }

    // 親IDを確認す
    if ( uml_object.parent_id && ! known_uml_object_ids[ uml_object.parent_id ] ) uml_object.parent_id = null;
    
    // 子オブジェクトが存在する時は再帰的に処理する
    for ( var key in uml_object.children ) {
      this._resetUnknownUmlObjectRelationId( uml_object.children[key], known_uml_object_ids );
    }
  };

  //--------------------------------------
  // クリップボードデータをメモリに読み込み
  //--------------------------------------
  EditorScreen.prototype._loadClipboard = function(){
    // 仮想クリップボード（localStorage）からデータを再現する
    var local_storage_clipboard_string = localStorage.getItem( this.application_name + "_clipboard" );
    if ( local_storage_clipboard_string ) {
      var local_storage_clipboard = JSON.parse( local_storage_clipboard_string );
      if ( this.application_name == local_storage_clipboard.application ) {
        if ( 
           ( this.clipboard && this.clipboard.data && this.clipboard.time < local_storage_clipboard.time )
        || ( ! this.clipboard || ! this.clipboard.data )
        ) {
          this.clipboard = local_storage_clipboard;
        }
      }
    }
  }

  //--------------------------------------
  // クリップボードデータからUMLオブジェクトを生成
  //--------------------------------------
  EditorScreen.prototype._createUmlObjectsByClipboard = function( trans_x, trans_y ){
    // 呼び出し側から平行移動量が明示指定されているか（関連ペーストなどはこちら。ペースト基準位置は使わない）
    var is_explicit_trans = ( "number" == typeof trans_x && "number" == typeof trans_y );

    // クリップボードからオブジェクトを生成
    var known_ids = {};
    var new_uml_object_ids = {};
    var created_uml_objects = [];
    for ( var i=0; i<this.clipboard.data.length; i++ ) {
      // 生成
      var uml_object = JSON.parse( this.clipboard.data[i].uml_object );
      // IDの再生成
      this._resetUmlbjectId( uml_object, known_ids, new_uml_object_ids );
      // 後で一括処理するために配列に退避
      created_uml_objects.push( uml_object );
    }
    // 一旦全て作成が終わってから、UMLオブジェクトの再登録などをまとめて行う（コピー元以外のオブジェクトとのリレーションを後で消すため）
    for ( var i=0; i<created_uml_objects.length; i++ ) {
      // 知らないIDを削除する
      this._resetUnknownUmlObjectRelationId( created_uml_objects[i], new_uml_object_ids );

      // オブジェクトを登録する
      this.save_data.objects[ created_uml_objects[i].id ] = created_uml_objects[i];
      this.save_data.priorities.push( created_uml_objects[i].id );
    }

    // 平行移動量の決定（明示指定が無い場合）
    if ( ! is_explicit_trans ) {
      if ( this.paste_base_position ) {
        // クリップボード内容の左上を、ペースト基準位置に合わせる
        var content_rect = this._getRectByUmlObjects( created_uml_objects );
        trans_x = this.paste_base_position.x - content_rect.x;
        trans_y = this.paste_base_position.y - content_rect.y;
        // 連続ペースト用に基準位置を少しずらす（カスケード）
        this.paste_base_position = {
          x: this.paste_base_position.x + ( this.grid_size * 2 ),
          y: this.paste_base_position.y + ( this.grid_size * 2 )
        };
      }
      else {
        // 基準位置が未設定の間は、従来通りコピー元の位置を基準にカスケードする
        trans_x = 60 * this.clipboard.paste_count;
        trans_y = 60 * this.clipboard.paste_count;
      }
    }

    // オブジェクトの登録が完了してから移動処理を行う（オブジェクトが全て登録されてから実施しないと、リレーションに矛盾が発生する）
    for ( var i=0; i<created_uml_objects.length; i++ ) {
      // 配置位置をコピー元からずらす
      this._translateUmlObject( created_uml_objects[i], trans_x, trans_y );
      // 移動に伴って、リレーション先に影響がある時の座標更新
      this._updateRelationUmlObject( created_uml_objects[i] );
      // 内部線からUMLオブジェクト矩形を正規化する
      if ( "relation" == created_uml_objects[i].type ) {
        this._normalizationUmlObjectSizeByInnerLine( created_uml_objects[i] );
      }
    }

    return created_uml_objects;
  };

  //--------------------------------------
  // クリップボードデータからメモリに読み込み、UMLオブジェクトを生成
  //--------------------------------------
  EditorScreen.prototype._loadAndCreateUmlObjectsByClipboard = function( trans_x, trans_y ){
    // 仮想クリップボード（localStorage）からデータを再現する
    this._loadClipboard();
    if ( ! this.clipboard || ! this.clipboard.data || 0 == this.clipboard.data.length ) return null;

    // 選択中のUMLオブジェクトを解除
    this._clearSelectedAllUmlObject();

    // ペースト回数の記録
    this.clipboard.paste_count++;

    // クリップボードからオブジェクトを生成
    return this._createUmlObjectsByClipboard( trans_x, trans_y );
  };

  //--------------------------------------
  // クリップボードからUMLオブジェクトを生成
  //--------------------------------------
  EditorScreen.prototype._pasteUmlObjectsByClipBoard = function(){
    // クリップボードからオブジェクトを生成
    var created_uml_objects = this._loadAndCreateUmlObjectsByClipboard();
    if ( ! created_uml_objects ) return null;

    // オブジェクトを選択状態にする（選択処理に付随して編集履歴が保存されてしまうため全ての処理が終わってから実施）
    for ( var i=0; i<created_uml_objects.length; i++ ) {
      // 選択中にする
      this._appendSelectUmlObjectByKey( created_uml_objects[i].id );
    }

    // 紙サイズの修正
    this._refreshPaperSize();
    // データの記録
    this.data_manager.setData( this.save_data );
    // 再描画
    this.screen_manager.requestDraw( this );

    return created_uml_objects;
  };

  //--------------------------------------
  // ショートカットキーからペースト
  //--------------------------------------
  EditorScreen.prototype._pasteByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_PASTE ) ) {
      this._pasteUmlObjectsByClipBoard();
      return true;
    }
    return false;
  };

  //--------------------------------------
  // ショートカットキーから関連しながらペースト
  //--------------------------------------
  EditorScreen.prototype._relatedPasteAsType = function( direction, relation_type ){
    if ( "string" != typeof relation_type ) relation_type = "none";
    var counter_direction = ( direction + 2 ) % 4;

    // 関連元となる選択済みのオブジェクトが無ければ何もしない
    if ( ! this.select_uml_object_ids || 0 == this.select_uml_object_ids.length ) return true;

    // 選択中のオブジェクトがグループの場合はこの機能を動作させない
    // （グループ内の特定オブジェクトを選択＝ドリルインしている場合は当該オブジェクトが対象となり動作する）
    var selected_entities = this._selectedUmlObjects();
    for ( var i=0; i<selected_entities.length; i++ ) {
      if ( ! selected_entities[i] || "group" == selected_entities[i].type ) return true;
    }

    // 選択中のオブジェクトから、最も指定方位に近いオブジェクトを取得
    var selected_uml_objects = this._selectedDescendantUmlObjects();
    var selected_uml_object = this._findUmlObjectByDirection( selected_uml_objects, direction );
    if ( ! selected_uml_object ) return true;

    // 選択中のオブジェクト全体の矩形を取得
    var selected_rect = this._getRectByUmlObjects( selected_uml_objects );

    var trans_x = 60 * this.clipboard.paste_count;
    var trans_y = 60 * this.clipboard.paste_count;
    switch ( direction ) {
    case 0:
      trans_y = -( selected_rect.height + 60 );
      break;
    case 1:
      trans_x = ( selected_rect.width + 60 );
      break;
    case 2:
      trans_y = ( selected_rect.height + 60 );
      break;
    case 3:
      trans_x = -( selected_rect.width + 60 );
      break;      
    }

    // クリップボードからオブジェクトを生成するが、クリップボードに登録が無ければ選択中のオブジェクトを利用する
    var pasted_uml_objects = this._loadAndCreateUmlObjectsByClipboard( trans_x, trans_y );
    if ( ! pasted_uml_objects || 0 == pasted_uml_objects.length ) {
      this._sendSelectedUmlObjectToClipboard();
      pasted_uml_objects = this._loadAndCreateUmlObjectsByClipboard( trans_x, trans_y );
      if ( ! pasted_uml_objects || 0 == pasted_uml_objects.length ) return;
    }

    // ペーストしたオブジェクトから、最も指定方向の逆方向に近いオブジェクトを取得
    var pasted_uml_object = this._findUmlObjectByDirection( pasted_uml_objects, counter_direction );
    if ( ! pasted_uml_object ) return true;

    // 関係線を作成
    var relation_uml_object = this._createInitializedUmlObject( "relation" );
    relation_uml_object.params["lineEndStyle"] = relation_type;

    // オブジェクトを登録する
    this.save_data.objects[ relation_uml_object.id ] = relation_uml_object;
    this.save_data.priorities.push( relation_uml_object.id );

    // リレーションする
    this._linkRelation( relation_uml_object, relation_uml_object.inner_lines[0], this._getContactUmlObjectRectByDirection( selected_uml_object, direction ) );
    this._linkRelation( relation_uml_object, relation_uml_object.inner_lines[1], this._getContactUmlObjectRectByDirection( pasted_uml_object, counter_direction ) );

    // 内部線からUMLオブジェクト矩形を正規化する
    this._updateRelationInnerLineUmlObject( relation_uml_object, relation_uml_object.inner_lines[0], selected_uml_object );
    this._updateRelationInnerLineUmlObject( relation_uml_object, relation_uml_object.inner_lines[1], pasted_uml_object );

    // 関係線の終端矩形を更新
    relation_uml_object.inner_shapes = this._refreshInnerShape( relation_uml_object, relation_uml_object.type );

    // オブジェクトを選択状態にする（選択処理に付随して編集履歴が保存されてしまうため全ての処理が終わってから実施）
    // 選択中のUMLオブジェクトを解除
    this._clearSelectedAllUmlObject();
    for ( var i=0; i<selected_uml_objects.length; i++ ) {
      // 選択中にする
      this._appendSelectUmlObjectByKey( selected_uml_objects[i].id );
    }
    /* 以下はペースト後のオブジェクトを選択状態にしたい時にコメントを外す
    for ( var i=0; i<pasted_uml_objects.length; i++ ) {
      // 選択中にする
      this._appendSelectUmlObjectByKey( pasted_uml_objects[i].id );
    }
    this._appendSelectUmlObjectByKey( relation_uml_object.id );
    */

    // 紙サイズの修正
    this._refreshPaperSize();
    // データの記録
    this.data_manager.setData( this.save_data );
    // 再描画
    this.screen_manager.requestDraw( this );
  };

  //--------------------------------------
  // ショートカットキーから関連しながらペースト
  //--------------------------------------
  EditorScreen.prototype._relatedPasteShortCutKeyAsPlain = function( statuses ){
    if ( statuses.isPressKey( KEYCODE_ALT ) ) {
      // コピー方向を取得
      var direction = null;
      if ( statuses.isDownKey( KEYCODE_UP ) ) {
        direction = 0;
      }
      else if ( statuses.isDownKey( KEYCODE_DOWN ) ) {
        direction = 2;
      }
      else if ( statuses.isDownKey( KEYCODE_LEFT ) ) {
        direction = 3;
      }
      else if ( statuses.isDownKey( KEYCODE_RIGHT ) ) {
        direction = 1;
      }

      // コピー方向が指定されている時だけ処理
      if ( null != direction && 0 <= direction ) {
        this._relatedPasteAsType( direction );
        return true;
      }
    }
    return false;
  };

  //--------------------------------------
  // ショートカットキーから矢印の関連をしながらペースト
  //--------------------------------------
  EditorScreen.prototype._relatedPasteShortCutKeyAsArrow = function( statuses ){
    if ( statuses.isPressKey( KEYCODE_COMMAND ) || statuses.isPressKey( KEYCODE_CTRL ) ) {
      var direction = null;
      if ( statuses.isDownKey( KEYCODE_UP ) ) {
        direction = 0;
      }
      else if ( statuses.isDownKey( KEYCODE_DOWN ) ) {
        direction = 2;
      }
      else if ( statuses.isDownKey( KEYCODE_LEFT ) ) {
        direction = 3;
      }
      else if ( statuses.isDownKey( KEYCODE_RIGHT ) ) {
        direction = 1;
      }

      // コピー方向が指定されている時だけ処理
      if ( null != direction && 0 <= direction ) {
        this._relatedPasteAsType( direction, "arrow" );
        return true;
      }
    }
    return false;
  };

  /*------------------------------------------------------------------------------
    PDF
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // 線のスタイルを適用してPDFに描画するラッパー
  //--------------------------------------
  EditorScreen.prototype._drawPdfLineWrapper = function( context, line_style, draw_function ){

    if ( line_style ) {
      switch( line_style ){
      case "solid":
        setPdfLineDash( context, [] );
        break;

      case "dashed":
        setPdfLineDash( context, [ 5, 8 ] );
        break;

      case "dotted":
        setPdfLineDash( context, [ 1, 5 ] );
        break;
      }
    }
    draw_function();
    setPdfLineDash( context, [] );
  }

  //--------------------------------------
  // UMLオブジェクトのPDFへの描画
  //--------------------------------------
  EditorScreen.prototype._drawPdfUmlObjectAt = function( context, base_x, base_y, uml_object, base_color, base_bg_color ){

    // 子がいるなら先に描画する
    for ( var key in uml_object.children ) {
      this._drawPdfUmlObjectAt( context, base_x, base_y, uml_object.children[key], base_color, base_bg_color );
    }

    // 描画色の解決（オブジェクトのパラメータの色名を使い、無ければ引数の色にフォールバック）
    var line_color = this._colorNameToPdfColor( context, uml_object.params["lineColor"] ) || base_color;
    var text_color = this._colorNameToPdfColor( context, uml_object.params["textColor"] ) || base_color;
    var is_transparent_bg = ( "transparent" == uml_object.params["backgroundColor"] );
    var fill_color = this._backgroundColorNameToPdfColor( context, uml_object.params["backgroundColor"] ) || base_bg_color;

    // 線幅の設定
    setPdfLineWidth( context, uml_object.params["lineWidth"] || 1 );

    // 描画順序について
    // 線、図形、矩形の順で描画
    //   矩形はテキスト表示領域となるので、最後に描画
    //   線の上に関係線の図形を上書きするので、線を最初に描画

    // 線の描画
    this._drawPdfLineWrapper( context, uml_object.params["lineStyle"], function(){
      for ( var i=0; i<uml_object.inner_lines.length - 1; i++ ) {
        var points = [];
        for ( var i=0; i<uml_object.inner_lines.length; i++ ) {
          points[i] = {
            x: base_x + uml_object.inner_lines[i].x,
            y: base_y + uml_object.inner_lines[i].y
          };
        }
        if ( uml_object.params["pathStyle"] == "curve" ) {
          var is_horizontal = ( ! uml_object.inner_lines[0].relation || isIncludeArray( [ "left", "right" ], uml_object.inner_lines[0].relation.base_type ) );
          if ( 3 <= points.length ) {
            if ( is_horizontal ) {
              if ( points[0].y <= points[2].y && ( points[1].y < points[0].y || points[2].y < points[1].y  ) ) is_horizontal = false;
              if ( points[0].y >  points[2].y && ( points[1].y < points[2].y || points[0].y < points[1].y  ) ) is_horizontal = false;
            }
            else {
              if ( points[0].x <= points[2].x && ( points[1].x < points[0].x || points[2].x < points[1].x ) ) is_horizontal = true;
              if ( points[0].x >  points[2].x && ( points[1].x < points[2].x || points[0].x < points[1].x ) ) is_horizontal = true;
            }
          }
          drawPdfBezier( context, points, line_color, is_horizontal );
        }
        else {
          drawPdfLines( context, points, line_color );
        }
      }
    } );

    // 各形状の描画
    for ( var key in uml_object.inner_shapes ) {
      switch( uml_object.inner_shapes[key].type ) {
      case "line":
        this._drawPdfLineWrapper( context, ( uml_object.inner_shapes[key].line_style || uml_object.params["lineStyle"] ), function(){
          drawPdfLine( context, base_x + uml_object.inner_shapes[key].start.x, base_y + uml_object.inner_shapes[key].start.y, base_x + uml_object.inner_shapes[key].end.x, base_y + uml_object.inner_shapes[key].end.y, line_color, false );
        });
        break;

      case "rect":
        if ( uml_object.inner_shapes[key].fill && ! is_transparent_bg ) drawPdfRect( context, base_x + uml_object.inner_shapes[key].x, base_y + uml_object.inner_shapes[key].y, uml_object.inner_shapes[key].width, uml_object.inner_shapes[key].height, fill_color, true );
        drawPdfRect( context, base_x + uml_object.inner_shapes[key].x, base_y + uml_object.inner_shapes[key].y, uml_object.inner_shapes[key].width, uml_object.inner_shapes[key].height, line_color, false );
        break;

      case "circle":
        if ( uml_object.inner_shapes[key].fill ) {
          if ( uml_object.inner_shapes[key].fill_border_color ) drawPdfCircle( context, base_x + uml_object.inner_shapes[key].x, base_y + uml_object.inner_shapes[key].y, uml_object.inner_shapes[key].radius, line_color, true );
          else if ( ! is_transparent_bg )                       drawPdfCircle( context, base_x + uml_object.inner_shapes[key].x, base_y + uml_object.inner_shapes[key].y, uml_object.inner_shapes[key].radius, fill_color, true );
        }
        drawPdfCircle( context, base_x + uml_object.inner_shapes[key].x, base_y + uml_object.inner_shapes[key].y, uml_object.inner_shapes[key].radius, line_color, false );
        break;

      case "polygon":
        var polygon = [];
        for ( var i=0; i<uml_object.inner_shapes[key].polygon.length; i++ ) polygon.push( { x: base_x + uml_object.inner_shapes[key].polygon[i].x, y: base_y + uml_object.inner_shapes[key].polygon[i].y } );
        if ( uml_object.inner_shapes[key].fill ) {
          if ( uml_object.inner_shapes[key].fill_border_color ) drawPdfPolygon( context, polygon, line_color, true );
          else if ( ! is_transparent_bg )                       drawPdfPolygon( context, polygon, fill_color, true );
        }
        drawPdfPolygon( context, polygon, line_color, false );
        break;
      }
    }

    // 矩形描画
    var font_size = uml_object.params["fontSize"] || 12;
    for ( var key in uml_object.inner_rects ) {
      if ( uml_object.inner_rects[ key ].fill && ! is_transparent_bg ) drawPdfRect( context, base_x + uml_object.inner_rects[key].x, base_y + uml_object.inner_rects[key].y, uml_object.inner_rects[key].width, uml_object.inner_rects[key].height, fill_color, true );
      if ( uml_object.inner_rects[ key ].is_border_visible ) drawPdfRect( context, base_x + uml_object.inner_rects[key].x, base_y + uml_object.inner_rects[key].y, uml_object.inner_rects[key].width, uml_object.inner_rects[key].height, line_color, false );
      // テキストがある時は描画
      if ( uml_object.inner_rects[key].has_text ) {

        clipPdfRect( context, base_x + uml_object.inner_rects[key].x + 1, base_y + uml_object.inner_rects[key].y + 1, uml_object.inner_rects[key].width - 2, uml_object.inner_rects[key].height - 2, function( clip_context ){
          var x = base_x + uml_object.inner_rects[key].x + 3;
          var y = base_y + uml_object.inner_rects[key].y + 3;
          var width  = uml_object.inner_rects[key].width;
          var height = uml_object.inner_rects[key].height;
          var text_area_size = ( uml_object.inner_rects[ key ].vertical_text ? height : width );
          var text_rows = this._getLayouteText( uml_object.inner_rects[key].text, font_size, text_area_size, ( "break" == uml_object.params["wordBreak"] ? true : false ) );

          // clipしたのに何も描画が無いとpdf-libでエラーが発生するので空白文字を描画させる
          if ( 0 == text_rows.length ) text_rows = [ " " ];

          var align = "left";
          if ( uml_object.params["textAlign"]                   ) align = uml_object.params["textAlign"];
          if ( uml_object.params["nameAlign"] && key == "name" ) align = uml_object.params["nameAlign"];

          for ( var i=0; i<text_rows.length; i++ ) {
            var text_width = getTextWidth( text_rows[i], font_size );
            var align_offset = 0;
            switch( align ) {
            case "left":
              align_offset = 0;
              break;

            case "center":
              align_offset = Math.round( ( text_area_size - text_width ) / 2 );
              break;

            case "right":
              align_offset = text_area_size - text_width;
              break;
            }

            // 縦書き
            if ( uml_object.inner_rects[ key ].vertical_text ) {
              var offset_y = ( uml_object.inner_rects[ key ].height - 6 ) - text_width;
              drawPdfVerticalText( clip_context, text_rows[i], x, y + offset_y - align_offset, text_color, font_size );
              x += font_size + 2;
            }
            // 横書き
            else {
              drawPdfText( clip_context, text_rows[i], x + align_offset, y, text_color, font_size );
              y += font_size + 2;
            }
          }

        }.bind(this) );
      }
    }
  };


  //--------------------------------------
  // PDF出力
  //--------------------------------------
  EditorScreen.prototype._exportPdfBlob = function( callback ){
    // PDFコンテキストの初期化
    initializePdfContext( function( pdf_context ){
      // ページ追加
      addPdfPage( pdf_context, this.save_data.paper.width, this.save_data.paper.height );
      // 色の取得
      var black_color = getPdfColor( pdf_context, 0, 0, 0 );
      var white_color = getPdfColor( pdf_context, 1, 1, 1 );

      // UMLオブジェクトの描画
      for ( var i=0; i<this.save_data.priorities.length; i++ ) {
        var uml_object = this.save_data.objects[ this.save_data.priorities[i] ];
        this._drawPdfUmlObjectAt( pdf_context, 0, 0, uml_object, black_color, white_color );
      }

      // PDF生成
      savePdfAsBlob( pdf_context, function( blob ){
        callback( blob );
      } );
    }.bind(this), './fonts/ipag.ttf' );
  };

  /*------------------------------------------------------------------------------
    その他
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // 文字列のパディング
  //--------------------------------------
  EditorScreen.prototype._findLikelyFileTitle = function(){
    var top_left_name = null;
    var top_left_distance = null;
    this._eachUmlObjects( function( uml_object ){
      if ( isIncludeArray( [ "comment", "text_box", "text" ], uml_object.type ) ) {
        var distance = Math.sqrt( uml_object.x*uml_object.x + uml_object.y*uml_object.y );
        if ( 300 > distance && ( ! top_left_distance || top_left_distance > distance ) ) {
          top_left_distance = distance;
          top_left_name = uml_object.inner_rects["name"].text;
        }
      }
    } );

    if ( top_left_name && 0 < top_left_name.length ) {
      var title_name = top_left_name.split("\n")[0].replace( /[\\\/:\*\?"<>|¥]+/g, "" );
      return 0 < title_name.length ? title_name : null;
    }
    else {
      return null;
    }
  };

  //--------------------------------------
  // 文字列のパディング
  //--------------------------------------
  EditorScreen.prototype._pad = function( str, padding_size, padding_str ){
    padding_str = padding_str || " ";
    var tmp = "";
    for ( var i=0; i<padding_size; i++ ) tmp += padding_str;
    tmp += str;
    return tmp.slice( -padding_size );
  };

  //--------------------------------------
  // 指定日時から日時文字列を生成する yyyy.MM.dd.hh.mm 形式
  //--------------------------------------
  EditorScreen.prototype._getDateTimeString = function( date ){
    return `${ this._pad( date.getFullYear(), 4, "0" ) }.${ this._pad( date.getMonth()+1, 2, "0" ) }.${ this._pad( date.getDate(), 2, "0" ) }.${ this._pad( date.getHours(), 2, "0" ) }.${ this._pad( date.getMinutes(), 2, "0" ) }`;
  };

  //--------------------------------------
  // 保存データの全データを走査する
  //--------------------------------------
  EditorScreen.prototype._seekSaveData = function( data, iterator_function ){
    for ( var key in data ) {
      iterator_function( data[key] );
      if ( data[key].children ) this._seekSaveData( data[key].children, iterator_function );
    }
  };

  //--------------------------------------
  // 保存データを最新版にする
  //--------------------------------------
  EditorScreen.prototype._upgradeSaveData = function( data ){
    if ( ! data || ! data.version ) return data;
    data.version = parseFloat( data.version );
    if ( data.version >= this.current_version ) return data;

    if ( 1.04 > data.version ) {
      // wordBreak属性を追加する
      this._seekSaveData( data.objects, function( uml_object ){
        switch( uml_object.type ) {
        case "text_box":
        case "object":
        case "class":
        case "frame":
        case "horizontal_partition":
        case "vertical_partition":
          uml_object.params["fontSize"] = uml_object.params["fontSize"] || 12;
          uml_object.params["wordBreak"] = "normal";
          break;

        case "text":
        case "comment":
          uml_object.params["fontSize"] = uml_object.params["fontSize"] || 12;
          uml_object.params["wordBreak"] = "break";
          break;
        }
      } );
    }

    if ( 1.05 > data.version ) {
      // ignore_select属性を追加する
      this._seekSaveData( data.objects, function( uml_object ){
        for ( var key in uml_object.inner_rects ) {
          if ( "contents" == key ) {
            uml_object.inner_rects[key].ignore_select = true;
          }
          else {
            uml_object.inner_rects[key].ignore_select = false;
          }
        }
      } );
    }

    if ( 1.09 > data.version ) {
      // inner_shapeを作成し直し（関係線の終端図形の更新）
      this._seekSaveData( data.objects, function( uml_object ){
        uml_object.inner_shapes = this._refreshInnerShape( uml_object, uml_object.type );
      }.bind(this) );
    }

    if ( 1.10 > data.version ) {
      // inner_linesのindex番号の再設定
      this._seekSaveData( data.objects, function( uml_object ){
        uml_object.inner_lines
        for ( var i=0; i<uml_object.inner_lines.length; i++ ) {
          uml_object.inner_lines[i].index = i;
        }
      }.bind(this) );
    }

    if ( 1.4 > data.version ) {
      // 色・線幅の属性を追加する（既存オブジェクトにも編集可能な既定値を付与）
      // textColorは文字列を持つオブジェクト（fontSizeを持つもの）にのみ付与する
      this._seekSaveData( data.objects, function( uml_object ){
        uml_object.params = uml_object.params || {};
        if ( "undefined" == typeof uml_object.params["lineColor"]       ) uml_object.params["lineColor"]       = "black";
        if ( "undefined" == typeof uml_object.params["backgroundColor"] ) uml_object.params["backgroundColor"] = "white";
        if ( "undefined" == typeof uml_object.params["lineWidth"]       ) uml_object.params["lineWidth"]       = 1;
        if ( "undefined" != typeof uml_object.params["fontSize"] && "undefined" == typeof uml_object.params["textColor"] ) uml_object.params["textColor"] = "black";
      } );
    }

    if ( 1.5 > data.version ) {
      // 文字列を持たない（fontSizeを持たない）オブジェクトからtextColorを削除する
      this._seekSaveData( data.objects, function( uml_object ){
        if ( uml_object.params && "undefined" == typeof uml_object.params["fontSize"] ) {
          delete uml_object.params["textColor"];
        }
      } );
    }

    if ( 1.6 > data.version ) {
      // typeに応じて不要な色・線幅の属性を削除する
      //   text                                            : lineColor / lineWidth
      //   text / relation / vertical_line / horizontal_line / close : backgroundColor
      this._seekSaveData( data.objects, function( uml_object ){
        if ( ! uml_object.params ) return;
        if ( "text" == uml_object.type ) {
          delete uml_object.params["lineColor"];
          delete uml_object.params["lineWidth"];
        }
        if ( isIncludeArray( [ "text", "relation", "vertical_line", "horizontal_line", "close" ], uml_object.type ) ) {
          delete uml_object.params["backgroundColor"];
        }
      } );
    }

    data.version = this.current_version;
    return data;
  };

  //--------------------------------------
  // 新しいタブで同画面を開く
  //--------------------------------------
  EditorScreen.prototype._openUmlDrawToolInNewTab = function( json ){
    // localStrageに開きたいファイルを一時保存する
    localStorage.setItem( this.application_name + "_temporary", json );

    var current_url = location.href;
    window.open( current_url, ( new Date ).getTime() );
  };

  //--------------------------------------
  // 保存データを開く
  //--------------------------------------
  EditorScreen.prototype._openSaveData = function( json_or_data ){
    var data = null;
    if ( "string" == typeof json_or_data ) {
      data = JSON.parse( json_or_data );
    }
    else {
      data = json_or_data;
    }

    if ( data && data.application_name == this.application_name ) {
      this.save_data = this._upgradeSaveData( data );

      // データ管理を初期化
      this.data_manager.initialize( this.save_data );

      // UI表示用のテンポラリデータの初期化
      this._initializeUiTemporary();
      this.setFocusObject( this.findObjectByName("tool_button_cursor") );
      
      // 紙サイズの修正
      this._refreshPaperSize();

      // タイトルがあれば表示する
      var title_name = this._findLikelyFileTitle() || "UML DrawTool";
      $("title").text( title_name );
    }
  }

  //--------------------------------------
  // テンポラリデータを開く
  //--------------------------------------
  EditorScreen.prototype._loadTemporary = function(){
    // localStrageに一時保存されたデータがあれば開く
    var json = localStorage.getItem( this.application_name + "_temporary" );

    // 一時保存データで開く
    this._openSaveData( json );

    // 一時保存データを消去する
    localStorage.removeItem( this.application_name + "_temporary" );
  }

  //--------------------------------------
  // UI表示用のテンポラリデータの初期化
  //--------------------------------------
  EditorScreen.prototype._initializeUiTemporary = function(){
    // 描画ズーム率
    this.zoom_rate = 1.0;

    // 選択中のオブジェクト
    this.select_uml_object_ids = [];

    // 選択中のツール
    this.select_tool_name = "tool_button_cursor";

    // 範囲選択の描画用矩形
    this.dragging_rect = null;

    // 入力中のオブジェクト
    this.inputting_uml_object = null;
    this.inputting_uml_object_shape = null;

    // インスタントラベル入力中の位置（何も無い場所のダブルクリックで開始）
    this.inputting_instant_label = null;

    // オブジェクトサイズの変形トグル
    this.draggable_toggles = [ /*
      { x:0, y:0, type: "top-left", owner: uml_object, inner_shape: object },
    */ ];
    this.is_dragging_toggle = false;

    // クリップボード
    this.clipboard = {};

    // ペーストの基準位置（クリック操作で更新される。nullの間は従来のコピー元基準でカスケード）
    this.paste_base_position = null;

    // グリッドサイズ
    this.grid_size = 10;

    // ツールボタンの初期選択はカーソル
    var button_object = this.findObjectByName("tool_button_cursor");
    if ( button_object ) this.setFocusObject( button_object );
  }

  //--------------------------------------
  // JSONでファイル保存
  //--------------------------------------
  EditorScreen.prototype._saveAsJson = function(){
    var title_name = this._findLikelyFileTitle();
    this.file_manager.downloadJson( this.save_data, `${ title_name || "uml_diagram" }_${ this._getDateTimeString( new Date() ) }.json` );
    $("title").text( title_name || "UML DrawTool" );
  };

  //--------------------------------------
  // PDFでファイル保存
  //--------------------------------------
  EditorScreen.prototype._saveAsPdf = function(){
    this._exportPdfBlob( function( blob ){
      var title_name = this._findLikelyFileTitle();
      this.file_manager.downloadBlob( blob, `${ title_name || "uml_diagram" }_${ this._getDateTimeString( new Date() ) }.pdf` );
      $("title").text( title_name || "UML DrawTool" );
    }.bind(this) );
  };

  //--------------------------------------
  // ショートカットキーから保存
  //--------------------------------------
  EditorScreen.prototype._saveByShortCutKey = function( statuses ){
    if ( statuses.isShortCutDownKey( KEYCODE_SHORTCUT_SAVE ) ) {
      this._saveAsJson();
      return true;
    }
    return false;
  };

  /*------------------------------------------------------------------------------
    publicメソッド
  ------------------------------------------------------------------------------*/

  //--------------------------------------
  // 初期化
  //--------------------------------------
  EditorScreen.prototype.initialize = function( display_element, width, height, screen_manager ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.call( this, display_element, width, height, screen_manager );

    // アプリケーション名
    this.application_name = "uml_draw_tool";
    this.current_version = 1.6;

    // 画像管理を生成
    this.image_manager = ( new ImageManager() ).initialize(this);
    this.image_manager.loadDividedImages( "icon", "./images/icon.png", 10, 5, 64, 64 );

    // 保存データ
    this.save_data = {
      application_name: this.application_name,
      version: this.current_version,
      objects: {},
      priorities: [],
      paper: {
        width: 1200,
        height: 848
      }
    }

    // ファイル管理を生成
    this.file_manager = ( new FileManager() ).initialize(this);

    // データ管理クラスを生成
    this.data_manager = new DataManager();
    this.data_manager.initialize( this.save_data );

    // ストレージ管理クラスを生成
    /*
    this.storage_manager = new StorageManager();
    this.storage_manager.initialize();
    */

    // UI表示用のテンポラリデータの初期化
    this._initializeUiTemporary();

    // UMLオブジェクト生成カウンタ（ID生成用）
    this.generate_uml_object_count = 0;

    // スタイルシートの生成
    this.appendStyleSheet(
`
/* ヘッダ */
header
{ position:fixed;  font-size:14;  line_height:16;  width:100%;  height:24;  background_color:#D0D0D0;  padding:4 10; }

header div.left
{ display:inline;  width:70%; }
header div.right
{ display:inline;  width:30%;  text-align:right }

header button,
toggle_panel button
{ margin-right:20;  background_color:null;  color:black;  border:0 transparent;  padding:0;  focus_background_color:null;  focus_color:black; }

toggle_panel
{ font-size:14;  line-height:20;  border_width:2;  border_color:#E0E0E0 #E0E0E0 #A0A0A0 #A0A0A0;  background-color:#D0D0D0;  color:black;  padding:4; }

/* コンテンツ領域 */
#contents
{ margin-top:24;  font-size:14; }

/* サイドメニュー */
#left_menu
{ display:inline;  width:225;  height:100%;  padding:5;  background-color:#A0A0A0;  border-right:1 black; }

#tool_buttons
{ width:100%;  height:330;  border:1 black;  padding:0;  margin-bottom:10; }

.tool_button
{ width:53;  height:53;  margin-right:5;  margin-bottom:5; }

.tool_button img
{ width:40;  height:40; }

#object_params
{ width:100%;  height:remaining;  border:1 black;  padding:5; }

#object_params input,
#object_params list,
#object_params select
{ width:100%;  margin_bottom:5;  background_color:#C0C0C0;  border_color:#808080 #808080 #E0E0E0 #E0E0E0;  focus_background_color:#D0D0D0;  focus_border_color:#808080 #808080 #E0E0E0 #E0E0E0; }


/* メインコンンテンツ領域 */
#main_contents
{ display:inline;  width:remaining;  height:100%;  padding:500;  background-color:#505050; }

#paper
{ width:1200;   height:848;  background-color:white;  overflow:hidden; }
`
    );

    // HTMLからオブジェクト生成のテスト
    this.appendHtml(
`
<!-- ヘッダ -->
<header>
  <div class='left'>
    <button id='filemenu_file'>File</button>
    <button id='filemenu_edit'>Edit</button>
    <button id='filemenu_view'>View</button>
  </div>
  <div class='right'>Ver ${ this.current_version }</div>
</header>
<div id="contents">
  <!-- サイドメニュー -->
  <div id='left_menu'>
    <!-- ツールボタン -->
    <div id='tool_buttons'>
      <button id='tool_button_cursor'               class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_range'                class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_contain_range'        class='tool_button'><img class='tool_button_icon' /></button>
      <br/>
      <button id='tool_button_text_box'             class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_object'               class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_class'                class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_text'                 class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_relation'             class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_comment'              class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_frame'                class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_actor'                class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_horizontal_partition' class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_vertical_partition'   class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_start'                class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_end'                  class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_begin'                class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_terminate'            class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_branch'               class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_vertical_line'        class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_horizontal_line'      class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_box'                  class='tool_button'><img class='tool_button_icon' /></button>
      <button id='tool_button_close'                class='tool_button'><img class='tool_button_icon' /></button>
    </div>
    <!-- パラメータ入力欄 -->
    <div id='object_params'></div>
  </div>
  <!-- メインコンテンツ部 -->
  <div id='main_contents'>
    <div id='paper'></div>
  </div>
</div>
<!-- ファイルメニュー -->
<toggle_panel id='filemenu_file_panel'>
  <button id='filemenu_file_save_json'>save as JSON ( cmd + s )</button><br/>
  <button id='filemenu_file_save_pdf'>save as PDF</button><br/>
</toggle_panel>
<!-- 編集メニュー -->
<toggle_panel id='filemenu_edit_panel'>
  <button id='filemenu_edit_undo'>undo ( cmd + z )</button><br/>
  <button id='filemenu_edit_redo'>redo ( cmd + shift + z )</button><br/>
  <div style="width:280;  border_width_bottom:1;  border_color:#909090;  margin:8 0 12 0;"></div>
  <button id='filemenu_edit_cut'>cut ( cmd + x )</button><br/>
  <button id='filemenu_edit_copy'>copy ( cmd + c )</button><br/>
  <button id='filemenu_edit_paste'>paste ( cmd + v )</button><br/>
  <button id='filemenu_edit_plain_related_paste'>related paste ( alt + down key )</button><br/>
  <button id='filemenu_edit_arrow_related_paste'>arrow related paste ( cmd + down key )</button><br/>
  <div style="width:280;  border_width_bottom:1;  border_color:#909090;  margin:8 0 12 0;"></div>
  <button id='filemenu_edit_most_background'>show on most background ( cmd + [ )</button><br/>
  <button id='filemenu_edit_background'>show on background ( [ )</button><br/>
  <button id='filemenu_edit_foreground'>show on foreground ( ] )</button><br/>
  <button id='filemenu_edit_most_foreground'>show on most foreground ( cmd + ] )</button><br/>
  <div style="width:280;  border_width_bottom:1;  border_color:#909090;  margin:8 0 12 0;"></div>
  <button id='filemenu_edit_group'>make group ( cmd + g )</button><br/>
  <button id='filemenu_edit_release_group'>release group ( cmd + shift + g )</button><br/>
</toggle_panel>
<!-- 表示メニュー -->
<toggle_panel id='filemenu_view_panel'>
  <button id='filemenu_view_50'>zoom 50%</button><br/>
  <button id='filemenu_view_75'>zoom 74%</button><br/>
  <button id='filemenu_view_100'>zoom 100%</button><br/>
  <button id='filemenu_view_125'>zoom 125%</button><br/>
  <button id='filemenu_view_150'>zoom 150%</button><br/>
  <button id='filemenu_view_200'>zoom 200%</button><br/>
</toggle_panel>
<!-- 右クリックメニュー -->
<toggle_panel id='context_menu_panel'>
  <button id='contextmenu_cut'>cut</button><br/>
  <button id='contextmenu_copy'>copy</button><br/>
  <button id='contextmenu_paste'>paste</button><br/>
  <button id='contextmenu_plain_related_paste'>related paste</button><br/>
  <button id='contextmenu_arrow_related_paste'>arrow related paste</button><br/>
  <div style="width:187;  border_width_bottom:1;  border_color:#909090;  margin:8 0 12 0;"></div>
  <button id='contextmenu_most_background'>show on most background</button><br/>
  <button id='contextmenu_background'>show on background</button><br/>
  <button id='contextmenu_foreground'>show on foreground</button><br/>
  <button id='contextmenu_most_foreground'>show on most foreground</button><br/>
  <div style="width:187;  border_width_bottom:1;  border_color:#909090;  margin:8 0 12 0;"></div>
  <button id='contextmenu_group'>make group</button><br/>
  <button id='contextmenu_release_group'>release group</button><br/>
</toggle_panel>
`
    );

    // 要素ごとの特別な設定

    // ツールボタンの初期選択はカーソル
    this.setFocusObject( this.findObjectByName("tool_button_cursor") );

    // メインコンテンツの初期スクロール位置の設定
    var main_contents_element = this.findObjectByName("main_contents")
    main_contents_element.scrollTop( 470 );
    main_contents_element.scrollLeft( 470 );

    // 一時保存されたデータがあればロードする
    this._loadTemporary();

    return this;
  };
  

  //--------------------------------------
  // ウィンドウサイズ変更イベント
  //--------------------------------------
  EditorScreen.prototype.reload = function( width, height ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).reload.call( this, width, height );
    this.image_manager.reload();
  };

  //--------------------------------------
  // 描画
  //--------------------------------------
  EditorScreen.prototype.draw = function( context ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).draw.call( this, context, function( context ){
      // absolute系の描画の前に以下を描画させる

      // 選択中のオブジェクトに関係線がある場合に、関係先を記録しておく
      var related_uml_object_keys = {};
      var selected_uml_objects = this._selectedUmlObjects();
      for ( var i=0, length=selected_uml_objects.length; i<length; i=(i+1)|0 ) {
        var uml_object = selected_uml_objects[i];
        if ( "relation" == uml_object.type ) {
          if ( uml_object.inner_lines[0].relation && uml_object.inner_lines[0].relation.id ) {
            related_uml_object_keys[ uml_object.inner_lines[0].relation.id ] = true;
          }
          if ( uml_object.inner_lines[ uml_object.inner_lines.length - 1 ].relation && uml_object.inner_lines[ uml_object.inner_lines.length - 1 ].relation.id ) {
            related_uml_object_keys[ uml_object.inner_lines[ uml_object.inner_lines.length - 1 ].relation.id ] = true;
          }
        }
      }


      // メインコンテンツ領域でクリップ
      var main_content_element = this.findObjectByName( "main_contents" );
      var main_pos = main_content_element.screenPosition();

      clipRect(
        context,
        main_pos.x,
        main_pos.y,
        main_content_element.width,
        main_content_element.height,
        function(){

          var base_pos = this.findObjectByName( "paper" ).screenPosition();
          
          // UMLオブジェクトの描画
          for ( var i=0; i<this.save_data.priorities.length; i++ ) {
            var uml_object = this.save_data.objects[ this.save_data.priorities[i] ];
            var uml_object_key = this._getFullUmlObjectKey( uml_object );

            // 選択中
            if ( this._isSelectedUmlObjectByKey( uml_object_key ) ) {
              this._drawUmlObjectRecursion( context, base_pos.x, base_pos.y, uml_object, "rgb(0,0,255)", null );

              // 選択中ならオブジェクト全体を点線で囲む
              setLineDash( context, [ 1, 4 ] );
              drawRect(
                context,
                base_pos.x + ( uml_object.x * this.zoom_rate ),
                base_pos.y + ( uml_object.y * this.zoom_rate ),
                ( uml_object.width * this.zoom_rate ),
                ( uml_object.height * this.zoom_rate ),
                "rgb(0,0,255)",
                false
              );
              setLineDash( context, [] );
            }
            // 選択中ではない
            else {
              this._drawUmlObjectRecursion( context, base_pos.x, base_pos.y, uml_object, null, null, related_uml_object_keys, "rgb(0,180,0)" );
            }            
          }

          // 選択したオブジェクトの編集用トグル描画
          for ( var i=0; i<this.draggable_toggles.length; i++ ) {
            var color = "rgb(0,0,255)";
            if ( isIncludeArray( [ "inner-line-start", "inner-line-end" ], this.draggable_toggles[i].type ) && this.draggable_toggles[i].related ) color = "rgb(0,180,0)";

            drawRect(
              context,
              base_pos.x + ( this.draggable_toggles[i].x * this.zoom_rate ) - 4,
              base_pos.y + ( this.draggable_toggles[i].y * this.zoom_rate ) - 4,
              8,
              8,
              color,
              true
            );
          }

          // ドラッグの範囲選択を描画
          if ( this.dragging_rect ) {
            setLineDash( context, [ 1, 1 ] );
            drawRect(
              context,
              base_pos.x + ( this.dragging_rect.x * this.zoom_rate ),
              base_pos.y + ( this.dragging_rect.y * this.zoom_rate ),
              ( this.dragging_rect.width * this.zoom_rate ),
              ( this.dragging_rect.height * this.zoom_rate ),
              "rgb(120,120,120)",
              false
            );
            setLineDash( context, [] );
          }

        }.bind(this)
      );
    } );
  };

  //--------------------------------------
  // 再レイアウト
  //--------------------------------------
  EditorScreen.prototype.relayout = function(){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).relayout.call( this );
  };

  //--------------------------------------
  // 入力状態変更イベント
  //--------------------------------------
  EditorScreen.prototype.onChangeInputStatuses = function( statuses ){

    // クリックによる入力状態の解除
    this._blurInputtingByClick( statuses );

    // ドラッグ操作を開始したら右クリックメニューを閉じる
    if ( statuses.isDrag( KEYCODE_CURSOR ) ) this._hideContextMenu();

    // 以下、オブジェクトの入力よりも優先して処理させたいドラッグ関連の処理（オブジェクトを先にするとスクロールが優先してしまうため）
    // カーソルツールでもSHIFT押下中のドラッグは範囲選択（交差）として扱う
    if ( this.select_tool_name == "tool_button_cursor" && ! statuses.isPressKey( KEYCODE_SHIFT ) ) {

      // 選択中のオブジェクトの変形
      if ( this._editSelectedUmlObjectsByDrag( statuses ) ) return true;

      // 選択中オブジェクトのドラッグ移動
      if ( this._moveSelectedUmlObjectsByDrag( statuses ) ) return true;

      // ここに到達するドラッグ開始は、変形でも移動でもない（＝空エリアのスクロール等）ドラッグ。
      // スクロール用ドラッグの開始位置を、次のペーストの基準位置にする（クリック時と同様）。
      if ( statuses.isDrag( KEYCODE_CURSOR ) ) {
        var drag_paper_position = this._getPaperOffsetPosition( statuses.getDragPosition() );
        this.paste_base_position = {
          x: Math.round( drag_paper_position.x / this.grid_size ) * this.grid_size,
          y: Math.round( drag_paper_position.y / this.grid_size ) * this.grid_size
        };
      }
    }
    // オブジェクトの範囲選択
    else {
      if ( this._selectUmlObjectsByDrag( statuses ) ) return true;
    }

    // オブジェクトで入力消費しなかった時
    if ( ! Object.getPrototypeOf(Object.getPrototypeOf(this)).onChangeInputStatuses.call( this, statuses ) ) {

      // 以下はキー入力に関する処理 ----------------

      // ESCキーで右クリックメニューを閉じる
      if ( this._hideContextMenuByShortCutKey( statuses ) ) return true;

      // 全選択のショートカットキー操作
      if ( this._allSelectByShortCutKey( statuses ) ) return true;

      // 保存のショートカットキー操作
      if ( this._saveByShortCutKey( statuses ) ) return true;

      // アンドゥ・リドゥのショートカットキー操作
      if ( this._undoByShortCutKey( statuses ) || this._redoByShortCutKey( statuses ) ) return true;

      // コピペのキー操作
      if ( this._cutByShortCutKey( statuses ) || this._copyByShortCutKey( statuses ) || this._pasteByShortCutKey( statuses ) ) return true;

      // 関連させてコピペのキー操作
      if ( this._relatedPasteShortCutKeyAsArrow( statuses ) || this._relatedPasteShortCutKeyAsPlain( statuses ) ) return true;

      // 前面・背面の移動
      if ( this._moveDrawPriorityByShortCutKey( statuses ) ) return true;

      // グルーピング
      if ( this._groupSelectedUmlObjectsByShortCutKey( statuses ) || this._ungroupSelectedUmlObjectsByShortCutKey( statuses ) ) return true;

      // オブジェクトの削除
      if ( this._removeByKey( statuses ) ) return true;

      // デバッグ出力
      if ( this._logByShortCutKey( statuses ) ) return true;

      // 以下はカーソル入力に関する処理 ------------

      // パラメータ入力エリア上にカーソルがある時は何もしない
      if ( this.findObjectByName( "object_params" ).isHover( statuses ) ) return false;

      // 右クリックによる右クリックメニューの表示（右クリックは以降の通常処理を行わない）
      if ( this._showContextMenuByRightClick( statuses ) ) return true;

      // ダブルクリックによるオブジェクトの編集
      if ( this._editSelectedUmlObjectsByDoubleClick( statuses ) ) return true;

      // クリックによるオブジェクトの選択
      if ( this._selectUmlObjectByClick( statuses ) ) return true;

      return false;
    }
    return true;
  };

  //--------------------------------------
  // オブジェクトイベント
  //--------------------------------------
  EditorScreen.prototype.onObjectEvent = function( object, event_name, statuses ){
    Object.getPrototypeOf(Object.getPrototypeOf(this)).onObjectEvent.call( this, object, event_name, statuses )

    switch( event_name ) {
    // フォームの値変更イベント
    case "change":
      if ( object ) {
        switch( object.name ){
        case "input_fontSize":
        case "input_nameAlign":
        case "input_textAlign":
        case "input_wordBreak":
        case "input_pathStyle":
        case "input_lineStyle":
        case "input_lineStartStyle":
        case "input_lineEndStyle":
        case "input_lineColor":
        case "input_backgroundColor":
        case "input_textColor":
        case "input_lineWidth":
          this._setSelectedUmlObjectParams();
          break;
        }
      }
      break;

    // クリックイベント
    case "click":
      if ( object ) {
        switch( object.name ){
        // ファイルメニュー
        case "filemenu_file":
          var toggle_panel = this.findObjectByName( "filemenu_file_panel" );
          if ( toggle_panel.isShow() ) {
            toggle_panel.hide();
          }
          else {
            toggle_panel.show( object );
          }
          this.findObjectByName( "filemenu_edit_panel" ).hide();
          this.findObjectByName( "filemenu_view_panel" ).hide();
          break;

        // データの保存
        case "filemenu_file_save_json":
          this._saveAsJson();
          break;

        // データの保存（PDF）
        case "filemenu_file_save_pdf":
          this._saveAsPdf();
          break;

        // 編集メニュー
        case "filemenu_edit":
          var toggle_panel = this.findObjectByName( "filemenu_edit_panel" );
          if ( toggle_panel.isShow() ) {
            toggle_panel.hide();
          }
          else {
            toggle_panel.show( object );
          }
          this.findObjectByName( "filemenu_file_panel" ).hide();
          this.findObjectByName( "filemenu_view_panel" ).hide();
          break;

        // アンドゥ
        case "filemenu_edit_undo":
          this._undo();
          break;

        // リドゥ
        case "filemenu_edit_redo":
          this._redo();
          break;

        // カット（ファイルメニュー / 右クリックメニュー共通）
        case "filemenu_edit_cut":
        case "contextmenu_cut":
          this._sendSelectedUmlObjectToClipboard();
          this._removeSelectedUmlObject();

          // 紙サイズの修正
          this._refreshPaperSize();
          // データの記録
          this.data_manager.setData( this.save_data );
          // 再描画
          this.screen_manager.requestDraw( this );
          break;

        // コピー
        case "filemenu_edit_copy":
        case "contextmenu_copy":
          this._sendSelectedUmlObjectToClipboard();
          break;

        // ペースト
        case "filemenu_edit_paste":
        case "contextmenu_paste":
          this._pasteUmlObjectsByClipBoard();
          break;

        // 関係線をつけてペースト
        case "filemenu_edit_plain_related_paste":
        case "contextmenu_plain_related_paste":
          this._relatedPasteAsType( 2 );
          break;

        // 関係線をつけてペースト（矢印）
        case "filemenu_edit_arrow_related_paste":
        case "contextmenu_arrow_related_paste":
          this._relatedPasteAsType( 2, "arrow" );
          break;

        // 最背面に表示
        case "filemenu_edit_most_background":
        case "contextmenu_most_background":
          this._moveLowestPriorityBySelectedUmlObject();
          break;

        // 背面に表示
        case "filemenu_edit_background":
        case "contextmenu_background":
          this._moveLowerPriorityBySelectedUmlObject();
          break;

        // 前面に表示
        case "filemenu_edit_foreground":
        case "contextmenu_foreground":
          this._moveHigherPriorityBySelectedUmlObject();
          break;

        // 最前面に表示
        case "filemenu_edit_most_foreground":
        case "contextmenu_most_foreground":
          this._moveHighestPriorityBySelectedUmlObject();
          break;

        // グルーピング
        case "filemenu_edit_group":
        case "contextmenu_group":
          this._groupSelectedUmlObjects();
          break;

        // グルーピング解除
        case "filemenu_edit_release_group":
        case "contextmenu_release_group":
          this._ungroupSelectedUmlObjects();
          break;

        // 表示メニュー
        case "filemenu_view":
          var toggle_panel = this.findObjectByName( "filemenu_view_panel" );
          if ( toggle_panel.isShow() ) {
            toggle_panel.hide();
          }
          else {
            toggle_panel.show( object );
          }
          this.findObjectByName( "filemenu_file_panel" ).hide();
          this.findObjectByName( "filemenu_edit_panel" ).hide();
          break;

        // 50%で表示
        case "filemenu_view_50":
          this.zoom_rate = 0.5
          this._refreshSaveData();
          break;

        // 75%で表示
        case "filemenu_view_75":
          this.zoom_rate = 0.75
          this._refreshSaveData();
          break;

        // 100%で表示
        case "filemenu_view_100":
          this.zoom_rate = 1.0
          this._refreshSaveData();
          break;

        // 125%で表示
        case "filemenu_view_125":
          this.zoom_rate = 1.25
          this._refreshSaveData();
          break;

        // 150%で表示
        case "filemenu_view_150":
          this.zoom_rate = 1.5
          this._refreshSaveData();
          break;

        // 200%で表示
        case "filemenu_view_200":
          this.zoom_rate = 2.0
          this._refreshSaveData();
          break;

        // ツールボタン
        case "tool_button_cursor":
        case "tool_button_range":
        case "tool_button_contain_range":
          this.select_tool_name = object.name;
          break;

        case "tool_button_text_box":
        case "tool_button_object":
        case "tool_button_class":
        case "tool_button_text":
        case "tool_button_relation":
        case "tool_button_comment":
        case "tool_button_frame":
        case "tool_button_start":
        case "tool_button_end":
        case "tool_button_begin":
        case "tool_button_terminate":
        case "tool_button_actor":
        case "tool_button_branch":
        case "tool_button_vertical_line":
        case "tool_button_horizontal_line":
        case "tool_button_box":
        case "tool_button_horizontal_partition":
        case "tool_button_vertical_partition":
        case "tool_button_close":

          // UIオブジェクトを生成する
          this._createUmlObject( object.name );
          break;
        }
      }
      break;

    // 複数行テキストの入力完了
    case "blur_textarea":
      this._blurInputting();
      break;

    // テキスト入力モードの解除（ESCキー押下など）。対象オブジェクトの選択は維持する
    // （インスタントラベル入力中の場合も同様に解除・確定する）
    case "request_blur_textarea":
      if ( this.inputting_uml_object || this.inputting_instant_label ) {
        this._blurInputting();
        // 編集内容を記録して再描画（選択状態はそのまま）
        this.data_manager.setData( this.save_data );
        // クリックによる解除は入力パイプライン（Application.onInput）が relayoutByRequest → drawByRequest の順で
        // 描画するため、必ずレイアウト更新後に描画される。一方ESC（request_blur_textarea）経由は入力パイプライン外で
        // 描画予約されるためレイアウト更新を挟まず、レイアウト不整合のまま描画してエラーになり得る。
        // そこでクリック経路と揃えて、（予約済みの再描画が走る前に）同期的にレイアウトを更新しておく。
        this.screen_manager.relayout();
        this.screen_manager.requestDraw( this );
      }
      break;
    }
  };

  //--------------------------------------
  // 画像の読み込み完了イベント
  //--------------------------------------
  EditorScreen.prototype.onLoadedImages = function( image_manager ){
    var pictures = this.findObjectsByClass("tool_button_icon");
    var index_to_icon_handle_map = [
      // selector
      "icon0",
      "icon1",
      "icon2",
      // uml objects
      "icon10",
      "icon11",
      "icon12",
      "icon13",
      "icon14",
      "icon15",
      "icon16",
      "icon17",
      "icon18",
      "icon19",
      "icon20",
      "icon21",
      "icon22",
      "icon23",
      "icon24",
      "icon25",
      "icon26",
      "icon27",
      "icon28",
    ]
    for ( var i=0; i<pictures.length; i++ ) {
      pictures[i].setSrc( index_to_icon_handle_map[i], this.image_manager );
    }
  };

  //--------------------------------------
  // テキストファイルのドロップ
  //--------------------------------------
  EditorScreen.prototype.onOpenFileAsText = function( file, json ){
    if ( json && 0 < json.length ) {
      var data = JSON.parse( json );
      if ( data.application_name == this.application_name ) {

        if ( 0 < this.data_manager.getHistorySize() ) {
          if ( window.confirm("このファイルを別タブで開きますか？") ) {
            this._openUmlDrawToolInNewTab( json );
          }
          else {
            // this._openSaveData( data );
          }
        }
        else {
          this._openSaveData( data );
        }

        return;
      }  
    }

    alert("このファイルを開くことはできません");
  };

  //--------------------------------------
  // 画像ファイルのドロップ
  //--------------------------------------
  EditorScreen.prototype.onOpenFileAsDataURL = function( file, data_url ){
  };

  //--------------------------------------
  // バイナリファイルのドロップ
  //--------------------------------------
  EditorScreen.prototype.onOpenFileAsBuffer = function( file, buffer ){
  };

}
// prototype継承できる様に定義時点で関数実行し、内部で定義したprototypeを完成させる
EditorScreen();
