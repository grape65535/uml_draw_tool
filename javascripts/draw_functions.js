// Math.PI を使うとMath.sinやcosなどで小数点の精度の問題で1以上の値が返る場合があるため使用しない
//（例：90度の時のcosが6.1232339957366e-17）
const RADIAN = ( 3.14159 / 180 );
var default_canvas = createCanvas();
var default_context = getContext( default_canvas, 0, 0 );

//--------------------------------------
// キャンバスの生成
//--------------------------------------
function createCanvas(){
  return document.createElement('canvas');
}

//--------------------------------------
// コンテキストの取得
//--------------------------------------
function getContext( canvas, screen_width, screen_height ){
  canvas.width = screen_width;
  canvas.height = screen_height;
  var context = canvas.getContext('2d');
  initializeContext( context, screen_width, screen_height );
  return context;
}

//--------------------------------------
// コンテキストの初期化
//--------------------------------------
function initializeContext( context, resolution_width, resolution_height ){
  // 合成処理の種別
  context.globalCompositeOperation = 'source-over';
  // 透明度
  context.globalAlpha = 1.0;
  // クリッピング領域
  context.beginPath();
  context.rect( 0, 0, resolution_width, resolution_height );
  context.clip();
  // 色
  context.strokeStyle = "rgb(0,0,0)";
  context.fillStyle = "rgb(255,255,255)";
  // テキスト
  context.font = '16px "ipag"';  // default serif
  context.textAlign = "start";
  context.textBaseline = "top";
  // その他
  context.lineWidth = 1;
  context.shadowBlur = 0;
  // 保存
  context.save();
}

//--------------------------------------
// クリッピング処理
//--------------------------------------
function clipRect( context, x, y, width, height, draw_func ){      

  // クリッピング前の状態を記憶
  context.save();
  
  // クリッピング
  context.beginPath();
  context.rect( x, y, width, height );
  context.closePath();
  context.clip();
  
  // クリッピング内で描画したい内容の実装をコールバック
  draw_func( context );

  // クリッピング前に戻す
  context.restore();
}

//--------------------------------------
// ブロック渡しの関数による任意形状のクリッピング
//--------------------------------------
function clipShape( context, clip_func, draw_func ){

  // クリッピング前の状態を記憶
  context.save();

  context.beginPath();
  clip_func( context );
  context.closePath();
  context.clip();

  // クリッピング内で描画したい内容の実装をコールバック
  draw_func( context );
  
  // クリッピング前に戻す
  context.restore();
}

//--------------------------------------
// 指定多角形によるクリッピング
//   polygon : [ {x:0,y:0}, {x:0,y:0}, ... ]
//--------------------------------------
function clipPloygon( context, polygon, draw_func, is_clip ){
  if ( "boolean" != typeof is_clip ) is_clip = true;

  // クリッピング前の状態を記憶
  context.save();

  if ( is_clip ) {
    context.beginPath();
    context.moveTo( Math.floor( polygon[0].x ), Math.floor( polygon[0].y ) ); 
    for ( var i=1, polygon_length=polygon.length; i<polygon_length; i=(i+1)|0 ) {
      context.lineTo( Math.floor( polygon[i].x ), Math.floor( polygon[i].y ) );
    }
    context.closePath();
    context.clip();
  }

  // クリッピング内で描画したい内容の実装をコールバック
  draw_func( context );
  
  // クリッピング前に戻す
  context.restore();
}

//--------------------------------------
// 画面消去
//--------------------------------------
function clear( context, width, height ){
  context.clearRect( 0, 0, width, height );
}

//--------------------------------------
// 透明度を設定（0〜1）
//--------------------------------------
function setAlpha( context, alpha ){
  context.globalAlpha = alpha;
}

//--------------------------------------
// 線の太さを設定する
//--------------------------------------
function setLineWidth( context, line_width ){
  context.lineWidth = line_width;
}

//--------------------------------------
// 線の描画方法を指定する
//   [] : 空配列 = 実線（デフォルト）
//   [ number1, number2 ] = number1 : 実線の長さ, number2 : 空白の長さ
//--------------------------------------
function setLineDash( context, array ){
  context.setLineDash( array );
}

