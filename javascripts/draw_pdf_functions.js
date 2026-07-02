// for PDF-LIB
//   PDF-LIB : https://pdf-lib.js.org/
//   fontkit : https://www.npmjs.com/package/@pdf-lib/fontkit

//--------------------------------------
// PDFの初期化
//--------------------------------------
function initializePdfContext( callback, font_url ){
  var font_url = font_url || null;

  PDFLib.PDFDocument.create().then( function( pdf_doc ){
    var context = { 
      original_context: null,
      pdf_doc:    pdf_doc,
      pages:      [],
      promise:    new Promise(function(resolve, reject){ resolve(); }),      
      offset:     { x:0, y:0 },
      params:     {
        opacity:  1.0,
        text:     {
          font:   null,
        },
        line:     {
          border_width: 1,
          dash_array: [],
        }
      }
    };
    context.pdf_doc.registerFontkit( window.fontkit );

    // フォント指定あり
    if ( "string" == typeof font_url ) {

      // フォント読込み
      _getAjaxFileAsArrayBuffer( context, font_url, function( font_buff ){
        // PDFにフォントを指定
        if ( font_buff ) {
          context.pdf_doc.embedFont( font_buff, { subset: true } ).then(function( font ){
            context.params.text.font = font;
            callback( context );
          } );  
        }
        // フォント取得できなかった時
        else {
          context.pdf_doc.embedFont( PDFLib.StandardFonts.Helvetica ).then(function( font ){
            context.params.text.font = font;
            callback( context );
          } ); 
        }
      } );
    }
    // フォント指定なし
    else {
      context.pdf_doc.embedFont( PDFLib.StandardFonts.Helvetica ).then(function( font ){
        context.params.text.font = font;
        callback( context );
      } ); 
    }
  } );
}

//--------------------------------------
// PDFにページ追加
//--------------------------------------
function addPdfPage( context, width, height ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){

    width = width || 1200;
    height = height || 848;
    page = context.pdf_doc.addPage( [ width, height ] );
    page.drawText(' ');
    context.pages.push( page );

    resolve();
  });
}



//--------------------------------------
// PDFを生成（ArrayBufferで取得）
//--------------------------------------
function savePdfAsArrayBuffer( context, callback ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){

    _removePdfClipPage( context );
    context.pdf_doc.save().then(function( pdfBytes ){
      callback( pdfBytes );
      resolve();
    } );
    context.promise = new Promise(function(resolve, reject){ resolve(); });
  });
}

//--------------------------------------
// PDFを生成（Blobで取得）
//--------------------------------------
function savePdfAsBlob( context, callback ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){

    _removePdfClipPage( context );
    context.pdf_doc.save( { useObjectStreams: true } ).then(function( pdfBytes ){
      var blob = new Blob( [ pdfBytes ], { type: "application/pdf" } ); // application/octet-binary か application/pdf
      callback( blob );
      resolve();
    } );
    context.promise = new Promise(function(resolve, reject){ resolve(); });
  });
}

//--------------------------------------
// PDFのクリッピング処理
//   CustomFontを利用している場合に、フォント情報の分だけpdfの出力ファイルサイズが大きくなるので注意
//--------------------------------------
function clipPdfRect( context, x, y, width, height, draw_func ){
  // クリップ用のページを生成する（PDF生成時のタイミングでまとめて削除される）
  var clip_page = context.pdf_doc.addPage( [ width, height ] );
  clip_page.drawText(' ');
  // クリップ用のページ描画のためにコンテキストを派生させる
  var clip_context = { 
    original_context: context,
    pdf_doc:    context.pdf_doc,
    pages:      [ clip_page ],
    promise:    null,
    offset:     { x:x, y:y },
    params:     context.params,
  };
  draw_func( clip_context );

  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( clip_context, function( resolve, reject ){

    // クリップ後のPDFを組込PDFとして元PDFに読込む
    clip_context.original_context.pdf_doc.embedPage( clip_page ).then(function( embed_page ){
      var embed_page_dims = embed_page.scale(1);

      var page = _getPdfPage( clip_context.original_context );
      var position = _getPdfPosition( clip_context.original_context, { x:x, y:y }, height );

      page.drawPage(
        embed_page, 
        {
          ...embed_page_dims,
          x: position.x,
          y: position.y,
        }
      );

      resolve();
    });
  });
}

