// for SVG
//   PDF出力（draw_pdf_functions.js）と同じ呼び出し方でSVG文字列を組み立てる
//   座標系はCanvasと同じ（左上原点、Y軸は下向き）

// 文字のベースライン位置（フォントサイズに対する上端からの比率）
//   Canvasは textBaseline = "top" で描画しているため、SVGではベースラインをずらして上端を揃える
var SVG_TEXT_ASCENT_RATE = 0.88;

// SVGで利用するフォント（フォントは埋め込まないので、閲覧環境にあるフォントへフォールバックする）
var SVG_FONT_FAMILY = "ipag, 'IPAGothic', 'IPAゴシック', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', Meiryo, sans-serif";

//--------------------------------------
// SVGの初期化
//--------------------------------------
function initializeSvgContext( width, height, background_color ){
  var context = {
    width:      width || 1200,
    height:     height || 848,
    elements:   [],
    defs:       [],
    clip_count: 0,
    params:     {
      opacity:  1.0,
      line:     {
        border_width: 1,
        dash_array: [],
      }
    }
  };
  // 背景
  if ( background_color ) {
    context.elements.push( `<rect x="0" y="0" width="${ context.width }" height="${ context.height }" fill="${ background_color }"/>` );
  }
  return context;
}

//--------------------------------------
// SVGを生成（文字列で取得）
//--------------------------------------
function saveSvgAsString( context ){
  var svg = [];
  svg.push( '<?xml version="1.0" encoding="UTF-8"?>' );
  svg.push( `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${ context.width }" height="${ context.height }" viewBox="0 0 ${ context.width } ${ context.height }">` );
  if ( 0 < context.defs.length ) {
    svg.push( "<defs>" );
    svg.push( context.defs.join("\n") );
    svg.push( "</defs>" );
  }
  svg.push( context.elements.join("\n") );
  svg.push( "</svg>" );
  return svg.join("\n");
}

//--------------------------------------
// SVGを生成（Blobで取得）
//--------------------------------------
function saveSvgAsBlob( context ){
  return new Blob( [ saveSvgAsString( context ) ], { type: "image/svg+xml" } );
}

//--------------------------------------
// SVGのクリッピング処理
//--------------------------------------
function clipSvgRect( context, x, y, width, height, draw_func ){
  var clip_id = `clip${ context.clip_count++ }`;
  context.defs.push( `<clipPath id="${ clip_id }"><rect x="${ x }" y="${ y }" width="${ Math.max( 0, width ) }" height="${ Math.max( 0, height ) }"/></clipPath>` );

  // クリップ内の描画要素を集めるためにコンテキストを差し替える
  var parent_elements = context.elements;
  context.elements = [];
  draw_func( context );
  var clipped_elements = context.elements;
  context.elements = parent_elements;

  context.elements.push( `<g clip-path="url(#${ clip_id })">` );
  context.elements.push( ...clipped_elements );
  context.elements.push( "</g>" );
}

//--------------------------------------
// SVGの色情報の取得（r, g, b は 0〜1）
//--------------------------------------
function getSvgColor( context, r, g, b ){
  return `rgb(${ Math.round( r * 255 ) },${ Math.round( g * 255 ) },${ Math.round( b * 255 ) })`;
}

//--------------------------------------
// 透明度を設定（0〜1）
//--------------------------------------
function setSvgAlpha( context, alpha ){
  context.params.opacity = alpha;
}

//--------------------------------------
// 線の太さを設定する
//--------------------------------------
function setSvgLineWidth( context, border_width ){
  context.params.line.border_width = border_width;
}

//--------------------------------------
// 線の描画方法を指定する
//   [] : 空配列 = 実線（デフォルト）
//   [ number1, number2 ] = number1 : 実線の長さ, number2 : 空白の長さ
//--------------------------------------
function setSvgLineDash( context, array ){
  context.params.line.dash_array = array;
}

//--------------------------------------
// 線分描画
//--------------------------------------
function drawSvgLine( context, x1, y1, x2, y2, color ){
  context.elements.push( `<line x1="${ x1 }" y1="${ y1 }" x2="${ x2 }" y2="${ y2 }"${ _getSvgStrokeAttributes( context, color ) }/>` );
}

//--------------------------------------
// 複数の線を描画する
//   points : [ {x:0,y:0}, ... ]
//--------------------------------------
function drawSvgLines( context, points, color ){
  if ( 0 == points.length ) return;

  var path = [];
  for ( var i=0, length=points.length; i<length; i=(i+1)|0 ) {
    path.push( `${ 0 == i ? "M" : "L" } ${ points[i].x },${ points[i].y }` );
  }
  context.elements.push( `<path d="${ path.join(" ") }" fill="none"${ _getSvgStrokeAttributes( context, color ) }/>` );
}

//--------------------------------------
// ペジェ曲線を描画する
//   points : [ {x:0,y:0}, ... ]
//--------------------------------------
function drawSvgBezier( context, points, color, is_horizontal ){
  if ( 0 == points.length ) return;

  var path = [ `M ${ points[0].x },${ points[0].y }` ];
  for ( var i=1, length=points.length; i<length; i=(i+1)|0 ) {
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
    path.push( `Q ${ cx },${ cy } ${ points[i].x },${ points[i].y }` );
  }
  context.elements.push( `<path d="${ path.join(" ") }" fill="none"${ _getSvgStrokeAttributes( context, color ) }/>` );
}

//--------------------------------------
// 矩形描画
//--------------------------------------
function drawSvgRect( context, x, y, width, height, color, is_fill_rect ){
  context.elements.push( `<rect x="${ x }" y="${ y }" width="${ Math.max( 0, width ) }" height="${ Math.max( 0, height ) }"${ _getSvgShapeAttributes( context, color, is_fill_rect ) }/>` );
}