//--------------------------------------
// 線分描画
//--------------------------------------
function drawLine( context, x1, y1, x2, y2, color ){
  x1 = Math.floor( x1 );
  y1 = Math.floor( y1 );
  x2 = Math.floor( x2 );
  y2 = Math.floor( y2 );
  var backup_strokeStyle  = context.strokeStyle;
  if ( color ) {
    context.strokeStyle = color;
  }

  context.beginPath();
  context.moveTo( x1, y1 );
  context.lineTo( x2, y2 );
  context.closePath();

  context.stroke();

  context.strokeStyle = backup_strokeStyle;
}

//--------------------------------------
// 複数の線を描画
//   points : [ {x:0,y:0}, ... ]
//--------------------------------------
function drawLines( context, points, color ){
  if ( 0 == points.length ) return;

  var backup_strokeStyle  = context.strokeStyle;
  if ( color ) {
    context.strokeStyle = color;
  }

  context.beginPath();
  context.moveTo( Math.floor( points[0].x ), Math.floor( points[0].y ) ); 
  for ( var i=1; i<points.length; i++ ) {
    context.lineTo( Math.floor( points[i].x ), Math.floor( points[i].y ) );
  }
  context.stroke();

  context.strokeStyle = backup_strokeStyle;
}

//--------------------------------------
// ペジェ曲線を描画する
//   points : [ {x:0,y:0}, ... ]
//--------------------------------------
function drawBezier( context, points, color, is_horizontal ){
  if ( 0 == points.length ) return;
  
  var backup_strokeStyle  = context.strokeStyle;
  if ( color ) {
    context.strokeStyle = color;
  }

  // 座標nと、座標n+1の間の制御点は、横座標優先ならば（ X(n+1), Y(n) ）とし、縦優先ならば（　X(n), Y(n+1)　）で決定する
  is_horizontal = ( is_horizontal ? true : false );

  context.beginPath();
  context.moveTo( Math.floor( points[0].x ), Math.floor( points[0].y ) ); 
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
    context.quadraticCurveTo( Math.floor( cx ), Math.floor( cy ), Math.floor( points[i].x ), Math.floor( points[i].y ) );
  }
  context.stroke();

  context.strokeStyle = backup_strokeStyle;
}

//--------------------------------------
// 矩形描画
//--------------------------------------
function drawRect( context, x, y, width, height, color, is_fill_rect ){
  x = Math.floor( x );
  y = Math.floor( y );
  var backup_fillStyle    = context.fillStyle;
  var backup_strokeStyle  = context.strokeStyle;
  if ( color ) {
    context.fillStyle = color;
    context.strokeStyle = color;
  }

  if ( is_fill_rect ) {
    context.fillRect( x, y, width, height );
  }
  else {
    context.strokeRect( x, y, width, height );
  }
  
  context.fillStyle = backup_fillStyle;
  context.strokeStyle = backup_strokeStyle;
}

//--------------------------------------
// 三角形の描画
//--------------------------------------
function drawTriangle( context, x1, y1, x2, y2, x3, y3, color, is_fill_rect ){
  x1 = Math.floor( x1 );
  y1 = Math.floor( y1 );
  x2 = Math.floor( x2 );
  y2 = Math.floor( y2 );
  x3 = Math.floor( x3 );
  y3 = Math.floor( y3 );
  var backup_fillStyle    = context.fillStyle;
  var backup_strokeStyle  = context.strokeStyle;
  if ( color ) {
    context.fillStyle = color;
    context.strokeStyle = color;
  }

  context.beginPath();
  context.moveTo( x1, y1 );
  context.lineTo( x2, y2 );
  context.lineTo( x3, y3 );
  context.closePath();

  if ( is_fill_rect ) {
    context.fill();
  }
  else {
    context.stroke();
  }
  
  context.fillStyle = backup_fillStyle;
  context.strokeStyle = backup_strokeStyle;
}