//--------------------------------------
// PDFの色情報の取得
//--------------------------------------
function getPdfColor( context, r, g, b ){
  return PDFLib.rgb( r, g, b );
}

//--------------------------------------
// 透明度を設定（0〜1）
//--------------------------------------
function setPdfAlpha( context, alpha ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){
    context.params.opacity = alpha;
    resolve();
  } );
}

//--------------------------------------
// 線の太さを設定する
//--------------------------------------
function setPdfLineWidth( context, border_width ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){
    context.params.line.border_width = border_width;
    resolve();
  } );
}

//--------------------------------------
// 線の描画方法を指定する
//   [] : 空配列 = 実線（デフォルト）
//   [ number1, number2 ] = number1 : 実線の長さ, number2 : 空白の長さ
//--------------------------------------
function setPdfLineDash( context, array ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){
    context.params.line.dash_array = array;
    resolve();
  } );
}

//--------------------------------------
// 線分描画
//--------------------------------------
function drawPdfLine( context, x1, y1, x2, y2, color ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){

    var page = _getPdfPage( context );
    var pos1 = _getPdfPosition( context, { x:x1, y:y1 } );
    var pos2 = _getPdfPosition( context, { x:x2, y:y2 } );

    page.drawLine({
      start: pos1,
      end:   pos2,
      thickness: context.params.line.border_width,
      dashArray: context.params.line.dash_array,
      color: color,
      opacity: context.params.opacity,
    });

    resolve();
  });
}

//--------------------------------------
// 複数の線を描画する
//   points : [ {x:0,y:0}, ... ]
//--------------------------------------
function drawPdfLines( context, points, color ){
  if ( 0 == points.length ) return;

  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){
    // SVG pathの生成
    var svg_data = _createSvgPath( points );
    var page = _getPdfPage( context );
    var pos = _getPdfPosition( context, svg_data );

    page.drawSvgPath(
      svg_data.svg_path,
      {
        x: pos.x,
        y: pos.y,
        borderColor: color,
        borderWidth: context.params.line.border_width,
        borderDashArray: context.params.line.dash_array,
        borderOpacity: context.params.opacity,
      }
    );

    resolve();
  });
}

//--------------------------------------
// ペジェ曲線を描画する
//   points : [ {x:0,y:0}, ... ]
//--------------------------------------
function drawPdfBezier( context, points, color, is_horizontal ){
  if ( 0 == points.length ) return;

  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){
    // SVG pathの生成
    var svg_data = _createBezierSvgPath( points, ( is_horizontal ? true : false ) );
    var page = _getPdfPage( context );
    var pos = _getPdfPosition( context, svg_data );

    page.drawSvgPath(
      svg_data.svg_path,
      {
        x: pos.x,
        y: pos.y,
        borderColor: color,
        borderWidth: context.params.line.border_width,
        borderDashArray: context.params.line.dash_array,
        borderOpacity: context.params.opacity,
      }
    );

    resolve();
  });
}

//--------------------------------------
// 矩形描画
//--------------------------------------
function drawPdfRect( context, x, y, width, height, color, is_fill_rect ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){

    var page = _getPdfPage( context );
    var pos = _getPdfPosition( context, { x:x, y:y }, height );

    page.drawRectangle({
      x: pos.x,
      y: pos.y,
      width: width,
      height: height,
      rotate: PDFLib.n,
      borderWidth: context.params.line.border_width,
      borderDashArray: context.params.line.dash_array,
      borderColor: color,
      color: color,
      opacity: ( is_fill_rect ? context.params.opacity : 0 ),
      borderOpacity: context.params.opacity,
    });

    resolve();
  });
}

//--------------------------------------
// 三角形の描画
//--------------------------------------
function drawPdfTriangle( context, x1, y1, x2, y2, x3, y3, color, is_fill_rect ){
  var polygon = [
    {x: x1, y: y1},
    {x: x2, y: y2},
    {x: x3, y: y3},
  ]
  drawPdfPolygon( context, polygon, color, is_fill_rect );
}

