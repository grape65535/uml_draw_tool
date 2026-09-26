// TrueTypeフォント（glyf形式）のサブセット化
//   SVGへ@font-faceとして埋め込むために、利用する文字のグリフだけを抜き出したTTFを生成する
//   ブラウザで利用できるよう、必要なテーブル（cmap / head / hhea / hmtx / maxp / name / OS/2 / post / loca / glyf）を出力する
//   ※ fontkitのサブセットはPDF埋め込み用でcmap等を出力しないため、ここで独自に生成する

//--------------------------------------
// フォントのサブセットを生成する
//   font_buffer : 元のTTF（ArrayBuffer）
//   text        : サブセットに含める文字列
//   戻り値      : サブセット化したTTF（Uint8Array）。生成できない場合はnull
//--------------------------------------
function createTtfSubset( font_buffer, text ){
  var font = _parseTtf( font_buffer );
  if ( ! font ) return null;

  // 利用する文字（コードポイント）を収集する
  var code_points = [];
  var code_point_map = {};
  for ( var char of text ) {
    var code_point = char.codePointAt( 0 );
    if ( code_point_map[ code_point ] ) continue;
    code_point_map[ code_point ] = true;
    code_points.push( code_point );
  }
  code_points.sort( function( a, b ){ return a - b; } );

  // 新しいグリフ順序を決める（0番は.notdef固定）
  var glyph_ids = [ 0 ];
  var new_glyph_id_map = { 0: 0 };
  var include_glyph = function( glyph_id ){
    if ( undefined === new_glyph_id_map[ glyph_id ] ) {
      new_glyph_id_map[ glyph_id ] = glyph_ids.length;
      glyph_ids.push( glyph_id );
    }
    return new_glyph_id_map[ glyph_id ];
  };

  // 文字 → 新グリフIDの対応（フォントに無い文字は含めない）
  var char_map = [];
  for ( var i=0; i<code_points.length; i++ ) {
    var glyph_id = font.cmap( code_points[i] );
    if ( 0 == glyph_id ) continue;
    char_map.push( { code_point: code_points[i], glyph_id: include_glyph( glyph_id ) } );
  }

  // グリフデータの収集（複合グリフの部品もサブセットに含め、参照するグリフIDを付け替える）
  var glyphs = [];
  for ( var i=0; i<glyph_ids.length; i++ ) {
    var glyph = font.glyph( glyph_ids[i] ).slice();
    if ( 10 <= glyph.length && ( new DataView( glyph.buffer ).getInt16( 0 ) < 0 ) ) {
      _remapCompositeGlyph( glyph, include_glyph );
    }
    glyphs.push( glyph );
  }

  // glyf / loca（long形式）
  var glyf_length = 0;
  for ( var i=0; i<glyphs.length; i++ ) glyf_length += _alignTtf4( glyphs[i].length );
  var glyf = new Uint8Array( glyf_length );
  var loca = new DataView( new ArrayBuffer( ( glyphs.length + 1 ) * 4 ) );
  var glyf_offset = 0;
  for ( var i=0; i<glyphs.length; i++ ) {
    loca.setUint32( i * 4, glyf_offset );
    glyf.set( glyphs[i], glyf_offset );
    glyf_offset += _alignTtf4( glyphs[i].length );
  }
  loca.setUint32( glyphs.length * 4, glyf_offset );

  // hmtx（全グリフを advanceWidth + lsb で出力）
  var hmtx = new DataView( new ArrayBuffer( glyph_ids.length * 4 ) );
  for ( var i=0; i<glyph_ids.length; i++ ) {
    var metric = font.horizontalMetric( glyph_ids[i] );
    hmtx.setUint16( i * 4, metric.advance_width );
    hmtx.setInt16( i * 4 + 2, metric.lsb );
  }

  // head（indexToLocFormatをlong形式にし、checkSumAdjustmentは後で計算）
  var head = font.table( "head" ).slice();
  var head_view = new DataView( head.buffer );
  head_view.setUint32( 8, 0 );
  head_view.setInt16( 50, 1 );

  // hhea（numberOfHMetrics）
  var hhea = font.table( "hhea" ).slice();
  new DataView( hhea.buffer ).setUint16( 34, glyph_ids.length );

  // maxp（numGlyphs）
  var maxp = font.table( "maxp" ).slice();
  new DataView( maxp.buffer ).setUint16( 4, glyph_ids.length );

  // post（グリフ名を持たない version 3.0 にする）
  var post = new Uint8Array( 32 );
  post.set( font.table( "post" ).subarray( 0, 16 ) );
  new DataView( post.buffer ).setUint32( 0, 0x00030000 );

  var tables = {
    "OS/2": font.table( "OS/2" ),
    "cmap": _createTtfCmap( char_map ),
    "glyf": glyf,
    "head": head,
    "hhea": hhea,
    "hmtx": new Uint8Array( hmtx.buffer ),
    "loca": new Uint8Array( loca.buffer ),
    "maxp": maxp,
    "name": font.table( "name" ),
    "post": post,
  };
  // ヒンティング用のテーブルは存在すればそのまま引き継ぐ
  var optional_tags = [ "cvt ", "fpgm", "prep", "gasp" ];
  for ( var i=0; i<optional_tags.length; i++ ) {
    if ( font.table( optional_tags[i] ) ) tables[ optional_tags[i] ] = font.table( optional_tags[i] );
  }

  return _buildTtf( tables );
}