//--------------------------------------
// 矩形描画
//   polygon : [ {x:0,y:0}, ... ]
//--------------------------------------
function drawPolygon( context, polygon, color, is_fill_rect ){
  var backup_fillStyle    = context.fillStyle;
  var backup_strokeStyle  = context.strokeStyle;
  if ( color ) {
    context.fillStyle = color;
    context.strokeStyle = color;
  }

  context.beginPath();
  context.moveTo( Math.floor( polygon[0].x ), Math.floor( polygon[0].y ) ); 
  for ( var i=1, polygon_length=polygon.length; i<polygon_length; i=(i+1)|0 ) {
    context.lineTo( Math.floor( polygon[i].x ), Math.floor( polygon[i].y ) );
  }
  context.closePath();

  if ( is_fill_rect ) {
    context.fill();
  }
  else {
    context.stroke();
  }

  context.fillStyle = backup_fillStyle;
  context.strokeStyle = backup_strokeStyle;
}

//--------------------------------------
// 円描画
//--------------------------------------
function drawCircle( context, x, y, radius, color, is_fill_rect ){
  x = Math.floor( x );
  y = Math.floor( y );
  var backup_fillStyle    = context.fillStyle;
  var backup_strokeStyle  = context.strokeStyle;
  if ( color ) {
    context.fillStyle = color;
    context.strokeStyle = color;
  }

  context.beginPath();
  context.arc( x, y, radius, 0 * RADIAN, 360 * RADIAN, false ) ;
  context.closePath();

  if ( is_fill_rect ) {
    context.fill();
  }
  else {
    context.stroke();
  }
  
  context.fillStyle = backup_fillStyle;
  context.strokeStyle = backup_strokeStyle;
}

//--------------------------------------
// ブロック渡しの関数による任意形状の描画
//--------------------------------------
function drawShape( context, draw_func, color, is_fill_rect ){
  var backup_fillStyle    = context.fillStyle;
  var backup_strokeStyle  = context.strokeStyle;
  if ( color ) {
    context.fillStyle = color;
    context.strokeStyle = color;
  }

  context.beginPath();
  draw_func( context );
  context.closePath();

  if ( is_fill_rect ) {
    context.fill();
  }
  else {
    context.stroke();
  }
  
  context.fillStyle = backup_fillStyle;
  context.strokeStyle = backup_strokeStyle;
}

//--------------------------------------
// 文字描画
//--------------------------------------
function drawText( context, text, x, y, color, size, is_fill_rect ){
  x = Math.floor( x );
  y = Math.floor( y );
  var backup_fillStyle    = context.fillStyle;
  var backup_strokeStyle  = context.strokeStyle;
  var backup_font         = context.font;

  context.fillStyle = color;
  context.strokeStyle = color;
  context.font = size.toString() + "px 'ipag'";

  if ( is_fill_rect ) {
    context.fillText( text, x, y );
  }
  else {
    context.strokeText( text, x, y );
  }
  
  context.fillStyle = backup_fillStyle;
  context.strokeStyle = backup_strokeStyle;
  context.font = backup_font;
}

//--------------------------------------
// ふちどり文字描画
//--------------------------------------
function drawTextStroke( context, text, x, y, stroke_color, text_color, size, stroke_width ){
  x = Math.floor( x );
  y = Math.floor( y );
  var backup_fillStyle    = context.fillStyle;
  var backup_strokeStyle  = context.strokeStyle;
  var backup_font         = context.font;
  var backup_lineWidth   = context.lineWidth;

  context.fillStyle = text_color;
  context.strokeStyle = stroke_color;
  context.font = size.toString() + 'px "ipag"';

  setLineWidth( context, stroke_width );
  context.strokeText( text, x, y );
  setLineWidth( context, 0 );
  context.fillText( text, x, y );
  
  context.fillStyle = backup_fillStyle;
  context.strokeStyle = backup_strokeStyle;
  context.font = backup_font;
  setLineWidth( context, backup_lineWidth );
}

//--------------------------------------
// 文字列を縦に描画
//--------------------------------------
function drawVerticalText( context, text, x, y, color, font_size, is_fill_rect ){
  context.save();
  context.beginPath ();

  context.translate( x, y ) ;
  context.rotate( -90 * RADIAN );
  context.translate( -getTextWidth( text, font_size ), 0 ) ;
  drawText( context, text, 0, 0, color, font_size, is_fill_rect );

  context.restore();
}