//--------------------------------------
// 矩形描画
//   polygon : [ {x:0,y:0}, ... ]
//--------------------------------------
function drawPdfPolygon( context, polygon, color, is_fill_rect ){
  if ( 2 >= polygon.length ) return;

  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){
    // SVG pathの生成
    var svg_data = _createSvgPath( polygon );
    var page = _getPdfPage( context );
    var pos = _getPdfPosition( context, svg_data );

    page.drawSvgPath(
      svg_data.svg_path + " Z",
      {
        x: pos.x,
        y: pos.y,
        borderColor: color,
        borderWidth: context.params.line.border_width,
        borderDashArray: context.params.line.dash_array,
        color: color,
        opacity: ( is_fill_rect ? context.params.opacity : 0 ),
        borderOpacity: context.params.opacity,
      }
    );

    resolve();
  });
}

//--------------------------------------
// 円描画
//--------------------------------------
function drawPdfCircle( context, x, y, radius, color, is_fill_rect ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){
    var page = _getPdfPage( context );
    var pos = _getPdfPosition( context, { x:x, y:y } );
  
    page.drawCircle({
      x: pos.x,
      y: pos.y,
      size: radius,
      borderWidth: context.params.line.border_width,
      borderColor: color,
      color: color,
      opacity: ( is_fill_rect ? context.params.opacity : 0 ),
      borderOpacity: context.params.opacity,
    });
  
    resolve();
  } );
}

//--------------------------------------
// 文字列を描画
//--------------------------------------
function drawPdfText( context, text, x, y, color, font_size ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){
    if ( ! text || "string" != typeof text || 0 == text.length ) {
      resolve();
      return;
    }

    var page = _getPdfPage( context );
    var position = _getPdfPosition( context, { x:x, y:y }, font_size );

    page.setLineHeight( font_size + 2 );
    page.drawText(
      text,
      {
        x: position.x,
        y: position.y,
        font: context.params.text.font || PDFLib.n,
        size: font_size,
        color: color,
      }
    );

    resolve();
  });
}

//--------------------------------------
// 文字列を縦に描画
//--------------------------------------
function drawPdfVerticalText( context, text, x, y, color, font_size ){
  // PDF描画用関数の中には非同期な処理が存在するため、全て非同期化することで描画順序を関数呼び出し順となる様にする
  _wrapAsyncPdfFunction( context, function( resolve, reject ){
    if ( ! text || "string" != typeof text || 0 == text.length ) {
      resolve();
      return;
    }

    var text_width = getPdfTextWidth( context, text, font_size );
    var page = _getPdfPage( context );
    var position = _getPdfPosition( context, { x:x, y:y }, text_width );

    page.setLineHeight( font_size + 2 );
    page.drawText(
      text,
      {
        x: position.x + font_size,
        y: position.y,
        font: context.params.text.font || PDFLib.n,
        size: font_size,
        color: color,
        rotate: PDFLib.degrees( 90 )
      }
    );

    resolve();
  });
}

//--------------------------------------
// 文字サイズの取得
//--------------------------------------
function getPdfTextWidth( context, text, font_size ){
  if ( ! text || "string" != typeof text || 0 == text.length ) return 0;
  return context.params.text.font.widthOfTextAtSize( text, font_size ) + Math.floor( font_size / 2 );
}

