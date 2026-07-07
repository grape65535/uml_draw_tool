//--------------------------------------
// 各形状同士の衝突判定
//   shape : { type: "形状ごとの種別名", 形状ごとの属性値 }
//     { type: "point", x:0, y:0 }
//     { type: "line", start:{ x:0, y:0 }, end:{ x:0, y:0 } }
//     { type: "rect", x:0, y:0, width:0, height:0 }
//     { type: "circle", x:0, y:0, radius:0 }
//     { type: "polygon", polygon: [ {x0,y:0}, {x0,y:0}, ... ] }
//--------------------------------------
function isCollisionShapes( shape1, shape2 ){
  var invoker = {
    point: {
      point:   function(){ return isCollisionPointAndPoint( shape1.x, shape1.y, shape2.x, shape2.y ); },
      line:    function(){ return isCollisionPointAndLine( shape1.x, shape1.y, shape2.start.x, shape2.start.y, shape2.end.x, shape2.end.y ); },
      rect:    function(){ return isCollisionPointAndRect( shape1.x, shape1.y, shape2.x, shape2.y, shape2.width, shape2.height ); },
      circle:  function(){ return isCollisionPointAndCircle( shape1.x, shape1.y, shape2.x, shape2.y, shape2.radius ); },
      polygon: function(){ return isCollisionPointAndPolygon( shape1.x, shape1.y, shape2.polygon ); },
    },
    line: {
      point:   function(){ return isCollisionPointAndLine( shape2.x, shape2.y, shape1.start.x, shape1.start.y, shape1.end.x, shape1.end.y ); },
      line:    function(){ return isCollisionLineAndLine( shape1.start.x, shape1.start.y, shape1.end.x, shape1.end.y, shape2.start.x, shape2.start.y, shape2.end.x, shape2.end.y ); },
      rect:    function(){ return isCollisionLineAndRect( shape1.start.x, shape1.start.y, shape1.end.x, shape1.end.y, shape2.x, shape2.y, shape2.width, shape2.height ); },
      circle:  function(){ return isCollisionLineAndCircle( shape1.start.x, shape1.start.y, shape1.end.x, shape1.end.y, shape2.x, shape2.y, shape2.radius ); },
      polygon: function(){ return isCollisionLineAndPolygon( shape1.start.x, shape1.start.y, shape1.end.x, shape1.end.y, shape2.polygon ); },
    },
    rect: {
      point:   function(){ return isCollisionPointAndRect( shape2.x, shape2.y, shape1.x, shape1.y, shape1.width, shape1.height ); },
      line:    function(){ return isCollisionLineAndRect( shape2.start.x, shape2.start.y, shape2.end.x, shape2.end.y, shape1.x, shape1.y, shape1.width, shape1.height ); },
      rect:    function(){ return isCollisionRectAndRect( shape1.x, shape1.y, shape1.width, shape1.height, shape2.x, shape2.y, shape2.width, shape2.height ); },
      circle:  function(){ return isCollisionRectAndCircle( shape1.x, shape1.y, shape1.width, shape1.height, shape2.x, shape2.y, shape2.radius ); },
      polygon: function(){ return isCollisionRectAndPolygon( shape1.x, shape1.y, shape1.width, shape1.height, shape2.polygon ); },
    },
    circle: {
      point:   function(){ return isCollisionPointAndCircle( shape2.x, shape2.y, shape1.x, shape1.y, shape1.radius ); },
      line:    function(){ return isCollisionLineAndCircle( shape2.start.x, shape2.start.y, shape2.end.x, shape2.end.y, shape1.x, shape1.y, shape1.radius ); },
      rect:    function(){ return isCollisionRectAndCircle( shape2.x, shape2.y, shape2.width, shape2.height, shape1.x, shape1.y, shape1.radius ); },
      circle:  function(){ return isCollisionCircleAndCircle( shape1.x, shape1.y, shape1.radius, shape2.x, shape2.y, shape2.radius ); },
      polygon: function(){ return isCollisionCircleAndPolygon( shape1.x, shape1.y, shape1.radius, shape2.polygon ); },
    },
    polygon: {
      point:   function(){ return isCollisionPointAndPolygon( shape2.x, shape2.y, shape1.polygon ); },
      line:    function(){ return isCollisionLineAndPolygon( shape2.start.x, shape2.start.y, shape2.end.x, shape2.end.y, shape1.polygon ); },
      rect:    function(){ return isCollisionRectAndPolygon( shape2.x, shape2.y, shape2.width, shape2.height, shape1.polygon ); },
      circle:  function(){ return isCollisionCircleAndPolygon( shape2.x, shape2.y, shape2.radius, shape1.polygon ); },
      polygon: function(){ return isCollisionPolygonAndPolygon( shape1.polygon, shape2.polygon ); },
    },
  };
  return invoker[ shape1.type ][ shape2.type ]();
}