//--------------------------------------
// 文字サイズの取得
//--------------------------------------
function getTextWidth( text, font_size ){
  var backup_font = default_context.font;
  default_context.font = font_size.toString() + 'px "ipag"';

  var width = default_context.measureText( text );
  default_context.font = backup_font;

  return Math.ceil( width.width + ( font_size / 2 ) );
}

//--------------------------------------
// キャンバスや画像要素の描画
//--------------------------------------
function drawCanvas( context, canvas, x, y ){
  context.drawImage( canvas, 0, 0 );
}

//--------------------------------------
// 画像描画
//--------------------------------------
function drawImage( context, image_context, x, y, scale ){
  scale = ( 'number' == typeof scale ? scale : 1 );
  x = Math.floor( x );
  y = Math.floor( y );
  if ( ! image_context || null == image_context.element ) return;
  if ( image_context.trim.is_divided ) {
    context.drawImage( image_context.element, image_context.trim.offset_x, image_context.trim.offset_y, image_context.trim.width, image_context.trim.height, x, y, image_context.trim.width * scale, image_context.trim.height * scale );
  }
  else {
    if ( 1 ==  scale ) {
      context.drawImage( image_context.element, x, y );
    }
    else {
      context.drawImage( image_context.element, 0, 0, image_context.trim.width, image_context.trim.height, x, y, image_context.trim.width * scale, image_context.trim.height * scale );
    }
  }
}

//--------------------------------------
// 画像の縮尺描画
//--------------------------------------
function drawScaleImage( context, image_context, x, y, width, height ){
  if ( ! image_context || null == image_context.element ) return;
  if ( image_context.trim.is_divided ) {
    context.drawImage( image_context.element, image_context.trim.offset_x, image_context.trim.offset_y, image_context.trim.width, image_context.trim.height, x, y, width, height );
  }
  else {
    context.drawImage( image_context.element, 0, 0, image_context.trim.width, image_context.trim.height, x, y, width, height );
  }
}

//--------------------------------------
// 画像の反転描画
//--------------------------------------
function drawTurnScaleImage( context, image_context, x, y, width, height, is_turn_horizontal, is_turn_vertical ){
  if ( "boolean" != typeof is_turn_horizontal ) is_turn_horizontal = true;
  if ( "boolean" != typeof is_turn_vertical ) is_turn_vertical = false;

  // コンテキストの状態を保存
  context.save();

  // 描画位置に移動
  context.translate( x, y );
  context.transform( ( is_turn_horizontal ? -1 : 1 ), 0, 0, ( is_turn_vertical ? -1 : 1 ), ( is_turn_horizontal ? width : 0 ), ( is_turn_vertical ? height : 0 ) );
  // 描画
  drawScaleImage( context, image_context, 0, 0, width, height );

  // コンテキストの状態を復元
  context.restore();
}

//--------------------------------------
// 画像を傾けて描画
//--------------------------------------
function drawTiltImage( context, image_context, x, y, width, height, vertical_tilt_rate, horizontal_tilt_rate ){
  vertical_tilt_rate = vertical_tilt_rate || 0,
  horizontal_tilt_rate = horizontal_tilt_rate || 0,

  // コンテキストの状態を保存
  context.save();

  // 描画位置に移動
  context.translate( x, y );
  // 傾斜率を設定（第二引数：垂直方向の傾斜率、第三引数：水平方向の傾斜率）
  context.transform( 1, vertical_tilt_rate, horizontal_tilt_rate, 1, 0, 0 );
  // 画像描画
  drawScaleImage( context, image_context, 0, 0, width, height )

  // コンテキストの状態を復元
  context.restore();
}