//--------------------------------------
// Uint8Arrayをbase64文字列に変換する
//--------------------------------------
function uint8ArrayToBase64( bytes ){
  var binary = [];
  var chunk_size = 0x8000;
  for ( var i=0; i<bytes.length; i+=chunk_size ) {
    binary.push( String.fromCharCode.apply( null, bytes.subarray( i, i + chunk_size ) ) );
  }
  return btoa( binary.join("") );
}

/*------------------------------------------------------------------------------
  Private functions
------------------------------------------------------------------------------*/

//--------------------------------------
// TTFの解析（サブセット化に必要な情報のみ）
//--------------------------------------
function _parseTtf( font_buffer ){
  var view = new DataView( font_buffer );
  var bytes = new Uint8Array( font_buffer );

  // TrueType（glyf形式）のみ対応
  var sfnt_version = view.getUint32( 0 );
  if ( 0x00010000 != sfnt_version && 0x74727565 != sfnt_version ) return null;

  // テーブルディレクトリ
  var table_records = {};
  var num_tables = view.getUint16( 4 );
  for ( var i=0; i<num_tables; i++ ) {
    var record_offset = 12 + i * 16;
    var tag = String.fromCharCode( bytes[ record_offset ], bytes[ record_offset + 1 ], bytes[ record_offset + 2 ], bytes[ record_offset + 3 ] );
    table_records[ tag ] = {
      offset: view.getUint32( record_offset + 8 ),
      length: view.getUint32( record_offset + 12 ),
    };
  }
  var required_tags = [ "cmap", "glyf", "head", "hhea", "hmtx", "loca", "maxp", "name", "OS/2", "post" ];
  for ( var i=0; i<required_tags.length; i++ ) {
    if ( ! table_records[ required_tags[i] ] ) return null;
  }

  var table = function( tag ){
    var record = table_records[ tag ];
    return record ? bytes.subarray( record.offset, record.offset + record.length ) : null;
  };

  var head_offset = table_records["head"].offset;
  var index_to_loc_format = view.getInt16( head_offset + 50 );
  var num_glyphs = view.getUint16( table_records["maxp"].offset + 4 );
  var number_of_h_metrics = view.getUint16( table_records["hhea"].offset + 34 );
  var loca_offset = table_records["loca"].offset;
  var glyf_offset = table_records["glyf"].offset;
  var hmtx_offset = table_records["hmtx"].offset;

  return {
    table: table,
    cmap: _createTtfCmapLookup( view, table_records["cmap"].offset ),
    glyph: function( glyph_id ){
      if ( glyph_id >= num_glyphs ) return new Uint8Array( 0 );
      var start, end;
      if ( 0 == index_to_loc_format ) {
        start = view.getUint16( loca_offset + glyph_id * 2 ) * 2;
        end   = view.getUint16( loca_offset + glyph_id * 2 + 2 ) * 2;
      }
      else {
        start = view.getUint32( loca_offset + glyph_id * 4 );
        end   = view.getUint32( loca_offset + glyph_id * 4 + 4 );
      }
      return bytes.subarray( glyf_offset + start, glyf_offset + end );
    },
    horizontalMetric: function( glyph_id ){
      if ( glyph_id < number_of_h_metrics ) {
        return {
          advance_width: view.getUint16( hmtx_offset + glyph_id * 4 ),
          lsb:           view.getInt16( hmtx_offset + glyph_id * 4 + 2 ),
        };
      }
      return {
        advance_width: view.getUint16( hmtx_offset + ( number_of_h_metrics - 1 ) * 4 ),
        lsb:           view.getInt16( hmtx_offset + number_of_h_metrics * 4 + ( glyph_id - number_of_h_metrics ) * 2 ),
      };
    },
  };
}