//--------------------------------------
// 各形状同士の衝突判定（引数展開版）
//   isCollisionShapeParams( type1, param1, param2, ..., type2, paramN, ... )
//   ex)
//     isCollisionShapeParams( "point", 0, 0, "rect", 0, 0, 0, 0 )
//--------------------------------------
function isCollisionShapeByParams( _args ){
  var iterator = { index: 0, args: arguments, getNext: function(){ return this.args[ this.index++ ]; } };
  function createShape( iterator ){
    switch( iterator.getNext() ) {
    case "point":
      var x = iterator.getNext();
      var y = iterator.getNext();
      return { type:"point", x:x, y:y };
    case "line":
      var x1 = iterator.getNext();
      var y1 = iterator.getNext();
      var x2 = iterator.getNext();
      var y2 = iterator.getNext();
      return { type:"line", start:{ x:x1, y:y1 }, end:{ x:x2, y:y2 } };
    case "rect":
      var x = iterator.getNext();
      var y = iterator.getNext();
      var width = iterator.getNext();
      var height = iterator.getNext();
      return { type:"rect", x:x, y:y, width:width, height:height };
    case "circle":
      var x = iterator.getNext();
      var y = iterator.getNext();
      var radius = iterator.getNext();
      return { type:"circle", x:x, y:y, radius:radius };
    case "polygon":
      return { type:"polygon", polygon:iterator.getNext() };
    default:
      throw "shape type error.";
    };
  }
  return isCollisionShapes( createShape( iterator ), createShape( iterator ) );
}

//--------------------------------------
// 点と点が衝突しているか？
//--------------------------------------
function isCollisionPointAndPoint( px1, py1, px2, py2 ){
  return px1==px2 && py1==py2;
}


//--------------------------------------
// 点と線が衝突しているか？
//--------------------------------------
function isCollisionPointAndLine( px, py, lsx, lsy, lex, ley ){
  var distance = getDistanceFromLineByPoint( px, py, lsx, lsy, lex, ley );
  return 3.0 >= distance;
}

//--------------------------------------
// 点と矩形が衝突しているか？
//--------------------------------------
function isCollisionPointAndRect( px, py, rx, ry, width, height ){
  if (
     ( rx <= px && px < rx + width )
  && ( ry <= py && py < ry + height )
  ) {
    return true;
  }
  return false;
}

//--------------------------------------
// 点と円が衝突しているか？
//--------------------------------------
function isCollisionPointAndCircle( px, py, cx, cy, radius ){
  return radius >= Math.round( getDistanceByPoints( px, py, cx, cy ) );
}

//--------------------------------------
// 点と楕円が衝突しているか？（radius_x == radius_y なら真円）
//--------------------------------------
function isCollisionPointAndEllipse( px, py, cx, cy, radius_x, radius_y ){
  if ( 0 == radius_x || 0 == radius_y ) return false;
  var dx = ( px - cx ) / radius_x;
  var dy = ( py - cy ) / radius_y;
  return ( dx * dx + dy * dy ) <= 1;
}

//--------------------------------------
// 点が多角形内に存在するか判定する
//   polygon : [ {x0,y:0}, {x0,y:0}, ... ]
//--------------------------------------
function isCollisionPointAndPolygon( x, y, source_polygon ){
  // 多角形が2点以下なら、多角形ではない
  if ( 2 >= source_polygon.length ) return false;

  // 多角形を計算用にコピーする
  var polygon = _normalizationPolygon( source_polygon );

  // 交差点アルゴリズムから求める。
  // ある点から右に水平に伸びる線と、多角形の各線が交わる時、
  // 交差点が奇数個ならば内側、偶数個や0の時は外側として判定する
  var count = 0;
  for ( var i=0; i<polygon.length - 1; i++ ) {
    // 多角形の辺の開始点と終点のY座標が指定座標をまたぐのなら、交差しているかも
    if (
       ( ( polygon[i].y <= y ) && ( polygon[i+1].y > y ) )
    || ( ( polygon[i].y > y) && ( polygon[i+1].y <= y ) )
    ) {
      // 多角形の辺が指定座標よりも右側にあること（ただし、水平な辺として重なる場合を除く）
      var vt = ( y - polygon[i].y ) / ( polygon[i+1].y - polygon[i].y );
      if ( x < ( polygon[i].x + ( vt * ( polygon[i+1].x - polygon[i].x ) ) ) ) {
        count++;
      }
    }
  }

  return ( 0 == count || 0 == count % 2 ? false : true );
}