//--------------------------------------
// 画像を回転して描画
//--------------------------------------
function drawRotateImage( context, image_context, x, y, width, height, rotate_radian, center_offset_x, center_offset_y ){
  rotate_radian = rotate_radian || 0;
  center_offset_x = center_offset_x || 0;
  center_offset_y = center_offset_y || 0;

  // コンテキストの状態を保存
  context.save();

  context.translate( x, y );
  context.rotate( rotate_radian );

  // 画像描画
  drawScaleImage( context, image_context, -center_offset_x, -center_offset_y, width, height )

  // コンテキストの状態を復元
  context.restore();
}

//--------------------------------------
// 画像の反転・拡大・回転描画
//--------------------------------------
function drawTurnScaleRotateImage( context, image_context, x, y, width, height, rotate_radian, center_offset_x, center_offset_y, is_turn_horizontal, is_turn_vertical ){
  rotate_radian = rotate_radian || 0;
  center_offset_x = center_offset_x || 0;
  center_offset_y = center_offset_y || 0;
  if ( "boolean" != typeof is_turn_horizontal ) is_turn_horizontal = false;
  if ( "boolean" != typeof is_turn_vertical ) is_turn_vertical = false;

  // コンテキストの状態を保存
  context.save();

  // 描画位置に移動
  context.translate( x, y );
  context.rotate( rotate_radian );
  context.transform(
    ( is_turn_horizontal ? -1 : 1 ),                      // 水平伸縮率
    0,                                                    // 垂直傾斜率
    0,                                                    // 水平傾斜率
    ( is_turn_vertical ? -1 : 1 ),                        // 垂直侵食率
    ( is_turn_horizontal ? width : 0 ) - center_offset_x, // 水平移動量
    ( is_turn_vertical ? height : 0 ) - center_offset_y   // 垂直移動量
  );

  // 描画
  drawScaleImage( context, image_context, 0, 0, width, height );

  // コンテキストの状態を復元
  context.restore();
}

//--------------------------------------
// 画像を擬似3次元でY軸回転して描画
//--------------------------------------
function draw3DYAxisRotateImage( context, image_context, x, y, width, height, y_angle_radian, center_offset_x, center_offset_y ){
  // 角度を垂直傾斜率に変換（角度を傾きに変換する）
  y_angle_radian = y_angle_radian || 0;
  var vertical_tilt_rate = Math.tan( y_angle_radian );
  // 角度から水平伸縮率に変換（角度0の時の伸縮率を1とした時、90度で伸縮率を0とする）
  var horisontal_scale = Math.cos( y_angle_radian );
  // 回転の中心位置のオフセットX座標
  center_offset_x = center_offset_x || 0;
  center_offset_y = center_offset_y || 0;
  var offset_x = center_offset_x - Math.cos( y_angle_radian ) * center_offset_x;
  var offset_y = center_offset_x - Math.sin( y_angle_radian ) * center_offset_x;

  // コンテキストの状態を保存
  context.save();

  // 描画位置に移動
  context.translate( x - center_offset_x, y - center_offset_x );
  // 傾斜率を設定（第二引数：垂直方向の傾斜率、第三引数：水平方向の傾斜率）
  context.transform( 1, vertical_tilt_rate, 0, 1, offset_x, offset_y );
  // 画像描画
  drawScaleImage( context, image_context, 0, -center_offset_y, Math.round( width * horisontal_scale ), height )

  // コンテキストの状態を復元
  context.restore();
}

//--------------------------------------
// 画像を擬似3次元でZ軸回転して描画
//--------------------------------------
function draw3DZAxisRotateImage( context, image_context, x, y, width, height, z_angle_radian, center_offset_x, center_offset_y ){
  // 角度を垂直傾斜率に変換（角度を傾きに変換する）
  z_angle_radian = z_angle_radian || 0;
  var horizontal_tilt_rate = Math.tan( z_angle_radian );
  // 角度から水平伸縮率に変換（角度0の時の伸縮率を1とした時、90度で伸縮率を0とする）
  var vertical_scale = Math.cos( z_angle_radian );
  // 回転の中心位置のオフセットX座標
  center_offset_y = center_offset_y || 0;
  center_offset_x = center_offset_x || 0;
  var offset_x = center_offset_y - Math.sin( z_angle_radian ) * center_offset_y;
  var offset_y = center_offset_y - Math.cos( z_angle_radian ) * center_offset_y;

  // コンテキストの状態を保存
  context.save();

  // 描画位置に移動
  context.translate( x - center_offset_y, y - center_offset_y );
  // 傾斜率を設定（第二引数：垂直方向の傾斜率、第三引数：水平方向の傾斜率）
  context.transform( 1, 0, horizontal_tilt_rate, 1, offset_x, offset_y );
  // 画像描画
  drawScaleImage( context, image_context, -center_offset_x, 0, width, Math.round( height * vertical_scale ) )

  // コンテキストの状態を復元
  context.restore();
}