//--------------------------------------
// 三角形の描画
//--------------------------------------
function drawSvgTriangle( context, x1, y1, x2, y2, x3, y3, color, is_fill_rect ){
  var polygon = [
    {x: x1, y: y1},
    {x: x2, y: y2},
    {x: x3, y: y3},
  ]
  drawSvgPolygon( context, polygon, color, is_fill_rect );
}

//--------------------------------------
// 多角形描画
//   polygon : [ {x:0,y:0}, ... ]
//--------------------------------------
function drawSvgPolygon( context, polygon, color, is_fill_rect ){
  if ( 2 >= polygon.length ) return;

  var points = [];
  for ( var i=0, length=polygon.length; i<length; i=(i+1)|0 ) {
    points.push( `${ polygon[i].x },${ polygon[i].y }` );
  }
  context.elements.push( `<polygon points="${ points.join(" ") }"${ _getSvgShapeAttributes( context, color, is_fill_rect ) }/>` );
}

//--------------------------------------
// 円描画
//--------------------------------------
function drawSvgCircle( context, x, y, radius, color, is_fill_rect ){
  context.elements.push( `<circle cx="${ x }" cy="${ y }" r="${ Math.abs( radius ) }"${ _getSvgShapeAttributes( context, color, is_fill_rect ) }/>` );
}

//--------------------------------------
// 楕円描画（radius_x == radius_y なら真円）
//--------------------------------------
function drawSvgEllipse( context, x, y, radius_x, radius_y, color, is_fill_rect ){
  context.elements.push( `<ellipse cx="${ x }" cy="${ y }" rx="${ Math.abs( radius_x ) }" ry="${ Math.abs( radius_y ) }"${ _getSvgShapeAttributes( context, color, is_fill_rect ) }/>` );
}

//--------------------------------------
// 文字列を描画（x, y は文字の左上）
//--------------------------------------
function drawSvgText( context, text, x, y, color, font_size ){
  if ( ! text || "string" != typeof text || 0 == text.length ) return;

  var baseline_y = y + Math.round( font_size * SVG_TEXT_ASCENT_RATE );
  context.elements.push( `<text x="${ x }" y="${ baseline_y }"${ _getSvgTextAttributes( context, color, font_size ) }>${ _escapeSvgText( text ) }</text>` );
}

//--------------------------------------
// 文字列を縦に描画（下から上へ。x, y は文字列の左上）
//--------------------------------------
function drawSvgVerticalText( context, text, x, y, color, font_size ){
  if ( ! text || "string" != typeof text || 0 == text.length ) return;

  var text_width = getTextWidth( text, font_size );
  var baseline_x = x + Math.round( font_size * SVG_TEXT_ASCENT_RATE );
  context.elements.push( `<text transform="translate(${ baseline_x },${ y + text_width }) rotate(-90)"${ _getSvgTextAttributes( context, color, font_size ) }>${ _escapeSvgText( text ) }</text>` );
}

//--------------------------------------
// data-url形式の画像を指定サイズで描画
//--------------------------------------
function drawSvgImageDataUrl( context, data_url, x, y, width, height ){
  if ( "string" != typeof data_url || ! data_url.match( /^data:image\/[0-9a-z.+-]+[;,]/i ) ) return;

  var href = _escapeSvgText( data_url );
  var opacity = ( 1 > context.params.opacity ? ` opacity="${ context.params.opacity }"` : "" );
  context.elements.push( `<image x="${ x }" y="${ y }" width="${ width }" height="${ height }" preserveAspectRatio="none" href="${ href }" xlink:href="${ href }"${ opacity }/>` );
}

/*------------------------------------------------------------------------------
  Private functions
------------------------------------------------------------------------------*/

//--------------------------------------
// 線の属性文字列を取得する
//--------------------------------------
function _getSvgStrokeAttributes( context, color ){
  var attributes = ` stroke="${ color }" stroke-width="${ context.params.line.border_width }"`;
  if ( context.params.line.dash_array && 0 < context.params.line.dash_array.length ) {
    attributes += ` stroke-dasharray="${ context.params.line.dash_array.join(" ") }"`;
  }
  if ( 1 > context.params.opacity ) {
    attributes += ` stroke-opacity="${ context.params.opacity }"`;
  }
  return attributes;
}

//--------------------------------------
// 図形の属性文字列を取得する（塗りつぶし or 枠線）
//--------------------------------------
function _getSvgShapeAttributes( context, color, is_fill_rect ){
  if ( is_fill_rect ) {
    var attributes = ` fill="${ color }" stroke="none"`;
    if ( 1 > context.params.opacity ) {
      attributes += ` fill-opacity="${ context.params.opacity }"`;
    }
    return attributes;
  }
  return ` fill="none"${ _getSvgStrokeAttributes( context, color ) }`;
}

//--------------------------------------
// 文字の属性文字列を取得する
//--------------------------------------
function _getSvgTextAttributes( context, color, font_size ){
  var attributes = ` font-family="${ SVG_FONT_FAMILY }" font-size="${ font_size }" fill="${ color }" xml:space="preserve" style="white-space:pre"`;
  if ( 1 > context.params.opacity ) {
    attributes += ` fill-opacity="${ context.params.opacity }"`;
  }
  return attributes;
}

//--------------------------------------
// XMLの特殊文字をエスケープする（XMLで利用できない制御文字は除去する）
//--------------------------------------
function _escapeSvgText( text ){
  return text
    .replace( /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "" )
    .replace( /&/g, "&amp;" )
    .replace( /</g, "&lt;" )
    .replace( />/g, "&gt;" )
    .replace( /"/g, "&quot;" )
    .replace( /'/g, "&apos;" );
}