//--------------------------------------
// 点がペジェ曲線と衝突しているか？
//   bezier_points = [ {x:0,y:0}, {x:0,y:0}, {x:0,y:0}, ... ]
//                   [ 開始点, 制御点, 中継点, 制御点, [ 中継点, 制御点 ]*, ..., 終了点 ]
//--------------------------------------
function isCollisionPointAndBezier( x, y, bezier_points ){
  return 3.0 >= getDistanceFromBezierByPoint( x, y, bezier_points );
}

//--------------------------------------
// 線と線が交差しているか？
//--------------------------------------
function isCollisionLineAndLine( lsx1, lsy1, lex1, ley1, lsx2, lsy2, lex2, ley2 ) {
  var ts1 = (lsx2 - lex2) * (lsy1 - lsy2) + (lsy2 - ley2) * (lsx2 - lsx1);
  var te1 = (lsx2 - lex2) * (ley1 - lsy2) + (lsy2 - ley2) * (lsx2 - lex1);
  var ts2 = (lsx1 - lex1) * (lsy2 - lsy1) + (lsy1 - ley1) * (lsx1 - lsx2);
  var te2 = (lsx1 - lex1) * (ley2 - lsy1) + (lsy1 - ley1) * (lsx1 - lex2);

  return ts2 * te2 < 0 && ts1 * te1 < 0;
  // return ts2 * te2 <= 0 && ts1 * te1 <= 0; // 端点を含む場合
};

//--------------------------------------
// 線と矩形が衝突しているか？
//--------------------------------------
function isCollisionLineAndRect( lsx, lsy, lex, ley, rx, ry, width, height ){
  // 始点が矩形内か？
  if (
     ( lsx <= rx + width && rx < lsx )
  && ( lsy <= ry + height && ry < lsy )
  ) {
    return true;
  }
  // 終点が矩形内か？
  else if (
     ( lex <= rx + width && rx < lex )
  && ( ley <= ry + height && ry < ley )
  ) {
    return true;
  }
  // 矩形をまたがる線か？
  else {
    // 矩形の４辺のいずれかと線が交差している？
    if (
       ( isCollisionLineAndLine( lsx, lsy, lex, ley, rx, ry, rx + width, ry ) )
    || ( isCollisionLineAndLine( lsx, lsy, lex, ley, rx + width, ry, rx + width, ry + height ) )
    || ( isCollisionLineAndLine( lsx, lsy, lex, ley, rx + width, ry + height, rx, ry + height ) )
    || ( isCollisionLineAndLine( lsx, lsy, lex, ley, rx, ry + height, rx, ry ) )
    ) {
      return true;
    }
  }
  return false;
}

//--------------------------------------
// 線と円が衝突しているか？
//--------------------------------------
function isCollisionLineAndCircle( lsx, lsy, lex, ley, cx, cy, radius ){
  // 始点または終点が円内にある？
  if ( isCollisionPointAndCircle( lsx, lsy, cx, cy, radius ) || isCollisionPointAndCircle( lex, ley, cx, cy, radius ) ) return true;

  // 線と円の中心の距離が半径内か？
  if ( radius >= getDistanceFromLineByPoint( cx, cy, lsx, lsy, lex, ley ) ) return true;

  return false;
}

//--------------------------------------
// 線と多角形が衝突しているか？
//   polygon : [ {x0,y:0}, {x0,y:0}, ... ]
//--------------------------------------
function isCollisionLineAndPolygon( lsx, lsy, lex, ley, source_polygon ){
  // 多角形が2点以下なら、多角形ではない
  if ( 2 >= source_polygon.length ) return false;

  // 始点または終点が多角形内に存在するなら、衝突している
  if ( isCollisionPointAndPolygon( lsx, lsy, source_polygon ) || isCollisionPointAndPolygon( lex, ley, source_polygon ) ) {
    return true;
  }

  // 多角形を計算用にコピーする
  var polygon = _normalizationPolygon( source_polygon );

  // 多角形を構成するいずれかの線と、指定の線が衝突しているなら衝突しているとみなす
  for ( var i=0; i<polygon.length - 1; i++ ) {
    if ( isCollisionLineAndLine( lsx, lsy, lex, ley, polygon[i].x, polygon[i].y, polygon[i+1].x, polygon[i+1].y ) ) return true;
  }
  return false;
}