//--------------------------------------
// 画像描画
//--------------------------------------
function drawPdfImage( context, image_context, x, y, scale ){
  if ( ! image_context || ! image_context.path ) return;
  scale = ( 'number' == typeof scale ? scale : 1 );

  // 非同期処理
  _wrapAsyncPdfFunction( context, function( resolve, reject ){

    // 画像の元サイズを拡大率を考慮して算出
    var source_image_size = {
      width:  Math.round( image_context.source_context.trim.width * scale ),
      height: Math.round( image_context.source_context.trim.height * scale ),
    };
    // 画像表示サイズを算出
    var image_size = {
      width:  Math.round( image_context.trim.width * scale ),
      height: Math.round( image_context.trim.height * scale ),
    };
    // 画像の部分切り出しのオフセット位置を算出
    var image_offset = { x: 0, y: 0 };
    if ( image_context.trim.is_divided ) {
      image_offset = {
        x: Math.round( image_context.trim.offset_x * scale ),
        y: Math.round( image_context.trim.offset_y * scale ),
      };
    }

    // 画像読み込み
    _getAjaxFileAsArrayBuffer( context, image_context.path, function( image_buffer ){
      if ( ! image_buffer ) return;

      // 画像の描画領域をクリッピングする
      _syncClipPdfRect( context, x, y, image_size.width, image_size.height, function( clip_context ){

        // PDFに描画可能な画像形式にする
        var embed_loader
        if ( image_context.path.match(/\.png$/i) ) {
          embed_loader = clip_context.pdf_doc.embedPng( image_buffer );
        }
        else {
          embed_loader = clip_context.pdf_doc.embedJpg( image_buffer );
        }

        embed_loader.then( function( pdf_image ){    
          var page = _getPdfPage( clip_context );
          var pos = _getPdfPosition( clip_context, { x:x, y:y }, source_image_size.height );
    
          page.drawImage( pdf_image, {
            x: pos.x - image_offset.x,
            y: pos.y + image_offset.y,
            width:  source_image_size.width,
            height: source_image_size.height,
            rotate: PDFLib.n,
            opacity: clip_context.params.opacity,
          });

          resolve();
        } );
      } );
    } );
  } );
}

/*------------------------------------------------------------------------------
  Private functions
------------------------------------------------------------------------------*/

//--------------------------------------
// 座標描画位置の変換
//--------------------------------------
function _getPdfPage( context ){
  if ( 0 == context.pages.length ) addPdfPage( context );
  return context.pages[ context.pages.length - 1 ];
}

//--------------------------------------
// 座標描画位置の変換
//--------------------------------------
function _getPdfPosition( context, position, height ){
  height = height || 0;
  var page_size = _getPdfPage( context ).getSize();
  return {
    x: position.x - context.offset.x,
    y: page_size.height - ( position.y - context.offset.y ) - height
  };
}

//--------------------------------------
// 指定座標の矩形情報を取得する
//--------------------------------------
function _getRectByPoints( points ){
  // 矩形のうち、最も左上と右下を探す
  var top_left     = { x: points[0].x, y: points[0].y };
  var bottom_right = { x: points[0].x, y: points[0].y };
  for ( var i=1, length=points.length; i<length; i=(i+1)|0 ) {
    if ( top_left.x > points[i].x ) top_left.x = points[i].x;
    if ( top_left.y > points[i].y ) top_left.y = points[i].y;
    if ( bottom_right.x < points[i].x ) bottom_right.x = points[i].x;
    if ( bottom_right.y < points[i].y ) bottom_right.y = points[i].y;      
  }
  return {
    x:      top_left.x,
    y:      top_left.y,
    width:  bottom_right.x - top_left.x,
    height: bottom_right.y - top_left.y,
  };
}

//--------------------------------------
// 指定座標を経由するSVG pathを生成する
//--------------------------------------
function _createSvgPath( points ){
  // 座標を包含する矩形を取得する
  var rect = _getRectByPoints( points );

  // SVG pathの生成
  var svg_paths = [];
  for ( var i=0, length=points.length; i<length; i=(i+1)|0 ) {
    var path = `${ Math.floor( points[i].x - rect.x ) },${ Math.floor( points[i].y - rect.y ) }`;
    if ( 0 == svg_paths.length ) {
      svg_paths[i] = "M " + path;
    }
    else {
      svg_paths[i] = "L " + path;
    }
  }

  return {
    ...rect,
    svg_path: svg_paths.join(" "),
  }
}