//--------------------------------------
// cmapから文字→グリフIDを引く関数を生成する（format 12 を優先し、無ければ format 4）
//--------------------------------------
function _createTtfCmapLookup( view, cmap_offset ){
  var num_sub_tables = view.getUint16( cmap_offset + 2 );
  var format4_offset = null;
  var format12_offset = null;
  for ( var i=0; i<num_sub_tables; i++ ) {
    var platform_id = view.getUint16( cmap_offset + 4 + i * 8 );
    var encoding_id = view.getUint16( cmap_offset + 4 + i * 8 + 2 );
    var sub_table_offset = cmap_offset + view.getUint32( cmap_offset + 4 + i * 8 + 4 );
    var format = view.getUint16( sub_table_offset );
    var is_unicode = ( 0 == platform_id || ( 3 == platform_id && ( 1 == encoding_id || 10 == encoding_id ) ) );
    if ( ! is_unicode ) continue;
    if ( 12 == format && null === format12_offset ) format12_offset = sub_table_offset;
    if ( 4 == format && null === format4_offset ) format4_offset = sub_table_offset;
  }

  // format 12（segmented coverage）
  if ( null !== format12_offset ) {
    var num_groups = view.getUint32( format12_offset + 12 );
    return function( code_point ){
      var low = 0, high = num_groups - 1;
      while ( low <= high ) {
        var middle = ( low + high ) >> 1;
        var group_offset = format12_offset + 16 + middle * 12;
        var start_char = view.getUint32( group_offset );
        var end_char = view.getUint32( group_offset + 4 );
        if ( code_point < start_char ) high = middle - 1;
        else if ( code_point > end_char ) low = middle + 1;
        else return view.getUint32( group_offset + 8 ) + ( code_point - start_char );
      }
      return 0;
    };
  }

  // format 4（segment mapping to delta values）
  if ( null !== format4_offset ) {
    var seg_count = view.getUint16( format4_offset + 6 ) / 2;
    var end_codes_offset = format4_offset + 14;
    var start_codes_offset = end_codes_offset + seg_count * 2 + 2;
    var id_deltas_offset = start_codes_offset + seg_count * 2;
    var id_range_offsets_offset = id_deltas_offset + seg_count * 2;
    return function( code_point ){
      if ( 0xFFFF < code_point ) return 0;
      for ( var i=0; i<seg_count; i++ ) {
        if ( code_point > view.getUint16( end_codes_offset + i * 2 ) ) continue;
        var start_code = view.getUint16( start_codes_offset + i * 2 );
        if ( code_point < start_code ) return 0;
        var id_delta = view.getUint16( id_deltas_offset + i * 2 );
        var id_range_offset = view.getUint16( id_range_offsets_offset + i * 2 );
        if ( 0 == id_range_offset ) return ( code_point + id_delta ) & 0xFFFF;
        var glyph_id = view.getUint16( id_range_offsets_offset + i * 2 + id_range_offset + ( code_point - start_code ) * 2 );
        return ( 0 == glyph_id ? 0 : ( glyph_id + id_delta ) & 0xFFFF );
      }
      return 0;
    };
  }

  return function(){ return 0; };
}