//--------------------------------------
// 矩形と矩形が衝突しているか？
//--------------------------------------
function isCollisionRectAndRect( rx1, ry1, width1, height1, rx2, ry2, width2, height2 ){
  if (
     ( rx1 + width1 > rx2 && rx2 + width2 > rx1 )
  && ( ry1 + height1 > ry2 && ry2 + height2 > ry1 )
  ) {
    return true;
  }
  return false;
}

//--------------------------------------
// 矩形と円が衝突しているか？
//--------------------------------------
function isCollisionRectAndCircle( rx, ry, width, height, cx, cy, radius ){
  // 円の中心点が矩形内？
  if ( isCollisionPointAndRect( cx, cy, rx, ry, width, height ) ) return true;
  // 矩形の４辺のいずれかが円の中心点との距離が半径以下の時、衝突しているとみなす
  if (
     ( isCollisionLineAndCircle( rx, ry, rx + width, ry, cx, cy, radius ) )
  || ( isCollisionLineAndCircle( rx + width, ry, rx + width, ry + height, cx, cy, radius ) )
  || ( isCollisionLineAndCircle( rx + width, ry + height, rx, ry + height, cx, cy, radius ) )
  || ( isCollisionLineAndCircle( rx, ry + height, rx, ry, cx, cy, radius ) )
  ) {
    return true;
  }
  return false;
}

//--------------------------------------
// 矩形と楕円が衝突しているか？（範囲選択用の近似。外接矩形の重なり＋中心/角の楕円内判定）
//--------------------------------------
function isCollisionRectAndEllipse( rx, ry, width, height, cx, cy, radius_x, radius_y ){
  // 楕円の中心点が矩形内？
  if ( isCollisionPointAndRect( cx, cy, rx, ry, width, height ) ) return true;
  // 矩形の4隅のいずれかが楕円内？
  if (
     ( isCollisionPointAndEllipse( rx,         ry,          cx, cy, radius_x, radius_y ) )
  || ( isCollisionPointAndEllipse( rx + width, ry,          cx, cy, radius_x, radius_y ) )
  || ( isCollisionPointAndEllipse( rx + width, ry + height, cx, cy, radius_x, radius_y ) )
  || ( isCollisionPointAndEllipse( rx,         ry + height, cx, cy, radius_x, radius_y ) )
  ) {
    return true;
  }
  // 楕円の外接矩形と矩形が重なる？（辺の交差を近似）
  return isCollisionRectAndRect( rx, ry, width, height, cx - radius_x, cy - radius_y, radius_x * 2, radius_y * 2 );
}

//--------------------------------------
// 矩形と多角形が衝突しているか？
//   polygon : [ {x0,y:0}, {x0,y:0}, ... ]
//--------------------------------------
function isCollisionRectAndPolygon( rx, ry, width, height, source_polygon ){
  // 多角形を構成するいずれかの点が矩形内なら衝突している
  for ( var i=0; i<source_polygon.length; i++ ) {
    if ( isCollisionPointAndRect( source_polygon[i].x, source_polygon[i].y, rx, ry, width, height ) ) return true;
  }
  // 矩形の４辺のいずれかが多角形の辺のいずれかと衝突している時、衝突しているとみなす
  if (
     ( isCollisionLineAndPolygon( rx, ry, rx + width, ry, source_polygon ) )
  || ( isCollisionLineAndPolygon( rx + width, ry, rx + width, ry + height, source_polygon ) )
  || ( isCollisionLineAndPolygon( rx + width, ry + height, rx, ry + height, source_polygon ) )
  || ( isCollisionLineAndPolygon( rx, ry + height, rx, ry, source_polygon ) )
 ) {
   return true;
 }
 return false;
}

//--------------------------------------
// 円と円が衝突しているか？
//--------------------------------------
function isCollisionCircleAndCircle( cx1, cy1, radius1, cx2, cy2, radius2 ){
  return isCollisionPointAndCircle( cx1, cy1, cx2, cy2, radius1 + radius2 );
}