//--------------------------------------
// 画像を自由変形で描画する
//   quad_polygon : [ {x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0} ]
//     画像の表示領域を4つの座標で、右回りに指定する。
//     最初の座標が、画像の左上と対応する様に変形描画される
//--------------------------------------
function drawTransformationImage( context, image_context, quad_polygon ){
  
  var clip_polygon = [
    [ { x:quad_polygon[0].x, y:quad_polygon[0].y }, { x:quad_polygon[1].x, y:quad_polygon[1].y }, { x:quad_polygon[2].x, y:quad_polygon[2].y } ],
    [ { x:quad_polygon[0].x, y:quad_polygon[0].y }, { x:quad_polygon[3].x, y:quad_polygon[3].y }, { x:quad_polygon[2].x, y:quad_polygon[2].y } ],
  ];

  clipPloygon( context, clip_polygon[0], function(){
    // コンテキストの状態を保存
    context.save();

    var dx = quad_polygon[0].x;
    var dy = quad_polygon[0].y;
    var sx = ( quad_polygon[1].x - quad_polygon[0].x ) / image_context.trim.width;    // 水平の伸縮率
    var sy = ( quad_polygon[2].y - quad_polygon[1].y ) / image_context.trim.height;   // 垂直の伸縮率
    var rx = ( quad_polygon[1].y - quad_polygon[0].y ) / image_context.trim.width;    // 垂直傾斜率
    var ry = ( quad_polygon[2].x - quad_polygon[1].x ) / image_context.trim.height;   // 水平傾斜率

    context.setTransform( sx, rx, ry, sy, dx, dy );
    drawScaleImage( context, image_context, 0, 0, image_context.trim.width, image_context.trim.height );

    // コンテキストの状態を復元
    context.restore();
  });

  clipPloygon( context, clip_polygon[1], function(){
    // コンテキストの状態を保存
    context.save();

    var dx = quad_polygon[0].x;
    var dy = quad_polygon[0].y;
    var sx = ( quad_polygon[2].x - quad_polygon[3].x ) / image_context.trim.width;  // 水平の伸縮率
    var sy = ( quad_polygon[3].y - quad_polygon[0].y ) / image_context.trim.height; // 垂直の伸縮率
    var rx = ( quad_polygon[2].y - quad_polygon[3].y ) / image_context.trim.width;  // 垂直傾斜率
    var ry = ( quad_polygon[3].x - quad_polygon[0].x ) / image_context.trim.height; // 水平傾斜率

    context.setTransform( sx, rx, ry, sy, dx, dy );
    drawScaleImage( context, image_context, 0, 0, image_context.trim.width, image_context.trim.height );

    // コンテキストの状態を復元
    context.restore();
  });
}