//--------------------------------------
// 複合グリフが参照するグリフIDを、サブセット内のグリフIDに付け替える
//--------------------------------------
function _remapCompositeGlyph( glyph, include_glyph ){
  var view = new DataView( glyph.buffer, glyph.byteOffset, glyph.byteLength );
  var offset = 10;
  while ( offset + 4 <= glyph.length ) {
    var flags = view.getUint16( offset );
    view.setUint16( offset + 2, include_glyph( view.getUint16( offset + 2 ) ) );
    offset += 4;
    offset += ( flags & 0x0001 ) ? 4 : 2; // ARG_1_AND_2_ARE_WORDS
    if      ( flags & 0x0008 ) offset += 2; // WE_HAVE_A_SCALE
    else if ( flags & 0x0040 ) offset += 4; // WE_HAVE_AN_X_AND_Y_SCALE
    else if ( flags & 0x0080 ) offset += 8; // WE_HAVE_A_TWO_BY_TWO
    if ( ! ( flags & 0x0020 ) ) break;      // MORE_COMPONENTS
  }
}

//--------------------------------------
// cmapテーブルを生成する（BMP用の format 4 と、全文字用の format 12）
//--------------------------------------
function _createTtfCmap( char_map ){
  // format 4（BMPの文字のみ。コードとグリフIDがともに連続する範囲を1セグメントにまとめる）
  var segments = [];
  for ( var i=0; i<char_map.length; i++ ) {
    if ( 0xFFFF <= char_map[i].code_point ) continue;
    var last = segments[ segments.length - 1 ];
    if ( last && last.end + 1 == char_map[i].code_point && last.glyph_id + ( last.end - last.start ) + 1 == char_map[i].glyph_id ) {
      last.end++;
    }
    else {
      segments.push( { start: char_map[i].code_point, end: char_map[i].code_point, glyph_id: char_map[i].glyph_id } );
    }
  }
  segments.push( { start: 0xFFFF, end: 0xFFFF, glyph_id: 0 } );

  var seg_count = segments.length;
  var entry_selector = Math.floor( Math.log2( seg_count ) );
  var search_range = Math.pow( 2, entry_selector ) * 2;
  var format4_length = 16 + seg_count * 8;
  var format4 = new DataView( new ArrayBuffer( format4_length ) );
  format4.setUint16( 0, 4 );
  format4.setUint16( 2, format4_length );
  format4.setUint16( 4, 0 );
  format4.setUint16( 6, seg_count * 2 );
  format4.setUint16( 8, search_range );
  format4.setUint16( 10, entry_selector );
  format4.setUint16( 12, seg_count * 2 - search_range );
  for ( var i=0; i<seg_count; i++ ) {
    var id_delta = ( 0xFFFF == segments[i].start ? 1 : ( segments[i].glyph_id - segments[i].start ) & 0xFFFF );
    format4.setUint16( 14 + i * 2, segments[i].end );
    format4.setUint16( 16 + seg_count * 2 + i * 2, segments[i].start );
    format4.setUint16( 16 + seg_count * 4 + i * 2, id_delta );
    format4.setUint16( 16 + seg_count * 6 + i * 2, 0 );
  }

  // format 12（全ての文字）
  var groups = [];
  for ( var i=0; i<char_map.length; i++ ) {
    var last = groups[ groups.length - 1 ];
    if ( last && last.end + 1 == char_map[i].code_point && last.glyph_id + ( last.end - last.start ) + 1 == char_map[i].glyph_id ) {
      last.end++;
    }
    else {
      groups.push( { start: char_map[i].code_point, end: char_map[i].code_point, glyph_id: char_map[i].glyph_id } );
    }
  }
  var format12_length = 16 + groups.length * 12;
  var format12 = new DataView( new ArrayBuffer( format12_length ) );
  format12.setUint16( 0, 12 );
  format12.setUint32( 4, format12_length );
  format12.setUint32( 12, groups.length );
  for ( var i=0; i<groups.length; i++ ) {
    format12.setUint32( 16 + i * 12, groups[i].start );
    format12.setUint32( 20 + i * 12, groups[i].end );
    format12.setUint32( 24 + i * 12, groups[i].glyph_id );
  }

  // cmapヘッダ（3-1:format 4, 3-10:format 12）
  var header_length = 4 + 2 * 8;
  var cmap = new Uint8Array( header_length + format4_length + format12_length );
  var header = new DataView( cmap.buffer );
  header.setUint16( 0, 0 );
  header.setUint16( 2, 2 );
  header.setUint16( 4, 3 );
  header.setUint16( 6, 1 );
  header.setUint32( 8, header_length );
  header.setUint16( 12, 3 );
  header.setUint16( 14, 10 );
  header.setUint32( 16, header_length + format4_length );
  cmap.set( new Uint8Array( format4.buffer ), header_length );
  cmap.set( new Uint8Array( format12.buffer ), header_length + format4_length );
  return cmap;
}