//--------------------------------------
// 円と多角形が衝突しているか？
//   polygon : [ {x0,y:0}, {x0,y:0}, ... ]
//--------------------------------------
function isCollisionCircleAndPolygon( cx, cy, radius, source_polygon ){
  // 円の中心点が多角形内ならば衝突している
  if ( isCollisionPointAndPolygon( cx, cy, source_polygon ) ) return true;

  // 多角形を計算用にコピーする
  var polygon = _normalizationPolygon( source_polygon );

  // 多角形を構成する各辺と円の中心点の距離が半径以下ならば、衝突しているとみなす
  for ( var i=0; i<polygon.length - 1; i++ ) {
    if ( isCollisionLineAndCircle( polygon[i].x, polygon[i].y, polygon[i+1].x, polygon[i+1].y, cx, cy, radius ) ) return true;
  }
  return false;
}

//--------------------------------------
// 多角形と多角形が衝突しているか？
//   polygon : [ {x0,y:0}, {x0,y:0}, ... ]
//--------------------------------------
function isCollisionPolygonAndPolygon( source_polygon1, source_polygon2 ){
  // 多角形を構成する各点が、もう１つの多角形内にあれば衝突している
  for ( var i=0; i<source_polygon1.length; i++ ) {
    if ( isCollisionPointAndPolygon( source_polygon1[i].x, source_polygon1[i].y, source_polygon2 ) ) return true;
  }
  // 多角形の内包関係を逆にして、同じ方法で判定する
  for ( var i=0; i<source_polygon2.length; i++ ) {
    if ( isCollisionPointAndPolygon( source_polygon2[i].x, source_polygon2[i].y, source_polygon1 ) ) return true;
  }
  return false;  
}

//--------------------------------------
// ２点間の距離を計算する
//--------------------------------------
function getDistanceByPoints( x1, y1, x2, y2 ){
  return Math.sqrt( Math.pow( x2 - x1, 2 ) + Math.pow( y2 - y1, 2 ) );
}

//--------------------------------------
// 点と直線の距離を計算する
//--------------------------------------
function getDistanceFromLineByPoint( px, py, lsx, lsy, lex, ley ){
  var a = lex - lsx;
  var b = ley - lsy;
  var r2 = ( a * a ) + ( b * b );
  var tt = -( a * ( lsx - px ) + b * ( lsy - py ) );
  if( tt < 0 ) {
    return Math.sqrt( ( lsx - px ) * ( lsx - px ) + ( lsy - py ) * ( lsy - py ) );
  }
  if( tt > r2 ) {
    return Math.sqrt( ( lex - px ) * ( lex - px ) + ( ley - py ) * ( ley - py ) );
  }
  var f1 = a * ( lsy - py ) - b * ( lsx - px );
  return Math.sqrt( ( f1 * f1 ) / r2 );
}

//--------------------------------------
// 矩形の4辺との距離を取得する
//--------------------------------------
function getDistanceRectByPoint( px, py, rect ){
  return [
    { type: "top",    distance: getDistanceFromLineByPoint( px, py, rect.x,              rect.y,               rect.x + rect.width, rect.y               ), contact: getContactPointFromLineByPoint( px, py, rect.x,              rect.y,               rect.x + rect.width, rect.y               ) },
    { type: "right",  distance: getDistanceFromLineByPoint( px, py, rect.x + rect.width, rect.y,               rect.x + rect.width, rect.y + rect.height ), contact: getContactPointFromLineByPoint( px, py, rect.x + rect.width, rect.y,               rect.x + rect.width, rect.y + rect.height ) },
    { type: "bottom", distance: getDistanceFromLineByPoint( px, py, rect.x,              rect.y + rect.height, rect.x + rect.width, rect.y + rect.height ), contact: getContactPointFromLineByPoint( px, py, rect.x,              rect.y + rect.height, rect.x + rect.width, rect.y + rect.height ) },
    { type: "left",   distance: getDistanceFromLineByPoint( px, py, rect.x,              rect.y,               rect.x,              rect.y + rect.height ), contact: getContactPointFromLineByPoint( px, py, rect.x,              rect.y,               rect.x,              rect.y + rect.height ) },
  ];
}