//--------------------------------------
// 画像を自由変形で描画する（四分割板）
//   quad_polygon : [ {x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0} ]
//     画像の表示領域を4つの座標で、右回りに指定する。
//     最初の座標が、画像の左上と対応する様に変形描画される
//--------------------------------------
function drawTransformationImageBy4Divide( context, image_context, quad_polygon ){
  // 距離を計算する
  function _getDistanceByPoints( x1, y1, x2, y2 ){
    var w = (x2- x1);
    var h = (y2 - y1);
    return Math.sqrt( w*w + h*h );
  }
  // 角度を計算する
  function _getRadianByPoints( x1, y1, x2, y2 ){
    return Math.atan2( y2 - y1, x2 - x1 );
  }
  // 角度から傾斜率に変換する
  function _getTiltByRadian( radian ){
    return Math.tan( radian );
  }
  
  // 指定の四角形の中心点を計算し、その中心点から四角形を4つの三角形に分割する
  var center_pos = {
    x: Math.round( ( quad_polygon[0].x + quad_polygon[1].x + quad_polygon[2].x + quad_polygon[3].x ) / 4 ),
    y: Math.round( ( quad_polygon[0].y + quad_polygon[1].y + quad_polygon[2].y + quad_polygon[3].y ) / 4 ),
  };
  var edge_size = [
    _getDistanceByPoints( quad_polygon[0].x, quad_polygon[0].y, quad_polygon[1].x, quad_polygon[1].y ),
    _getDistanceByPoints( quad_polygon[1].x, quad_polygon[1].y, quad_polygon[2].x, quad_polygon[2].y ),
    _getDistanceByPoints( quad_polygon[2].x, quad_polygon[2].y, quad_polygon[3].x, quad_polygon[3].y ),
    _getDistanceByPoints( quad_polygon[3].x, quad_polygon[3].y, quad_polygon[0].x, quad_polygon[0].y )
  ];
  var edge_center = [
    { x: Math.round( ( quad_polygon[0].x + quad_polygon[1].x ) / 2 ), y: Math.round( ( quad_polygon[0].y + quad_polygon[1].y ) / 2 ) },
    { x: Math.round( ( quad_polygon[1].x + quad_polygon[2].x ) / 2 ), y: Math.round( ( quad_polygon[1].y + quad_polygon[2].y ) / 2 ) },
    { x: Math.round( ( quad_polygon[2].x + quad_polygon[3].x ) / 2 ), y: Math.round( ( quad_polygon[2].y + quad_polygon[3].y ) / 2 ) },
    { x: Math.round( ( quad_polygon[3].x + quad_polygon[0].x ) / 2 ), y: Math.round( ( quad_polygon[3].y + quad_polygon[0].y ) / 2 ) }
  ];
  var edge_raidan = [
    _getRadianByPoints( quad_polygon[0].x, quad_polygon[0].y, quad_polygon[1].x, quad_polygon[1].y ),
    _getRadianByPoints( quad_polygon[1].x, quad_polygon[1].y, quad_polygon[2].x, quad_polygon[2].y ),
    _getRadianByPoints( quad_polygon[2].x, quad_polygon[2].y, quad_polygon[3].x, quad_polygon[3].y ),
    _getRadianByPoints( quad_polygon[3].x, quad_polygon[3].y, quad_polygon[0].x, quad_polygon[0].y ),
  ];
  var center_radian = [
    (                    edge_raidan[0] ) + ( (  90 * RADIAN ) - _getRadianByPoints( edge_center[0].x, edge_center[0].y, center_pos.x, center_pos.y ) ),
    ( (  90 * RADIAN ) - edge_raidan[1] ) + ( ( 180 * RADIAN ) + _getRadianByPoints( edge_center[1].x, edge_center[1].y, center_pos.x, center_pos.y ) ),
    ( ( 180 * RADIAN ) + edge_raidan[2] ) - ( (  90 * RADIAN ) + _getRadianByPoints( edge_center[2].x, edge_center[2].y, center_pos.x, center_pos.y ) ),
    ( ( 270 * RADIAN ) - edge_raidan[3] ) + (                    _getRadianByPoints( edge_center[3].x, edge_center[3].y, center_pos.x, center_pos.y ) ),
  ];
  var polygons = [
    { // top
      points: [
        { x: quad_polygon[0].x, y: quad_polygon[0].y },
        { x: quad_polygon[1].x, y: quad_polygon[1].y },
        { x: center_pos.x,      y: center_pos.y + 1 }
      ],
      edge_width: edge_size[0],
      edge_height: _getDistanceByPoints( edge_center[0].x, edge_center[0].y, center_pos.x, center_pos.y ) * Math.cos( center_radian[0] ) * 2,
      edge_radian: edge_raidan[0],
      edge_v_tilt: 0,
      edge_h_tilt: _getTiltByRadian( center_radian[0] ),
      after_move: { x:0, y:0 }
    },
    { // right
      points: [
        { x: quad_polygon[1].x, y: quad_polygon[1].y },
        { x: quad_polygon[2].x, y: quad_polygon[2].y },
        { x: center_pos.x,      y: center_pos.y }
      ],
      edge_width: _getDistanceByPoints( edge_center[1].x, edge_center[1].y, center_pos.x, center_pos.y ) * Math.cos( center_radian[1] ) * 2,
      edge_height: edge_size[1],
      edge_radian: edge_raidan[1],
      edge_v_tilt: _getTiltByRadian( center_radian[1] ),
      edge_h_tilt: 0,
      after_move: { x:-_getDistanceByPoints( edge_center[1].x, edge_center[1].y, center_pos.x, center_pos.y ) * Math.cos( center_radian[1] ) * 2, y:0 }
    },
    { // bottom
      points: [
        { x: quad_polygon[2].x, y: quad_polygon[2].y },
        { x: quad_polygon[3].x, y: quad_polygon[3].y },
        { x: center_pos.x,      y: center_pos.y }
      ],
      edge_width: edge_size[2],
      edge_height: _getDistanceByPoints( edge_center[2].x, edge_center[2].y, center_pos.x, center_pos.y ) * Math.cos( center_radian[2] ) * 2,
      edge_radian: edge_raidan[2],
      edge_v_tilt: 0,
      edge_h_tilt: _getTiltByRadian( center_radian[2] ),
      after_move: { x:-edge_size[2], y:-_getDistanceByPoints( edge_center[2].x, edge_center[2].y, center_pos.x, center_pos.y ) * Math.cos( center_radian[2] ) * 2 }
    },
    { // left
      points: [
        { x: quad_polygon[3].x, y: quad_polygon[3].y },
        { x: quad_polygon[0].x, y: quad_polygon[0].y },
        { x: center_pos.x + 1,  y: center_pos.y }
      ],
      edge_width: _getDistanceByPoints( edge_center[3].x, edge_center[3].y, center_pos.x, center_pos.y ) * Math.cos( center_radian[3] ) * 2,
      edge_height: edge_size[3],
      edge_radian: edge_raidan[3],
      edge_v_tilt: _getTiltByRadian( center_radian[3] ),
      edge_h_tilt: 0,
      after_move: { x:0, y:-edge_size[3] }
    },
  ];

  // 上下左右の辺ごとに描画する
  for ( var i=0, polygons_length=polygons.length; i<polygons_length; i=(i+1)|0 ) {
    clipPloygon( context, polygons[i].points, function(){
      // コンテキストの状態を保存
      context.save();

      // 各辺を描画するにあたって、画像を一旦回転して描画する辺が上辺になる様にする
      context.translate( polygons[i].points[0].x, polygons[i].points[0].y );
      context.rotate( ( -90 * i ) * RADIAN );
      // 実際の各辺の方向に合わせて回転させる
      context.rotate( polygons[i].edge_radian );
      // 画像の中心がポリゴンの中心になる様に傾斜させる
      context.transform( 1, polygons[i].edge_v_tilt, polygons[i].edge_h_tilt, 1, 0, 0 );
      // 回転後の画像の左上が各開始点の位置になる様に位置を戻す
      context.translate( polygons[i].after_move.x, polygons[i].after_move.y );

      // 画像描画
      drawScaleImage( context, image_context, 0, 0, polygons[i].edge_width, polygons[i].edge_height );

      // コンテキストの状態を復元
      context.restore();
    } );
  } 
}

//--------------------------------------
// 画像描画
//--------------------------------------
function canvasColorToCssColor( canvas_color ){
  var rgb = canvas_color.replace( /[ \t]+/, "" ).replace( /(^rgb\(|\))/ig, "" ).split(",");
  for ( var i=0; i<rgb.length; i++ ) rgb[i] = parseInt( rgb[i] );
  return `#${ ( "00" + rgb[0].toString(16) ).slice(-2) }${ ( "00" + rgb[1].toString(16) ).slice(-2) }${ ( "00" + rgb[2].toString(16) ).slice(-2) }`;
}