//--------------------------------------
// テーブル群からTTFファイルを組み立てる
//--------------------------------------
function _buildTtf( tables ){
  var tags = Object.keys( tables ).sort();
  var num_tables = tags.length;
  var entry_selector = Math.floor( Math.log2( num_tables ) );
  var search_range = Math.pow( 2, entry_selector ) * 16;

  var header_length = 12 + num_tables * 16;
  var total_length = header_length;
  for ( var i=0; i<num_tables; i++ ) total_length += _alignTtf4( tables[ tags[i] ].length );

  var bytes = new Uint8Array( total_length );
  var view = new DataView( bytes.buffer );
  view.setUint32( 0, 0x00010000 );
  view.setUint16( 4, num_tables );
  view.setUint16( 6, search_range );
  view.setUint16( 8, entry_selector );
  view.setUint16( 10, num_tables * 16 - search_range );

  var offset = header_length;
  var head_offset = null;
  for ( var i=0; i<num_tables; i++ ) {
    var tag = tags[i];
    var data = tables[ tag ];
    var record_offset = 12 + i * 16;
    for ( var j=0; j<4; j++ ) view.setUint8( record_offset + j, tag.charCodeAt( j ) );
    bytes.set( data, offset );
    view.setUint32( record_offset + 4, _calcTtfChecksum( bytes, offset, data.length ) );
    view.setUint32( record_offset + 8, offset );
    view.setUint32( record_offset + 12, data.length );
    if ( "head" == tag ) head_offset = offset;
    offset += _alignTtf4( data.length );
  }

  // head.checkSumAdjustment
  if ( null !== head_offset ) {
    view.setUint32( head_offset + 8, ( 0xB1B0AFBA - _calcTtfChecksum( bytes, 0, total_length ) ) >>> 0 );
  }
  return bytes;
}

//--------------------------------------
// TTFのチェックサム計算
//--------------------------------------
function _calcTtfChecksum( bytes, offset, length ){
  var sum = 0;
  var end = offset + _alignTtf4( length );
  for ( var i=offset; i<end; i+=4 ) {
    sum = ( sum + ( ( ( bytes[i] << 24 ) | ( bytes[i+1] << 16 ) | ( bytes[i+2] << 8 ) | bytes[i+3] ) >>> 0 ) ) >>> 0;
  }
  return sum;
}

//--------------------------------------
// 4バイト境界への切り上げ
//--------------------------------------
function _alignTtf4( length ){
  return ( length + 3 ) & ~3;
}