//--------------------------------------
// 点と線に対して、線上の最も近い点を取得する
//--------------------------------------
function getContactPointFromLineByPoint( px, py, lsx, lsy, lex, ley ){
  var left = ( lsx < lex ? lsx : lex );
  var width = ( lsx < lex ? lex : lsx ) - left;
  var top = ( lsy < ley ? lsy : ley );
  var height = ( lsy < ley ? ley : lsy ) - top;

  var contact = { x:0, y:0 };
  // x座標が線上の範囲に無い時
  if ( px < left || px >= left + width ) px = ( px < left ? left : left + width );
  // y座標が線上の範囲に無い時
  if ( py < top || py >= top + height  ) py = ( py < top ? top : top + height );

  // x,y座標共に線上の範囲にあり、X座標基準の線上の座標と、Y座標基準の線上の座標を計算する
  var contact_x = {
    x: px,
    y: ( 1 > width ? py : top + height * (( px - left ) / width ) )
  };
  var contact_y = {
    x: ( 1 > height ? px : left + width * (( py - top ) / height ) ),
    y: py
  };

  return {
    x: Math.round( ( contact_x.x + contact_y.x ) / 2 ),
    y: Math.round( ( contact_x.y + contact_y.y ) / 2 ),
  };
}

//--------------------------------------
// 座標配列からペジェ曲線のための制御点を追加した座標配列を生成する
//   points : [ {x:0,y:0}, ... ]
//--------------------------------------
function getBezierPointsByPoints( points, is_horizontal ) {
  // 座標nと、座標n+1の間の制御点は、横座標優先ならば（ X(n+1), Y(n) ）とし、縦優先ならば（　X(n), Y(n+1)　）で決定する
  is_horizontal = ( is_horizontal ? true : false );

  var bezier_points = [ { x: points[0].x, y: points[0].y } ];
  for ( var i=1; i<points.length; i++ ) {
    var cx, cy;
    if ( is_horizontal ) {
      cx = points[i].x;
      cy = points[i-1].y;
      is_horizontal = false;
    }
    else {
      cx = points[i-1].x;
      cy = points[i].y;
      is_horizontal = true;
    }
    bezier_points.push( { x: cx, y: cy } );
    bezier_points.push( { x: points[i].x, y: points[i].y } );
  }

  return bezier_points;
}

//--------------------------------------
// 点とペジェ曲線の距離を計算する
//   bezier_points = [ {x:0,y:0}, {x:0,y:0}, {x:0,y:0}, ... ]
//                   [ 開始点, 制御点, 中継点, 制御点, [ 中継点, 制御点 ]*, ..., 終了点 ]
//--------------------------------------
function getDistanceFromBezierByPoint( px, py, bezier_points ){
  var contact = getContactPointFromBezierByPoint( px, py, bezier_points )

  var x = ( contact.x - px );
  var y = ( contact.y - py );
  return Math.sqrt( x*x + y*y );
}

//--------------------------------------
// 点とペジェ曲線に対して、線上の最も近い点を取得する
//   bezier_points = [ {x:0,y:0}, {x:0,y:0}, {x:0,y:0}, ... ]
//                   [ 開始点, 制御点, 中継点, 制御点, [ 中継点, 制御点 ]*, ..., 終了点 ]
//--------------------------------------
function getContactPointFromBezierByPoint( px, py, bezier_points ){
  // ペジェ曲線を構成する点は、最低でも3つ存在し奇数個のはず。
  if ( 3 > bezier_points.length || 0 == bezier_points.length % 2 ) return null;

  var min_distance = null;
  var min_point = null;
  for ( var i=0; i<bezier_points.length-2; i+=2 ) {
    var tmp_point = _contactBezierPoint( px, py, bezier_points.slice( i, i+3 ) );
    var distance = getDistanceByPoints( px, py, tmp_point.x, tmp_point.y );
    if ( ! min_distance || min_distance > distance ) {
      min_distance = distance;
      min_point = tmp_point;
    }
  }
  return min_point;
}

//--------------------------------------
// 多角形データの終端補完をしながら元データをコピーした新規多角形を返す
//   polygon : [ {x0,y:0}, {x0,y:0}, ... ]
//--------------------------------------
function _normalizationPolygon( source_polygon ){
  // 多角形を計算用にコピーする
  var polygon = [];
  for ( var i=0; i<source_polygon.length; i++ ) {
    polygon.push( { x:source_polygon[i].x, y:source_polygon[i].y } );
  }
  // 多角形が閉じていない時は、強制的に閉じる
  if ( polygon[0].x != polygon[ polygon.length - 1 ].x || polygon[0].y != polygon[ polygon.length - 1 ].y ) {
    polygon.push( { x:polygon[0].x, y:polygon[0].y } );
  }

  return polygon;
}