//--------------------------------------
// 指定座標を経由するペジェ曲線のSVG pathを生成する
//--------------------------------------
function _createBezierSvgPath( points, is_horizontal ){
  // 座標を包含する矩形を取得する
  var rect = _getRectByPoints( points );

  // SVG pathの生成
  var svg_paths = [];
  svg_paths[0] = `M ${ Math.floor( points[0].x - rect.x ) },${ Math.floor( points[0].y - rect.y ) }`;
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

    var path = `${ Math.floor( cx - rect.x ) } ${ Math.floor( cy - rect.y ) } ${ Math.floor( points[i].x - rect.x ) },${ Math.floor( points[i].y - rect.y ) }`;
    svg_paths[i] = "Q " + path;
  }

  return {
    ...rect,
    svg_path: svg_paths.join(" "),
  }
}

//--------------------------------------
// PDF処理用非同期関数
//--------------------------------------
function _wrapAsyncPdfFunction( context, async_function ){
  if ( context.promise ) {
    context.promise = context.promise.then( function(){ 
      return new Promise( async_function );
    });  
  }
  else if ( context.original_context ) {
    context.original_context.promise = context.original_context.promise.then( function(){ 
      return new Promise( async_function );
    });
  }
}

//--------------------------------------
// AJAXでファイルをArrayBuffer形式で取得する
//--------------------------------------
function _getAjaxFileAsArrayBuffer( context, url, callback ){

  var oReq = new XMLHttpRequest();
  oReq.open( "GET", url, true );
  oReq.responseType = "arraybuffer";
  
  oReq.onload = function(oEvent) {
    if ( oReq.status == 200 ) {
      var array_buffer = oReq.response;
      if ( array_buffer ) {
        callback( array_buffer );
      }  
    }
    else {
      console.log( `Cannot get file. : ${ url } : status( ${ oReq.status } )` );
      // エラーは無視して処理を続行させる
      callback( null );
    }
  }
  oReq.onerror = function(){
    console.log( `XHR error. : ${ url }` );
    // エラーは無視して処理を続行させる
    callback( null );
  }
  
  oReq.send(null);
}

//--------------------------------------
// PDFのクリップ用ページを削除する
//--------------------------------------
function _removePdfClipPage( context ){
  // PDFdoc.getPages() は削除されたページも取得されるが、PDFDoc.removePage() は削除したページを除いたインデックス番号で削除対象を指定しなければならない
  // そこで、インデックス番号がズレない様に、PDFdoc.getPages()で取得されるページ配列の後方から順に削除対象を探す

  // 全てのページを検索し、削除対象をみつける
  var pages = context.pdf_doc.getPages();
  for ( var i=pages.length-1; i>=0; i=(i-1)|0 ) {
    // 全てのレンダリング用ページと比較し、レンダリング用ページと一致するページがなければ削除対象
    var is_include = false;
    for ( var j=0, render_page_length = context.pages.length; j<render_page_length; j=(j+1)|0 ) {
      if ( pages[i] === context.pages[j] ) {
        is_include = true;
        break;
      }
    }
    // 一致するページがなかったので削除する
    if ( ! is_include ) {
      context.pdf_doc.removePage( i );
    }
  }
}

//--------------------------------------
// PDFのクリッピング処理（非同期でラッピングしない版）
//--------------------------------------
function _syncClipPdfRect( context, x, y, width, height, draw_func ){
  // クリップ用のページを生成する（PDF生成時のタイミングでまとめて削除される）
  var clip_page = context.pdf_doc.addPage( [ width, height ] );
  clip_page.drawText(' ');
  // クリップ用のページ描画のためにコンテキストを派生させる
  var clip_context = { 
    original_context: context,
    pdf_doc:    context.pdf_doc,
    pages:      [ clip_page ],
    promise:    null,
    offset:     { x:x, y:y },
    params:     context.params,
  };
  draw_func( clip_context );

  // クリップ後のPDFを組込PDFとして元PDFに読込む
  clip_context.original_context.pdf_doc.embedPage( clip_page ).then(function( embed_page ){
    var embed_page_dims = embed_page.scale(1);

    var page = _getPdfPage( clip_context.original_context );
    var position = _getPdfPosition( clip_context.original_context, { x:x, y:y }, height );

    page.drawPage(
      embed_page, 
      {
        ...embed_page_dims,
        x: position.x,
        y: position.y,
      }
    );
  });
}