//--------------------------------------
// 3次方程式の解を求める
//   ax^3+bx^2+cx+d=0のxを求める
//--------------------------------------
function _cubic_equ(a,b,c,d){
  var p=-b*b/3/a/a+c/a;
  var q=2*b*b*b/27/a/a/a-b*c/3/a/a+d/a;
  var r2=81*q*q+12*p*p*p;
  var r_real=0;
  var r_img=0;
  if(r2<0){
    r_img=Math.sqrt(-r2);
  }else{
    r_real=Math.sqrt(r2);
  }
  var u3_real;
  var u3_img
  if(r_img){
    u3_real=-9*q/18;
    u3_img=r_img/18;
    v3_real=-9*q/18;
    v3_img=-r_img/18;
  }else{
    u3_real=(-9*q+r_real)/18;
    u3_img=0;
    v3_real=(-9*q-r_real)/18;
    v3_img=0;
  }
  var u_real;
  var u_img
  if(u3_img ){
    var z=Math.sqrt(u3_real*u3_real+u3_img*u3_img);
    var t=Math.atan2(u3_img,u3_real);
    z=Math.pow(z,1/3);
    t=t/3;
    u_real=z*Math.cos(t);
    u_img=z*Math.sin(t);
  }else{
    if(u3_real<0)
      u_real=-Math.pow(-u3_real,1/3);
    else
      u_real=Math.pow(u3_real,1/3);
    u_img=0;
  }
  var v_real;
  var v_img
  if(v3_img){
    var z=Math.sqrt(v3_real*v3_real+v3_img*v3_img);
    var t=Math.atan2(v3_img,v3_real);
    z=Math.pow(z,1/3);
    t=t/3;
    v_real=z*Math.cos(t);
    v_img=z*Math.sin(t);
  }else{
    if(v3_real<0)
      v_real=-Math.pow(-v3_real,1/3);
    else
      v_real=Math.pow(v3_real,1/3);
    v_img=0;
  }
  var omega1_real=-0.5;
  var omega1_img=Math.sqrt(3)/2;
  var omega2_real=-0.5;
  var omega2_img=-Math.sqrt(3)/2;
  var y0_real,y0_img;
  var y1_real,y1_img;
  var y2_real,y2_img;
  y0_real=u_real+v_real;
  y0_img=u_img+v_img;
  y1_real=omega1_real*u_real-omega1_img*u_img + omega2_real*v_real-omega2_img*v_img;
  y1_img=omega1_img*u_real+omega1_real*u_img + omega2_img*v_real+omega1_real*v_img
  y2_real=omega2_real*u_real-omega2_img*u_img + omega1_real*v_real-omega1_img*v_img;
  y2_img=omega2_img*u_real+omega2_real*u_img + omega1_img*v_real+omega1_real*v_img

  var x0_real,x0_img;
  var x1_real,x1_img;
  var x2_real,x2_img;
  x0_real=y0_real-b/(3*a);
  x0_img=y0_img;
  x1_real=y1_real-b/(3*a);
  x1_img=y1_img;
  x2_real=y2_real-b/(3*a);
  x2_img=y2_img;
  var xn=new Array(6);
  xn[0]=x0_real;
  xn[1]=x0_img;
  xn[2]=x1_real;
  xn[3]=x1_img;
  xn[4]=x2_real;
  xn[5]=x2_img;
  return xn;
}

//--------------------------------------
// ペジェ曲線を構成する最低限の要素（開始点-制御点-終了点）について、で媒介変数tのときの曲線上の点の座標を求める
//--------------------------------------
function _getBezierPoint( bezier_3points, t ){
  return {
    x: (1-t) * (1-t) * bezier_3points[0].x + 2 * (1-t) * t * bezier_3points[1].x + t * t * bezier_3points[2].x,
    y: (1-t) * (1-t) * bezier_3points[0].y + 2 * (1-t) * t * bezier_3points[1].y + t * t * bezier_3points[2].y
  }
}

//--------------------------------------
// ペジェ曲線を構成する最低限の要素（開始点-制御点-終了点）について、指定の座標と最も近い座標を求める
//--------------------------------------
function _contactBezierPoint( x, y, bezier_3points ){
  var x0=bezier_3points[0].x - x;
  var y0=bezier_3points[0].y - y;
  var x1=bezier_3points[1].x - x;
  var y1=bezier_3points[1].y - y;
  var x2=bezier_3points[2].x - x;
  var y2=bezier_3points[2].y - y;
  var a=x0-2*x1+x2;
  var b=-2*x0+2*x1;
  var c=x0;
  var d=y0-2*y1+y2;
  var e=-2*y0+2*y1;
  var f=y0;
  var g=4*(a*a+d*d);
  var h=6*a*b+6*d*e;
  var k=2*b*b+4*a*c+2*e*e+4*d*f;
  var m=2*b*c+2*e*f;
  var tn = _cubic_equ( g, h, k, m );
  var n;
  var tdn=0;
  var dmin=0;
  var i=0;
  var contact;
  for(n=0;n<3;n++){
    if(Math.abs(tn[n*2+1])<1e-14){ // 実数解の場合
      if(0<=tn[n*2] && tn[n*2]<=1){
        contact = _getBezierPoint( bezier_3points, tn[n*2] );
        var dx = contact.x - x;
        var dy = contact.y - y;
        var d = dx * dx + dy * dy;
        if(i==0){
          dmin=d;
          tdn=tn[n*2];
        }else{
          if(d<dmin){
            dmin=d;
            tdn=tn[n*2];
          }
        }
        ++i;
      }
    }
  }
  if(i==0){ // 有効な実数解がない場合
    contact = _getBezierPoint( bezier_3points, 0 );
    var dx = contact.x - x;
    var dy = contact.y - y;
    var d = dx * dx + dy * dy;
    dmin=d;
    tdn=0;
  }else{
    contact = _getBezierPoint( bezier_3points, 0 );
    var dx = contact.x - x;
    var dy = contact.y - y;
    var d = dx * dx + dy * dy;
    if(dmin>d){
      dmin=d;
      tdn=0;
    }
  }
  contact = _getBezierPoint( bezier_3points, 1 );
  dx = contact.x - x;
  dy = contact.y - y;
  d = dx * dx + dy * dy;
  if(dmin>d){
    dmin=d;
    tdn=1;
  }
  return _getBezierPoint( bezier_3points, tdn );
}

//--------------------------------------
// 二分技探索
//   calc_function が target_value に最も近い値を返すまで二分技探査をします
// parameter:
//   calc_function( rate ) : rate 区間[0,1] の間の数値が与えられる
// return:
//   区間[0,1]の間の、最も target_value に誓った時の値を返す
//--------------------------------------
function _dichotomy( target_value, calc_function ){
  var smaller = calc_function( 0 );
  if ( smaller == target_value ) return 0;
  var larger  = calc_function( 1 );
  if ( larger == target_value ) return 0;
  // 最小値でも最大値でも値が変化しないのなら、0を返す
  if ( smaller == larger ) return 0;

  // 0.0 -> 1.0 の方向に対して calc_function が返す値が増加するのか減少するのか
  is_increase = ( smaller < larger ? true : false );

  // 最大10回まで繰り返す
  var section = 50;
  var range = 50;
  var current_value = smaller;
  var current_rate = 0;
  var last_value = smaller;
  var last_rate = null;
  for ( var i=0; i<10; i++ ) {
    if ( 0   > section ) section = 0;
    if ( 100 < section ) section = 100;
    last_value = current_value;
    last_rate  = current_rate;
    var current_rate = section / 100;
    current_value = calc_function( current_rate );
    range = range / 2;
    if (
       ( current_value < target_value && is_increase   )
    || ( current_value > target_value && ! is_increase )
    ) {
      section += range;
    }
    else if (
       ( current_value < target_value && ! is_increase )
    || ( current_value > target_value && is_increase   )
    ) {
      section -= range;
    }
    else {
      return current_rate;
    }
  }
  
  // 最後と、その前回で target_value に近い方の値を返す
  return Math.abs( last_value - target_value ) < Math.abs( ( current_value - target_value ) ) ? last_rate : current_rate;
}

//--------------------------------------
// 基点から指定距離のペジェ曲線上の座標を二分技で探す
//--------------------------------------
function _contactDistanceBezierPoint( x, y, distance, bezier_3points ){
  // 二分技で指定距離を得られる 媒介変数t の値を探す
  var t = _dichotomy( distance, function( seek_t ){
    var pos = _getBezierPoint( bezier_3points, seek_t );
    return getDistanceByPoints( x, y, pos.x, pos.y );
  } );
  return _getBezierPoint( bezier_3points, t );
}
